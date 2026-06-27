"use client";

import { useEffect, useRef } from "react";
import { purchase as fbPurchase, type UserData } from "@/lib/pixel";
import { gtag, pushDataLayer, AW_ID, AW_CONVERSION_LABEL } from "@/components/GoogleTag";
import { track } from "@vercel/analytics";

type Item = { productId?: number; name: string; quantity: number; price: number };

export default function PurchaseEvent({
  orderId,
  total,
  items,
  user,
}: {
  orderId: string;
  total: number;
  items?: Item[];
  user?: UserData;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || total <= 0 || !orderId) return;

    const send = () => {
      if (fired.current) return;
      fired.current = true;

      const list = items ?? [];
      const contentIds = list.map(i => i.productId).filter((id): id is number => !!id);
      const numItems = list.reduce((s, i) => s + i.quantity, 0) || undefined;

      // 1. Meta Pixel purchase (with hashed user data for Advanced Matching)
      fbPurchase({ orderId, value: total, contentIds, numItems, user });

      // 2. GA4 purchase event
      gtag("event", "purchase", {
        transaction_id: orderId,
        value: total,
        currency: "USD",
        items: list.map((item, i) => ({
          item_id: String(item.productId ?? `item_${i}`),
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // 3. Google Ads remarketing purchase
      gtag("event", "purchase", {
        send_to:                  AW_ID,
        value:                    total,
        currency:                 "USD",
        google_business_vertical: "retail",
        transaction_id:           orderId,
      });

      // 4. Google Ads conversion (feeds Smart Bidding)
      gtag("event", "conversion", {
        send_to:        AW_CONVERSION_LABEL,
        value:          total,
        currency:       "USD",
        transaction_id: orderId,
      });

      // 5. Vercel Web Analytics: "Completed Checkout" funnel step
      track("Completed Checkout", { value: total, orderId });
    };

    // Order data (with item IDs) loads from sessionStorage just after mount.
    // Fire immediately once items are present; otherwise wait briefly, then fire
    // anyway so we never lose the Purchase event if the order data is missing.
    if (items && items.length) {
      send();
    } else {
      const t = setTimeout(send, 1500);
      return () => clearTimeout(t);
    }
  }, [total, items, orderId]);  // orderId in deps so effect re-runs once sessionStorage order loads

  return null;
}
