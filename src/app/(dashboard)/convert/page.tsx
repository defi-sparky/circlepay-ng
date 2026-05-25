"use client";
// app/(dashboard)/convert/page.tsx
// USDC ↔ Naira rate display + off-ramp redirect

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useAppStore } from "@/lib/store";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import {
  ArrowLeftRight,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Copy,
  CheckCircle,
} from "lucide-react";
import { cn, copyToClipboard, formatNaira } from "@/lib/utils";
import toast from "react-hot-toast";
import axios from "axios";

type Direction = "sell" | "buy";

interface RateData {
  rate: number;
  sell: number;
  buy: number;
  cached: boolean;
  timestamp: number;
}

// Trusted Nigerian off-ramp partners
const OFFRAMP_PARTNERS = [
  {
    name: "Breet",
    description: "Instant crypto-to-bank. Best rates in Nigeria.",
    url: "https://breet.app",
    badge: "Recommended",
    badgeColor: "text-brand-green bg-brand-green/10 border-brand-green/20",
  },
  {
    name: "Busha",
    description: "Local exchange with competitive NGN rates.",
    url: "https://busha.co",
    badge: "Popular",
    badgeColor: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  },
  {
    name: "Yellow Card",
    description: "Pan-African crypto exchange. Fast NGN withdrawals.",
    url: "https://yellowcard.io",
    badge: "Pan-Africa",
    badgeColor: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  },
];

