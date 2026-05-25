"use client";
// components/Providers.tsx
// Wagmi + RainbowKit + React Query provider wrapper

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { Toaster } from "react-hot-toast";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 2 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00E87A",
            accentColorForeground: "#07090F",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          coolMode
        >
          {children}

          {/* Toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#141820",
                color: "#E8EDF5",
                border: "1px solid #1E2433",
                borderRadius: "12px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                maxWidth: "380px",
              },
              success: {
                iconTheme: { primary: "#00E87A", secondary: "#07090F" },
              },
              error: {
                iconTheme: { primary: "#FF4444", secondary: "#141820" },
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
