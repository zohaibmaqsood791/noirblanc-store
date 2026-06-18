"use client";

import { useState, useRef, useEffect } from "react";

const UGC_ITEMS = [
  { id: 1, src: "https://noirblanc.store/wp-content/uploads/2026/06/lv_0_20251026142226.mp4-Free-Online-Video-Compressor.mp4", label: "Your perfect plus-one", poster: "/ugc/ugc-1.png" },
  { id: 2, src: "https://noirblanc.store/wp-content/uploads/2026/06/copy_638A8422-D04E-4484-8DC2-E1BC3778B957.mp4-Free-Online-Video-Compressor.mp4", label: "Elevate your everyday", poster: "/ugc/ugc-2.png" },
  { id: 3, src: "https://noirblanc.store/wp-content/uploads/2026/06/WhatsApp-Video-2026-06-07-at-00.20.47.mp4", label: "Your work day just got better", poster: "/ugc/ugc-3.png" },
  { id: 4, src: "https://noirblanc.store/wp-content/uploads/2026/06/Bag.mp4", label: "Pack with me – Weekend Bag", poster: "/ugc/ugc-4.jpg" },
  { id: 5, src: "https://noirblanc.store/wp-content/uploads/2026/06/This-bag-is-my-everyday-kind-of-luxury-🖤Beautiful-leather-clean-details-and-two-interchangeabl.mp4", label: "Four new styles just dropped", poster: "/ugc/ugc-5.jpg" },
];

/* ── Single video card with IntersectionObserver autoplay ───────────────── */
function UGCCard({ item, onClick }: { item: typeof UGC_ITEMS[0]; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full group cursor-pointer overflow-hidden rounded-2xl bg-neutral-200 block"
      style={{ aspectRatio: "9/16" }}
    >
      {/* Poster — shown until video loads */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.poster}
        alt={item.label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Video — autoplays muted when scrolled into view */}
      <video
        ref={videoRef}
        src={item.src}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: playing ? 1 : 0 }}
        onCanPlay={() => { videoRef.current?.play().then(() => setPlaying(true)).catch(() => {}); }}
      />

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
        <p className="text-white font-semibold text-[13px] leading-snug line-clamp-2 text-left">
          {item.label}
        </p>
      </div>

      {/* Play icon — hidden when playing */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${playing ? "opacity-0" : "opacity-100"}`}>
        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-900 ml-0.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
    </button>
  );
}

/* ── Full-screen modal ───────────────────────────────────────────────────── */
function UGCModal({ startIndex, onClose }: { startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const item = UGC_ITEMS[idx];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[380px] mx-4 rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "9/16", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          key={item.src}
          src={item.src}
          autoPlay
          loop
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Mute / Close */}
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
        {/* Prev / Next */}
        <button onClick={() => setIdx((i) => (i - 1 + UGC_ITEMS.length) % UGC_ITEMS.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % UGC_ITEMS.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white">
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

/* ── Section ─────────────────────────────────────────────────────────────── */
export default function UGCStrip() {
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  return (
    <section className="py-10 sm:py-12" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="text-center mb-6 sm:mb-8 px-4">
        <p className="text-[12px] sm:text-[13px] text-neutral-500 tracking-wide italic">
          Real moments from our community
        </p>
        <h2 className="font-heading text-[22px] sm:text-[28px] font-semibold text-neutral-900 mt-1">
          18,347+ happy customers (and counting)
        </h2>
      </div>

      <div
        className="flex gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory px-3 sm:px-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-6 xl:px-8"
        style={{ scrollbarWidth: "none" }}
      >
        {UGC_ITEMS.map((item, i) => (
          <div key={item.id} className="flex-none w-[52vw] sm:w-[36vw] md:w-[28vw] lg:w-full snap-start">
            <UGCCard item={item} onClick={() => { setStartIdx(i); setOpen(true); }} />
          </div>
        ))}
      </div>

      {open && <UGCModal startIndex={startIdx} onClose={() => setOpen(false)} />}
    </section>
  );
}
