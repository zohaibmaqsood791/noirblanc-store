"use client";

import { useEffect } from "react";
import Script from "next/script";
import { KLAVIYO_PUBLIC_KEY } from "@/lib/klaviyo";

// Loads Klaviyo onsite JS (Active on Site, forms, and client-side event tracking).
export default function Klaviyo() {
  // Safety guard: the (hidden) Klaviyo popup can lock body/html scroll on mobile
  // and never release it. If scroll is locked while NO real modal (Headless UI
  // Dialog) is open, clear it. This never fights the cart drawer / menus, which
  // render a [data-headlessui-portal] element while open.
  useEffect(() => {
    const unlockIfStray = () => {
      const realModalOpen = !!document.querySelector("[data-headlessui-portal]");
      if (realModalOpen) return;
      const html = document.documentElement;
      const body = document.body;
      const locked =
        getComputedStyle(html).overflow === "hidden" ||
        getComputedStyle(body).overflow === "hidden" ||
        getComputedStyle(body).position === "fixed";
      if (locked) {
        html.style.overflow = "";
        body.style.overflow = "";
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
      }
    };
    const id = window.setInterval(unlockIfStray, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!KLAVIYO_PUBLIC_KEY) return null;
  return (
    <Script
      id="klaviyo-onsite"
      strategy="lazyOnload"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_PUBLIC_KEY}`}
    />
  );
}