export default function ConvertPage() {
  const { isConnected } = useAccount();
  const { numericBalance } = useUSDCBalance();
  const { usdcNgnRate, setRate } = useAppStore();

  const [direction, setDirection] = useState<Direction>("sell");
  const [usdcInput, setUsdcInput] = useState("");
  const [ngnInput, setNgnInput] = useState("");
  const [rateData, setRateData] = useState<RateData | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch live rate on mount
  useEffect(() => {
    fetchRate();
  }, []);

  async function fetchRate() {
    setIsLoadingRate(true);
    try {
      const res = await axios.get("/api/rates");
      setRateData(res.data);
      setRate(res.data.rate);
    } catch {
      // Silently use cached rate from store
    } finally {
      setIsLoadingRate(false);
    }
  }

  const activeRate = direction === "sell"
    ? (rateData?.sell ?? usdcNgnRate * 0.97)
    : (rateData?.buy ?? usdcNgnRate * 1.02);

  // Sync inputs
  function handleUsdcChange(val: string) {
    setUsdcInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setNgnInput((num * activeRate).toFixed(0));
    } else {
      setNgnInput("");
    }
  }

  function handleNgnChange(val: string) {
    setNgnInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setUsdcInput((num / activeRate).toFixed(4));
    } else {
      setUsdcInput("");
    }
  }

  function setMaxUsdc() {
    handleUsdcChange(numericBalance.toFixed(4));
  }

  const usdcNum = parseFloat(usdcInput) || 0;
  const ngnNum = parseFloat(ngnInput) || 0;
  const hasEnoughBalance = direction === "sell" ? usdcNum <= numericBalance : true;
  const canConvert = usdcNum > 0 && hasEnoughBalance;

  async function handleCopyAddress() {
    await copyToClipboard("Send USDC to partner wallet");
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  }

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="p-4 space-y-5 page-enter">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-text">Convert</h1>
        <p className="text-sm text-brand-text-muted mt-0.5">
          USDC ↔ Naira. See live rates, sell via trusted partners.
        </p>
      </div>

      {/* Live Rate Card */}
      <div className="relative overflow-hidden glass-card p-5">
        <div className="absolute inset-0 bg-glow-blue pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-brand-text-muted uppercase tracking-wider font-medium mb-1">
              Live Rate
            </p>
            <div className="flex items-baseline gap-2">
              {isLoadingRate ? (
                <div className="h-8 w-32 rounded-lg bg-brand-muted animate-pulse" />
              ) : (
                <>
                  <span className="font-display text-2xl font-bold text-brand-text">
                    1 USDC
                  </span>
                  <span className="text-brand-text-muted text-sm">=</span>
                  <span className="font-display text-2xl font-bold text-brand-green">
                    ₦{(rateData?.rate ?? usdcNgnRate).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={fetchRate}
            disabled={isLoadingRate}
            className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center hover:bg-brand-border transition-colors"
          >
            <RefreshCw
              size={15}
              className={cn(
                "text-brand-text-muted",
                isLoadingRate && "animate-spin"
              )}
            />
          </button>
        </div>

        {/* Buy / Sell spread */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-muted rounded-xl p-3">
            <p className="text-xs text-brand-text-muted mb-1">You sell at</p>
            <p className="font-display font-bold text-brand-green text-sm">
              ₦{(rateData?.sell ?? Math.round(usdcNgnRate * 0.97)).toLocaleString()}
            </p>
          </div>
          <div className="bg-brand-muted rounded-xl p-3">
            <p className="text-xs text-brand-text-muted mb-1">You buy at</p>
            <p className="font-display font-bold text-brand-gold text-sm">
              ₦{(rateData?.buy ?? Math.round(usdcNgnRate * 1.02)).toLocaleString()}
            </p>
          </div>
        </div>

        {rateData && (
          <p className="text-xs text-brand-text-muted mt-3">
            {rateData.cached ? "⚡ Cached" : "🔴 Live"} ·
            Updated {new Date(rateData.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["sell", "buy"] as Direction[]).map((dir) => (
          <button
            key={dir}
            onClick={() => setDirection(dir)}
            className={cn(
              "py-3 rounded-xl border text-sm font-semibold font-display capitalize transition-all",
              direction === dir
                ? "bg-brand-green/10 border-brand-green/40 text-brand-green"
                : "bg-brand-card border-brand-border text-brand-text-muted"
            )}
          >
            {dir === "sell" ? "Sell USDC → ₦" : "Buy USDC ← ₦"}
          </button>
        ))}
      </div>

      {/* Converter inputs */}
      <div className="glass-card p-4 space-y-3">
        {/* USDC input */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs text-brand-text-muted font-medium">USDC Amount</label>
            {direction === "sell" && (
              <button
                onClick={setMaxUsdc}
                className="text-xs text-brand-green font-medium hover:underline"
              >
                Max: {numericBalance.toFixed(2)} USDC
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              className="input-field pr-16"
              placeholder="0.00"
              value={usdcInput}
              onChange={(e) => handleUsdcChange(e.target.value)}
              min="0"
              step="0.01"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm font-medium">
              USDC
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-brand-muted flex items-center justify-center">
            <ArrowLeftRight size={14} className="text-brand-text-muted" />
          </div>
        </div>

        {/* NGN input */}
        <div>
          <label className="text-xs text-brand-text-muted font-medium mb-1.5 block">
            Naira Equivalent
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm font-medium">
              ₦
            </span>
            <input
              type="number"
              className="input-field pl-8 pr-12"
              placeholder="0"
              value={ngnInput}
              onChange={(e) => handleNgnChange(e.target.value)}
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted text-xs font-medium">
              NGN
            </span>
          </div>
        </div>

        {/* Rate used */}
        {canConvert && (
          <div className="flex justify-between text-xs text-brand-text-muted pt-1 border-t border-brand-border">
            <span>Rate used</span>
            <span>1 USDC = ₦{activeRate.toLocaleString()}</span>
          </div>
        )}

        {!hasEnoughBalance && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-400/10 border border-red-400/20">
            <AlertCircle size={13} className="text-red-400" />
            <span className="text-xs text-red-400">Insufficient USDC balance</span>
          </div>
        )}
      </div>

      {/* Off-ramp CTA */}
      {direction === "sell" && canConvert && (
        <div className="glass-card p-4">
          <p className="text-xs text-brand-text-muted mb-3 font-medium uppercase tracking-wider">
            Send your USDC to one of these trusted partners to receive ₦ in your bank:
          </p>
          <div className="space-y-2">
            {OFFRAMP_PARTNERS.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-brand-muted hover:bg-brand-border transition-all border border-transparent hover:border-brand-border group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-brand-text">
                      {partner.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                        partner.badgeColor
                      )}
                    >
                      {partner.badge}
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-muted">{partner.description}</p>
                </div>
                <ExternalLink
                  size={14}
                  className="text-brand-text-muted group-hover:text-brand-green transition-colors flex-shrink-0 ml-3"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Buy USDC instructions */}
      {direction === "buy" && (
        <div className="glass-card p-4">
          <p className="text-xs text-brand-text-muted mb-3 font-medium uppercase tracking-wider">
            How to buy USDC on Arc Testnet
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-green">
                1
              </div>
              <div>
                <p className="text-sm text-brand-text font-medium">Get test USDC free</p>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-blue flex items-center gap-1 mt-0.5 hover:underline"
                >
                  faucet.circle.com <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-green">
                2
              </div>
              <div>
                <p className="text-sm text-brand-text font-medium">Add Arc Testnet to MetaMask</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  RPC: rpc.arc-testnet.io · Chain ID: 1234
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-green">
                3
              </div>
              <div>
                <p className="text-sm text-brand-text font-medium">Bridge or transfer USDC</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Use Circle's CCTP bridge to move USDC across chains
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-brand-text-muted text-center px-2">
        CirclePay NG displays rates for reference only. Actual rates depend on your chosen exchange partner.
        Always verify before transacting.
      </p>
    </div>
  );
}
