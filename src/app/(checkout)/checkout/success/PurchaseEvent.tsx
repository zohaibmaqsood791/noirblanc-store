"use client";

import { useEffect } from "react";
import { purchase } from "@/lib/pixel";

export default function PurchaseEvent({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {
  useEffect(() => {
    if (total > 0) {
      purchase({ orderId, value: total });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
