"use client";
// app/(dashboard)/pay/page.tsx
// Bill payment hub: airtime, data, electricity

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { AirtimeForm } from "@/components/payment/AirtimeForm";
import { DataForm } from "@/components/payment/DataForm";
import { ElectricityForm } from "@/components/payment/ElectricityForm";
import { Phone, Wifi, Zap, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";


type ServiceTab = "airtime" | "data" | "electricity";

const tabs: { id: ServiceTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "airtime", label: "Airtime", icon: Phone, description: "Top up any Nigerian number" },
  { id: "data", label: "Data", icon: Wifi, description: "Browse without wahala" },
  { id: "electricity", label: "Electric", icon: Zap, description: "Buy electricity tokens" },
];

export default function PayPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<ServiceTab>("airtime");

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="p-4 page-enter">
      
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-brand-text">Pay Bills</h1>
        <p className="text-sm text-brand-text-muted mt-0.5">
          Pay with USDC. Quick, cheap, no P2P stress.
        </p>
      </div>
      {/* Testnet simulation notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/25">
        <FlaskConical size={15} className="text-brand-gold mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-brand-gold font-semibold">Testnet Simulation Mode</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Purchases are simulated — no real airtime/data/tokens are delivered.
            Your USDC flow works end-to-end. Live delivery activates on mainnet.
          </p>
        </div>
      </div>
      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200",
              activeTab === id
                ? "bg-brand-green/10 border-brand-green/40 text-brand-green shadow-glow-green-sm"
                : "bg-brand-card border-brand-border text-brand-text-muted hover:border-brand-border/60"
            )}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            <div className="text-center">
              <div
                className={cn(
                  "text-xs font-semibold font-display",
                  activeTab === id ? "text-brand-green" : "text-brand-text"
                )}
              >
                {label}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Form area */}
      <div className="animate-fade-in">
        {activeTab === "airtime" && <AirtimeForm />}
        {activeTab === "data" && <DataForm />}
        {activeTab === "electricity" && <ElectricityForm />}
      </div>
    </div>
  );
}
