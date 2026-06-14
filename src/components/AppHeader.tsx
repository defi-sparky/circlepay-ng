"use client";
// components/AppHeader.tsx

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export function AppHeader() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { gaslessMode, setGaslessMode } = useAppStore();
  const { isDark } = useTheme();
  const isCorrectNetwork = chainId === arcTestnet.id;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-200",
        isDark
          ? "bg-[#07090F]/90 border-[var(--border)]"
          : "bg-white/90 border-slate-200"
      )}
    >
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
            <span
              className={cn(
                "font-display font-bold text-base",
                isDark ? "text-[var(--text)]" : "text-slate-800"
              )}
            >
              CirclePay
            </span>
            <span className="font-display font-bold text-base text-[var(--green)]"> NG</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Gasless mode toggle */}
          {isConnected && (
            <button
              onClick={() => setGaslessMode(!gaslessMode)}
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-lg border transition-all duration-200",
                gaslessMode
                  ? "bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]"
                  : isDark
                    ? "bg-[var(--muted)] border-[var(--border)] text-[var(--text-muted)]"
                    : "bg-slate-100 border-slate-200 text-slate-500"
              )}
              title="Toggle gasless mode"
            >
              {gaslessMode ? "⛽ Free" : "⛽ Gas"}
            </button>
          )}

          {/* Wrong network warning */}
          {isConnected && !isCorrectNetwork && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
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
