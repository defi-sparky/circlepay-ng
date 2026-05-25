// app/api/vtpass/data/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// TESTNET MODE — simulated data bundle purchase.
// Replace with real VTpass call when API keys are ready.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { validateNigerianPhone, generateRequestRef, normalizePhone } from "@/lib/utils";

const IS_TESTNET = !process.env.VTPASS_API_KEY || process.env.VTPASS_API_KEY === "your_vtpass_api_key";

const NETWORK_NAMES: Record<string, string> = {
  mtn: "MTN", airtel: "Airtel", glo: "Glo", "9mobile": "9mobile", etisalat: "9mobile",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, network, bundleCode, amount, requestRef } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!phone || !network || !bundleCode || !amount) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!validateNigerianPhone(phone)) {
      return NextResponse.json(
        { success: false, message: "Invalid Nigerian phone number" },
        { status: 400 }
      );
    }

    const ref = requestRef || generateRequestRef();
    const normalizedPhone = normalizePhone(phone);
    const networkName = NETWORK_NAMES[network] || network;

    // Parse data size from bundle code e.g. "mtn-data-1000" → display nicely
    const bundleParts = bundleCode.split("-");
    const bundleSize = bundleParts[bundleParts.length - 1];

    // ── TESTNET: mock success ─────────────────────────────────────────────────
    if (IS_TESTNET) {
      await delay(1400);

      return NextResponse.json({
        success: true,
        testnet: true,
        reference: ref,
        vtpassRef: `VTPASS-MOCK-${ref}`,
        message: `✅ ${networkName} data bundle activated on ${normalizedPhone}`,
        data: {
          code: "000",
          response_description: "TRANSACTION SUCCESSFUL",
          requestId: ref,
          content: {
            transactions: {
              status: "delivered",
              product_name: `${networkName} Data Bundle`,
              unique_element: normalizedPhone,
              unit_price: amount,
              quantity: 1,
              type: "Data Services",
              phone: normalizedPhone,
              transactionId: ref,
              amount: amount,
            },
          },
        },
      });
    }

    // ── LIVE MODE (uncomment when ready) ──────────────────────────────────────
    // const axios = (await import("axios")).default;
    // const serviceIdMap: Record<string, string> = { mtn: "mtn-data", airtel: "airtel-data", glo: "glo-data", "9mobile": "etisalat-data" };
    // const response = await axios.post(`${process.env.VTPASS_API_URL}/pay`, {
    //   request_id: ref, serviceID: serviceIdMap[network], billersCode: normalizedPhone,
    //   variation_code: bundleCode, amount, phone: normalizedPhone,
    // }, { headers: { "api-key": process.env.VTPASS_API_KEY, "Secret-Key": process.env.VTPASS_SECRET_KEY }, timeout: 30_000 });
    // const vtData = response.data;
    // if (vtData.code === "000") return NextResponse.json({ success: true, reference: ref, vtpassRef: vtData.requestId, message: "Data bundle activated", data: vtData });
    // return NextResponse.json({ success: false, message: vtData.response_description }, { status: 422 });

    return NextResponse.json({ success: false, message: "Live mode not configured" }, { status: 503 });

  } catch (error) {
    console.error("[Data API Error]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET — mock data variations (for future plan fetching)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get("network");
  if (!network) {
    return NextResponse.json({ success: false, message: "Network required" }, { status: 400 });
  }
  // Return empty — frontend uses hardcoded plans from vtu-data.ts
  return NextResponse.json({ success: true, data: { varations: [] } });
}