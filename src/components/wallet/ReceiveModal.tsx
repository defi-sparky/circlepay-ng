"use client";
// components/wallet/ReceiveModal.tsx

import { useAccount } from "wagmi";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Download } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import toast from "react-hot-toast";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { address } = useAccount();

  async function handleCopy() {
    if (!address) return;
    await copyToClipboard(address);
    toast.success("Address copied to clipboard!");
  }

  if (!isOpen || !address) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-brand-surface border-t border-brand-border rounded-t-3xl p-6 pb-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-brand-text">Receive USDC</h3>
            <p className="text-xs text-brand-text-muted">Share your address to receive USDC on Arc</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center"
          >
            <X size={16} className="text-brand-text-muted" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-2xl bg-white">
            <QRCodeSVG
              value={address}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#07090F"
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Address display */}
        <div className="glass-card p-4 mb-4">
          <p className="text-xs text-brand-text-muted mb-2 font-medium">Your Arc Wallet Address</p>
          <p className="font-mono text-sm text-brand-text break-all leading-relaxed">
            {address}
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-brand-gold/5 border border-brand-gold/20 mb-4">
          <span className="text-brand-gold text-sm mt-0.5">⚠️</span>
          <p className="text-xs text-brand-text-muted">
            Only send <strong className="text-brand-text">USDC on Arc Testnet</strong> to this address.
            Sending other tokens or on wrong network may result in permanent loss.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Copy size={16} />
          Copy Address
        </button>
      </div>
    </div>
  );
}
