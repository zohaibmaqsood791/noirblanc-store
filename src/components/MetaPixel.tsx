"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PIXEL_ID, pageView as pixelPageView } from "@/lib/pixel";

function injectPixel() {
  if (typeof window === "undefined") return;
  if ((window as any).fbq) return; // already loaded

  // Set up the fbq stub so calls before fbevents.js loads are queued
  const fbq: any = function (...args: any[]) {
    (fbq as any).callMethod
      ? (fbq as any).callMethod.apply(fbq, args)
      : (fbq as any).queue.push(args);
  };
  (window as any).fbq = fbq;
  if (!(window as any)._fbq) (window as any)._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  // Load fbevents.js
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", PIXEL_ID);
  // initial PageView fired by PixelPageView effect below with event_id
}

function PixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      pixelPageView(); // fires browser pixel + CAPI with matching event_id
    }
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  useEffect(() => {
    injectPixel();
  }, []);

  return (
    <>
      {/* noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PixelPageView />
      </Suspense>
    </>
  );
}
