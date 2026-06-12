import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const isSandbox = process.env.SQUARE_ENVIRONMENT !== "production";
  const base = isSandbox
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";

  const res = await fetch(`${base}/v2/apple-pay/domains`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({ domain_name: "www.noirblanc.store" }),
  });

  const data = await res.json();
  return NextResponse.json({ status: res.status, data });
}
