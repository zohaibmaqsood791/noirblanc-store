import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const WC_API_URL = process.env.WC_API_URL!;   // https://noirblanc.store/wp-json/wc/v3
const WC_KEY = process.env.WC_CONSUMER_KEY!;
const WC_SECRET = process.env.WC_CONSUMER_SECRET!;

function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const hash = crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(body).digest("base64");
  return hash === hmacHeader;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const data = JSON.parse(rawBody);

  // Shopify discount_codes/create webhook payload
  const code = data.code;
  const value = data.value;           // e.g. "5.0"
  const valueType = data.value_type;  // "percentage" or "fixed_amount"
  const customerEmail = data.entitled_customer_ids; // may be empty for code-based

  if (!code) {
    return NextResponse.json({ error: "No code in payload" }, { status: 400 });
  }

  // Map Shopify discount type to WooCommerce discount type
  const wcDiscountType = valueType === "percentage" ? "percent" : "fixed_cart";

  // Build WooCommerce coupon payload
  const couponPayload: Record<string, unknown> = {
    code: code.toLowerCase(),
    discount_type: wcDiscountType,
    amount: String(parseFloat(value)),
    individual_use: false,
    usage_limit: 1,
    usage_limit_per_user: 1,
  };

  // If there's a customer email restriction, add it
  if (data.customer_selection === "prerequisite" && data.prerequisite_customer_ids?.length) {
    // We'd need to look up the email — skip restriction for now
  }

  // Create coupon in WooCommerce
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  const wcRes = await fetch(`${WC_API_URL}/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(couponPayload),
  });

  const wcData = await wcRes.json();

  if (!wcRes.ok) {
    console.error("WooCommerce coupon creation failed:", wcData);
    return NextResponse.json({ error: "WooCommerce error", details: wcData }, { status: 500 });
  }

  console.log(`✅ Synced discount ${code} to WooCommerce coupon ID ${wcData.id}`);
  return NextResponse.json({ success: true, wcCouponId: wcData.id });
}
