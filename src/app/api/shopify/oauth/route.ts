import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE!; // e.g. wearelyfe1.myshopify.com

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const hmac = searchParams.get("hmac");

  if (!code || !shop) {
    return NextResponse.json({ error: "Missing code or shop" }, { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get token", details: tokenData }, { status: 500 });
  }

  // Return token so you can copy it and add to Vercel env vars
  return new NextResponse(
    `<html><body style="font-family:monospace;padding:40px;background:#111;color:#0f0">
      <h2 style="color:#fff">✅ Shopify OAuth Success</h2>
      <p style="color:#aaa">Copy this token and add it as <strong>SHOPIFY_ADMIN_TOKEN</strong> in Vercel env vars:</p>
      <p style="background:#000;padding:20px;border-radius:8px;word-break:break-all;font-size:14px">${accessToken}</p>
      <p style="color:#aaa;margin-top:20px">Shop: ${shop}</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
