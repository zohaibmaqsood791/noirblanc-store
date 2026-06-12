/**
 * WooCommerce headless cart helpers.
 * WooCommerce tracks the cart via a session token returned in the
 * `woocommerce-session` response header. We persist it in localStorage
 * and send it back as a header on every subsequent request so the same
 * cart is maintained across page loads.
 */

import { GraphQLClient } from "graphql-request";
import { ADD_TO_CART, GET_CART, REMOVE_FROM_CART, UPDATE_CART_ITEM } from "./graphql/queries";
import type { Cart } from "@/types";

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
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
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
    return data.addToCart?.cart ?? null;
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
    return data.updateItemQuantities?.cart ?? null;
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
    return data.removeItemsFromCart?.cart ?? null;
  } catch (e) {
    console.error("removeFromCart error:", e);
    return null;
  }
}
