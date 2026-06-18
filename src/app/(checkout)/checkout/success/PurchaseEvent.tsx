"use client";

import { useEffect } from "react";
import { purchase as fbPurchase } from "@/lib/pixel";
import { gtag, pushDataLayer, AW_ID, AW_CONVERSION_LABEL } from "@/components/GoogleTag";

export default function PurchaseEvent({
  orderId,
  total,
  items,
}: {
  orderId: string;
  total: number;
  items?: { name: string; quantity: number; price: number }[];
}) {
  useEffect(() => {
    if (total <= 0) return;

    // 1. Meta Pixel purchase
    fbPurchase({ orderId, value: total });

    // 2. GA4 purchase event
    pushDataLayer({
      event:          "purchase",
      transaction_id: orderId,
      value:          total,
      currency:       "USD",
      items: (items || []).map((item, i) => ({
        item_id:   `item_${i}`,
        item_name: item.name,
        quantity:  item.quantity,
        price:     item.price,
      })),
    });

    // 3. Google Ads remarketing purchase
    gtag("event", "purchase", {
      send_to:                AW_ID,
      value:                  total,
      currency:               "USD",
      google_business_vertical: "retail",
      transaction_id:         orderId,
    });

    // 4. Google Ads conversion (feeds Smart Bidding)
    gtag("event", "conversion", {
      send_to:        AW_CONVERSION_LABEL,
      value:          total,
      currency:       "USD",
      transaction_id: orderId,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
