import { NextRequest, NextResponse } from "next/server";

const WP_GQL = process.env.NEXT_PUBLIC_WP_URL
  ? `${process.env.NEXT_PUBLIC_WP_URL}/graphql`
  : "https://noirblanc.store/graphql";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const auth = req.headers.get("authorization");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) headers["Authorization"] = auth;

  try {
    const res = await fetch(WP_GQL, {
      method: "POST",
      headers,
      body,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ errors: [{ message: e.message }] }, { status: 502 });
  }
}
