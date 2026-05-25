"use client";
// components/payment/DataForm.tsx

import { useState, useEffect } from "react";
import { NETWORKS, DATA_BUNDLES, ngnToUsdc, type NetworkProvider, type DataBundle } from "@/lib/vtu-data";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useUSDCPay } from "@/lib/hooks/useUSDCPay";
import { useAppStore } from "@/lib/store";
import { calcFees } from "@/lib/fees";
import { detectNetwork, normalizePhone, validateNigerianPhone, getErrorMessage, formatNaira } from "@/lib/utils";
import { GasFeeDisplay } from "@/components/GasFeeDisplay";
import { SuccessScreen } from "@/components/SuccessScreen";
import { AlertCircle, Phone, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import axios from "axios";

export function DataForm() {
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<NetworkProvider | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [successData, setSuccessData] = useState<{
    reference: string; txHash: string; bundle: DataBundle;
    usdcAmount: string; totalUsdc: string;
  } | null>(null);

  const { numericBalance, refetch } = useUSDCBalance();
  const usdcNgnRate = useAppStore((s) => s.usdcNgnRate);
  const gaslessMode = useAppStore((s) => s.gaslessMode);
  const { pay, isLoading, isPending, isConfirming } = useUSDCPay();

  useEffect(() => {
    if (phone.length >= 4) {
      const detected = detectNetwork(phone);
      if (detected) { setNetwork(detected as NetworkProvider); setSelectedBundle(null); }
    }
  }, [phone]);

  const usdcPrincipal = selectedBundle ? ngnToUsdc(selectedBundle.amount, usdcNgnRate) : 0;
  const fees = calcFees("payment", usdcPrincipal, gaslessMode);
  const hasEnoughBalance = fees.totalDeducted <= numericBalance;
  const isValidPhone = validateNigerianPhone(phone);
  const canProceed = isValidPhone && network && selectedBundle && hasEnoughBalance && !isLoading;
  const availableBundles = network ? DATA_BUNDLES[network] : [];

  async function handlePurchase() {
    if (!canProceed || !selectedBundle || !network) return;
    const normalizedPhone = normalizePhone(phone);

    try {
      toast("Confirm the transaction in your wallet...", { icon: "👛", duration: 10000 });

      const result = await pay({
        type: "payment",
        amountUsdc: usdcPrincipal,
        description: `${selectedBundle.data} data → ${normalizedPhone}`,
        metadata: { service: "data", network, plan: selectedBundle.name },
      });

      toast.dismiss();
      toast("Payment confirmed! Activating data...", { icon: "🌐", duration: 3000 });

      const vtResponse = await axios.post("/api/vtpass/data", {
        phone: normalizedPhone, network,
        bundleCode: selectedBundle.vtpassCode,
        amount: selectedBundle.amount,
        requestRef: result.reference,
      });

      if (vtResponse.data.success) {
        refetch();
        setSuccessData({
          reference: result.reference, txHash: result.txHash,
          bundle: selectedBundle, usdcAmount: result.amountPaid.toFixed(4),
          totalUsdc: result.totalDeducted.toFixed(4),
        });
      } else {
        toast.error("Payment sent but data activation failed. Ref: " + result.reference);
      }
    } catch (err) {
      toast.dismiss();
      toast.error(getErrorMessage(err));
    }
  }

  function handleReset() {
    setPhone(""); setNetwork(null); setSelectedBundle(null); setSuccessData(null);
  }

  if (successData && network) {
    return (
      <SuccessScreen
        title="Data Activated! 🌐"
        subtitle={`${successData.bundle.data} for ${successData.bundle.validity} activated on ${normalizePhone(phone)}`}
        reference={successData.reference}
        txHash={successData.txHash}
        extras={[
          { label: "Phone", value: normalizePhone(phone) },
          { label: "Network", value: NETWORKS[network].name },
          { label: "Bundle", value: `${successData.bundle.data} (${successData.bundle.validity})` },
          { label: "USDC Paid", value: `${successData.usdcAmount} USDC` },
          { label: "Total (incl. fees)", value: `${successData.totalUsdc} USDC` },
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
          {network && <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="network-badge">{NETWORKS[network]?.name}</span>
          </div>}
        </div>
        {phone && !isValidPhone && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> Enter a valid Nigerian number
          </p>
        )}
      </div>

      {/* Network */}
      <div>
        <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Network</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(NETWORKS) as [NetworkProvider, typeof NETWORKS[NetworkProvider]][]).map(([key, net]) => (
            <button key={key} onClick={() => { setNetwork(key); setSelectedBundle(null); }}
              className={cn("py-3 px-1 rounded-xl border text-xs font-semibold font-display transition-all",
                network === key ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : "border-brand-border bg-brand-card text-brand-text")}>
              {net.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bundles */}
      {network && (
        <div>
          <label className="text-xs text-brand-text-muted mb-1.5 block font-medium">Choose Bundle</label>
          <div className="space-y-2">
            {availableBundles.map((bundle) => {
              const bundleUsdc = ngnToUsdc(bundle.amount, usdcNgnRate);
              const bundleFees = calcFees("payment", bundleUsdc, gaslessMode);
              return (
                <button key={bundle.id} onClick={() => setSelectedBundle(bundle)}
                  className={cn("w-full flex items-center justify-between p-3.5 rounded-xl border transition-all",
                    selectedBundle?.id === bundle.id ? "border-brand-green/40 bg-brand-green/5"
                      : "border-brand-border bg-brand-card")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedBundle?.id === bundle.id ? "bg-brand-green/10" : "bg-brand-muted")}>
                      <Wifi size={16} className={selectedBundle?.id === bundle.id ? "text-brand-green" : "text-brand-text-muted"} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-brand-text">{bundle.data}</p>
                      <p className="text-xs text-brand-text-muted">{bundle.validity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-display text-brand-green">
                      {bundleFees.totalDeducted.toFixed(3)} USDC
                    </p>
                    <p className="text-xs text-brand-text-muted">{formatNaira(bundle.amount)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedBundle && !hasEnoughBalance && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-400/10 border border-red-400/20">
          <AlertCircle size={13} className="text-red-400" />
          <span className="text-xs text-red-400">Need {fees.totalDeducted.toFixed(4)} USDC total</span>
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
        ) : selectedBundle ? (
          `Pay ${fees.totalDeducted.toFixed(4)} USDC → Get ${selectedBundle.data}`
        ) : "Select a bundle to continue"}
      </button>
    </div>
  );
}
