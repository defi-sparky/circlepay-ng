"use client";
// components/payment/AirtimeForm.tsx

import { useState, useEffect } from "react";
import { NETWORKS, AIRTIME_PLANS, ngnToUsdc, type NetworkProvider } from "@/lib/vtu-data";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useUSDCPay } from "@/lib/hooks/useUSDCPay";
import { useAppStore } from "@/lib/store";
import { calcFees } from "@/lib/fees";
import {
  detectNetwork, normalizePhone, validateNigerianPhone,
  generateRequestRef, getErrorMessage, formatNaira,
} from "@/lib/utils";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import { SuccessScreen } from "@/components/SuccessScreen";
import { AlertCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import axios from "axios";

export function AirtimeForm() {
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<NetworkProvider | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [successData, setSuccessData] = useState<{
    reference: string; txHash: string; usdcAmount: string;
    usdcFee: string; ngnAmount: number;
  } | null>(null);

  const { numericBalance, refetch } = useUSDCBalance();
  const usdcNgnRate = useAppStore((s) => s.usdcNgnRate);
  const gaslessMode = useAppStore((s) => s.gaslessMode);
  const { pay, isLoading, isPending, isConfirming } = useUSDCPay();

  useEffect(() => {
    if (phone.length >= 4) {
      const detected = detectNetwork(phone);
      if (detected) setNetwork(detected as NetworkProvider);
    }
  }, [phone]);

  const finalAmount = amount ?? (customAmount ? parseFloat(customAmount) : null);
  const usdcPrincipal = finalAmount ? ngnToUsdc(finalAmount, usdcNgnRate) : 0;
  const fees = calcFees("payment", usdcPrincipal, gaslessMode);
  const hasEnoughBalance = fees.totalDeducted <= numericBalance;
  const isValidPhone = validateNigerianPhone(phone);
  const canProceed = isValidPhone && network && finalAmount && finalAmount >= 50 && hasEnoughBalance && !isLoading;

  async function handlePurchase() {
    if (!canProceed || !finalAmount || !network) return;
    const normalizedPhone = normalizePhone(phone);

    try {
      // ── Step 1: On-chain USDC transfer (MetaMask popup) ──────────────────────
      toast("Confirm the transaction in your wallet...", { icon: "👛", duration: 10000 });

      const result = await pay({
        type: "payment",
        amountUsdc: usdcPrincipal,
        description: `₦${finalAmount} ${NETWORKS[network]?.name} airtime → ${normalizedPhone}`,
        metadata: { service: "airtime", network, phone: normalizedPhone, ngnAmount: finalAmount.toString() },
      });

      toast.dismiss();
      toast("Transaction confirmed! Delivering airtime...", { icon: "⚡", duration: 3000 });

      // ── Step 2: Deliver service via VTpass (after payment confirmed) ─────────
      const vtResponse = await axios.post("/api/vtpass/airtime", {
        phone: normalizedPhone,
        network: network === "9mobile" ? "etisalat" : network,
        amount: finalAmount,
        requestRef: result.reference,
      });

      if (vtResponse.data.success) {
        refetch(); // refresh wallet balance
        setSuccessData({
          reference: result.reference,
          txHash: result.txHash,
          usdcAmount: result.amountPaid.toFixed(4),
          usdcFee: result.totalDeducted.toFixed(4),
          ngnAmount: finalAmount,
        });
      } else {
        // Payment went through but delivery failed — show partial success
        toast.error("Payment sent but airtime delivery failed. Contact support with ref: " + result.reference);
      }
    } catch (err) {
      toast.dismiss();
      toast.error(getErrorMessage(err));
    }
  }

  function handleReset() {
    setPhone(""); setAmount(null); setCustomAmount("");
    setNetwork(null); setSuccessData(null);
  }

  if (successData) {
    return (
      <SuccessScreen
        title="Airtime Sent! ✅"
        subtitle={`₦${successData.ngnAmount} airtime delivered to ${normalizePhone(phone)}`}
        reference={successData.reference}
        txHash={successData.txHash}
        extras={[
          { label: "Phone", value: normalizePhone(phone) },
          { label: "Network", value: NETWORKS[network!]?.name || "" },
          { label: "Amount", value: formatNaira(successData.ngnAmount) },
          { label: "USDC Paid", value: `${successData.usdcAmount} USDC` },
          { label: "Total (incl. fees)", value: `${successData.usdcFee} USDC` },
        ]}
        onDone={handleReset}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Phone */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Phone Number</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input type="tel" className="input-field pl-10 pr-24" placeholder="0801 234 5678"
            value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-+]/g, ""))} maxLength={14} />
          {network && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="network-badge">{NETWORKS[network]?.name}</span>
            </div>
          )}
        </div>
        {phone && !isValidPhone && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> Enter a valid Nigerian number (e.g. 08012345678)
          </p>
        )}
      </div>

      {/* Network */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Network</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(NETWORKS) as [NetworkProvider, typeof NETWORKS[NetworkProvider]][]).map(([key, net]) => (
            <button key={key} onClick={() => setNetwork(key)}
              className={cn("py-3 px-1 rounded-xl border text-xs font-semibold font-display transition-all",
                network === key ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {net.name}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Amount (₦)</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {AIRTIME_PLANS.slice(0, 4).map((plan) => (
            <button key={plan.amount} onClick={() => { setAmount(plan.amount); setCustomAmount(""); }}
              className={cn("py-2.5 px-1 rounded-xl border text-xs font-semibold font-display transition-all",
                amount === plan.amount ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {plan.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {AIRTIME_PLANS.slice(4).map((plan) => (
            <button key={plan.amount} onClick={() => { setAmount(plan.amount); setCustomAmount(""); }}
              className={cn("py-2.5 px-1 rounded-xl border text-xs font-semibold font-display transition-all",
                amount === plan.amount ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {plan.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm font-medium">₦</span>
          <input type="number" className="input-field pl-8" placeholder="Custom amount..."
            value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
            min="50" max="50000" />
        </div>
      </div>

      {/* USDC preview */}
      {finalAmount != null && finalAmount > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-muted">USDC amount</span>
            <span className="font-display font-bold text-brand-text">{usdcPrincipal.toFixed(4)} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-muted">NGN value</span>
            <span className="text-brand-text">{formatNaira(finalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-muted">Rate</span>
            <span className="text-brand-text">1 USDC = ₦{usdcNgnRate.toLocaleString()}</span>
          </div>
          {!hasEnoughBalance && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle size={13} className="text-red-400" />
              <span className="text-xs text-red-400">Need {fees.totalDeducted.toFixed(4)} USDC total</span>
            </div>
          )}
        </div>
      )}

      <GasFeeDisplay type="payment" amount={usdcPrincipal} />

      <button className="btn-primary w-full" disabled={!canProceed} onClick={handlePurchase}>
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
            Waiting for wallet approval...
          </span>
        ) : isConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin" />
            Confirming on-chain...
          </span>
        ) : finalAmount ? (
          `Pay ${fees.totalDeducted.toFixed(4)} USDC → Get ${formatNaira(finalAmount)} Airtime`
        ) : (
          "Select amount to continue"
        )}
      </button>
    </div>
  );
}
