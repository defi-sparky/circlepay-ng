"use client";
// components/staking/StakingHistory.tsx
// Shows recent stake/unstake/claim activity from local store

import { useAppStore } from "@/lib/store";
import { arcTestnet } from "@/lib/wagmi";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Gift, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function StakingHistory() {
  const transactions = useAppStore((s) => s.transactions);

  const stakingTxs = transactions.filter((tx) =>
    ["stake", "unstake", "claim"].includes(tx.type)
  );

  if (stakingTxs.length === 0) return null;

  const icons = {
    stake: TrendingUp,
    unstake: TrendingDown,
    claim: Gift,
  };
  const colors = {
    stake: "text-brand-blue",
    unstake: "text-orange-400",
    claim: "text-brand-green",
  };
  const bgs = {
    stake: "bg-brand-blue/10",
    unstake: "bg-orange-400/10",
    claim: "bg-brand-green/10",
  };

  return (
    <div>
      <h3 className="font-display font-semibold text-base text-brand-text mb-3">
        Staking Activity
      </h3>
      <div className="space-y-2">
        {stakingTxs.slice(0, 5).map((tx) => {
          const type = tx.type as "stake" | "unstake" | "claim";
          const Icon = icons[type];
          const explorerUrl = tx.txHash
            ? `${arcTestnet.blockExplorers.default.url}/tx/${tx.txHash}`
            : null;

          return (
            <div
              key={tx.id}
              className="glass-card p-3.5 flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  bgs[type]
                )}
              >
                <Icon size={15} className={colors[type]} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text capitalize">
                  {tx.type} USDC
                </p>
                <p className="text-xs text-brand-text-muted">
                  {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold font-display",
                    colors[type]
                  )}
                >
                  {type === "unstake" ? "-" : "+"}
                  {tx.amount} USDC
                </span>
                <span
                  className={cn(
                    "text-xs",
                    tx.status === "success"
                      ? "text-brand-green"
                      : tx.status === "pending"
                      ? "text-yellow-400"
                      : "text-red-400"
                  )}
                >
                  {tx.status}
                </span>
              </div>

              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-text-muted hover:text-brand-blue transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
