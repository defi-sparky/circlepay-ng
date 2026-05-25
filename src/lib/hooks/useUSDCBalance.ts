// hooks/useUSDCBalance.ts
// Arc docs: use the ERC-20 interface for reading balances (6 decimals)
// NOT useBalance (which reads native 18-decimal balance)

import { useAccount, useReadContract } from "wagmi";
import { ERC20_ABI, CONTRACTS } from "@/lib/contracts";

export function useUSDCBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: rawBalance,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 15_000,
    },
  });

  const balance = rawBalance ?? 0n;
  // ERC-20 interface = 6 decimals
  const numericBalance = Number(balance) / 1_000_000;
  const formattedBalance = numericBalance.toFixed(2);

  return {
    balance,
    formattedBalance,
    numericBalance,
    isLoading,
    isError,
    refetch,
  };
}
