"use client";

import Script from "next/script";
import { KLAVIYO_PUBLIC_KEY } from "@/lib/klaviyo";

// Loads Klaviyo onsite JS (Active on Site, forms, and client-side event tracking).
export default function Klaviyo() {
  if (!KLAVIYO_PUBLIC_KEY) return null;
  return (
    <Script
      id="klaviyo-onsite"
      strategy="afterInteractive"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_PUBLIC_KEY}`}
    />
  );
}
