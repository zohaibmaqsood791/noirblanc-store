import { NextRequest, NextResponse } from "next/server";

// Register a domain for Apple Pay with Square.
// Call once per live domain: /api/square/register-apple-pay?domain=noirblancnyc.com
export async function GET(req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
  const base = isSandbox
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

  const domain = req.nextUrl.searchParams.get("domain") || "noirblancnyc.com";

  const res = await fetch(`${base}/v2/apple-pay/domains`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({ domain_name: domain }),
  });

  const data = await res.json();
  return NextResponse.json({ status: res.status, domain, data });
}
