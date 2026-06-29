import type { NextConfig } from "next";

// ── Square Web Payments SDK ──────────────────────────────────────────────────
// Square hosts its own JS/iframes on squarecdn/squareup, but its FONTS are
// served from AWS CloudFront (d1g145x70srn7h.cloudfront.net).
// CSP v3 — updated 2026-06-12
const SQUARE = [
  "https://web.squarecdn.com",
  "https://sandbox.web.squarecdn.com",
  "https://*.squarecdn.com",
  "https://*.squareup.com",
  "https://*.squareupsandbox.com",
  // Square's font CDN (CloudFront) — must be explicit for font-src
  "https://*.cloudfront.net",
  // Square SDK uses Sentry for internal error monitoring
  "https://*.sentry.io",
];

// ── Google Pay ───────────────────────────────────────────────────────────────
// Google Pay connects to both pay.google.com AND google.com (root).
// *.google.com does NOT cover the root google.com — must list both.
const GPAY = [
  "https://google.com",           // root — used by pay.js connect-src
  "https://pay.google.com",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleapis.com",
];

// ── Apple Pay ────────────────────────────────────────────────────────────────
const APAY = [
  "https://apple.com",
  "https://*.apple.com",
];

// ── Meta Pixel ───────────────────────────────────────────────────────────────
const META = [
  "https://connect.facebook.net",
  "https://*.facebook.net",
  "https://*.facebook.com",
  "https://*.fbcdn.net",
];

// ── Google Analytics / Ads / Tag Manager ─────────────────────────────────────
const GTAG = [
  "https://www.googletagmanager.com",
  "https://*.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://www.googleadservices.com",
  "https://*.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://*.doubleclick.net",
  "https://stats.g.doubleclick.net",
];

// ── Review images (Judge.me / AliExpress CDN) ────────────────────────────────
const REVIEW_IMG = [
  "https://*.amazonaws.com",
  "https://*.alicdn.com",
  "https://*.judge.me",
];

// ── Our own assets ───────────────────────────────────────────────────────────
// noirblancny.com (root) is NOT covered by *.noirblancny.com — list both.
const OUR_ASSETS = [
  "https://noirblancny.com",
  "https://*.noirblancny.com",
  "https://noirandblancnyc.kinsta.cloud",
  "https://noirblanc.store",
  "https://*.noirblanc.store",
];

// ── Klaviyo (onsite JS, tracking, forms) ─────────────────────────────────────
const KLAVIYO = [
  "https://static.klaviyo.com",
  "https://static-tracking.klaviyo.com",
  "https://a.klaviyo.com",
  "https://fast.a.klaviyo.com",
  "https://*.klaviyo.com",
];

const ALL = [...SQUARE, ...GPAY, ...APAY, ...META, ...GTAG, ...KLAVIYO];

