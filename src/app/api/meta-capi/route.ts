import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const PIXEL_ID   = process.env.META_PIXEL_ID!;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN!;
const CAPI_URL   = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

function hash(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashRaw(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event_name,
      event_id,
      event_source_url,
      test_event_code,
      external_id,
      user = {},
      custom_data = {},
    } = body;

    if (!event_name) return NextResponse.json({ error: "event_name required" }, { status: 400 });

    // Build user_data with server-side signals
    const ip  = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
              || req.headers.get("x-real-ip")
              || undefined;
    const ua  = req.headers.get("user-agent") || undefined;
    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;

    const user_data: Record<string, string | undefined> = {
      em:          hash(user.email),
      fn:          hash(user.firstName),
      ln:          hash(user.lastName),
      ph:          user.phone ? hash(user.phone.replace(/\D/g, "")) : undefined,
      ct:          hash(user.city),
      st:          hash(user.state),
      zp:          hashRaw(user.zip),
      country:     hash(user.country || "us"),
      client_ip_address: ip,
      client_user_agent: ua,
      fbp,
      fbc,
      external_id: external_id || undefined,
    };

    // Remove undefined fields
    Object.keys(user_data).forEach(k => user_data[k] === undefined && delete user_data[k]);

    const payload: Record<string, unknown> = {
      data: [{
        event_name,
        event_time:       Math.floor(Date.now() / 1000),
        event_id:         event_id || undefined,
        event_source_url,
        action_source:    "website",
        user_data,
        custom_data:      Object.keys(custom_data).length ? custom_data : undefined,
      }],
    };
    if (test_event_code) payload.test_event_code = test_event_code;

    const res = await fetch(`${CAPI_URL}?access_token=${CAPI_TOKEN}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
