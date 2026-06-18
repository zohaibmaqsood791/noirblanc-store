"use client";

import { useEffect } from "react";
import { gtag, pushDataLayer, GA4_ID } from "@/components/GoogleTag";

// Fires a GA4 / dataLayer event whenever a 404 page renders, capturing the bad
// URL, referrer, and gclid (present only on Google Ads clicks). Lets us see in
// GA4 exactly which ad-driven URLs are 404ing.
export default function NotFoundTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid") || params.get("wbraid") || params.get("gbraid") || "";
    const path = window.location.pathname + window.location.search;
    const referrer = document.referrer || "";
    const fromGoogleAds = !!gclid;

    gtag("event", "page_not_found", {
      send_to: GA4_ID,
      page_path: path,
      page_location: window.location.href,
      page_referrer: referrer,
      gclid,
      from_google_ads: fromGoogleAds,
    });

    pushDataLayer({
      event: "page_not_found",
      page_path: path,
      page_referrer: referrer,
      gclid,
      from_google_ads: fromGoogleAds,
    });
  }, []);

  return null;
}
