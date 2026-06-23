// lib/store.ts
// Global Zustand store for CirclePay NG

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Transaction {
  id: string;
  type: "send" | "receive" | "payment" | "stake" | "unstake" | "claim" | "bridge";
  amount: string;        // principal USDC amount
  usdcFee?: string;      // platform fee collected (USDC)
  gasFee?: string;       // network gas fee (USDC)
  totalDeducted?: string; // amount + fee + gas
  status: "pending" | "success" | "failed";
  txHash?: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, string>;
}

// ─── Fee revenue entry ────────────────────────────────────────────────────────
export interface FeeEntry {
  id: string;
  txId: string;
  type: Transaction["type"];
  platformFee: number;   // USDC — CirclePay's cut
  gasFee: number;        // USDC — network gas
  totalFee: number;      // platformFee + gasFee
  timestamp: number;
  walletAddress: string;
}

interface AppState {
  // UI state
  gaslessMode: boolean;
  setGaslessMode: (enabled: boolean) => void;

  // Transaction history
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  // ── Revenue tracking ────────────────────────────────────────────────────────
  feeRevenue: FeeEntry[];
  totalRevenue: number;        // cumulative USDC collected
  totalGasCollected: number;   // gas fees collected
  totalPlatformFees: number;   // platform fees collected
  recordFee: (entry: Omit<FeeEntry, "id">) => void;
  clearRevenue: () => void;

  // Last used details
  lastNetwork?: string;
  setLastNetwork: (network: string) => void;

  // Exchange rate cache
  usdcNgnRate: number;
  rateUpdatedAt: number;
  setRate: (rate: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      gaslessMode: false,
      setGaslessMode: (enabled) => set({ gaslessMode: enabled }),

      transactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions].slice(0, 100),
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),

      // ── Revenue ──────────────────────────────────────────────────────────────
      feeRevenue: [],
      totalRevenue: 0,
      totalGasCollected: 0,
      totalPlatformFees: 0,

      recordFee: (entry) =>
        set((state) => {
          const id = `FEE-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
          const newEntry: FeeEntry = { ...entry, id };
          return {
            feeRevenue: [newEntry, ...state.feeRevenue].slice(0, 200),
            totalRevenue: state.totalRevenue + entry.totalFee,
            totalGasCollected: state.totalGasCollected + entry.gasFee,
            totalPlatformFees: state.totalPlatformFees + entry.platformFee,
          };
        }),

      clearRevenue: () =>
        set({ feeRevenue: [], totalRevenue: 0, totalGasCollected: 0, totalPlatformFees: 0 }),

      lastNetwork: undefined,
      setLastNetwork: (network) => set({ lastNetwork: network }),

      usdcNgnRate: 1620,
      rateUpdatedAt: 0,
      setRate: (rate) => set({ usdcNgnRate: rate, rateUpdatedAt: Date.now() }),
    }),
    {
      name: "circlepay-storage",
      partialize: (state) => ({
        transactions: state.transactions,
        feeRevenue: state.feeRevenue,
        totalRevenue: state.totalRevenue,
        totalGasCollected: state.totalGasCollected,
        totalPlatformFees: state.totalPlatformFees,
        lastNetwork: state.lastNetwork,
        gaslessMode: state.gaslessMode,
        usdcNgnRate: state.usdcNgnRate,
        rateUpdatedAt: state.rateUpdatedAt,
      }),
    }
  )
);
