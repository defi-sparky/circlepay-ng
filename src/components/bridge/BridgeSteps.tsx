"use client";
// components/bridge/BridgeSteps.tsx
// Visual step progress for the 4-step CCTP bridge flow

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BridgeStep } from "@/lib/cctp";

const STEPS: { key: BridgeStep; label: string; description: string }[] = [
  {
    key: "approving",
    label: "Approve",
    description: "Allow CCTP to spend your USDC",
  },
  {
    key: "burning",
    label: "Burn",
    description: "USDC burned on source chain",
  },
  {
    key: "attesting",
    label: "Attest",
    description: "Circle signing the transfer (~30s)",
  },
  {
    key: "minting",
    label: "Mint",
    description: "Fresh USDC minted on Arc",
  },
];

const STEP_ORDER: BridgeStep[] = [
  "idle",
  "approving",
  "burning",
  "attesting",
  "minting",
  "complete",
];

interface BridgeStepsProps {
  currentStep: BridgeStep;
  txHashes?: {
    approve?: string;
    burn?: string;
    mint?: string;
  };
}

export function BridgeSteps({ currentStep, txHashes }: BridgeStepsProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const stepIndex = i + 1; // steps start at index 1 in STEP_ORDER
        const isComplete = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;
        const isPending = currentIndex < stepIndex;

        return (
          <div key={step.key} className="flex items-center gap-3">
            {/* Step circle */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300",
                isComplete
                  ? "bg-brand-green text-brand-bg"
                  : isActive
                  ? "bg-brand-green/20 border-2 border-brand-green text-brand-green"
                  : "bg-brand-muted border border-brand-border text-brand-text-muted"
              )}
            >
              {isComplete ? (
                <Check size={14} />
              ) : isActive ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                i + 1
              )}
            </div>

            {/* Step info */}
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-semibold font-display transition-colors",
                  isComplete
                    ? "text-brand-green"
                    : isActive
                    ? "text-brand-text"
                    : "text-brand-text-muted"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-brand-text-muted">
                {step.description}
              </p>
            </div>

            {/* Tx hash badge */}
            {isComplete && (
              <div className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0" />
            )}
          </div>
        );
      })}

      {/* Connector lines */}
      <style>{`
        .bridge-steps > div:not(:last-child)::after {
          content: '';
          display: block;
          width: 2px;
          height: 12px;
          background: var(--border);
          margin-left: 15px;
        }
      `}</style>
    </div>
  );
}
