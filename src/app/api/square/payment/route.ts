import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
const SQUARE_API_BASE = isSandbox
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

const WC_ENDPOINT = "https://noirblanc.store/?rest_route=/noirblanc/v1/checkout";
const WC_SECRET   = process.env.NOIRBLANC_CHECKOUT_SECRET ?? "nb_hdls_7x9kQmP2wRtZvL4nEsYcJ8uA";

// Fire the authoritative "Placed Order" event to Klaviyo (server-side, so it's
// reliable even if the browser closes). Never throws — checkout must not depend on it.
async function klaviyoPlacedOrder(opts: {
  email?: string;
  value: number;
  orderNumber: string | null;
  paymentId: string;
  items?: { productId: number; variationId?: number; quantity: number; name: string }[];
}) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key || !opts.email) return;
  try {
    await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${key}`,
        revision: "2024-10-15",
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: "Placed Order" } } },
            profile: { data: { type: "profile", attributes: { email: opts.email } } },
            value: opts.value,
            unique_id: opts.orderNumber ?? opts.paymentId, // dedupe key
            properties: {
              OrderId: opts.orderNumber ?? opts.paymentId,
              ItemNames: (opts.items ?? []).map((i) => i.name),
              Items: (opts.items ?? []).map((i) => ({
                ProductID: i.variationId ?? i.productId,
                ProductName: i.name,
                Quantity: i.quantity,
              })),
            },
          },
        },
      }),
    });
  } catch (e) {
    console.error("[klaviyo] Placed Order failed:", e);
  }
}

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
      coupons,
      attribution,
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
      coupons?: string[];
      attribution?: { source: string; medium: string; campaign: string; content: string; referrer: string };
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
          coupons: coupons ?? [],
          attribution: attribution ?? {},
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

    // ── 3. Klaviyo Placed Order (fire-and-forget) ─────────────────────────
    await klaviyoPlacedOrder({
      email: buyerEmail,
      value: Math.round(amountCents) / 100,
      orderNumber,
      paymentId,
      items,
    });

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
