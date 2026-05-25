// app/api/rates/route.ts
// Fetch live USDC/NGN exchange rates

import { NextResponse } from "next/server";
import axios from "axios";

// Cache rate for 5 minutes
let rateCache: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchLiveRate(): Promise<number> {
  try {
    // Try CoinGecko first (free, no API key needed)
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn",
      { timeout: 8_000 }
    );
    const rate = response.data?.["usd-coin"]?.ngn;
    if (rate && rate > 0) return rate;
  } catch {
    console.warn("[Rates] CoinGecko failed, trying fallback");
  }

  try {
    // Fallback: open.er-api.com (USD → NGN, since USDC ≈ USD)
    const response = await axios.get(
      `https://open.er-api.com/v6/latest/USD`,
      {
        timeout: 8_000,
        params: { apikey: process.env.EXCHANGE_RATE_API_KEY },
      }
    );
    const ngnRate = response.data?.rates?.NGN;
    if (ngnRate && ngnRate > 0) return ngnRate;
  } catch {
    console.warn("[Rates] Exchange rate API failed");
  }

  // Final fallback: approximate market rate
  return 1620;
}

export async function GET() {
  try {
    // Return cached rate if fresh
    if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        rate: rateCache.rate,
        cached: true,
        timestamp: rateCache.timestamp,
        sell: Math.round(rateCache.rate * 0.97), // 3% spread for selling
        buy: Math.round(rateCache.rate * 1.02),  // 2% spread for buying
      });
    }

    const rate = await fetchLiveRate();
    rateCache = { rate, timestamp: Date.now() };

    return NextResponse.json({
      rate,
      cached: false,
      timestamp: rateCache.timestamp,
      sell: Math.round(rate * 0.97), // You pay less when selling USDC
      buy: Math.round(rate * 1.02),  // You pay more when buying USDC
    });
  } catch (error) {
    console.error("[Rates Error]", error);
    // Return last cached or fallback
    const fallback = rateCache?.rate || 1620;
    return NextResponse.json(
      {
        rate: fallback,
        cached: true,
        timestamp: rateCache?.timestamp || 0,
        sell: Math.round(fallback * 0.97),
        buy: Math.round(fallback * 1.02),
        error: "Using cached/fallback rate",
      },
      { status: 200 } // Still 200, don't break the UI
    );
  }
}
