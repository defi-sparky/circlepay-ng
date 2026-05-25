// app/layout.tsx
import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// ── Self-hosted via next/font — zero external network request ─────────────────
// Fonts are downloaded at build time, served from your own domain.
// This eliminates the Google Fonts round-trip that was slowing down load.
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false, // mono font — not critical path
});

export const metadata: Metadata = {
  title: "CirclePay NG — Pay Bills with USDC",
  description:
    "Buy airtime, data, electricity tokens with USDC on Arc Network. Waka pay your bills without stress.",
  keywords: ["USDC", "Nigeria", "airtime", "data", "electricity", "crypto", "Arc Network"],
  themeColor: "#07090F",
  icons: {
    icon: "/favicon.png",
    apple: "/logo-icon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "CirclePay NG",
    description: "Pay Nigerian bills with USDC on Arc Testnet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-brand-bg text-brand-text font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
