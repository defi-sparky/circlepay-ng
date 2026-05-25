"use client";
// app/(dashboard)/stake/page.tsx
// USDC Staking — earn 25% APY on Arc Testnet

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { StakePanel } from "@/components/staking/StakePanel";
import { StakingStats } from "@/components/staking/StakingStats";
import { StakingHistory } from "@/components/staking/StakingHistory";
import { TrendingUp, Info } from "lucide-react";

export default function StakePage() {
  const { isConnected } = useAccount();

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="p-4 space-y-4 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-text">Earn on USDC</h1>
          <p className="text-sm text-brand-text-muted mt-0.5">
            Stake USDC and collect yield. No lock-up.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-brand-text-muted mb-0.5 uppercase tracking-wider font-medium">APY</span>
          <span className="font-display text-3xl font-black text-gradient-green">25%</span>
        </div>
      </div>

      {/* Testnet notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/20">
        <Info size={14} className="text-brand-blue mt-0.5 flex-shrink-0" />
        <p className="text-xs text-brand-text-muted">
          <strong className="text-brand-text">Testnet only.</strong> 25% APY is a simulated rate
          for Arc Testnet. Mainnet rates will reflect real market conditions.
        </p>
      </div>

      {/* Protocol stats */}
      <StakingStats />

      {/* Stake / Unstake panel */}
      <StakePanel />

      {/* Recent staking activity */}
      <StakingHistory />
    </div>
  );
}
