import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Google Places API (New).
// Keeps GOOGLE_MAPS_API_KEY secret (never exposed to the browser).
//   GET /api/places?action=autocomplete&input=...&session=...
//   GET /api/places?action=details&placeId=...&session=...

const KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(req: NextRequest) {
  if (!KEY) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const session = searchParams.get("session") ?? undefined;

  try {
    if (action === "autocomplete") {
      const input = searchParams.get("input") ?? "";
      if (input.trim().length < 3) return NextResponse.json({ suggestions: [] });

      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
        },
        body: JSON.stringify({
          input,
          sessionToken: session,
          // Bias to street-level address results
          includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
        }),
      });
      const data = await res.json();
      const suggestions = (data.suggestions ?? [])
        .map((s: any) => s.placePrediction)
        .filter(Boolean)
        .map((p: any) => ({
          placeId: p.placeId,
          main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
          secondary: p.structuredFormat?.secondaryText?.text ?? "",
        }));
      return NextResponse.json({ suggestions });
    }

    if (action === "details") {
      const placeId = searchParams.get("placeId");
      if (!placeId) return NextResponse.json({ error: "missing placeId" }, { status: 400 });

      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
          (session ? `?sessionToken=${encodeURIComponent(session)}` : ""),
        {
          headers: {
            "X-Goog-Api-Key": KEY,
            "X-Goog-FieldMask": "addressComponents",
          },
        }
      );
      const data = await res.json();
      const comps: any[] = data.addressComponents ?? [];
      const get = (type: string, short = false) => {
        const c = comps.find((x) => (x.types ?? []).includes(type));
        return c ? (short ? c.shortText : c.longText) : "";
      };

      const streetNumber = get("street_number");
      const route = get("route");
      const city =
        get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_2");

      return NextResponse.json({
        address1: [streetNumber, route].filter(Boolean).join(" "),
        city,
        state: get("administrative_area_level_1", true), // e.g. "NJ"
        postcode: get("postal_code"),
        countryCode: get("country", true), // e.g. "US"
      });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[places] error:", e);
    return NextResponse.json({ error: "places lookup failed" }, { status: 500 });
  }
}
