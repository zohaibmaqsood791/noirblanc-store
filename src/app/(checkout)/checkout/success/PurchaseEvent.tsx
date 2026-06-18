"use client";

import { useEffect } from "react";
import { purchase as fbPurchase } from "@/lib/pixel";
import { gtag, pushDataLayer } from "@/components/GoogleTag";

const AW_ID             = "AW-17089443241";
const AW_CONVERSION_ID  = "AW-17089443241/purchase"; // update with actual conversion label if you have one

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

    // 2. GA4 purchase event via dataLayer
    pushDataLayer({
      event:            "purchase",
      transaction_id:   orderId,
      value:            total,
      currency:         "USD",
      items: (items || []).map((item, i) => ({
        item_id:       `item_${i}`,
        item_name:     item.name,
        quantity:      item.quantity,
        price:         item.price,
      })),
    });

    // 3. Google Ads conversion
    gtag("event", "conversion", {
      send_to:        AW_CONVERSION_ID,
      value:          total,
      currency:       "USD",
      transaction_id: orderId,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
