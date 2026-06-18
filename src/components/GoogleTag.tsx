"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const GA4_ID              = "G-LCCZT27BDH";
export const AW_ID               = "AW-17089443241";
export const AW_CONVERSION_LABEL = "AW-17089443241/VI21CKPCk8kaEKnr8NQ_";

// Call window.gtag() safely from any client component
export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  (window as any).gtag?.(...args);
}

// Push arbitrary object to dataLayer
export function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(event);
}

function PageViewTracker() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleTag() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
