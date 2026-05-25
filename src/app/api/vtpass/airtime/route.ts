// app/api/vtpass/airtime/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// TESTNET MODE — returns simulated success responses without calling VTpass.
// To go live: set VTPASS_API_KEY, VTPASS_PUBLIC_KEY, VTPASS_SECRET_KEY in
// .env.local and replace this file with the real implementation (see bottom).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { validateNigerianPhone, generateRequestRef, normalizePhone } from "@/lib/utils";

const IS_TESTNET = !process.env.VTPASS_API_KEY || process.env.VTPASS_API_KEY === "your_vtpass_api_key";

const NETWORK_NAMES: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  etisalat: "9mobile",
  "9mobile": "9mobile",
};

// Simulate a small network delay so it feels real
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, network, amount, requestRef } = body;

    // ── Validation (runs in both testnet and live mode) ──────────────────────
    if (!phone || !network || !amount) {
      return NextResponse.json(
        { success: false, message: "Phone, network, and amount are required" },
        { status: 400 }
      );
    }

    if (!validateNigerianPhone(phone)) {
      return NextResponse.json(
        { success: false, message: "Invalid Nigerian phone number" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 50 || numAmount > 50000) {
      return NextResponse.json(
        { success: false, message: "Amount must be between ₦50 and ₦50,000" },
        { status: 400 }
      );
    }

    const vtpassNetwork = network === "9mobile" ? "etisalat" : network;
    const validNetworks = ["mtn", "airtel", "glo", "etisalat"];
    if (!validNetworks.includes(vtpassNetwork)) {
      return NextResponse.json(
        { success: false, message: "Invalid network provider" },
        { status: 400 }
      );
    }

    const ref = requestRef || generateRequestRef();
    const normalizedPhone = normalizePhone(phone);
    const networkName = NETWORK_NAMES[vtpassNetwork] || network;

    // ── TESTNET: return mock success ─────────────────────────────────────────
    if (IS_TESTNET) {
      await delay(1200); // simulate API latency

      return NextResponse.json({
        success: true,
        testnet: true,
        reference: ref,
        vtpassRef: `VTPASS-MOCK-${ref}`,
        message: `✅ ₦${numAmount} ${networkName} airtime sent to ${normalizedPhone}`,
        data: {
          code: "000",
          response_description: "TRANSACTION SUCCESSFUL",
          requestId: ref,
          amount: numAmount,
          phone: normalizedPhone,
          network: networkName,
          content: {
            transactions: {
              status: "delivered",
              product_name: `${networkName} Airtime`,
              unique_element: normalizedPhone,
              unit_price: numAmount,
              quantity: 1,
              service_verification: null,
              channel: "api",
              commission: 0,
              total_amount: numAmount,
              discount: null,
              type: "Airtime Recharge",
              email: "testnet@circlepay.ng",
              phone: normalizedPhone,
              name: normalizedPhone,
              convinience_fee: 0,
              amount: numAmount,
              platform: "api",
              method: "usdc",
              transactionId: ref,
            },
          },
        },
      });
    }

    // ── LIVE: real VTpass call (uncomment when you have API keys) ────────────
    // const axios = (await import("axios")).default;
    // const response = await axios.post(
    //   `${process.env.VTPASS_API_URL}/pay`,
    //   { request_id: ref, serviceID: vtpassNetwork, amount: numAmount, phone: normalizedPhone },
    //   {
    //     headers: { "api-key": process.env.VTPASS_API_KEY, "Secret-Key": process.env.VTPASS_SECRET_KEY },
    //     timeout: 30_000,
    //   }
    // );
    // const vtData = response.data;
    // if (vtData.code === "000") {
    //   return NextResponse.json({ success: true, reference: ref, vtpassRef: vtData.requestId, message: `Airtime of ₦${numAmount} sent to ${normalizedPhone}`, data: vtData });
    // }
    // return NextResponse.json({ success: false, message: vtData.response_description }, { status: 422 });

    return NextResponse.json({ success: false, message: "Live mode not configured" }, { status: 503 });

  } catch (error) {
    console.error("[Airtime API Error]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}