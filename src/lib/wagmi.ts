// lib/wagmi.ts
// Wagmi + RainbowKit configuration for CirclePay NG

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia, baseSepolia, arbitrumSepolia } from "wagmi/chains";
import { arcTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "CirclePay NG",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "CirclePay-ng-demo",
  chains: [
    arcTestnet,       // primary chain — bill payments, staking, send
    sepolia,          // CCTP bridge source
    baseSepolia,      // CCTP bridge source
    arbitrumSepolia,  // CCTP bridge source
  ],
  transports: {
    [arcTestnet.id]:      http("https://rpc.testnet.arc.network"),
    [sepolia.id]:         http(),
    [baseSepolia.id]:     http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});

export { arcTestnet };
