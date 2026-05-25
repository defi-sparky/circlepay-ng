"use client";
// components/wallet/WalletBalance.tsx

import { useAccount } from "wagmi";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useAppStore } from "@/lib/store";
import { arcTestnet } from "@/lib/wagmi";
import { shortenAddress, copyToClipboard } from "@/lib/utils";
import { Copy, RefreshCw, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export function WalletBalance() {
  const { address } = useAccount();
  const { formattedBalance, numericBalance, isLoading, refetch } = useUSDCBalance();
  const usdcNgnRate = useAppStore((s) => s.usdcNgnRate);

  const ngnEquivalent = (numericBalance * usdcNgnRate).toLocaleString("en-NG", {
    maximumFractionDigits: 0,
  });

  async function handleCopyAddress() {
    if (!address) return;
    await copyToClipboard(address);
    toast.success("Address copied!");
  }

  return (
    <div className="relative overflow-hidden glass-card p-6">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-glow-green pointer-events-none" />

      {/* Network badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="network-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-green" />
          Arc Testnet
        </div>
        <button
          onClick={() => refetch()}
          className="w-7 h-7 rounded-lg bg-brand-muted flex items-center justify-center hover:bg-brand-border transition-colors"
        >
          <RefreshCw size={13} className="text-brand-text-muted" />
        </button>
      </div>

      {/* Balance */}
      <div className="mb-1">
        <p className="text-xs text-brand-text-muted mb-1 font-medium uppercase tracking-wider">
          USDC Balance
        </p>
        {isLoading ? (
          <div className="h-10 w-36 rounded-lg bg-brand-muted animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-brand-text">
              {formattedBalance}
            </span>
            <span className="text-brand-text-muted font-medium">USDC</span>
          </div>
        )}
        <p className="text-sm text-brand-text-muted mt-0.5">
          ≈ ₦{ngnEquivalent} NGN
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-border my-4" />

      {/* Address */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-text-muted mb-0.5">Your Address</p>
          <p className="font-mono text-sm text-brand-text">
            {address ? shortenAddress(address, 8) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAddress}
            className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center hover:bg-brand-border transition-colors"
          >
            <Copy size={13} className="text-brand-text-muted" />
          </button>
          <a
            href={`${arcTestnet.blockExplorers.default.url}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center hover:bg-brand-border transition-colors"
          >
            <ExternalLink size={13} className="text-brand-text-muted" />
          </a>
        </div>
      </div>
    </div>
  );
}
