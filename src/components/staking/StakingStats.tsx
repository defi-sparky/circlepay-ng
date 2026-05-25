"use client";
// components/staking/StakingStats.tsx

import { useStaking } from "@/lib/hooks/useStaking";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { TrendingUp, Users, Wallet, Gift, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/utils";

export function StakingStats() {
  const {
    stakedFormatted,
    stakedAmount,
    liveRewards,
    rewardsFormatted,
    totalStakedFormatted,
    apy,
    pendingRewards,
    claimRewards,
    isClaiming,
    dailyReward,
    monthlyReward,
    isTestnet,
  } = useStaking();

  const { refetch } = useUSDCBalance();

  async function handleClaim() {
    try {
      await claimRewards();
      toast.success(`Rewards claimed! 🎉`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  // Format live rewards — show more decimals when small
  function formatLiveRewards(val: number): string {
    if (val === 0) return "0.000000";
    if (val < 0.0001) return val.toFixed(8);
    if (val < 0.01) return val.toFixed(6);
    return val.toFixed(4);
  }

  return (
    <div className="space-y-3">
      {/* Your position */}
      <div className="glass-card p-4">
        <p className="text-xs text-brand-text-muted uppercase tracking-wider font-medium mb-3">
          Your Position
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Staked */}
          <div className="bg-brand-muted rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet size={12} className="text-brand-blue" />
              <span className="text-xs text-brand-text-muted">Staked</span>
            </div>
            <p className="font-display font-bold text-lg text-brand-text">
              {stakedFormatted}
            </p>
            <p className="text-xs text-brand-text-muted">USDC</p>
          </div>

          {/* Live rewards — ticks every second */}
          <div className="bg-brand-muted rounded-xl p-3 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1">
              <Gift size={12} className="text-brand-green" />
              <span className="text-xs text-brand-text-muted">Rewards</span>
              {stakedAmount > 0 && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-[10px] text-brand-green">Live</span>
                </span>
              )}
            </div>
            <p className={cn(
              "font-display font-bold text-sm transition-all duration-500",
              stakedAmount > 0 ? "text-brand-green" : "text-brand-text"
            )}>
              {formatLiveRewards(liveRewards)}
            </p>
            <p className="text-xs text-brand-text-muted">USDC</p>
          </div>
        </div>

        {/* Earnings projection (only show if staked) */}
        {stakedAmount > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-brand-surface rounded-lg p-2.5 border border-brand-border">
              <p className="text-[10px] text-brand-text-muted mb-0.5">Daily earnings</p>
              <p className="text-xs font-semibold font-display text-brand-text">
                +{dailyReward.toFixed(4)} USDC
              </p>
            </div>
            <div className="bg-brand-surface rounded-lg p-2.5 border border-brand-border">
              <p className="text-[10px] text-brand-text-muted mb-0.5">Monthly earnings</p>
              <p className="text-xs font-semibold font-display text-brand-green">
                +{monthlyReward.toFixed(2)} USDC
              </p>
            </div>
          </div>
        )}

        {/* Claim rewards button */}
        {liveRewards > 0.000001 && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full py-2.5 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm font-semibold font-display hover:bg-brand-green/15 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClaiming ? (
              <>
                <span className="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift size={15} />
                Claim {parseFloat(rewardsFormatted).toFixed(4)} USDC
              </>
            )}
          </button>
        )}

        {/* Empty state */}
        {stakedAmount === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-surface border border-brand-border">
            <Zap size={14} className="text-brand-text-muted" />
            <p className="text-xs text-brand-text-muted">
              Stake USDC below to start earning {apy}% APY
            </p>
          </div>
        )}
      </div>

      {/* Protocol stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={13} className="text-brand-green" />
            <span className="text-xs text-brand-text-muted">Current APY</span>
          </div>
          <p className="font-display font-black text-2xl text-gradient-green">
            {apy}%
          </p>
          {isTestnet && (
            <p className="text-[10px] text-brand-text-muted mt-0.5">Testnet rate</p>
          )}
        </div>

        <div className="glass-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users size={13} className="text-brand-blue" />
            <span className="text-xs text-brand-text-muted">Total Staked</span>
          </div>
          <p className="font-display font-bold text-lg text-brand-text">
            {parseFloat(totalStakedFormatted).toLocaleString()}
          </p>
          <p className="text-xs text-brand-text-muted">USDC TVL</p>
        </div>
      </div>
    </div>
  );
}
