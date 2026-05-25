"use client";
// app/revenue/page.tsx
// Internal revenue dashboard — shows all collected fees
// Access at: http://localhost:3000/revenue
// Protect this route with a password or remove on mainnet

import { useAppStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import {
  TrendingUp, BadgeDollarSign, Fuel, Zap,
  ArrowUpRight, Trash2, Lock,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  payment: "Bill Payment",
  send: "USDC Send",
  stake: "Stake",
  unstake: "Unstake",
  claim: "Claim Rewards",
};

const TYPE_COLORS: Record<string, string> = {
  payment: "text-brand-gold",
  send: "text-brand-blue",
  stake: "text-brand-green",
  unstake: "text-orange-400",
  claim: "text-brand-green",
};

// Simple PIN gate — change this to a real auth in production
const ADMIN_PIN = "1234";

export default function RevenuePage() {
  const {
    feeRevenue, totalRevenue, totalGasCollected,
    totalPlatformFees, clearRevenue,
  } = useAppStore();

  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  function handleUnlock() {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  // PIN gate
  if (!unlocked) {
    return (
      <div className="min-h-dvh bg-brand-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm glass-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Lock size={18} className="text-brand-green" />
            </div>
            <div>
              <h2 className="font-display font-bold text-brand-text">Revenue Dashboard</h2>
              <p className="text-xs text-brand-text-muted">Admin access only</p>
            </div>
          </div>
          <input
            type="password"
            className="input-field"
            placeholder="Enter admin PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            maxLength={8}
          />
          {pinError && (
            <p className="text-xs text-red-400">Incorrect PIN. Try again.</p>
          )}
          <button className="btn-primary w-full" onClick={handleUnlock}>
            Unlock Dashboard
          </button>
          <p className="text-xs text-brand-text-muted text-center">
            Default PIN: 1234 — change in <code className="text-brand-green">app/revenue/page.tsx</code>
          </p>
        </div>
      </div>
    );
  }

  // Revenue by type
  const revenueByType = feeRevenue.reduce((acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = { platform: 0, gas: 0, total: 0, count: 0 };
    acc[entry.type].platform += entry.platformFee;
    acc[entry.type].gas += entry.gasFee;
    acc[entry.type].total += entry.totalFee;
    acc[entry.type].count += 1;
    return acc;
  }, {} as Record<string, { platform: number; gas: number; total: number; count: number }>);

  return (
    <div className="min-h-dvh bg-brand-bg">
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-text">
              Revenue Dashboard
            </h1>
            <p className="text-sm text-brand-text-muted mt-0.5">
              All fees collected by CirclePay NG
            </p>
          </div>
          <button
            onClick={() => { if (confirm("Clear all revenue data?")) clearRevenue(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-medium hover:bg-red-400/15 transition-all"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-brand-green" />
              <span className="text-xs text-brand-text-muted">Total Revenue</span>
            </div>
            <p className="font-display font-black text-xl text-brand-green">
              {totalRevenue.toFixed(4)}
            </p>
            <p className="text-xs text-brand-text-muted">USDC</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BadgeDollarSign size={13} className="text-brand-gold" />
              <span className="text-xs text-brand-text-muted">Platform Fees</span>
            </div>
            <p className="font-display font-bold text-xl text-brand-gold">
              {totalPlatformFees.toFixed(4)}
            </p>
            <p className="text-xs text-brand-text-muted">USDC</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Fuel size={13} className="text-brand-blue" />
              <span className="text-xs text-brand-text-muted">Gas Collected</span>
            </div>
            <p className="font-display font-bold text-xl text-brand-blue">
              {totalGasCollected.toFixed(4)}
            </p>
            <p className="text-xs text-brand-text-muted">USDC</p>
          </div>
        </div>

        {/* Transaction count */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-brand-green" />
            <span className="text-sm text-brand-text font-medium">
              Total transactions
            </span>
          </div>
          <span className="font-display font-bold text-xl text-brand-text">
            {feeRevenue.length}
          </span>
        </div>

        {/* Revenue by type */}
        {Object.keys(revenueByType).length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-display font-semibold text-sm text-brand-text mb-3 uppercase tracking-wider">
              By Transaction Type
            </h3>
            <div className="space-y-2">
              {Object.entries(revenueByType).map(([type, data]) => (
                <div
                  key={type}
                  className="flex items-center justify-between py-2 border-b border-brand-border last:border-0"
                >
                  <div>
                    <p className={cn("text-sm font-medium", TYPE_COLORS[type] || "text-brand-text")}>
                      {TYPE_LABELS[type] || type}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      {data.count} tx · Platform: {data.platform.toFixed(4)} + Gas: {data.gas.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-sm text-brand-text">
                      {data.total.toFixed(4)} USDC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fee log */}
        <div>
          <h3 className="font-display font-semibold text-base text-brand-text mb-3">
            Fee Log
          </h3>
          {feeRevenue.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-brand-text-muted">
                No fees collected yet. Make a transaction to see revenue here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {feeRevenue.map((entry) => (
                <div key={entry.id} className="glass-card p-3.5 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-muted"
                  )}>
                    <BadgeDollarSign size={14} className={TYPE_COLORS[entry.type] || "text-brand-text-muted"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text">
                      {TYPE_LABELS[entry.type] || entry.type}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      Platform: {entry.platformFee.toFixed(4)} + Gas: {entry.gasFee.toFixed(4)} USDC ·{" "}
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-display text-brand-green">
                      +{entry.totalFee.toFixed(4)}
                    </p>
                    <p className="text-xs text-brand-text-muted">USDC</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NGN equivalent */}
        {totalRevenue > 0 && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-text-muted mb-0.5">NGN Equivalent</p>
              <p className="text-sm text-brand-text font-medium">
                At current rates
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-xl text-gradient-gold">
                ₦{(totalRevenue * 1620).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-brand-text-muted">≈ estimated</p>
            </div>
          </div>
        )}

        <p className="text-xs text-brand-text-muted text-center pb-6">
          Revenue data is stored locally on this device.
          On mainnet, fees will be collected directly to your treasury wallet on-chain.
        </p>
      </div>
    </div>
  );
}
