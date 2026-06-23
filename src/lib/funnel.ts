const ENDPOINT = "https://noirblanc.store/wp-json/nb/v1/funnel";

type FunnelEvent = "session" | "atc" | "checkout" | "purchased";

export function trackFunnel(event: FunnelEvent): void {
  if (typeof window === "undefined") return;
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}
