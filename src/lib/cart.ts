/**
 * WooCommerce headless cart helpers.
 * WooCommerce tracks the cart via a session token returned in the
 * `woocommerce-session` response header. We persist it in localStorage
 * and send it back as a header on every subsequent request so the same
 * cart is maintained across page loads.
 */

import { GraphQLClient } from "graphql-request";
import { ADD_TO_CART, APPLY_COUPON, GET_CART, REMOVE_COUPON, REMOVE_FROM_CART, UPDATE_CART_ITEM, UPDATE_SHIPPING_METHOD } from "./graphql/queries";

import type { Cart } from "@/types";

export interface UpsellProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string | null;
  regularPrice: string | null;
  image: { sourceUrl: string; altText: string } | null;
  firstVariationId: number | null;
}

const WC_SESSION_KEY = "woo-session";
const endpoint = process.env.NEXT_PUBLIC_WORDPRESS_API_URL!;

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WC_SESSION_KEY);
}

function saveSessionToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WC_SESSION_KEY, token);
}

function buildClient(): GraphQLClient {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["woocommerce-session"] = `Session ${token}`;
  }
  return new GraphQLClient(endpoint, { headers });
}

/** After every mutation/query, check for a refreshed session token */
async function requestWithSession<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const client = buildClient();

  // graphql-request doesn't expose raw response headers easily,
  // so we use fetch directly to capture the session header.
  const token = getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["woocommerce-session"] = `Session ${token}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  // Persist refreshed session token
  const newSession = res.headers.get("woocommerce-session");
  if (newSession) {
    saveSessionToken(newSession);
  }

  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL errors:", json.errors);
    // Use the first error message directly (WooCommerce returns user-friendly messages)
    const errMsg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(errMsg);
  }
  return json.data as T;
}

export async function fetchCart(): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ cart: Cart }>(GET_CART);
    return data.cart;
  } catch (e) {
    console.error("fetchCart error:", e);
    return null;
  }
}


export async function addToCart(
  productId: number,
  quantity: number,
  variationId?: number
): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ addToCart: { cart: Cart } }>(
      ADD_TO_CART,
      { productId, quantity, variationId: variationId ?? null }
    );
    const cart = data.addToCart?.cart ?? null;
    if (cart) return await syncBagCoupons(cart);
    return cart;
  } catch (e) {
    console.error("addToCart error:", e);
    return null;
  }
}

export async function updateCartItem(
  key: string,
  quantity: number
): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ updateItemQuantities: { cart: Cart } }>(
      UPDATE_CART_ITEM,
      { key, quantity }
    );
    const cart = data.updateItemQuantities?.cart ?? null;
    if (cart) return await syncBagCoupons(cart);
    return cart;
  } catch (e) {
    console.error("updateCartItem error:", e);
    return null;
  }
}

export async function removeFromCart(keys: string[]): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ removeItemsFromCart: { cart: Cart } }>(
      REMOVE_FROM_CART,
      { keys }
    );
    const cart = data.removeItemsFromCart?.cart ?? null;
    if (cart) return await syncBagCoupons(cart);
    return cart;
  } catch (e) {
    console.error("removeFromCart error:", e);
    return null;
  }
}

export async function applyCoupon(code: string): Promise<Cart | null> {
  // Let errors propagate so the caller can show the real WooCommerce error message
  const data = await requestWithSession<{ applyCoupon: { cart: Cart } }>(
    APPLY_COUPON,
    { code }
  );
  return data.applyCoupon?.cart ?? null;
}

/** Count bag items (non-straps) across all cart lines */
function countBags(cart: Cart): number {
  return (cart.contents?.nodes ?? []).reduce((sum, item) => {
    const slug = item.product?.node?.slug ?? "";
    const name = (item.product?.node?.name ?? "").toLowerCase();
    const isStrap = slug.includes("strap") || name.includes("strap");
    return sum + (isStrap ? 0 : item.quantity);
  }, 0);
}

/** Auto-apply the right bundle coupon based on bag count */
export async function syncBagCoupons(cart: Cart): Promise<Cart> {
  const bags = countBags(cart);
  const applied = (cart.appliedCoupons ?? []).map((c: { code: string }) => c.code.toLowerCase());

  const want = bags >= 3 ? "buy3get25" : bags >= 2 ? "buy2get20" : null;
  const unwanted = want === "buy3get25" ? "buy2get20" : want === "buy2get20" ? "buy3get25" : null;

  let current: Cart = cart;

  // Remove wrong coupon
  if (unwanted && applied.includes(unwanted)) {
    try { current = (await removeCoupon(unwanted)) ?? current; } catch { /* ignore */ }
  }

  // Remove bundle coupons when no longer needed
  if (!want) {
    for (const code of ["buy2get20", "buy3get25"]) {
      if (applied.includes(code)) {
        try { current = (await removeCoupon(code)) ?? current; } catch { /* ignore */ }
      }
    }
    return current;
  }

  // Apply the right coupon if not already applied
  if (!applied.includes(want)) {
    try { current = (await applyCoupon(want)) ?? current; } catch { /* ignore */ }
  }

  return current;
}

export async function removeCoupon(code: string): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ removeCoupons: { cart: Cart } }>(
      REMOVE_COUPON,
      { code }
    );
    return data.removeCoupons?.cart ?? null;
  } catch (e) {
    console.error("removeCoupon error:", e);
    return null;
  }
}

export async function updateShippingMethod(shippingMethod: string): Promise<Cart | null> {
  try {
    const data = await requestWithSession<{ updateShippingMethod: { cart: Cart } }>(
      UPDATE_SHIPPING_METHOD,
      { shippingMethods: [shippingMethod] }
    );
    return data.updateShippingMethod?.cart ?? null;
  } catch (e) {
    console.error("updateShippingMethod error:", e);
    return null;
  }
}

export async function updateCustomerShippingAddress(address: {
  address1: string; city: string; state: string; postcode: string; country: string;
}): Promise<Cart | null> {
  try {
    // Update customer shipping address so WooCommerce can calculate rates
    await requestWithSession<unknown>(
      `mutation UpdateCustomerShipping($input: UpdateCustomerInput!) {
        updateCustomer(input: $input) { customer { id } }
      }`,
      {
        input: {
          shipping: {
            address1: address.address1,
            city: address.city,
            state: address.state,
            postcode: address.postcode,
            country: address.country,
          },
        },
      }
    );
    // Re-fetch cart to get updated shipping rates + tax
    return await fetchCart();
  } catch (e) {
    console.error("updateCustomerShippingAddress error:", e);
    return null;
  }
}

const UPSELL_QUERY = `
  query UpsellProducts($search: String!) {
    products(first: 20, where: { search: $search, status: "publish" }) {
      nodes {
        id
        databaseId
        name: title
        slug
        ... on SimpleProduct { price regularPrice image { sourceUrl altText } }
        ... on VariableProduct {
          price regularPrice image { sourceUrl altText }
          variations(first: 1) { nodes { databaseId } }
        }
      }
    }
  }
`;

export async function fetchUpsellProducts(search: string): Promise<UpsellProduct[]> {
  try {
    const client = new GraphQLClient(process.env.NEXT_PUBLIC_WORDPRESS_API_URL!);
    const data = await client.request<{ products: { nodes: any[] } }>(UPSELL_QUERY, { search });
    return (data?.products?.nodes ?? []).map((p: any) => ({
      id: p.id,
      databaseId: p.databaseId,
      name: p.name,
      slug: p.slug,
      price: p.price ?? null,
      regularPrice: p.regularPrice ?? null,
      image: p.image ?? null,
      firstVariationId: p.variations?.nodes?.[0]?.databaseId ?? null,
    }));
  } catch {
    return [];
  }
}
