import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
const SHOPIFY_STORE = "e2121b-3.myshopify.com";
const WC_API_URL = process.env.WC_API_URL!;
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

  // discounts/redeemcode_added payload has: code, discount_id
  const code: string = data.code;
  const discountId: string = data.discount_id ?? data.id;

  if (!code) {
    return NextResponse.json({ error: "No code in payload" }, { status: 400 });
  }

  // Fetch discount details from Shopify to get value and type
  let amount = "5";
  let wcDiscountType = "percent";

  if (discountId) {
    const discountRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/price_rules/${discountId}.json`,
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN } }
    );

    if (discountRes.ok) {
      const { price_rule } = await discountRes.json();
      amount = String(Math.abs(parseFloat(price_rule.value ?? "-5")));
      wcDiscountType = price_rule.value_type === "percentage" ? "percent" : "fixed_cart";
    }
  }

  // Create coupon in WooCommerce
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  const wcRes = await fetch(`${WC_API_URL}/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      code: code.toLowerCase(),
      discount_type: wcDiscountType,
      amount,
      individual_use: false,
      usage_limit: 1,
      usage_limit_per_user: 1,
    }),
  });

  const wcData = await wcRes.json();

  if (!wcRes.ok) {
    console.error("WooCommerce coupon creation failed:", wcData);
    return NextResponse.json({ error: "WooCommerce error", details: wcData }, { status: 500 });
  }

  console.log(`✅ Synced discount ${code} → WooCommerce coupon ID ${wcData.id}`);
  return NextResponse.json({ success: true, code, wcCouponId: wcData.id });
}
