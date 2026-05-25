"use client";
// components/GasFeeDisplay.tsx
// Full fee breakdown display — shows platform fee + gas fee

import { Fuel, Info, BadgeDollarSign } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { calcFees, formatFee, type FeeType } from "@/lib/fees";
import { cn } from "@/lib/utils";

interface GasFeeDisplayProps {
  type?: FeeType;          // transaction type for fee calculation
  amount?: number;         // principal amount to calculate fee on
  estimatedGas?: string;   // override gas display (legacy / testnet)
  className?: string;
  compact?: boolean;       // show condensed single-line version
}

export function GasFeeDisplay({
  type = "payment",
  amount = 0,
  estimatedGas,
  className,
  compact = false,
}: GasFeeDisplayProps) {
  const gaslessMode = useAppStore((s) => s.gaslessMode);

  // Gasless mode — only gas is free, platform fee still applies
  if (gaslessMode) {
    const fees = calcFees(type, amount, true);
    return (
      <div className={cn(
        "rounded-xl border overflow-hidden",
        "bg-brand-green/5 border-brand-green/15",
        className
      )}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Fuel size={13} className="text-brand-green" />
          <span className="text-xs text-brand-green font-medium flex-1">
            Gas: FREE via Circle Paymaster ✨
          </span>
          {amount > 0 && fees.platformFee > 0 && (
            <span className="text-xs text-brand-text-muted">
              Fee: {formatFee(fees.platformFee)} USDC
            </span>
          )}
        </div>
      </div>
    );
  }

  // No amount — show static estimate
  if (!amount || amount === 0) {
    const gas = estimatedGas ?? "0.0020";
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-surface border border-brand-border",
        className
      )}>
        <Fuel size={13} className="text-brand-text-muted" />
        <span className="text-xs text-brand-text-muted flex-1">
          Gas: ~<span className="text-brand-text font-medium">{gas} USDC</span>
        </span>
        <div className="group relative">
          <Info size={12} className="text-brand-text-muted cursor-help" />
          <div className="absolute bottom-5 right-0 w-52 p-2 rounded-lg bg-brand-card border border-brand-border text-xs text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            Gas is paid in USDC on Arc Network. Platform fees are CirclePay's revenue.
          </div>
        </div>
      </div>
    );
  }

  const fees = calcFees(type, amount, gaslessMode);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between px-3 py-2 rounded-xl bg-brand-surface border border-brand-border",
        className
      )}>
        <div className="flex items-center gap-2">
          <Fuel size={13} className="text-brand-text-muted" />
          <span className="text-xs text-brand-text-muted">Total fees</span>
        </div>
        <span className="text-xs font-medium text-brand-text">
          {formatFee(fees.totalFee)} USDC
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl bg-brand-surface border border-brand-border overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-brand-border">
        <BadgeDollarSign size={13} className="text-brand-text-muted" />
        <span className="text-xs text-brand-text-muted font-medium">Fee Breakdown</span>
      </div>

      {/* Fee rows */}
      <div className="px-3 py-2 space-y-1.5">
        {/* Gas fee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Fuel size={11} className="text-brand-text-muted" />
            <span className="text-xs text-brand-text-muted">Network gas</span>
          </div>
          <span className="text-xs text-brand-text font-medium font-mono">
            {formatFee(fees.gasFee)} USDC
          </span>
        </div>

        {/* Platform fee */}
        {fees.platformFee > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BadgeDollarSign size={11} className="text-brand-text-muted" />
              <span className="text-xs text-brand-text-muted">
                Platform fee ({fees.platformFeePct}%)
              </span>
            </div>
            <span className="text-xs text-brand-text font-medium font-mono">
              {formatFee(fees.platformFee)} USDC
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-1.5 border-t border-brand-border">
          <span className="text-xs font-semibold text-brand-text">Total deducted</span>
          <span className="text-xs font-bold text-brand-green font-mono font-display">
            {fees.totalDeducted.toFixed(4)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}
