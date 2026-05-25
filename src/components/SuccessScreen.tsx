"use client";
// components/SuccessScreen.tsx
// Full-screen success animation for completed transactions

import { CheckCircle, ExternalLink, Copy } from "lucide-react";
import { cn, copyToClipboard, shortenAddress } from "@/lib/utils";
import { arcTestnet } from "@/lib/wagmi";
import toast from "react-hot-toast";

interface SuccessScreenProps {
  title: string;
  subtitle: string;
  reference?: string;
  txHash?: string;
  token?: string; // For electricity tokens
  extras?: { label: string; value: string }[];
  onDone: () => void;
}

export function SuccessScreen({
  title,
  subtitle,
  reference,
  txHash,
  token,
  extras = [],
  onDone,
}: SuccessScreenProps) {
  const explorerUrl = `${arcTestnet.blockExplorers.default.url}/tx/${txHash}`;

  async function handleCopy(text: string, label: string) {
    await copyToClipboard(text);
    toast.success(`${label} copied!`);
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Success icon with pulse ring */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-brand-green/20 animate-ping" />
        <div className="relative w-24 h-24 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center glow-green">
          <CheckCircle size={48} className="text-brand-green" />
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold text-brand-text mb-2 text-center">
        {title}
      </h2>
      <p className="text-brand-text-muted text-sm text-center mb-8 max-w-xs">
        {subtitle}
      </p>

      {/* Details card */}
      <div className="w-full max-w-sm glass-card p-5 space-y-3 mb-6">
        {reference && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-text-muted">Reference</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-brand-text">{reference}</span>
              <button onClick={() => handleCopy(reference, "Reference")}>
                <Copy size={12} className="text-brand-text-muted hover:text-brand-green" />
              </button>
            </div>
          </div>
        )}

        {token && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-brand-text-muted">Electricity Token</span>
            <div
              className="flex items-center justify-between bg-brand-green/10 border border-brand-green/20 rounded-lg px-3 py-2 cursor-pointer"
              onClick={() => handleCopy(token, "Token")}
            >
              <span className="font-mono text-sm text-brand-green font-bold tracking-widest">
                {token}
              </span>
              <Copy size={14} className="text-brand-green" />
            </div>
            <span className="text-xs text-brand-text-muted">Tap to copy token</span>
          </div>
        )}

        {extras.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-brand-text-muted">{label}</span>
            <span className="text-xs text-brand-text">{value}</span>
          </div>
        ))}

        {txHash && (
          <div className="flex items-center justify-between pt-1 border-t border-brand-border">
            <span className="text-xs text-brand-text-muted">Tx Hash</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-brand-text">
                {shortenAddress(txHash, 6)}
              </span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink
                  size={12}
                  className="text-brand-blue hover:text-brand-green transition-colors"
                />
              </a>
            </div>
          </div>
        )}
      </div>

      <button onClick={onDone} className="btn-primary w-full max-w-sm">
        Done — Back to Home
      </button>
    </div>
  );
}
