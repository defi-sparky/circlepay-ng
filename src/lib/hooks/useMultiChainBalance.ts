"use client";
// lib/hooks/useMultiChainBalance.ts
// Reads USDC balance on all supported source chains simultaneously

import { useAccount } from "wagmi";
import { createPublicClient, http, formatUnits } from "viem";
import { useState, useEffect, useCallback } from "react";
import { CCTP_SOURCE_CHAINS, type SourceChainKey } from "@/lib/cctp";

const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface ChainBalance {
  chain: SourceChainKey;
  balance: string;      // formatted e.g. "12.50"
  rawBalance: bigint;
  isLoading: boolean;
  isError: boolean;
}

export function useMultiChainBalance() {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<Record<SourceChainKey, ChainBalance>>({
    "ethereum-sepolia": { chain: "ethereum-sepolia", balance: "0.00", rawBalance: 0n, isLoading: true, isError: false },
    "base-sepolia":     { chain: "base-sepolia",     balance: "0.00", rawBalance: 0n, isLoading: true, isError: false },
    "arbitrum-sepolia": { chain: "arbitrum-sepolia", balance: "0.00", rawBalance: 0n, isLoading: true, isError: false },
  });

  const fetchBalances = useCallback(async () => {
    if (!address || !isConnected) return;

    const keys = Object.keys(CCTP_SOURCE_CHAINS) as SourceChainKey[];

    await Promise.all(
      keys.map(async (key) => {
        const chain = CCTP_SOURCE_CHAINS[key];

        // Update loading state
        setBalances((prev) => ({
          ...prev,
          [key]: { ...prev[key], isLoading: true, isError: false },
        }));

        try {
          const client = createPublicClient({
            chain: chain.viemChain,
            transport: http(),
          });

          const raw = await client.readContract({
            address: chain.usdcAddress,
            abi: ERC20_BALANCE_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          setBalances((prev) => ({
            ...prev,
            [key]: {
              chain: key,
              balance: parseFloat(formatUnits(raw, 6)).toFixed(2),
              rawBalance: raw,
              isLoading: false,
              isError: false,
            },
          }));
        } catch {
          setBalances((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              balance: "—",
              rawBalance: 0n,
              isLoading: false,
              isError: true,
            },
          }));
        }
      })
    );
  }, [address, isConnected]);

  // Fetch on mount and every 30s
  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { balances, refetch: fetchBalances };
}
