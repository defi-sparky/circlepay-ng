"use client";
// components/bridge/ChainBalances.tsx
// Shows USDC balance on each supported source chain

import { useMultiChainBalance } from "@/lib/hooks/useMultiChainBalance";
import { CCTP_SOURCE_CHAINS, type SourceChainKey } from "@/lib/cctp";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChainBalancesProps {
  selectedChain: SourceChainKey;
  onSelectChain: (chain: SourceChainKey) => void;
}

export function ChainBalances({ selectedChain, onSelectChain }: ChainBalancesProps) {
  const { balances, refetch } = useMultiChainBalance();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-brand-text-muted font-medium">
          From Chain — Your USDC Balance
        </label>
        <button
          onClick={refetch}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-brand-muted transition-colors"
          title="Refresh balances"
        >
          <RefreshCw size={11} className="text-brand-text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(CCTP_SOURCE_CHAINS) as SourceChainKey[]).map((key) => {
          const chain = CCTP_SOURCE_CHAINS[key];
          const bal = balances[key];
          const isSelected = selectedChain === key;

          return (
            <button
              key={key}
              onClick={() => onSelectChain(key)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                isSelected
                  ? "border-brand-green/40 bg-brand-green/10"
                  : "border-brand-border bg-brand-card hover:border-brand-border/60"
              )}
            >
              {/* Chain logo */}
              <span className="text-xl">{chain.logo}</span>

              {/* Chain name */}
              <span
                className={cn(
                  "text-[10px] font-semibold font-display leading-tight text-center",
                  isSelected ? "text-brand-green" : "text-brand-text"
                )}
              >
                {chain.name.replace(" Sepolia", "")}
              </span>

              {/* Balance */}
              <div className="w-full text-center">
                {bal.isLoading ? (
                  <div className="h-3.5 w-12 rounded bg-brand-muted animate-pulse mx-auto" />
                ) : bal.isError ? (
                  <span className="text-[10px] text-brand-text-muted">—</span>
                ) : (
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      isSelected ? "text-brand-green" : "text-brand-text",
                      parseFloat(bal.balance) === 0 && "text-brand-text-muted"
                    )}
                  >
                    {bal.balance}
                  </span>
                )}
                <span className="text-[9px] text-brand-text-muted block">USDC</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
