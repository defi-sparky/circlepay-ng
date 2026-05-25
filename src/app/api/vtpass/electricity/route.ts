// app/api/vtpass/electricity/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// TESTNET MODE — simulated electricity token purchase.
// Generates a realistic-looking mock token number.
// Replace with real VTpass call when API keys are ready.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { generateRequestRef, validateMeterNumber } from "@/lib/utils";

const IS_TESTNET = !process.env.VTPASS_API_KEY || process.env.VTPASS_API_KEY === "your_vtpass_api_key";

// Generate a realistic-looking electricity token (20-digit numeric)
function generateMockToken(): string {
  const segments = Array.from({ length: 4 }, () =>
    Math.floor(10000 + Math.random() * 90000).toString()
  );
  return segments.join("-");
}

// Mock customer names for meter verification
const MOCK_CUSTOMERS: Record<string, string> = {
  "1111111111111": "ADEBAYO JAMES O.",
  "2222222222222": "CHIDINMA OKAFOR",
  "3333333333333": "EMEKA NWOSU & SONS",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { disco, meterNumber, meterType, amount, phone, requestRef } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!disco || !meterNumber || !meterType || !amount) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!validateMeterNumber(meterNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid meter number (must be 11-13 digits)" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      return NextResponse.json(
        { success: false, message: "Minimum electricity purchase is ₦500" },
        { status: 400 }
      );
    }

    const ref = requestRef || generateRequestRef();
    const cleanMeter = meterNumber.replace(/\s/g, "");

    // ── TESTNET: mock success ─────────────────────────────────────────────────
    if (IS_TESTNET) {
      await delay(1600); // electricity takes slightly longer

      const mockToken = generateMockToken();
      // Estimate units: roughly 65 units per ₦1000 (mock rate)
      const mockUnits = ((numAmount / 1000) * 65).toFixed(1);
      const customerName = MOCK_CUSTOMERS[cleanMeter] || "TESTNET CUSTOMER";

      return NextResponse.json({
        success: true,
        testnet: true,
        reference: ref,
        vtpassRef: `VTPASS-MOCK-${ref}`,
        token: mockToken,
        units: `${mockUnits} kWh`,
        meterName: customerName,
        message: `✅ Electricity token of ₦${numAmount} purchased successfully`,
        data: {
          code: "000",
          response_description: "TRANSACTION SUCCESSFUL",
          requestId: ref,
          token: mockToken,
          content: {
            transactions: {
              status: "delivered",
              product_name: `${disco} Electricity`,
              unique_element: cleanMeter,
              unit_price: numAmount,
              units: `${mockUnits} kWh`,
              token: mockToken,
              type: "Electricity Bill",
              meter_type: meterType,
              transactionId: ref,
              amount: numAmount,
              Customer_Name: customerName,
            },
          },
        },
      });
    }

    // ── LIVE MODE (uncomment when ready) ──────────────────────────────────────
    // const axios = (await import("axios")).default;
    // const response = await axios.post(`${process.env.VTPASS_API_URL}/pay`, {
    //   request_id: ref, serviceID: disco, billersCode: cleanMeter,
    //   variation_code: meterType, amount: numAmount, phone: phone || "08000000000",
    // }, { headers: { "api-key": process.env.VTPASS_API_KEY, "Secret-Key": process.env.VTPASS_SECRET_KEY }, timeout: 30_000 });
    // const vtData = response.data;
    // if (vtData.code === "000") {
    //   return NextResponse.json({ success: true, reference: ref, token: vtData.content?.transactions?.token, units: vtData.content?.transactions?.units, message: `Electricity token purchased`, data: vtData });
    // }
    // return NextResponse.json({ success: false, message: vtData.response_description }, { status: 422 });

    return NextResponse.json({ success: false, message: "Live mode not configured" }, { status: 503 });

  } catch (error) {
    console.error("[Electricity API Error]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET — mock meter verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const meter = searchParams.get("meter");
  const disco = searchParams.get("disco");

  if (!disco || !meter) {
    return NextResponse.json({ success: false, message: "disco and meter required" }, { status: 400 });
  }

  await delay(800);

  // Return mock customer for known test meters, generic for others
  const cleanMeter = meter.replace(/\s/g, "");
  const customerName = MOCK_CUSTOMERS[cleanMeter] || "VERIFIED CUSTOMER";

  if (!validateMeterNumber(cleanMeter)) {
    return NextResponse.json({ success: false, message: "Invalid meter number" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    customerName,
    address: "123 Test Street, Lagos",
    meterType: "Prepaid",
    testnet: true,
  });
}