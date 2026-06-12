"use client";

import { useState, useEffect } from "react";

const ITEMS = [
  "SPRING EDIT — UP TO 40% OFF",
  "2 FREE STRAPS & KEYRING (WORTH $100) WITH EVERY BAG",
  "FREE SHIPPING ON ORDERS OVER $75 · EASY 365-DAY RETURNS",
];

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % ITEMS.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-neutral-900 text-white text-center py-2.5 px-4 overflow-hidden">
      <p
        className="text-[11px] tracking-widest font-medium uppercase whitespace-nowrap transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {ITEMS[current]}
      </p>
    </div>
  );
}
