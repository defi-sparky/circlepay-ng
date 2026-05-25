// lib/hooks/useUSDCPay.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central payment hook for CirclePay NG.
//
// Arc docs say: use ERC-20 interface (6 decimals) for transfers and balance.
// Do NOT use native sendTransaction (18 decimals) — that causes wrong amounts.
//
// Flow:
//   1. calcFees()  → compute principal + platform fee + gas
//   2. ERC-20 approve (if needed) then transfer → MetaMask popup
//   3. USDC (principal + platform fee) → treasury wallet via ERC-20 transfer
//   4. Gas paid automatically by Arc from native balance
//   5. recordFee() → store revenue entry
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI, CONTRACTS } from "@/lib/contracts";
import { calcFees, type FeeType } from "@/lib/fees";
import { useAppStore, type Transaction } from "@/lib/store";
import { generateRequestRef } from "@/lib/utils";

// ── Treasury wallet — receives all USDC payments + platform fees ──────────────
const TREASURY = process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`;

export interface PayOptions {
  type: FeeType;
  amountUsdc: number;
  description: string;
  metadata?: Record<string, string>;
}

export interface PayResult {
  txHash: string;
  amountPaid: number;
  totalDeducted: number;
  platformFee: number;
  gasFee: number;
  reference: string;
}

export function useUSDCPay() {
  const { address } = useAccount();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const recordFee = useAppStore((s) => s.recordFee);
  const gaslessMode = useAppStore((s) => s.gaslessMode);

  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();

  const {
    writeContractAsync,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: pendingHash,
  });

  async function pay(opts: PayOptions): Promise<PayResult> {
    if (!address) throw new Error("Wallet not connected");

    // Safety — never burn funds to zero address
    if (
      !TREASURY ||
      TREASURY === "0x0000000000000000000000000000000000000000" ||
      TREASURY.includes("Your")
    ) {
      throw new Error(
        "Treasury wallet not set. Add NEXT_PUBLIC_TREASURY_ADDRESS to .env.local"
      );
    }

    const fees = calcFees(opts.type, opts.amountUsdc, gaslessMode);
    const reference = generateRequestRef();

    // Principal + platform fee goes to treasury via ERC-20 transfer
    // Gas is handled separately by Arc network from native balance
    const onChainAmount = fees.principalUsdc + fees.platformFee;

    // Arc ERC-20 interface = 6 decimals
    const rawAmount = parseUnits(onChainAmount.toFixed(6), 6);

    // Add pending tx to history
    const txEntry: Transaction = {
      id: reference,
      type: opts.type === "payment" ? "payment"
        : opts.type === "send" ? "send"
        : opts.type === "stake" ? "stake"
        : opts.type === "unstake" ? "unstake"
        : "claim",
      amount: fees.principalUsdc.toFixed(4),
      usdcFee: fees.totalFee.toFixed(4),
      gasFee: fees.gasFee.toFixed(4),
      totalDeducted: fees.totalDeducted.toFixed(4),
      status: "pending",
      description: opts.description,
      timestamp: Date.now(),
      metadata: opts.metadata,
    };
    addTransaction(txEntry);

    try {
      // ── ERC-20 transfer → triggers MetaMask popup ───────────────────────────
      // Arc docs: use ERC-20 interface (6 decimals) for all USDC transfers
      const hash = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [TREASURY, rawAmount],
      });

      setPendingHash(hash);
      updateTransaction(reference, { status: "success", txHash: hash });

      // Record revenue
      recordFee({
        txId: reference,
        type: opts.type,
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        totalFee: fees.totalFee,
        timestamp: Date.now(),
        walletAddress: address,
      });

      return {
        txHash: hash,
        amountPaid: fees.principalUsdc,
        totalDeducted: fees.totalDeducted,
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        reference,
      };
    } catch (err) {
      updateTransaction(reference, { status: "failed" });
      throw err;
    }
  }

  return {
    pay,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
    error: writeError,
    treasury: TREASURY,
  };
}
