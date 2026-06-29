import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Shopify generates checkout URLs using the custom domain. Redirect them to
// the actual Shopify store so the checkout can complete.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const search = req.nextUrl.search;
  return NextResponse.redirect(`https://e2121b-3.myshopify.com/checkouts/${path.join("/")}${search}`, 308);
}
