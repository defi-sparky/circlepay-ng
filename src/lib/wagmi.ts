// lib/wagmi.ts
// Wagmi + RainbowKit configuration for Arc Testnet

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "CirclePay NG",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "CirclePay-ng-demo",
  chains: [arcTestnet],
  ssr: true,
});

export { arcTestnet };
