import { NextRequest, NextResponse } from "next/server";
import { COUNTRY_LOCALE } from "@/lib/currency";

const LOCALE_PREFIXES = ["gb", "au", "ca", "eu", "nz", "ae"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip non-page routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/merchant-feed") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Already has a locale prefix — don't redirect again
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && LOCALE_PREFIXES.includes(segments[0])) {
    return NextResponse.next();
  }

  // Check if user already has a locale cookie (their manual preference)
  const localeCookie = req.cookies.get("nb_locale")?.value;
  if (localeCookie && LOCALE_PREFIXES.includes(localeCookie)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${localeCookie}${pathname}`;
    return NextResponse.redirect(url, { status: 302 });
  }

  // Auto-detect from Vercel geo header
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const locale = COUNTRY_LOCALE[country];

  if (locale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    const res = NextResponse.redirect(url, { status: 302 });
    // Remember for this session
    res.cookies.set("nb_locale", locale, { maxAge: 60 * 60 * 24, path: "/" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
