"use client";
// components/staking/StakePanel.tsx

import { useState } from "react";
import { useStaking } from "@/lib/hooks/useStaking";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import { SuccessScreen } from "@/components/SuccessScreen";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lock,
  FlaskConical,
} from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

type Mode = "stake" | "unstake";

export function StakePanel() {
  const [mode, setMode] = useState<Mode>("stake");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState("");
  const [successMode, setSuccessMode] = useState<Mode>("stake");
  const [successHash, setSuccessHash] = useState<string | undefined>();

  const { numericBalance, refetch: refetchBalance } = useUSDCBalance();
  const {
    stake,
    unstake,
    isStaking,
    isUnstaking,
    stakedFormatted,
    stakedAmount,
    apy,
    isTestnet,
    dailyReward,
    monthlyReward,
  } = useStaking();

  const numAmount = parseFloat(amount) || 0;
  const maxAmount = mode === "stake" ? numericBalance : stakedAmount;
  const hasEnough = numAmount > 0 && numAmount <= maxAmount;
  const isLoading = isStaking || isUnstaking;

  function setMax() {
    setAmount(maxAmount.toFixed(4));
  }

  async function handleSubmit() {
    if (!hasEnough || numAmount <= 0) return;
    try {
      let hash: string | undefined;
      if (mode === "stake") {
        hash = await stake(amount);
        toast.success(`Staked ${amount} USDC — earning ${apy}% APY 🎉`);
      } else {
        hash = await unstake(amount);
        toast.success(`Unstaked ${amount} USDC successfully!`);
      }
      setSuccessAmount(amount);
      setSuccessMode(mode);
      setSuccessHash(hash);
      setAmount("");
      setShowSuccess(true);
      refetchBalance();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (showSuccess) {
    return (
      <SuccessScreen
        title={successMode === "stake" ? "USDC Staked! 🔒" : "USDC Unstaked! ✅"}
        subtitle={
          successMode === "stake"
            ? `${successAmount} USDC is now earning ${apy}% APY. Rewards tick every second.`
            : `${successAmount} USDC has been returned to your wallet.`
        }
        txHash={successHash}
        extras={[
          { label: "Amount", value: `${successAmount} USDC` },
          {
            label: successMode === "stake" ? "APY" : "Action",
            value: successMode === "stake" ? `${apy}%` : "Unstaked",
          },
          ...(isTestnet ? [{ label: "Mode", value: "Testnet Simulation" }] : []),
        ]}
        onDone={() => setShowSuccess(false)}
      />
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-brand-text">
          Stake or Unstake USDC
        </h3>
        {isTestnet && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/20">
            <FlaskConical size={11} className="text-brand-gold" />
            <span className="text-[10px] text-brand-gold font-medium">Simulated</span>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 bg-brand-muted p-1 rounded-xl">
        {([
          { id: "stake", icon: TrendingUp, label: "Stake" },
          { id: "unstake", icon: TrendingDown, label: "Unstake" },
        ] as { id: Mode; icon: typeof TrendingUp; label: string }[]).map(
          ({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setAmount(""); }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold font-display transition-all",
                mode === id
                  ? "bg-brand-card text-brand-green shadow-sm"
                  : "text-brand-text-muted hover:text-brand-text"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        )}
      </div>

      {/* Amount input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-brand-text-muted font-medium">
            Amount (USDC)
          </label>
          <button onClick={setMax} className="text-xs text-brand-green font-medium hover:underline">
            Max:{" "}
            {mode === "stake"
              ? `${numericBalance.toFixed(2)} USDC (wallet)`
              : `${stakedFormatted} USDC (staked)`}
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            className="input-field pr-16"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm font-medium">
            USDC
          </span>
        </div>
        {amount && !hasEnough && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} />
            {numAmount > maxAmount ? "Insufficient balance" : "Enter a valid amount"}
          </p>
        )}
      </div>

      {/* Rewards preview — shown when staking */}
      {mode === "stake" && numAmount > 0 && hasEnough && (
        <div className="bg-brand-green/5 border border-brand-green/15 rounded-xl p-4 space-y-2">
          <p className="text-xs text-brand-green font-semibold uppercase tracking-wider">
            Estimated Earnings
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-brand-text-muted">Daily</p>
              <p className="font-display font-bold text-sm text-brand-text">
                +{((numAmount * apy) / 100 / 365).toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-muted">Monthly</p>
              <p className="font-display font-bold text-sm text-brand-text">
                +{((numAmount * apy) / 100 / 365 * 30).toFixed(3)}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-text-muted">Yearly</p>
              <p className="font-display font-bold text-sm text-brand-green">
                +{((numAmount * apy) / 100).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-brand-text-muted">
            At {apy}% APY · Rewards accrue every second
          </p>
        </div>
      )}

      {/* Nothing staked warning */}
      {mode === "unstake" && stakedAmount === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-muted border border-brand-border">
          <Lock size={14} className="text-brand-text-muted" />
          <p className="text-xs text-brand-text-muted">
            You don&apos;t have any USDC staked yet.
          </p>
        </div>
      )}

      <GasFeeDisplay estimatedGas={isTestnet ? "0.00" : "0.0012"} />

      {isTestnet && (
        <p className="text-xs text-brand-text-muted text-center">
          Staking is simulated on testnet. Real on-chain staking activates on mainnet.
        </p>
      )}

      <button
        className="btn-primary w-full"
        disabled={!hasEnough || isLoading || numAmount <= 0}
        onClick={handleSubmit}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
            {isStaking ? "Staking..." : "Unstaking..."}
          </span>
        ) : mode === "stake" ? (
          `Stake ${amount || "0"} USDC → Earn ${apy}% APY`
        ) : (
          `Unstake ${amount || "0"} USDC`
        )}
      </button>
    </div>
  );
}