const csp = [
  `default-src 'self'`,
  `script-src  'self' 'unsafe-inline' 'unsafe-eval' ${ALL.join(" ")}`,
  `style-src   'self' 'unsafe-inline' ${ALL.join(" ")} https://fonts.googleapis.com`,
  // font-src needs CloudFront explicitly for Square's sqmarket font
  `font-src    'self' data: ${ALL.join(" ")} https://fonts.gstatic.com`,
  // frame-src must allow https: so Square's 3D Secure (3DS) challenge can load the
  // card issuer's verification page (e.g. vcas.visa.com). Issuer/ACS domains vary by
  // bank and can't be enumerated — a fixed list silently breaks checkout for some banks.
  `frame-src   'self' https:`,
  // connect-src needs google.com root AND sentry.io for Square's error SDK.
  // https: also added for 3DS challenges that POST to the issuer's ACS server.
  `connect-src 'self' https: ${ALL.join(" ")} ${OUR_ASSETS.join(" ")}`,
  // NOTE: Google Ads conversion pixels load from country-specific domains
  // (google.com.pk, google.co.uk, google.de, …). These are harmless tracking
  // pixels — CSP can't wildcard the TLD, so we let them be blocked. No impact on checkout.
  `img-src     'self' data: blob: ${ALL.join(" ")} ${OUR_ASSETS.join(" ")} ${REVIEW_IMG.join(" ")}`,
  `media-src   'self' ${OUR_ASSETS.join(" ")}`,
  `manifest-src 'self' ${GPAY.join(" ")}`,
].join("; ");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 256, 384, 400],
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "noirblancny.com" },
      { protocol: "https", hostname: "**.noirblancny.com" },
      { protocol: "https", hostname: "noirblanc.store" },
      { protocol: "https", hostname: "**.noirblanc.store" },
      { protocol: "https", hostname: "noirandblancnyc.kinsta.cloud" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.judge.me" },
    ],
  },

  async rewrites() {
    return [
      // Proxy all WordPress/WooCommerce API calls through Vercel
      // Users see requests to noirblancny.com instead of noirblanc.store
      {
        source: "/api/wp/:path*",
        destination: "https://noirblanc.store/:path*",
      },
      {
        source: "/api/graphql",
        destination: "https://noirblanc.store/graphql",
      },
    ];
  },

  async redirects() {
    return [
      // Redirect old wallets URL to leather-wallets for backwards compatibility
      {
        source: "/collections/wallets",
        destination: "/collections/leather-wallets",
        permanent: true,
      },
      // /track-order redirects to the canonical /a/track-order
      {
        source: "/track-order",
        destination: "/a/track-order",
        permanent: true,
      },
      // Shopify-style /pages/* URLs
      { source: "/pages/contact",         destination: "/contact",          permanent: true },
      { source: "/pages/shipping-policy", destination: "/shipping-returns", permanent: true },
      { source: "/pages/privacy-policy",  destination: "/privacy-policy",   permanent: true },
      { source: "/pages/refund-policy",   destination: "/refund-policy",    permanent: true },
      { source: "/pages/return-policy",   destination: "/refund-policy",    permanent: true },
      { source: "/pages/terms-of-service",destination: "/terms",            permanent: true },
      { source: "/pages/terms",           destination: "/terms",            permanent: true },
      { source: "/pages/faq",             destination: "/faq",              permanent: true },
      // Shopify-style country code prefixes → our locale prefixes
      { source: "/de/:path*", destination: "/eu/:path*", permanent: true },
      { source: "/fr/:path*", destination: "/eu/:path*", permanent: true },
      { source: "/es/:path*", destination: "/eu/:path*", permanent: true },
      { source: "/it/:path*", destination: "/eu/:path*", permanent: true },
      { source: "/nl/:path*", destination: "/eu/:path*", permanent: true },
      { source: "/en-gb/:path*", destination: "/gb/:path*", permanent: true },
      { source: "/en-au/:path*", destination: "/au/:path*", permanent: true },
      { source: "/en-ca/:path*", destination: "/ca/:path*", permanent: true },
      { source: "/en-nz/:path*", destination: "/nz/:path*", permanent: true },
      // Old Shopify product URLs → new product pages
      { source: "/products/hana-medium-weave-texture-tote-bag-black", destination: "/products/nora-tote-noirwoven", permanent: true },
      { source: "/products/savannah-wallet-purse-saddle-brown", destination: "/products/elysee-zip-around-wallet", permanent: true },
      { source: "/products/savannah-wallet-purse",              destination: "/products/elysee-zip-around-wallet", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Prevent clickjacking — but allow Google Pay/Apple Pay popups to keep
          // their opener reference (unsafe-none = browser default, required for
          // Google Pay's cross-origin popup ↔ parent communication)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      // Allow Google Pay / Square to fetch the payment manifest with correct CORS
      {
        source: "/.well-known/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/json" },
        ],
      },
    ];
  },
};

export default nextConfig;
