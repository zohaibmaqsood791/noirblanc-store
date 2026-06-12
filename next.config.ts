import type { NextConfig } from "next";

// Domains that Square's Web Payments SDK and Google/Apple Pay require
const SQUARE_DOMAINS = [
  "https://web.squarecdn.com",
  "https://sandbox.web.squarecdn.com",
  "https://*.squarecdn.com",
  "https://*.squareup.com",
  "https://*.squareupsandbox.com",
];
const GPAY_DOMAINS = [
  "https://pay.google.com",
  "https://*.google.com",
  "https://*.gstatic.com",
  "https://*.googleapis.com",
];
const APAY_DOMAINS = [
  "https://apple.com",
  "https://*.apple.com",
];

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${SQUARE_DOMAINS.join(" ")} ${GPAY_DOMAINS.join(" ")} ${APAY_DOMAINS.join(" ")}`,
  `style-src 'self' 'unsafe-inline' ${SQUARE_DOMAINS.join(" ")} https://fonts.googleapis.com`,
  `font-src 'self' data: ${SQUARE_DOMAINS.join(" ")} https://fonts.gstatic.com`,
  `frame-src 'self' ${SQUARE_DOMAINS.join(" ")} ${GPAY_DOMAINS.join(" ")} ${APAY_DOMAINS.join(" ")}`,
  `connect-src 'self' ${SQUARE_DOMAINS.join(" ")} ${GPAY_DOMAINS.join(" ")} ${APAY_DOMAINS.join(" ")} https://noirandblancnyc.kinsta.cloud`,
  `img-src 'self' data: blob: ${SQUARE_DOMAINS.join(" ")} ${GPAY_DOMAINS.join(" ")} https://*.noirblancnyc.com https://noirandblancnyc.kinsta.cloud`,
  `manifest-src 'self' ${GPAY_DOMAINS.join(" ")}`,
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
