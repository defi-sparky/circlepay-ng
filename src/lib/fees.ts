// lib/fees.ts
// ─────────────────────────────────────────────────────────────────────────────
// CirclePay NG — Fee Engine
//
// All fees are denominated in USDC.
// Two components per transaction:
//   1. Platform fee  — CirclePay's revenue (percentage of transaction)
//   2. Gas fee       — Arc network gas (flat, very low since USDC is native gas)
//
// Fee schedule:
//   Bill payments  → 1.5% platform fee  + 0.0020 USDC gas
//   Send USDC      → 0.5% platform fee  + 0.0015 USDC gas
//   Stake          → 0.3% platform fee  + 0.0012 USDC gas
//   Unstake        → 0.3% platform fee  + 0.0012 USDC gas
//   Claim rewards  → 0.0% platform fee  + 0.0010 USDC gas (free to claim)
// ─────────────────────────────────────────────────────────────────────────────

export type FeeType = "payment" | "send" | "stake" | "unstake" | "claim";

export interface FeeBreakdown {
  principalUsdc: number;   // what user intends to transact
  platformFee: number;     // CirclePay revenue (USDC)
  gasFee: number;          // Arc network gas (USDC)
  totalFee: number;        // platformFee + gasFee
  totalDeducted: number;   // principalUsdc + totalFee (what leaves the wallet)
  platformFeePct: number;  // e.g. 1.5 for 1.5%
  breakdown: string;       // human-readable summary
}

// Fee schedule
const FEE_SCHEDULE: Record<FeeType, { platformPct: number; gasFee: number }> = {
  payment:  { platformPct: 1.5,  gasFee: 0.0020 },
  send:     { platformPct: 0.5,  gasFee: 0.0015 },
  stake:    { platformPct: 0.3,  gasFee: 0.0012 },
  unstake:  { platformPct: 0.3,  gasFee: 0.0012 },
  claim:    { platformPct: 0.0,  gasFee: 0.0010 },
};

/**
 * Calculate all fees for a transaction
 * @param type    Transaction type
 * @param amount  Principal USDC amount the user wants to transact
 * @param gasless Whether Circle Paymaster is covering gas
 */
export function calcFees(
  type: FeeType,
  amount: number,
  gasless = false
): FeeBreakdown {
  const schedule = FEE_SCHEDULE[type];
  const platformFee = (amount * schedule.platformPct) / 100;
  const gasFee = gasless ? 0 : schedule.gasFee;
  const totalFee = platformFee + gasFee;
  const totalDeducted = amount + totalFee;

  const parts: string[] = [];
  if (platformFee > 0) parts.push(`${schedule.platformPct}% platform fee`);
  if (gasFee > 0) parts.push(`${gasFee.toFixed(4)} USDC gas`);
  if (gasless && schedule.gasFee > 0) parts.push("gas sponsored");

  return {
    principalUsdc: amount,
    platformFee,
    gasFee,
    totalFee,
    totalDeducted,
    platformFeePct: schedule.platformPct,
    breakdown: parts.join(" + ") || "no fees",
  };
}

/**
 * Format a fee amount for display
 */
export function formatFee(fee: number): string {
  if (fee === 0) return "0.00";
  if (fee < 0.0001) return "< 0.0001";
  return fee.toFixed(4);
}

/**
 * Check if user has enough USDC to cover principal + all fees
 */
export function hasSufficientBalance(
  balance: number,
  amount: number,
  type: FeeType,
  gasless = false
): { sufficient: boolean; shortfall: number } {
  const { totalDeducted } = calcFees(type, amount, gasless);
  const sufficient = balance >= totalDeducted;
  return {
    sufficient,
    shortfall: sufficient ? 0 : totalDeducted - balance,
  };
}
