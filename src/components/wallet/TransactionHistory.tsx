"use client";
// components/wallet/TransactionHistory.tsx

import { useAppStore } from "@/lib/store";
import { arcTestnet } from "@/lib/wagmi";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Send, Download, Zap, TrendingUp, TrendingDown, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  send: { icon: Send, label: "Sent", color: "text-red-400", bg: "bg-red-400/10" },
  receive: { icon: Download, label: "Received", color: "text-brand-green", bg: "bg-brand-green/10" },
  payment: { icon: Zap, label: "Bill Payment", color: "text-brand-gold", bg: "bg-brand-gold/10" },
  stake: { icon: TrendingUp, label: "Staked", color: "text-brand-blue", bg: "bg-brand-blue/10" },
  unstake: { icon: TrendingDown, label: "Unstaked", color: "text-orange-400", bg: "bg-orange-400/10" },
  claim: { icon: Gift, label: "Rewards", color: "text-brand-green", bg: "bg-brand-green/10" },
};

const statusConfig = {
  pending: { label: "Pending", color: "text-yellow-400" },
  success: { label: "Success", color: "text-brand-green" },
  failed: { label: "Failed", color: "text-red-400" },
};

export function TransactionHistory() {
  const transactions = useAppStore((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-muted flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-brand-text-muted" />
        </div>
        <p className="text-sm text-brand-text-muted">No transactions yet</p>
        <p className="text-xs text-brand-text-muted mt-1">
          Your activity will appear here after your first transaction
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type];
        const statusCfg = statusConfig[tx.status];
        const Icon = config.icon;
        const explorerUrl = tx.txHash
          ? `${arcTestnet.blockExplorers.default.url}/tx/${tx.txHash}`
          : null;

        return (
          <div
            key={tx.id}
            className="glass-card p-4 flex items-center gap-3"
          >
            {/* Icon */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
              <Icon size={16} className={config.color} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-brand-text truncate">
                  {tx.description}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-xs font-medium", statusCfg.color)}>
                  {statusCfg.label}
                </span>
                <span className="text-brand-border">·</span>
                <span className="text-xs text-brand-text-muted">
                  {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Amount + link */}
            <div className="flex flex-col items-end gap-1">
              <span className={cn("text-sm font-semibold font-display", config.color)}>
                {tx.type === "receive" || tx.type === "claim" ? "+" : "-"}
                {tx.amount} USDC
              </span>
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
          </div>
        );
      })}
    </div>
  );
}
