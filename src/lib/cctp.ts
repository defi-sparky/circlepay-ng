// lib/cctp.ts
// ─────────────────────────────────────────────────────────────────────────────
// CCTP V2 configuration for CirclePay NG (used with Bridge Kit)
// Official Circle docs: https://developers.circle.com/cctp
// Contract addresses confirmed at: https://docs.arc.io/arc/references/contract-addresses
// ─────────────────────────────────────────────────────────────────────────────

import { defineChain } from "viem";
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";

// ─── Arc Testnet chain definition for viem ────────────────────────────────────
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { decimals: 6, name: "USD Coin", symbol: "USDC" },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// ─── Supported source chains ──────────────────────────────────────────────────
export type SourceChainKey = "ethereum-sepolia" | "base-sepolia" | "arbitrum-sepolia";

export interface CCTPChainConfig {
  key: SourceChainKey;
  name: string;
  logo: string;
  viemChain: typeof sepolia | typeof baseSepolia | typeof arbitrumSepolia;
  usdcAddress: `0x${string}`;
  domain: number;
  explorerUrl: string;
}

export const CCTP_SOURCE_CHAINS: Record<SourceChainKey, CCTPChainConfig> = {
  "ethereum-sepolia": {
    key: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    logo: "⟠",
    viemChain: sepolia,
    usdcAddress: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
    domain: 0,
    explorerUrl: "https://sepolia.etherscan.io",
  },
  "base-sepolia": {
    key: "base-sepolia",
    name: "Base Sepolia",
    logo: "🔵",
    viemChain: baseSepolia,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    domain: 6,
    explorerUrl: "https://sepolia.basescan.org",
  },
  "arbitrum-sepolia": {
    key: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    logo: "🔷",
    viemChain: arbitrumSepolia,
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    domain: 3,
    explorerUrl: "https://sepolia.arbiscan.io",
  },
};

// ─── Arc Testnet CCTP config (confirmed from docs.arc.io) ────────────────────
export const ARC_CCTP_CONFIG = {
  domain: 26,
  tokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as `0x${string}`,
  messageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as `0x${string}`,
  tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192" as `0x${string}`,
  usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
  viemChain: arcTestnet,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type BridgeStep =
  | "idle"
  | "approving"
  | "burning"
  | "attesting"
  | "minting"
  | "complete"
  | "error";

export interface BridgeState {
  step: BridgeStep;
  approveTxHash?: string;
  burnTxHash?: string;
  mintTxHash?: string;
  error?: string;
}
