"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

const GTM_ID  = "GT-PHCH4QPC";
const GA4_ID  = "G-LCCZT27BDH";
const AW_ID   = "AW-17089443241";

// Push to dataLayer safely
export function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(event);
}

// Fire gtag() safely
export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
}

function PageViewTracker() {
  const pathname  = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    pushDataLayer({
      event:     "page_view",
      page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleTag() {
  return (
    <>
      {/* GTM script — loads once, manages GA4 + Ads inside */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />

      {/* Direct gtag for GA4 + Google Ads (belt-and-suspenders alongside GTM) */}
      <Script
        id="gtag-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', { send_page_view: false });
            gtag('config', '${AW_ID}');
          `,
        }}
      />

      {/* GTM noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
