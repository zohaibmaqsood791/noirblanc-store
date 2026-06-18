// Klaviyo client-side tracking helpers (Active on Site / onsite JS).
// The public key (company/site id) is not secret — it's exposed in the browser.
export const KLAVIYO_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY || "Rxu9bK";

type Props = Record<string, unknown>;

function kl(): any[] {
  if (typeof window === "undefined") return [];
  (window as any).klaviyo = (window as any).klaviyo || [];
  return (window as any).klaviyo;
}

/** Associate the current browser session with an email (powers abandoned flows). */
export function klIdentify(email: string, extra?: Props) {
  if (!email) return;
  kl().push(["identify", { email, ...(extra ?? {}) }]);
}

/** Track a Klaviyo metric event. */
export function klTrack(event: string, properties: Props = {}) {
  kl().push(["track", event, properties]);
}
