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

// ── Our own assets ───────────────────────────────────────────────────────────
// noirblancnyc.com (root) is NOT covered by *.noirblancnyc.com — list both.
const OUR_ASSETS = [
  "https://noirblancnyc.com",
  "https://*.noirblancnyc.com",
  "https://noirandblancnyc.kinsta.cloud",
];

const ALL = [...SQUARE, ...GPAY, ...APAY];

const csp = [
  `default-src 'self'`,
  `script-src  'self' 'unsafe-inline' 'unsafe-eval' ${ALL.join(" ")}`,
  `style-src   'self' 'unsafe-inline' ${ALL.join(" ")} https://fonts.googleapis.com`,
  // font-src needs CloudFront explicitly for Square's sqmarket font
  `font-src    'self' data: ${ALL.join(" ")} https://fonts.gstatic.com`,
  `frame-src   'self' ${ALL.join(" ")}`,
  // connect-src needs google.com root AND sentry.io for Square's error SDK
  `connect-src 'self' ${ALL.join(" ")} ${OUR_ASSETS.join(" ")}`,
  `img-src     'self' data: blob: ${ALL.join(" ")} ${OUR_ASSETS.join(" ")}`,
  `manifest-src 'self' ${GPAY.join(" ")}`,
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "noirblancnyc.com" },
      { protocol: "https", hostname: "**.noirblancnyc.com" },
      { protocol: "https", hostname: "noirblanc.store" },
      { protocol: "https", hostname: "**.noirblanc.store" },
      { protocol: "https", hostname: "noirandblancnyc.kinsta.cloud" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Allow Google Pay's payment handler to embed our pages
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Required for Google Pay payment manifest verification
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
