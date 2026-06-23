"use client";
// app/(dashboard)/bridge/page.tsx
// CCTP V2 bridge page — transfer USDC to Arc from other chains

import { useAccount } from "wagmi";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { BridgeForm } from "@/components/bridge/BridgeForm";
import { Info } from "lucide-react";

export default function BridgePage() {
  const { isConnected } = useAccount();

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="p-4 space-y-5 page-enter">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-text">
          Bridge to Arc
        </h1>
        <p className="text-sm text-brand-text-muted mt-0.5">
          Move USDC from any chain to Arc. Powered by Circle CCTP V2.
        </p>
      </div>

      {/* Testnet notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/25">
        <Info size={14} className="text-brand-gold mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-brand-gold font-semibold">Testnet Mode</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            This bridge works on testnet only. You need test USDC on Ethereum
            Sepolia, Base Sepolia, or Arbitrum Sepolia. Get some at{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green hover:underline"
            >
              faucet.circle.com
            </a>
          </p>
        </div>
      </div>

      {/* Bridge form */}
      <BridgeForm />

      {/* How it works */}
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-sm text-brand-text mb-3 uppercase tracking-wider">
          How It Works
        </h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Select your source chain and enter USDC amount" },
            { step: "2", text: "Approve the CCTP contract to spend your USDC" },
            { step: "3", text: "USDC is burned on the source chain" },
            { step: "4", text: "Circle signs the transfer (~30 seconds)" },
            { step: "5", text: "Fresh native USDC is minted on Arc" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-green">
                {step}
              </div>
              <p className="text-xs text-brand-text-muted pt-0.5">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
