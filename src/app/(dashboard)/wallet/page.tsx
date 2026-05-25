"use client";
// app/(dashboard)/wallet/page.tsx
// Main wallet page: balance, send, receive, history

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { useUSDCBalance } from "@/lib/hooks/useUSDCBalance";
import { useAppStore } from "@/lib/store";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { SendModal } from "@/components/wallet/SendModal";
import { ReceiveModal } from "@/components/wallet/ReceiveModal";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { Send, Download, Clock } from "lucide-react";

type ActiveModal = "send" | "receive" | null;

export default function WalletPage() {
  const { isConnected } = useAccount();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  if (!isConnected) return <ConnectPrompt />;

  return (
    <div className="p-4 space-y-4 page-enter">
      {/* Balance Card */}
      <WalletBalance />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveModal("send")}
          className="flex items-center gap-3 glass-card p-4 hover:border-brand-green/30 transition-all duration-200 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <Send size={18} className="text-brand-green" />
          </div>
          <div className="text-left">
            <div className="font-display font-semibold text-sm text-brand-text">Send</div>
            <div className="text-xs text-brand-text-muted">Transfer USDC</div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal("receive")}
          className="flex items-center gap-3 glass-card p-4 hover:border-brand-blue/30 transition-all duration-200 active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
            <Download size={18} className="text-brand-blue" />
          </div>
          <div className="text-left">
            <div className="font-display font-semibold text-sm text-brand-text">Receive</div>
            <div className="text-xs text-brand-text-muted">Your address + QR</div>
          </div>
        </button>
      </div>

      {/* Transaction History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-brand-text-muted" />
          <h2 className="font-display font-semibold text-base text-brand-text">
            Recent Activity
          </h2>
        </div>
        <TransactionHistory />
      </div>

      {/* Modals */}
      <SendModal
        isOpen={activeModal === "send"}
        onClose={() => setActiveModal(null)}
      />
      <ReceiveModal
        isOpen={activeModal === "receive"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
