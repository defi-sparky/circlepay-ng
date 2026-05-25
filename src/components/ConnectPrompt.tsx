"use client";
// components/ConnectPrompt.tsx

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Shield, Zap } from "lucide-react";

export function ConnectPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mb-6 glow-green">
        <Wallet size={36} className="text-brand-green" />
      </div>

      <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
        Connect Your Wallet
      </h2>
      <p className="text-brand-text-muted text-sm mb-8 max-w-xs leading-relaxed">
        Connect MetaMask, Rabby, or Rainbow to start paying bills with USDC on Arc Testnet.
        No stress, no P2P wahala.
      </p>

      {/* Features */}
      <div className="w-full max-w-xs space-y-3 mb-8">
        {[
          { icon: Zap, text: "Buy airtime & data instantly with USDC" },
          { icon: Shield, text: "Gasless transactions via Circle Paymaster" },
          { icon: Wallet, text: "Earn 25% APY staking your USDC" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-card border border-brand-border text-left"
          >
            <Icon size={16} className="text-brand-green flex-shrink-0" />
            <span className="text-sm text-brand-text-muted">{text}</span>
          </div>
        ))}
      </div>

      <ConnectButton label="Connect Wallet to Continue" />

      <p className="text-xs text-brand-text-muted mt-4">
        Testnet only · Get free USDC from{" "}
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-green hover:underline"
        >
          Circle Faucet
        </a>
      </p>

      {/* Builder credit */}
      <p className="text-xs text-brand-text-muted mt-8 flex items-center gap-1.5">
        <span>⚡</span>
        <span>Built by</span>
        <a
          href="https://twitter.com/Defi_Sparky"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-green font-medium hover:underline"
        >
          Defi_Sparky
        </a>
      </p>
    </div>
  );
}
