import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://noirblanc.store";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });

  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/users/lostpassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // WordPress doesn't have a built-in REST endpoint for password reset,
    // so we use the standard lost password form submission
    const formRes = await fetch(`${WP_URL}/wp-login.php?action=lostpassword`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ user_login: email, redirect_to: "", wp_submit: "Get New Password" }),
      redirect: "manual",
    });

    // WordPress redirects on success (302) or shows error page
    if (formRes.status === 302 || formRes.status === 200) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, message: "Could not send reset email" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
