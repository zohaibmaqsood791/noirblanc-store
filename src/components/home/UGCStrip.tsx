"use client";

import { useRef, useState, useEffect } from "react";

const UGC_ITEMS = [
  { id: 1, src: "https://cdn.shopify.com/videos/c/o/v/39ddfffae7b24858854eddb8978961c4.mov", label: "Your perfect plus-one" },
  { id: 2, src: "https://cdn.shopify.com/videos/c/o/v/f6f28399f1e74d2e97cb77d7a6d41409.mov", label: "Elevate your everyday" },
  { id: 3, src: "https://cdn.shopify.com/videos/c/o/v/97b3af1b409c48d5b39f2bec018ff2c0.mp4", label: "Your work day just got better" },
  { id: 4, src: "https://cdn.shopify.com/videos/c/o/v/bc5644cc829f4f25b5ee4f8fdc4ac3fb.mp4", label: "Pack with me – Weekend Bag" },
  { id: 5, src: "https://cdn.shopify.com/videos/c/o/v/09ed40a4fc84407d918f5a1fd5052e49.mp4", label: "Four new styles have entered the building" },
];

function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setVisible(true); io.disconnect(); }
        });
      },
      { rootMargin: "200px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <video src={src} autoPlay loop muted playsInline preload="metadata" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-600" />
      )}
    </div>
  );
}

function UGCModal({ startIndex, onClose }: { startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const item = UGC_ITEMS[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => { setMuted(true); }, [idx]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "9/16", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <video src={item.src} autoPlay loop muted={muted} playsInline className="w-full h-full object-cover" />

        {/* Controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button onClick={() => setMuted((m) => !m)} className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Prev/Next */}
        <button onClick={() => setIdx((i) => (i - 1 + UGC_ITEMS.length) % UGC_ITEMS.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % UGC_ITEMS.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {UGC_ITEMS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UGCStrip() {
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  return (
    <section className="py-10 sm:py-12 bg-white">
      <div className="text-center mb-6 sm:mb-8 px-4">
        <h2 className="font-heading text-[22px] sm:text-[28px] font-semibold text-neutral-900">
          15,243+ happy customers (and counting)
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">Real moments from our community</p>
      </div>

      <div
        className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:gap-3"
        style={{ scrollbarWidth: "none" }}
      >
        {UGC_ITEMS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setStartIdx(i); setOpen(true); }}
            className="flex-none aspect-[9/16] overflow-hidden bg-neutral-100 snap-start relative group cursor-pointer w-[42vw] sm:w-[28vw] lg:w-full first:ml-3 last:mr-3 sm:first:ml-6 sm:last:mr-6 lg:first:ml-0 lg:last:mr-0"
          >
            <LazyVideo src={item.src} className="w-full h-full" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
              <p className="text-white font-semibold text-xs sm:text-sm leading-snug text-left line-clamp-2">{item.label}</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-900 ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {open && <UGCModal startIndex={startIdx} onClose={() => setOpen(false)} />}
    </section>
  );
}
