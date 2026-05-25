"use client";
// components/wallet/SendModal.tsx

import { useState } from "react";
import { isAddress } from "viem";
import { X, Send, AlertCircle } from "lucide-react";
import { useUSDCTransfer } from "@/lib/hooks/useUSDCTransfer";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useAppStore } from "@/lib/store";
import { calcFees } from "@/lib/fees";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const { numericBalance, refetch } = useUSDCBalance();
  const { sendUSDC, isPending, isConfirming } = useUSDCTransfer();
  const gaslessMode = useAppStore((s) => s.gaslessMode);
  const recordFee = useAppStore((s) => s.recordFee);

  const isValidAddress = toAddress.length > 0 && isAddress(toAddress);
  const numAmount = parseFloat(amount) || 0;
  const fees = calcFees("send", numAmount, gaslessMode);
  const isValidAmount = numAmount > 0 && fees.totalDeducted <= numericBalance;
  const canProceed = isValidAddress && isValidAmount;
  const isLoading = isPending || isConfirming;

  function handleMax() {
    // Reserve enough for fees
    const maxAmount = Math.max(0, numericBalance - fees.totalFee - 0.001);
    setAmount(maxAmount.toFixed(4));
  }

  async function handleSend() {
    try {
      const hash = await sendUSDC(toAddress, amount);

      // Record fee revenue
      recordFee({
        txId: hash || "send-" + Date.now(),
        type: "send",
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        totalFee: fees.totalFee,
        timestamp: Date.now(),
        walletAddress: toAddress,
      });

      toast.success(`Sent ${amount} USDC successfully! 🎉`);
      refetch();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleClose() {
    setToAddress(""); setAmount(""); setStep("form"); onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-brand-surface border-t border-brand-border rounded-t-3xl p-6 pb-10 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Send size={18} className="text-brand-green" />
            </div>
            <div>
              <h3 className="font-display font-bold text-brand-text">Send USDC</h3>
              <p className="text-xs text-brand-text-muted">Arc Testnet</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
            <X size={16} className="text-brand-text-muted" />
          </button>
        </div>

        {step === "form" ? (
          <div className="space-y-4">
            {/* Recipient */}
            <div>
              <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Recipient Address</label>
              <input type="text" className="input-field font-mono text-sm" placeholder="0x..."
                value={toAddress} onChange={(e) => setToAddress(e.target.value.trim())} spellCheck={false} />
              {toAddress.length > 5 && !isValidAddress && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Invalid address
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-brand-text-muted font-medium">Amount (USDC)</label>
                <button onClick={handleMax} className="text-xs text-brand-green font-medium hover:underline">
                  Max: {numericBalance.toFixed(2)} USDC
                </button>
              </div>
              <div className="relative">
                <input type="number" className="input-field pr-16" placeholder="0.00"
                  value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm font-medium">USDC</span>
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {fees.totalDeducted > numericBalance
                    ? `Need ${fees.totalDeducted.toFixed(4)} USDC (incl. fees)`
                    : "Enter a valid amount"}
                </p>
              )}
            </div>

            <GasFeeDisplay type="send" amount={numAmount} />

            <button className="btn-primary w-full" disabled={!canProceed} onClick={() => setStep("confirm")}>
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confirmation */}
            <div className="glass-card p-4 space-y-3">
              <h4 className="text-sm font-semibold text-brand-text-muted uppercase tracking-wider">
                Confirm Transaction
              </h4>
              <div className="flex justify-between">
                <span className="text-sm text-brand-text-muted">Sending</span>
                <span className="font-display font-bold text-xl text-brand-green">{amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-brand-text-muted">Platform fee (0.5%)</span>
                <span className="text-sm text-brand-text">{fees.platformFee.toFixed(4)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-brand-text-muted">Network gas</span>
                <span className="text-sm text-brand-text">{fees.gasFee.toFixed(4)} USDC</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-border">
                <span className="text-sm font-semibold text-brand-text">Total deducted</span>
                <span className="font-display font-bold text-brand-green">{fees.totalDeducted.toFixed(4)} USDC</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-brand-text-muted">To</span>
                <span className="font-mono text-xs text-brand-text max-w-[200px] text-right break-all">{toAddress}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep("form")} disabled={isLoading}>Back</button>
              <button className="btn-primary flex-1" onClick={handleSend} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
                    {isPending ? "Confirming..." : "Sending..."}
                  </span>
                ) : "Confirm Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
