// hooks/useUSDCTransfer.ts
// Arc: use ERC-20 interface (6 decimals) for USDC transfers

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseUnits } from "viem";
import { ERC20_ABI, CONTRACTS } from "@/lib/contracts";
import { useAppStore } from "@/lib/store";
import { generateRequestRef } from "@/lib/utils";

export function useUSDCTransfer() {
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const recordFee = useAppStore((s) => s.recordFee);

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  async function sendUSDC(toAddress: string, amountStr: string) {
    if (!isAddress(toAddress)) throw new Error("Invalid recipient address");

    const numAmount = parseFloat(amountStr);
    if (!numAmount || numAmount <= 0) throw new Error("Invalid amount");

    // Arc ERC-20 = 6 decimals
    const rawAmount = parseUnits(amountStr, 6);

    const txId = generateRequestRef();

    addTransaction({
      id: txId,
      type: "send",
      amount: amountStr,
      status: "pending",
      description: `Send ${amountStr} USDC to ${toAddress.slice(0, 8)}...`,
      timestamp: Date.now(),
      metadata: { to: toAddress },
    });

    try {
      // ERC-20 transfer via contract interface (6 decimals)
      const hash = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, rawAmount],
      });

      updateTransaction(txId, { status: "success", txHash: hash });
      return hash;
    } catch (err) {
      updateTransaction(txId, { status: "failed" });
      throw err;
    }
  }

  return {
    sendUSDC,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
