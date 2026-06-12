import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
const SQUARE_API_BASE = isSandbox
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceId,
      amountCents,
      currency = "USD",
      buyerEmail,
      note,
    } = body as {
      sourceId: string;
      amountCents: number;
      currency?: string;
      buyerEmail?: string;
      note?: string;
    };

    if (!sourceId || !amountCents) {
      return NextResponse.json(
        { error: "sourceId and amountCents are required" },
        { status: 400 }
      );
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      console.error("Square env vars missing");
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 500 }
      );
    }

    const payload = {
      source_id: sourceId,
      idempotency_key: randomUUID(),
      amount_money: {
        amount: Math.round(amountCents), // integer cents, no BigInt
        currency,
      },
      location_id: locationId,
      buyer_email_address: buyerEmail ?? undefined,
      note: note ?? "Noir & Blanc order",
    };

    const response = await fetch(`${SQUARE_API_BASE}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const detail =
        data?.errors?.[0]?.detail ?? data?.errors?.[0]?.code ?? "Payment failed";
      console.error("Square API error:", JSON.stringify(data.errors));
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentId: data.payment?.id,
      status: data.payment?.status,
    });
  } catch (err) {
    console.error("Square payment route error:", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred" },
      { status: 500 }
    );
  }
}
