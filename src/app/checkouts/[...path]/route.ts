import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Shopify generates checkout URLs using the custom domain. Redirect them to
// the actual Shopify store so the checkout can complete.
export function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const search = req.nextUrl.search;
  return NextResponse.redirect(`https://e2121b-3.myshopify.com/checkouts/${path}${search}`, 308);
}
