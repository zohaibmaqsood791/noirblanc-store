export const PIXEL_ID = "724894499822999";

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

// SHA-256 hash for Advanced Matching (Facebook requires hashed PII)
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

// Build hashed user_data object for Advanced Matching
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

export function pageView() {
  fbq("track", "PageView");
}

export function viewContent(opts: {
  contentId: string | number;
  contentName: string;
  value: number;
  currency?: string;
}) {
  fbq("track", "ViewContent", {
    content_ids: [String(opts.contentId)],
    content_name: opts.contentName,
    content_type: "product",
    value: opts.value,
    currency: opts.currency ?? "USD",
  });
}

export function addToCart(opts: {
  contentId: string | number;
  contentName: string;
  value: number;
  currency?: string;
  user?: UserData;
}) {
  const eventData = {
    content_ids: [String(opts.contentId)],
    content_name: opts.contentName,
    content_type: "product",
    value: opts.value,
    currency: opts.currency ?? "USD",
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "AddToCart", eventData, { userData: ud }));
  } else {
    fbq("track", "AddToCart", eventData);
  }
}

export function initiateCheckout(opts: {
  value: number;
  numItems: number;
  currency?: string;
  user?: UserData;
}) {
  const eventData = {
    value: opts.value,
    num_items: opts.numItems,
    currency: opts.currency ?? "USD",
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "InitiateCheckout", eventData, { userData: ud }));
  } else {
    fbq("track", "InitiateCheckout", eventData);
  }
}

export function purchase(opts: {
  orderId: string | number;
  value: number;
  currency?: string;
  contentIds?: (string | number)[];
  numItems?: number;
  user?: UserData;
}) {
  const eventData = {
    content_type: "product",
    content_ids: (opts.contentIds ?? []).map(String),
    value: opts.value,
    currency: opts.currency ?? "USD",
    num_items: opts.numItems,
    order_id: String(opts.orderId),
  };
  if (opts.user) {
    buildUserData(opts.user).then(ud => fbq("track", "Purchase", eventData, { userData: ud }));
  } else {
    fbq("track", "Purchase", eventData);
  }
}
