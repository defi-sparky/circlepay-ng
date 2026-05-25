"use client";
// components/payment/ElectricityForm.tsx

import { useState } from "react";
import { DISCOS, ELECTRICITY_AMOUNTS, ngnToUsdc } from "@/lib/vtu-data";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useUSDCPay } from "@/lib/hooks/useUSDCPay";
import { useAppStore } from "@/lib/store";
import { calcFees } from "@/lib/fees";
import { getErrorMessage, formatNaira, validateMeterNumber } from "@/lib/utils";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import { SuccessScreen } from "@/components/SuccessScreen";
import { AlertCircle, Zap, Search, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import axios from "axios";

export function ElectricityForm() {
  const [disco, setDisco] = useState<string | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [meterCustomer, setMeterCustomer] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successData, setSuccessData] = useState<{
    reference: string; txHash: string; token: string;
    units: string; amount: number; usdcAmount: string; totalUsdc: string;
  } | null>(null);

  const { numericBalance, refetch } = useUSDCBalance();
  const usdcNgnRate = useAppStore((s) => s.usdcNgnRate);
  const gaslessMode = useAppStore((s) => s.gaslessMode);
  const { pay, isLoading, isPending, isConfirming } = useUSDCPay();

  const finalAmount = amount ?? (customAmount ? parseFloat(customAmount) : null);
  const usdcPrincipal = finalAmount ? ngnToUsdc(finalAmount, usdcNgnRate) : 0;
  const fees = calcFees("payment", usdcPrincipal, gaslessMode);
  const hasEnoughBalance = fees.totalDeducted <= numericBalance;
  const isValidMeter = validateMeterNumber(meterNumber);
  const canProceed = disco && isValidMeter && finalAmount && finalAmount >= 500 && hasEnoughBalance && !isLoading;

  async function verifyMeter() {
    if (!disco || !isValidMeter) return;
    setIsVerifying(true);
    try {
      const res = await axios.get(`/api/vtpass/electricity?disco=${disco}&meter=${meterNumber.replace(/\s/g, "")}&type=${meterType}`);
      if (res.data.success) {
        setMeterCustomer(res.data.customerName);
        toast.success(`Meter verified: ${res.data.customerName}`);
      } else {
        toast.error("Could not verify meter.");
      }
    } catch { toast.error("Meter verification failed"); }
    finally { setIsVerifying(false); }
  }

  async function handlePurchase() {
    if (!canProceed || !finalAmount || !disco) return;
    const discoName = DISCOS.find((d) => d.vtpassId === disco)?.name || disco;

    try {
      toast("Confirm the transaction in your wallet...", { icon: "👛", duration: 10000 });

      const result = await pay({
        type: "payment",
        amountUsdc: usdcPrincipal,
        description: `₦${finalAmount} electricity — ${discoName}`,
        metadata: { service: "electricity", disco, meter: meterNumber },
      });

      toast.dismiss();
      toast("Payment confirmed! Generating token...", { icon: "⚡", duration: 3000 });

      const vtResponse = await axios.post("/api/vtpass/electricity", {
        disco, meterNumber: meterNumber.replace(/\s/g, ""),
        meterType, amount: finalAmount,
        phone: phone || "08000000000",
        requestRef: result.reference,
      });

      if (vtResponse.data.success) {
        refetch();
        setSuccessData({
          reference: result.reference, txHash: result.txHash,
          token: vtResponse.data.token, units: vtResponse.data.units,
          amount: finalAmount, usdcAmount: result.amountPaid.toFixed(4),
          totalUsdc: result.totalDeducted.toFixed(4),
        });
      } else {
        toast.error("Payment sent but token generation failed. Ref: " + result.reference);
      }
    } catch (err) {
      toast.dismiss();
      toast.error(getErrorMessage(err));
    }
  }

  function handleReset() {
    setMeterNumber(""); setAmount(null); setCustomAmount("");
    setMeterCustomer(null); setSuccessData(null);
  }

  if (successData) {
    return (
      <SuccessScreen
        title="Token Purchased! ⚡"
        subtitle="Your electricity token is ready. Load it on your meter."
        reference={successData.reference}
        txHash={successData.txHash}
        token={successData.token}
        extras={[
          { label: "Meter No.", value: meterNumber },
          { label: "Amount", value: formatNaira(successData.amount) },
          { label: "Units", value: successData.units },
          { label: "USDC Paid", value: `${successData.usdcAmount} USDC` },
          { label: "Total (incl. fees)", value: `${successData.totalUsdc} USDC` },
        ]}
        onDone={handleReset}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* DISCO */}
      <div>
        <label className="text-xs text-brand-text-muted mb-2 block font-medium">Select Your DISCO</label>
        <div className="grid grid-cols-2 gap-2">
          {DISCOS.map((d) => (
            <button key={d.id} onClick={() => setDisco(d.vtpassId)}
              className={cn("py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all",
                disco === d.vtpassId ? "border-brand-green/40 bg-brand-green/5 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              <span className="mr-1.5">{d.logo}</span>{d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Meter type */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Meter Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(["prepaid", "postpaid"] as const).map((type) => (
            <button key={type} onClick={() => setMeterType(type)}
              className={cn("py-2.5 rounded-xl border text-sm font-medium font-display capitalize transition-all",
                meterType === type ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Meter number */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Meter Number</label>
        <div className="flex gap-2">
          <input type="text" className="input-field flex-1 font-mono" placeholder="01234567890"
            value={meterNumber}
            onChange={(e) => { setMeterNumber(e.target.value.replace(/[^\d\s]/g, "")); setMeterCustomer(null); }}
            maxLength={15} />
          <button onClick={verifyMeter} disabled={!disco || !isValidMeter || isVerifying}
            className="px-3 py-2 rounded-xl bg-brand-muted border border-brand-border text-sm text-brand-text-muted hover:border-brand-green/30 transition-all disabled:opacity-40 flex items-center gap-1.5">
            {isVerifying
              ? <span className="w-4 h-4 border-2 border-brand-text-muted/30 border-t-brand-text-muted rounded-full animate-spin" />
              : <Search size={14} />}
            Verify
          </button>
        </div>
        {meterNumber && !isValidMeter && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> Must be 11-13 digits
          </p>
        )}
        {meterCustomer && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-brand-green/5 border border-brand-green/20">
            <Zap size={12} className="text-brand-green" />
            <span className="text-xs text-brand-green font-medium">{meterCustomer}</span>
          </div>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Phone (optional — SMS delivery)</label>
        <div className="relative">
          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input type="tel" className="input-field pl-10" placeholder="0801 234 5678"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Amount (₦)</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {ELECTRICITY_AMOUNTS.map((a) => (
            <button key={a} onClick={() => { setAmount(a); setCustomAmount(""); }}
              className={cn("py-2.5 rounded-xl border text-xs font-semibold font-display transition-all",
                amount === a ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {formatNaira(a)}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm">₦</span>
          <input type="number" className="input-field pl-8" placeholder="Custom amount (min ₦500)"
            value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }} min="500" />
        </div>
      </div>

      {/* Preview */}
      {finalAmount != null && finalAmount > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-muted">USDC cost</span>
            <span className="font-display font-bold text-brand-green">{usdcPrincipal.toFixed(4)} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-muted">NGN value</span>
            <span className="text-brand-text">{formatNaira(finalAmount)}</span>
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
          `Pay ${fees.totalDeducted.toFixed(4)} USDC → Get ⚡ Token`
        ) : "Select amount to continue"}
      </button>
    </div>
  );
}
