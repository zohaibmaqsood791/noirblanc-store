export const PIXEL_ID = "1404465483480876";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

// Unique event ID for browser+server deduplication
function genEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// SHA-256 hash for Advanced Matching
async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface UserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

async function buildUserData(u: UserData): Promise<Record<string, string>> {
  const ud: Record<string, string> = {};
  if (u.email)     ud.em      = await sha256(u.email);
  if (u.firstName) ud.fn      = await sha256(u.firstName);
  if (u.lastName)  ud.ln      = await sha256(u.lastName);
  if (u.phone)     ud.ph      = await sha256(u.phone.replace(/\D/g, ""));
  if (u.city)      ud.ct      = await sha256(u.city);
  if (u.state)     ud.st      = await sha256(u.state);
  if (u.zip)       ud.zp      = await sha256(u.zip);
  if (u.country)   ud.country = await sha256(u.country);
  return ud;
}

// Persistent anonymous user ID stored in cookie — used as external_id for EMQ
function getExternalId(): string {
  if (typeof document === "undefined") return "";
  const key = "_nb_uid";
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]+)`));
  if (match) return match[1];
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${key}=${uid}; expires=${expires}; path=/; SameSite=Lax`;
  return uid;
}

// Read test_event_code from meta tag (injected during testing only)
function getTestEventCode(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return (document.querySelector('meta[name="fb-test-event-code"]') as HTMLMetaElement)?.content || undefined;
}

// Fire browser pixel + server CAPI with matching event_id
function sendCAPI(params: {
  event_name: string;
  event_id: string;
  user?: UserData;
  custom_data?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;
  fetch("/api/meta-capi", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      event_name:       params.event_name,
      event_id:         params.event_id,
      event_source_url: window.location.href,
      test_event_code:  getTestEventCode(),
      external_id:      getExternalId(),
      user:             params.user ?? {},
      custom_data:      params.custom_data ?? {},
    }),
  }).catch(() => {});
}

export function pageView() {
  const event_id = genEventId();
  fbq("track", "PageView", {}, { eventID: event_id });
  sendCAPI({ event_name: "PageView", event_id });
}

export function viewContent(opts: {
  contentId: string | number;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const event_id = genEventId();
  const data = {
    content_ids:  [String(opts.contentId)],
    content_name: opts.contentName,
    content_type: "product",
    value:        opts.value,
    currency:     opts.currency ?? "USD",
  };
  fbq("track", "ViewContent", data, { eventID: event_id });
  sendCAPI({ event_name: "ViewContent", event_id, custom_data: data });
}

export function addToCart(opts: {
  contentId: string | number;
  contentName: string;
  value: number;
  currency?: string;
  user?: UserData;
}) {
  const event_id = genEventId();
  const data = {
    content_ids:  [String(opts.contentId)],
    content_name: opts.contentName,
    content_type: "product",
    value:        opts.value,
    currency:     opts.currency ?? "USD",
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "AddToCart", data, { eventID: event_id, userData: ud }));
  } else {
    fbq("track", "AddToCart", data, { eventID: event_id });
  }
  sendCAPI({ event_name: "AddToCart", event_id, user: opts.user, custom_data: data });
}

export function initiateCheckout(opts: {
  value: number;
  numItems: number;
  currency?: string;
  user?: UserData;
}) {
  const event_id = genEventId();
  const data = {
    value:     opts.value,
    num_items: opts.numItems,
    currency:  opts.currency ?? "USD",
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "InitiateCheckout", data, { eventID: event_id, userData: ud }));
  } else {
    fbq("track", "InitiateCheckout", data, { eventID: event_id });
  }
  sendCAPI({ event_name: "InitiateCheckout", event_id, user: opts.user, custom_data: data });
}

export function purchase(opts: {
  orderId: string | number;
  value: number;
  currency?: string;
  contentIds?: (string | number)[];
  numItems?: number;
  user?: UserData;
}) {
  // Use same event_id format as WordPress so Meta deduplicates browser + server events
  const event_id = `wp-${opts.orderId}`;
  const data = {
    content_type: "product",
    content_ids:  (opts.contentIds ?? []).map(String),
    value:        opts.value,
    currency:     opts.currency ?? "USD",
    num_items:    opts.numItems,
    order_id:     String(opts.orderId),
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "Purchase", data, { eventID: event_id, userData: ud }));
  } else {
    fbq("track", "Purchase", data, { eventID: event_id });
  }
  sendCAPI({ event_name: "Purchase", event_id, user: opts.user, custom_data: data });
}
