"use client";

import Script from "next/script";
import { useEffect } from "react";
import { KLAVIYO_PUBLIC_KEY, klIdentify } from "@/lib/klaviyo";

function KlaviyoFormListener() {
  useEffect(() => {
    // When a Klaviyo embed/popup form is submitted, identify the browser session
    // with the submitted email so abandoned cart flows can fire.
    const handler = (e: CustomEvent) => {
      const email = e.detail?.$email || e.detail?.email;
      if (email) klIdentify(email);
    };
    window.addEventListener("klaviyoForms" as any, handler);
    return () => window.removeEventListener("klaviyoForms" as any, handler);
  }, []);
  return null;
}

export default function Klaviyo() {
  if (!KLAVIYO_PUBLIC_KEY) return null;
  return (
    <>
      <Script
        id="klaviyo-onsite"
        strategy="lazyOnload"
        src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_PUBLIC_KEY}`}
      />
      <KlaviyoFormListener />
    </>
  );
}
