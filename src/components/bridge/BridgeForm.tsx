"use client";
// components/bridge/BridgeForm.tsx

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArrowDown, ExternalLink, AlertCircle, Info, Zap } from "lucide-react";
import { useCCTPBridge } from "@/lib/hooks/useCCTPBridge";
import { useMultiChainBalance } from "@/lib/hooks/useMultiChainBalance";
import { CCTP_SOURCE_CHAINS, type SourceChainKey } from "@/lib/cctp";
import { ChainBalances } from "./ChainBalances";
import { BridgeSteps } from "./BridgeSteps";
import { cn, getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

export function BridgeForm() {
  const { address } = useAccount();
  const { bridge, bridgeState, isLoading, reset } = useCCTPBridge();
  const { balances, refetch } = useMultiChainBalance();

  const [selectedChain, setSelectedChain] = useState<SourceChainKey>("ethereum-sepolia");
  const [amount, setAmount] = useState("");
  const [useForwarding, setUseForwarding] = useState(true);

  const chainConfig = CCTP_SOURCE_CHAINS[selectedChain];
  const currentBalance = balances[selectedChain];
  const numAmount = parseFloat(amount) || 0;
  const availableBalance = parseFloat(currentBalance?.balance || "0");

  // Validation
  const isBelowMinimum = numAmount > 0 && numAmount < 0.01;
  const isInsufficientBalance = numAmount > 0 && numAmount > availableBalance;
  const hasValidAmount = numAmount >= 0.01 && !isInsufficientBalance;
  const canBridge = hasValidAmount && !isLoading && bridgeState.step === "idle" && !currentBalance?.isLoading;

  // Fee estimates
  const estimatedFee = numAmount * 0.001;
  const youReceive = Math.max(0, numAmount - estimatedFee);

  function handleMax() {
    if (currentBalance?.balance && parseFloat(currentBalance.balance) > 0) {
      // Leave small buffer for fees
      const max = Math.max(0, parseFloat(currentBalance.balance) - 0.002);
      setAmount(max.toFixed(4));
    }
  }

  function handleChainSelect(chain: SourceChainKey) {
    setSelectedChain(chain);
    setAmount(""); // reset amount when switching chain
  }

  async function handleBridge() {
    if (!address) { toast.error("Connect your wallet first"); return; }

    try {
      // Chain switching is handled inside useCCTPBridge hook
      toast("Starting bridge — confirm wallet prompts", {
        icon: "🌉", duration: 5000,
      });

      await bridge({ sourceChain: selectedChain, amountUsdc: amount });

      refetch();
      toast.success("Bridge complete! USDC arriving on Arc 🎉");
    } catch (err) {
      toast.dismiss();
      toast.error(getErrorMessage(err));
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (bridgeState.step === "complete") {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 border-2 border-brand-green flex items-center justify-center mb-4 glow-green">
            <span className="text-4xl">🌉</span>
          </div>
          <h3 className="font-display font-bold text-xl text-brand-text">Bridge Complete!</h3>
          <p className="text-sm text-brand-text-muted mt-1 text-center">
            {amount} USDC is on its way to your Arc wallet
          </p>
        </div>

        <div className="glass-card p-4 space-y-2">
          {bridgeState.burnTxHash && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">Burn Tx</span>
              <a
                href={`${chainConfig.explorerUrl}/tx/${bridgeState.burnTxHash}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-blue hover:underline"
              >
                View <ExternalLink size={11} />
              </a>
            </div>
          )}
          {bridgeState.mintTxHash && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-text-muted">Mint Tx (Arc)</span>
              <a
                href={`https://testnet.arcscan.app/tx/${bridgeState.mintTxHash}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-green hover:underline"
              >
                View on ArcScan <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        <button className="btn-primary w-full" onClick={() => { reset(); setAmount(""); }}>
          Bridge More USDC
        </button>
      </div>
    );
  }

  // ── Active bridging progress ────────────────────────────────────────────────
  if (isLoading || (bridgeState.step !== "idle" && bridgeState.step !== "error")) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="text-center py-2">
          <p className="font-display font-semibold text-brand-text">
            Bridging {amount} USDC
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            {chainConfig.name} → Arc Testnet
          </p>
        </div>

        <div className="glass-card p-5">
          <BridgeSteps currentStep={bridgeState.step} />
        </div>

        {bridgeState.step === "attesting" && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/20">
            <Info size={14} className="text-brand-blue mt-0.5 flex-shrink-0" />
            <p className="text-xs text-brand-text-muted">
              Circle is signing your transfer. This usually takes 20–60 seconds.
              Please keep this window open.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (bridgeState.step === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-400/10 border border-red-400/20">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-medium">Bridge Failed</p>
            <p className="text-xs text-brand-text-muted mt-1">{bridgeState.error}</p>
          </div>
        </div>
        <button className="btn-secondary w-full" onClick={reset}>
          Try Again
        </button>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Chain selector with live balances */}
      <ChainBalances
        selectedChain={selectedChain}
        onSelectChain={handleChainSelect}
      />

      {/* Amount input with Max button */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-brand-text-muted font-medium">
            Amount to Bridge
          </label>
          {availableBalance > 0 && (
            <span className="text-xs text-brand-text-muted">
              Available:{" "}
              <span className="text-brand-text font-medium">
                {currentBalance?.isLoading ? "..." : `${currentBalance?.balance} USDC`}
              </span>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="number"
            className={cn(
              "input-field pr-28",
              isInsufficientBalance && "border-red-400/60 focus:border-red-400/60 focus:ring-red-400/20",
              isBelowMinimum && "border-red-400/60"
            )}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Max button */}
            <button
              onClick={handleMax}
              disabled={!availableBalance || currentBalance?.isLoading}
              className="px-2 py-1 rounded-lg bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-bold font-display hover:bg-brand-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              MAX
            </button>
            <span className="text-brand-text-muted text-sm font-medium">USDC</span>
          </div>
        </div>

        {/* Validation error messages */}
        {isInsufficientBalance && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
            <AlertCircle size={11} />
            Insufficient balance — you only have {currentBalance?.balance} USDC on {chainConfig.name}
          </p>
        )}
        {isBelowMinimum && !isInsufficientBalance && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
            <AlertCircle size={11} />
            Minimum bridge amount is 0.01 USDC
          </p>
        )}
        {availableBalance === 0 && !currentBalance?.isLoading && (
          <p className="text-xs text-brand-text-muted mt-1.5 flex items-center gap-1.5">
            <Info size={11} />
            No USDC on {chainConfig.name}. Get some at{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green hover:underline"
            >
              faucet.circle.com
            </a>
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-brand-muted border border-brand-border flex items-center justify-center">
          <ArrowDown size={16} className="text-brand-text-muted" />
        </div>
      </div>

      {/* Destination preview */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-text-muted font-medium">To</span>
          <span className="text-xs font-semibold text-brand-green">Arc Testnet</span>
        </div>
        {numAmount >= 0.01 && !isInsufficientBalance && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">You receive</span>
              <span className="font-display font-bold text-brand-green">
                ~{youReceive.toFixed(4)} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Bridge fee</span>
              <span className="text-brand-text">~{estimatedFee.toFixed(4)} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Est. time</span>
              <span className="text-brand-text flex items-center gap-1">
                <Zap size={12} className="text-brand-green" />
                ~30 seconds
              </span>
            </div>
          </>
        )}
      </div>

      {/* Auto-mint toggle */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-muted border border-brand-border">
        <input
          type="checkbox"
          id="forwarding"
          checked={useForwarding}
          onChange={(e) => setUseForwarding(e.target.checked)}
          className="mt-0.5 accent-[var(--green)]"
        />
        <label htmlFor="forwarding" className="cursor-pointer">
          <p className="text-sm font-medium text-brand-text">Auto-mint on Arc ✨</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Circle handles the final step. No need to switch networks manually.
          </p>
        </label>
      </div>

      {/* CCTP info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-green/5 border border-brand-green/15">
        <Info size={13} className="text-brand-green mt-0.5 flex-shrink-0" />
        <p className="text-xs text-brand-text-muted">
          Powered by{" "}
          <a
            href="https://www.circle.com/cctp"
            target="_blank" rel="noopener noreferrer"
            className="text-brand-green hover:underline"
          >
            Circle CCTP V2
          </a>
          . Native USDC — no wrapped tokens, no liquidity pools.
        </p>
      </div>

      {/* Bridge button */}
      <button
        className="btn-primary w-full"
        disabled={!canBridge}
        onClick={handleBridge}
      >
        {currentBalance?.isLoading
          ? "Loading balance..."
          : isInsufficientBalance
          ? `Insufficient USDC on ${chainConfig.name}`
          : isBelowMinimum
          ? "Minimum 0.01 USDC"
          : `Bridge ${amount ? `${amount} USDC` : "USDC"} → Arc`}
      </button>
    </div>
  );
}
