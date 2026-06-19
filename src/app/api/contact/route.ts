import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://noirblanc.store";
const SECRET = process.env.CONTACT_FORM_SECRET;

// Posts the contact form to a small WordPress endpoint that sends it via
// wp_mail (the same mail pipeline already used for order/account emails).
export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ ok: false, error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const res = await fetch(`${WP_URL}/wp-json/noirblanc/v1/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-contact-secret": SECRET ?? "",
      },
      body: JSON.stringify({ name, email, subject, message }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      console.error("Contact form send failed:", res.status, data);
      return NextResponse.json({ ok: false, error: "Could not send your message. Please email us directly." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact route error:", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
