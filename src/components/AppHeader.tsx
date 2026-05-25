"use client";
// components/AppHeader.tsx

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export function AppHeader() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { gaslessMode, setGaslessMode } = useAppStore();
  const isCorrectNetwork = chainId === arcTestnet.id;

  return (
    <header className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/wallet" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="CirclePay NG"
            width={34}
            height={34}
            priority
            className="object-contain"
          />
          <div>
            <span className="font-display font-bold text-base text-brand-text">CirclePay</span>
            <span className="font-display font-bold text-base text-brand-green"> NG</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Gasless mode toggle */}
          {isConnected && (
            <button
              onClick={() => setGaslessMode(!gaslessMode)}
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-lg border transition-all duration-200",
                gaslessMode
                  ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                  : "bg-brand-muted border-brand-border text-brand-text-muted"
              )}
              title="Toggle gasless mode (Arc Circle Paymaster)"
            >
              {gaslessMode ? "⛽ Free" : "⛽ Gas"}
            </button>
          )}

          {/* Wrong network warning */}
          {isConnected && !isCorrectNetwork && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Wrong Net
            </div>
          )}

          {/* RainbowKit connect button */}
          <ConnectButton
            accountStatus="avatar"
            chainStatus="none"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}
