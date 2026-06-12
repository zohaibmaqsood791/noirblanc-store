import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
const SQUARE_API_BASE = isSandbox
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

const WC_ENDPOINT = "https://noirandblancnyc.kinsta.cloud/?rest_route=/noirblanc/v1/checkout";
const WC_SECRET   = process.env.NOIRBLANC_CHECKOUT_SECRET ?? "nb_hdls_7x9kQmP2wRtZvL4nEsYcJ8uA";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceId,
      amountCents,
      currency = "USD",
      buyerEmail,
      billing,
      shipping,
      items,
      shippingMethod,
      shippingTotal,
    } = body as {
      sourceId: string;
      amountCents: number;
      currency?: string;
      buyerEmail?: string;
      billing?: Record<string, string>;
      shipping?: Record<string, string>;
      items?: {
        productId: number;
        variationId?: number;
        quantity: number;
        name: string;
      }[];
      shippingMethod?: string;
      shippingTotal?: number;
    };

    if (!sourceId || !amountCents) {
      return NextResponse.json(
        { error: "sourceId and amountCents are required" },
        { status: 400 }
      );
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId  = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      return NextResponse.json({ error: "Payment provider not configured" }, { status: 500 });
    }

    // ── 1. Charge via Square ──────────────────────────────────────────────
    const squareRes = await fetch(`${SQUARE_API_BASE}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: randomUUID(),
        amount_money: { amount: Math.round(amountCents), currency },
        location_id: locationId,
        buyer_email_address: buyerEmail ?? undefined,
        note: "Noir & Blanc order",
      }),
    });

    const squareData = await squareRes.json();

    if (!squareRes.ok) {
      const detail = squareData?.errors?.[0]?.detail ?? squareData?.errors?.[0]?.code ?? "Payment failed";
      console.error("Square API error:", JSON.stringify(squareData.errors));
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    const paymentId = squareData.payment?.id as string;

    // ── 2. Create WooCommerce order ───────────────────────────────────────
    let orderId: number | null = null;
    let orderNumber: string | null = null;

    try {
      const wcRes = await fetch(WC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Noirblanc-Secret": WC_SECRET,
        },
        body: JSON.stringify({
          transactionId: paymentId,
          paymentId,
          billing: billing ?? {},
          shipping: shipping ?? billing ?? {},
          items: items ?? [],
          shippingMethod: shippingMethod ?? "standard",
          shippingTotal: shippingTotal ?? 0,
        }),
      });

      if (wcRes.ok) {
        const wcData = await wcRes.json();
        orderId     = wcData.orderId   ?? null;
        orderNumber = wcData.orderNumber ?? null;
        console.log(`WooCommerce order created: #${orderNumber} (${orderId})`);
      } else {
        const wcErr = await wcRes.text();
        console.error("WooCommerce order creation failed:", wcErr);
        // Don't fail the checkout — Square already charged. Log and continue.
      }
    } catch (wcErr) {
      console.error("WooCommerce order creation error:", wcErr);
      // Same — Square succeeded, don't surface WC failure to customer.
    }

    return NextResponse.json({
      success: true,
      paymentId,
      status: squareData.payment?.status,
      orderId,
      orderNumber,
    });

  } catch (err) {
    console.error("Payment route error:", err);
    return NextResponse.json({ error: "An unexpected server error occurred" }, { status: 500 });
  }
}
