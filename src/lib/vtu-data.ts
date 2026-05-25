// lib/vtu-data.ts
// Nigerian VTU service definitions for CirclePay NG

export type NetworkProvider = "mtn" | "airtel" | "glo" | "9mobile";
export type DiscoProvider =
  | "ikeja"
  | "eko"
  | "ibadan"
  | "abuja"
  | "kano"
  | "portharcourt"
  | "benin"
  | "enugu"
  | "kaduna"
  | "jos";

export interface DataBundle {
  id: string;
  name: string;
  amount: number; // NGN
  validity: string;
  data: string;
  vtpassCode: string;
}

export interface AirtimePlan {
  amount: number; // NGN
  label: string;
}

export interface ElectricityDisco {
  id: DiscoProvider;
  name: string;
  vtpassId: string;
  logo: string;
  color: string;
}

// ─── Network providers ────────────────────────────────────────────────────────
export const NETWORKS: Record<
  NetworkProvider,
  { name: string; color: string; vtpassId: string; logo: string }
> = {
  mtn: {
    name: "MTN",
    color: "#FFCC00",
    vtpassId: "mtn",
    logo: "🟡",
  },
  airtel: {
    name: "Airtel",
    color: "#FF0000",
    vtpassId: "airtel",
    logo: "🔴",
  },
  glo: {
    name: "Glo",
    color: "#00A859",
    vtpassId: "glo",
    logo: "🟢",
  },
  "9mobile": {
    name: "9mobile",
    color: "#006600",
    vtpassId: "etisalat",
    logo: "🟩",
  },
};

// ─── Common airtime amounts ───────────────────────────────────────────────────
export const AIRTIME_PLANS: AirtimePlan[] = [
  { amount: 50, label: "₦50" },
  { amount: 100, label: "₦100" },
  { amount: 200, label: "₦200" },
  { amount: 500, label: "₦500" },
  { amount: 1000, label: "₦1,000" },
  { amount: 2000, label: "₦2,000" },
  { amount: 5000, label: "₦5,000" },
];

// ─── Data bundles per network ─────────────────────────────────────────────────
export const DATA_BUNDLES: Record<NetworkProvider, DataBundle[]> = {
  mtn: [
    {
      id: "mtn-100mb",
      name: "100MB",
      amount: 100,
      validity: "1 day",
      data: "100MB",
      vtpassCode: "mtn-data-100",
    },
    {
      id: "mtn-1gb",
      name: "1GB",
      amount: 300,
      validity: "30 days",
      data: "1GB",
      vtpassCode: "mtn-data-1000",
    },
    {
      id: "mtn-2gb",
      name: "2GB",
      amount: 500,
      validity: "30 days",
      data: "2GB",
      vtpassCode: "mtn-data-1500",
    },
    {
      id: "mtn-5gb",
      name: "5GB",
      amount: 1500,
      validity: "30 days",
      data: "5GB",
      vtpassCode: "mtn-data-2500",
    },
    {
      id: "mtn-10gb",
      name: "10GB",
      amount: 3000,
      validity: "30 days",
      data: "10GB",
      vtpassCode: "mtn-data-5000",
    },
  ],
  airtel: [
    {
      id: "airtel-100mb",
      name: "100MB",
      amount: 100,
      validity: "1 day",
      data: "100MB",
      vtpassCode: "airtel-data-100",
    },
    {
      id: "airtel-1gb",
      name: "1GB",
      amount: 350,
      validity: "30 days",
      data: "1GB",
      vtpassCode: "airtel-data-1000",
    },
    {
      id: "airtel-2gb",
      name: "2GB",
      amount: 600,
      validity: "30 days",
      data: "2GB",
      vtpassCode: "airtel-data-2000",
    },
    {
      id: "airtel-5gb",
      name: "5GB",
      amount: 1500,
      validity: "30 days",
      data: "5GB",
      vtpassCode: "airtel-data-2500",
    },
  ],
  glo: [
    {
      id: "glo-100mb",
      name: "100MB",
      amount: 50,
      validity: "1 day",
      data: "100MB",
      vtpassCode: "glo-data-100",
    },
    {
      id: "glo-1gb",
      name: "1.8GB",
      amount: 500,
      validity: "30 days",
      data: "1.8GB",
      vtpassCode: "glo-data-500",
    },
    {
      id: "glo-5gb",
      name: "5GB",
      amount: 1500,
      validity: "30 days",
      data: "5GB",
      vtpassCode: "glo-data-1500",
    },
    {
      id: "glo-10gb",
      name: "10GB",
      amount: 2500,
      validity: "30 days",
      data: "10GB",
      vtpassCode: "glo-data-2500",
    },
  ],
  "9mobile": [
    {
      id: "9mobile-1gb",
      name: "1GB",
      amount: 300,
      validity: "30 days",
      data: "1GB",
      vtpassCode: "etisalat-data-200",
    },
    {
      id: "9mobile-2gb",
      name: "2GB",
      amount: 1000,
      validity: "30 days",
      data: "2GB",
      vtpassCode: "etisalat-data-1000",
    },
    {
      id: "9mobile-5gb",
      name: "5GB",
      amount: 2000,
      validity: "30 days",
      data: "5GB",
      vtpassCode: "etisalat-data-2000",
    },
  ],
};

// ─── Electricity DISCOs ───────────────────────────────────────────────────────
export const DISCOS: ElectricityDisco[] = [
  {
    id: "ikeja",
    name: "IKEDC (Ikeja)",
    vtpassId: "ikeja-electric",
    logo: "⚡",
    color: "#FF6B00",
  },
  {
    id: "eko",
    name: "EKEDC (Eko)",
    vtpassId: "eko-electric",
    logo: "⚡",
    color: "#0066CC",
  },
  {
    id: "ibadan",
    name: "IBEDC (Ibadan)",
    vtpassId: "ibadan-electric",
    logo: "⚡",
    color: "#009900",
  },
  {
    id: "abuja",
    name: "AEDC (Abuja)",
    vtpassId: "abuja-electric",
    logo: "⚡",
    color: "#006699",
  },
  {
    id: "kano",
    name: "KEDCO (Kano)",
    vtpassId: "kano-electric",
    logo: "⚡",
    color: "#CC0000",
  },
  {
    id: "portharcourt",
    name: "PHED (Port Harcourt)",
    vtpassId: "portharcourt-electric",
    logo: "⚡",
    color: "#660099",
  },
  {
    id: "benin",
    name: "BEDC (Benin)",
    vtpassId: "benin-electric",
    logo: "⚡",
    color: "#CC6600",
  },
  {
    id: "enugu",
    name: "EEDC (Enugu)",
    vtpassId: "enugu-electric",
    logo: "⚡",
    color: "#006633",
  },
  {
    id: "kaduna",
    name: "KEDCO (Kaduna)",
    vtpassId: "kaduna-electric",
    logo: "⚡",
    color: "#003366",
  },
  {
    id: "jos",
    name: "JED (Jos)",
    vtpassId: "jos-electric",
    logo: "⚡",
    color: "#993300",
  },
];

// Common electricity amounts
export const ELECTRICITY_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

// Exchange rate mock (USDC/NGN) — in production, fetch from API
export const MOCK_USDC_NGN_RATE = 1620; // 1 USDC = ₦1,620

// Convert NGN to USDC
export function ngnToUsdc(ngn: number, rate = MOCK_USDC_NGN_RATE): number {
  return ngn / rate;
}

// Convert USDC to NGN
export function usdcToNgn(usdc: number, rate = MOCK_USDC_NGN_RATE): number {
  return usdc * rate;
}
