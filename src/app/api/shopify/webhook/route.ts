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

async function fetchDiscountDetails(gid: string) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({
      query: `{
        discountNode(id: "${gid}") {
          discount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) { nodes { code } }
              customerGets {
                value {
                  ... on DiscountPercentage { percentage }
                  ... on DiscountAmount { amount { amount } }
                }
                items {
                  ... on AllDiscountItems { allItems }
                  ... on DiscountCollections {
                    collections(first: 10) { nodes { id title } }
                  }
                  ... on DiscountProducts {
                    products(first: 10) { nodes { id title } }
                  }
                }
              }
              customerSelection {
                ... on DiscountCustomerAll { allCustomers }
                ... on DiscountCustomers {
                  customers { email }
                }
              }
              usageLimit
              appliesOncePerCustomer
            }
          }
        }
      }`,
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const data = JSON.parse(rawBody);
  const gid: string = data.admin_graphql_api_id;

  if (!gid) {
    return NextResponse.json({ error: "No GraphQL ID in payload" }, { status: 400 });
  }

  // Fetch full discount details from Shopify
  const details = await fetchDiscountDetails(gid);
  const discount = details?.data?.discountNode?.discount;

  if (!discount) {
    console.error("Could not fetch discount details:", JSON.stringify(details));
    return NextResponse.json({ error: "Could not fetch discount" }, { status: 500 });
  }

  const code = discount.codes?.nodes?.[0]?.code ?? discount.title;
  if (!code) {
    return NextResponse.json({ error: "No code found" }, { status: 400 });
  }

  // Determine discount amount and type
  const value = discount.customerGets?.value;
  let amount = "5";
  let wcDiscountType = "percent";

  if (value?.percentage !== undefined) {
    amount = String(value.percentage * 100);
    wcDiscountType = "percent";
  } else if (value?.amount?.amount !== undefined) {
    amount = String(value.amount.amount);
    wcDiscountType = "fixed_cart";
  }

  // Determine customer email restriction
  const selection = discount.customerSelection;
  const emails: string[] = [];
  if (!selection?.allCustomers && selection?.customers?.length) {
    emails.push(...selection.customers.map((c: { email: string }) => c.email));
  }

  // Resolve Shopify collections → WooCommerce category IDs
  const wcCategoryIds: number[] = [];
  const items = discount.customerGets?.items;
  if (items && !items.allItems) {
    const collectionTitles: string[] = (items.collections?.nodes ?? []).map((c: { title: string }) => c.title);
    if (collectionTitles.length) {
      const auth2 = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
      const catRes = await fetch(`${WC_API_URL}/products/categories?per_page=100`, {
        headers: { Authorization: `Basic ${auth2}` },
      });
      if (catRes.ok) {
        const cats: { id: number; name: string }[] = await catRes.json();
        for (const title of collectionTitles) {
          const match = cats.find(c => c.name.toLowerCase() === title.toLowerCase());
          if (match) wcCategoryIds.push(match.id);
        }
      }
    }
  }

  // Build WooCommerce coupon
  const couponPayload: Record<string, unknown> = {
    code: code.toLowerCase(),
    discount_type: wcDiscountType,
    amount,
    individual_use: false,
    usage_limit: discount.usageLimit ?? 1,
    usage_limit_per_user: discount.appliesOncePerCustomer ? 1 : 0,
  };

  if (emails.length) {
    couponPayload.email_restrictions = emails;
  }

  if (wcCategoryIds.length) {
    couponPayload.product_categories = wcCategoryIds;
  }

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

  console.log(`✅ Synced ${code} (${amount}% ${wcDiscountType}) → WooCommerce coupon ID ${wcData.id}`);
  return NextResponse.json({ success: true, code, amount, wcCouponId: wcData.id });
}
