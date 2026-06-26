"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ITEMS = [
  "2 FREE STRAPS & KEYRING (WORTH $100) WITH EVERY BAG",
  "FREE SHIPPING ON ORDERS OVER $75 · EASY 365-DAY RETURNS",
  "30-DAY MONEY-BACK GUARANTEE",
];

const BG = "#2D3B1E";

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % ITEMS.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white text-[11px] px-4 py-2" style={{ backgroundColor: BG }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Spacer */}
        <div className="hidden sm:flex gap-4 opacity-0 pointer-events-none text-[11px]">
          <span>Help</span>
        </div>

        {/* Rotating message */}
        <p
          className="tracking-widest font-medium uppercase text-center flex-1 transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {ITEMS[current]}
        </p>

        {/* Help / Track links */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium tracking-wide whitespace-nowrap">
          <Link href="/contact" className="hover:underline">Help</Link>
          <span className="opacity-50 mx-1">|</span>
          <Link href="/a/track-order" className="hover:underline">Track Your Order</Link>
        </div>
      </div>
    </div>
  );
}
