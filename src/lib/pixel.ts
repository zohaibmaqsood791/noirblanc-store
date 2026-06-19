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
}) {
  fbq("track", "AddToCart", {
    content_ids: [String(opts.contentId)],
    content_name: opts.contentName,
    content_type: "product",
    value: opts.value,
    currency: opts.currency ?? "USD",
  });
}

export function initiateCheckout(opts: { value: number; numItems: number; currency?: string }) {
  fbq("track", "InitiateCheckout", {
    value: opts.value,
    num_items: opts.numItems,
    currency: opts.currency ?? "USD",
  });
}

export function purchase(opts: {
  orderId: string | number;
  value: number;
  currency?: string;
  contentIds?: (string | number)[];
  numItems?: number;
}) {
  fbq("track", "Purchase", {
    content_type: "product",
    content_ids: (opts.contentIds ?? []).map(String),
    value: opts.value,
    currency: opts.currency ?? "USD",
    num_items: opts.numItems,
    order_id: String(opts.orderId),
  });
}
