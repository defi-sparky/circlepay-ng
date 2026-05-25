// lib/utils.ts
// Shared utility functions for CirclePay NG

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── TailwindCSS class merger ─────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Address formatting ───────────────────────────────────────────────────────
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ─── Nigerian phone number validation ────────────────────────────────────────
export function validateNigerianPhone(phone: string): boolean {
  // Accepts: 08012345678, 07012345678, 09012345678, 0701234567, +2348012345678
  const cleaned = phone.replace(/[\s\-]/g, "");
  return /^(\+234|0)[789][01]\d{8}$/.test(cleaned);
}

// Normalize phone to 080XXXXXXXX format
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("+234")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("234")) return "0" + cleaned.slice(3);
  return cleaned;
}

// Detect Nigerian network from phone prefix
export function detectNetwork(phone: string): string | null {
  const num = normalizePhone(phone);
  const prefix = num.slice(0, 4);

  const mtnPrefixes = [
    "0703", "0706", "0803", "0806", "0810", "0813", "0814",
    "0816", "0903", "0906", "0913", "0916",
  ];
  const airtelPrefixes = [
    "0701", "0708", "0802", "0808", "0812", "0902", "0907", "0901",
  ];
  const gloPrefixes = ["0705", "0805", "0807", "0811", "0815", "0905"];
  const nineMobilePrefixes = [
    "0809", "0817", "0818", "0909", "0908",
  ];

  if (mtnPrefixes.includes(prefix)) return "mtn";
  if (airtelPrefixes.includes(prefix)) return "airtel";
  if (gloPrefixes.includes(prefix)) return "glo";
  if (nineMobilePrefixes.includes(prefix)) return "9mobile";
  return null;
}

// ─── Meter number validation ──────────────────────────────────────────────────
export function validateMeterNumber(meter: string): boolean {
  return /^\d{11,13}$/.test(meter.replace(/\s/g, ""));
}

// ─── Currency formatting ──────────────────────────────────────────────────────
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSDCDisplay(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

// ─── Generate unique request reference ───────────────────────────────────────
export function generateRequestRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ARC${timestamp}${random}`;
}

// ─── Truncate text ────────────────────────────────────────────────────────────
export function truncate(str: string, length = 20): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// ─── Sleep utility ────────────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  }
}

// ─── Error message extractor ──────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
}

// ─── Gas estimate display ─────────────────────────────────────────────────────
export function formatGas(gasUnits: bigint, gasPriceInUSDC: number): string {
  const cost = (Number(gasUnits) * gasPriceInUSDC) / 1e6;
  return cost < 0.001 ? "< 0.001" : cost.toFixed(4);
}

export function formatUSDC(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}