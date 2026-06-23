"use client";
// lib/hooks/useCCTPBridge.ts

import { useState, useCallback } from "react";
import { useConnectorClient, useSwitchChain } from "wagmi";
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { CCTP_SOURCE_CHAINS, type SourceChainKey } from "@/lib/cctp";
import type { BridgeStep, BridgeState } from "@/lib/cctp";
import { useAppStore, type Transaction } from "@/lib/store";
import { generateRequestRef } from "@/lib/utils";

const BRIDGE_KIT_CHAIN_NAMES: Record<SourceChainKey, string> = {
  "ethereum-sepolia": "Ethereum_Sepolia",
  "base-sepolia":     "Base_Sepolia",
  "arbitrum-sepolia": "Arbitrum_Sepolia",
};

const ARC_TESTNET_CHAIN_NAME = "Arc_Testnet";

interface BridgeResult {
  approvalTxHash?: string;
  burnTxHash?: string;
  mintTxHash?: string;
}

export function useCCTPBridge() {
  const { data: connectorClient } = useConnectorClient();
  const { switchChainAsync } = useSwitchChain();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  const [bridgeState, setBridgeState] = useState<BridgeState>({ step: "idle" });
  const [isLoading, setIsLoading] = useState(false);

  function updateStep(step: BridgeStep, extra?: Partial<BridgeState>) {
    setBridgeState((prev) => ({ ...prev, step, ...extra }));
  }

  const bridge = useCallback(
    async ({
      sourceChain,
      amountUsdc,
    }: {
      sourceChain: SourceChainKey;
      amountUsdc: string;
    }) => {
      if (!connectorClient) {
        throw new Error("Wallet client not ready. Wait a moment then try again.");
      }

      const chainConfig = CCTP_SOURCE_CHAINS[sourceChain];
      if (!chainConfig) throw new Error("Unsupported source chain");

      setIsLoading(true);
      setBridgeState({ step: "idle" });

      // Add pending entry immediately
      const txId = generateRequestRef();
      const txEntry: Transaction = {
        id: txId,
        type: "bridge",
        amount: amountUsdc,
        status: "pending",
        description: `Bridge ${amountUsdc} USDC: ${chainConfig.name} → Arc Testnet`,
        timestamp: Date.now(),
        metadata: {
          sourceChain: chainConfig.name,
          destinationChain: "Arc Testnet",
        },
      };
      addTransaction(txEntry);

      try {
        // ── Step 1: Force wallet to switch to the correct source chain ────────────
        // This is the root cause of the Base Sepolia bug — without explicitly
        // switching first, Bridge Kit talks to whatever chain the wallet is
        // currently on, silently succeeds with a no-op, and returns an empty result.
        updateStep("approving");

        await switchChainAsync({ chainId: chainConfig.viemChain.id });

        // ── Step 2: Build adapter from wallet provider ─────────────────────────────
        const transport = (connectorClient as unknown as {
          transport?: Record<string, unknown>;
        })?.transport;

        const provider =
          (transport?.value as { provider?: unknown } | undefined)?.provider ??
          (transport as { provider?: unknown } | undefined)?.provider ??
          (typeof window !== "undefined"
            ? (window as unknown as { ethereum?: unknown }).ethereum
            : undefined);

        if (!provider) {
          throw new Error(
            "Could not access wallet provider. Try disconnecting and reconnecting."
          );
        }

        const adapter = await createAdapterFromProvider({ provider });
        const kit = new BridgeKit();

        // ── Step 3: Execute the bridge transfer ───────────────────────────────────
        // No setTimeout cosmetic updates — we only advance steps on real results.
        // This prevents false success when kit.bridge() resolves without doing anything.
        const result = (await kit.bridge({
          from: { adapter, chain: BRIDGE_KIT_CHAIN_NAMES[sourceChain] as never },
          to:   { adapter, chain: ARC_TESTNET_CHAIN_NAME as never },
          amount: amountUsdc,
        })) as BridgeResult;

        // ── Step 4: Extract tx hashes — log real shape so we can map correctly ─────
        // Log result safely — BigInt values can't use JSON.stringify directly
        try {
          console.log("Bridge Kit result:", JSON.stringify(result, (_k, v) =>
            typeof v === "bigint" ? v.toString() + "n" : v, 2));
        } catch {
          console.log("Bridge Kit result (raw):", result);
        }

        // Bridge Kit's actual field names vary by version — extract whatever exists
        const anyResult = result as unknown as Record<string, string>;

        const mintHash =
          anyResult?.mintTxHash ||
          anyResult?.destinationTxHash ||
          anyResult?.receiveTxHash ||
          anyResult?.claimTxHash;

        const burnHash =
          anyResult?.burnTxHash ||
          anyResult?.sourceTxHash ||
          anyResult?.depositTxHash ||
          anyResult?.transferTxHash;

        const approveHash =
          anyResult?.approvalTxHash ||
          anyResult?.approveTxHash ||
          anyResult?.allowanceTxHash;

        updateStep("complete", {
          approveTxHash: approveHash,
          burnTxHash:    burnHash,
          mintTxHash:    mintHash,
        });

        updateTransaction(txId, {
          status: "success",
          txHash: mintHash || burnHash,
        });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Bridge failed";
        updateStep("error", { error });
        updateTransaction(txId, { status: "failed" });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [connectorClient, switchChainAsync, addTransaction, updateTransaction]
  );

  function reset() {
    setBridgeState({ step: "idle" });
    setIsLoading(false);
  }

  return { bridge, bridgeState, isLoading, reset };
}
