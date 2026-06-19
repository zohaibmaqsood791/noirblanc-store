import { NextRequest, NextResponse } from "next/server";
import { debugTracking } from "@/lib/seventeentrack";

// TEMP diagnostic: GET /api/track-order/debug?number=XXXX&secret=YYY
// Returns the raw 17track gettrackinfo/register response so we can see what
// carrier/status 17track actually has for a number. Protected by the existing
// checkout secret. Remove once tracking is verified.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.NOIRBLANC_CHECKOUT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const number = req.nextUrl.searchParams.get("number");
  if (!number) {
    return NextResponse.json({ error: "Pass ?number=" }, { status: 400 });
  }
  const result = await debugTracking(number);
  return NextResponse.json(result);
}
