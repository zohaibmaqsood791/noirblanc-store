"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { addToCart, fetchCart } from "@/lib/cart";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════════
   GALLERY
   Mobile  → swiper main image + horizontal thumb strip
   Desktop → large main image + 2-col thumbnail grid below (sticky)
═══════════════════════════════════════════════════════════════════════════ */
function Gallery({
  images,
  activeIdx,
  setActiveIdx,
}: {
  images: { sourceUrl: string; altText: string }[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
}) {
  const prev = () => setActiveIdx((activeIdx - 1 + images.length) % images.length);
  const next = () => setActiveIdx((activeIdx + 1) % images.length);

  if (!images.length) return <div className="w-full bg-neutral-100 rounded-xl" style={{ paddingBottom: "100%", height: 0 }} />;

  return (
    <div className="md:sticky md:top-[80px] md:h-fit">
      {/* ── MOBILE ─────────────────────────────────────────── */}
      <div className="md:hidden">
        <div className="relative w-full overflow-hidden rounded-xl mb-3 bg-neutral-50" style={{ paddingBottom: "100%", height: 0 }}>
          <Image
            src={images[activeIdx].sourceUrl}
            alt={images[activeIdx].altText || "Product"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center z-10">
                <ChevronLeft size={16} />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center z-10">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`flex-none w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeIdx ? "border-black" : "border-transparent opacity-70"}`}
              >
                <Image src={img.sourceUrl} alt={img.altText || ""} width={80} height={80} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP ────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-hidden rounded-xl mb-3 bg-neutral-50" style={{ paddingBottom: "100%", height: 0 }}>
          <Image
            src={images[activeIdx].sourceUrl}
            alt={images[activeIdx].altText || "Product"}
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`relative w-full overflow-hidden rounded-xl transition-all ${i === activeIdx ? "ring-2 ring-black ring-offset-1" : "opacity-80 hover:opacity-100"}`}
                style={{ paddingBottom: "100%", height: 0 }}
              >
                <Image src={img.sourceUrl} alt={img.altText || ""} fill className="object-cover" sizes="25vw" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELLING OUT FAST (collapsible pill)
═══════════════════════════════════════════════════════════════════════════ */
function SellingOutFast() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-3 px-4 py-2 bg-[#F9F3F1] rounded-2xl cursor-pointer w-fit hover:bg-[#f5ebe9] transition-colors"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D63939] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D63939]" />
        </span>
        <span className="text-[#CC5C5C] font-semibold text-sm whitespace-nowrap">Selling Out Fast</span>
        <svg className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="#CC5C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="bg-[#F9F3F1] rounded-2xl px-4 py-2 max-w-md mt-1">
            <p className="text-[#CC5C5C] text-xs leading-relaxed">
              This product is in high demand. Based on the sales volume in the past 3 hours,{" "}
              <strong className="font-semibold">this product is likely to sell out today.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPPING STRIP
═══════════════════════════════════════════════════════════════════════════ */
function getNextBusinessDay() {
  const d = new Date();
  if (d.getHours() >= 14) d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function ShippingStrip() {
  const shipDate = getNextBusinessDay();
  return (
    <section className="mt-8 mb-6">
      <div
        className="flex flex-row justify-center gap-2 sm:gap-6 lg:gap-4 py-5 px-4 sm:px-8 rounded-2xl border border-neutral-200"
        style={{ background: "linear-gradient(to right,#f5f5f5 0%,#f8f8f8 50%,#ffffff 100%)" }}
      >
        {/* Ships by */}
        <div className="flex flex-row gap-3 sm:gap-5">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-md">
              <div className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-neutral-100">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-black" />
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center text-neutral-800">In Stock Ships By</h3>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-center text-black">{shipDate}</div>
            </div>
          </div>
          <span className="w-px self-stretch bg-neutral-200" />
        </div>

        {/* 30-Day Guarantee */}
        <div className="flex flex-row gap-3 sm:gap-5">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6" className="w-7 h-7">
                <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center text-neutral-800">30-Day Guarantee</h3>
              <p className="text-[11px] sm:text-xs text-center text-neutral-500">Try Risk-Free For 30 Days</p>
            </div>
          </div>
          <span className="w-px self-stretch bg-neutral-200" />
        </div>

        {/* Free Shipping */}
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-md">
            <svg viewBox="0 0 60 40" className="w-9 h-7">
              <rect width="60" height="40" fill="#fff" />
              <g fill="#B22234">
                {[0, 2, 4, 6, 8, 10, 12].map((i) => (
                  <rect key={i} y={i * (40 / 13)} width="60" height={40 / 13} />
                ))}
              </g>
              <rect width="24" height={40 * 7 / 13} fill="#3C3B6E" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center text-neutral-800">Free Shipping</h3>
            <div className="text-[11px] sm:text-xs text-center text-neutral-500 uppercase tracking-wider">
              To <span className="underline underline-offset-2">United States</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOMER PHOTO MARQUEE
═══════════════════════════════════════════════════════════════════════════ */
function CustomerMarquee() {
  const placeholders = Array.from({ length: 6 });
  return (
    <div className="mt-6 mb-2">
      <h2 className="font-heading font-semibold text-black text-lg mb-4 md:text-xl">
        15,000+ customers love our bags!
      </h2>
      <div className="overflow-hidden w-full">
        <div
          className="flex gap-3"
          style={{ animation: "marquee 18s linear infinite", width: "max-content" }}
        >
          {[...placeholders, ...placeholders].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] md:w-[180px] rounded-xl overflow-hidden bg-neutral-200" style={{ aspectRatio: "3/4" }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UGC VIDEO STRIP
═══════════════════════════════════════════════════════════════════════════ */
const UGC_ITEMS = [
  { id: 1, src: "https://cdn.shopify.com/videos/c/o/v/39ddfffae7b24858854eddb8978961c4.mov", label: "Your perfect plus-one" },
  { id: 2, src: "https://cdn.shopify.com/videos/c/o/v/f6f28399f1e74d2e97cb77d7a6d41409.mov", label: "Elevate your everyday" },
  { id: 3, src: "https://cdn.shopify.com/videos/c/o/v/97b3af1b409c48d5b39f2bec018ff2c0.mp4", label: "Your work day just got better" },
  { id: 4, src: "https://cdn.shopify.com/videos/c/o/v/bc5644cc829f4f25b5ee4f8fdc4ac3fb.mp4", label: "Pack with me – Weekend Bag" },
  { id: 5, src: "https://cdn.shopify.com/videos/c/o/v/09ed40a4fc84407d918f5a1fd5052e49.mp4", label: "Four new styles just dropped" },
];

function UGCModal({ items, startIndex, onClose }: { items: typeof UGC_ITEMS; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => { setMuted(true); }, [idx]);

  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div
        className="relative w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: "9/16", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <video ref={videoRef} src={items[idx].src} autoPlay loop muted={muted} playsInline className="w-full h-full object-cover" />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button onClick={() => setMuted((m) => !m)} className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            <X size={14} />
          </button>
        </div>

        {items.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white">
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UGCStrip() {
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);
  return (
    <section className="py-12 bg-white">
      <div className="text-center mb-8 px-4">
        <h2 className="font-heading text-[22px] sm:text-[28px] font-semibold text-neutral-900">
          15,243+ happy customers (and counting)
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">Real moments from our community</p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-8 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {UGC_ITEMS.map((item, i) => (
          <button key={item.id} onClick={() => { setStartIdx(i); setOpen(true); }}
            className="flex-none w-[180px] sm:w-[220px] lg:w-[260px] rounded-2xl overflow-hidden bg-neutral-100 snap-start relative group cursor-pointer" style={{ aspectRatio: "9/16" }}
          >
            <div className="w-full h-full bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-600" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-neutral-900 ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-white font-semibold text-xs sm:text-sm leading-snug text-left line-clamp-2">{item.label}</p>
            </div>
          </button>
        ))}
      </div>
      {open && <UGCModal items={UGC_ITEMS} startIndex={startIdx} onClose={() => setOpen(false)} />}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS SECTION
═══════════════════════════════════════════════════════════════════════════ */
function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={sz}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "text-[#F9BC4B]" : "text-neutral-200"}>★</span>
      ))}
    </span>
  );
}

const MOCK_REVIEWS = [
  { id: 1, name: "Sarah M.", rating: 5, title: "Perfect everyday bag", body: "The quality is absolutely unreal. I use it every single day and it still looks brand new. The strap is so comfortable too.", verified: true, date: "2026-04-12" },
  { id: 2, name: "Jessica T.", rating: 5, title: "Finally fits everything!", body: "Finally a bag that fits everything without being bulky. I can fit my wallet, phone, keys, sunglasses, and even a small water bottle.", verified: true, date: "2026-03-28" },
  { id: 3, name: "Priya K.", rating: 5, title: "Goes with everything", body: "Ordered in Ivory and it goes with literally every outfit I own. Already planning to get another in Noir.", verified: true, date: "2026-03-15" },
  { id: 4, name: "Maria L.", rating: 5, title: "Worth every penny", body: "I was hesitant about the price at first but this bag is absolutely worth it. The leather feels luxurious and the hardware is solid.", verified: false, date: "2026-02-20" },
];

function ReviewsSection() {
  const avg = "5.0";
  return (
    <section id="reviews-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-neutral-100">
        <div>
          <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <Stars rating={5} size="lg" />
            <span className="text-3xl font-bold text-neutral-900">{avg}</span>
            <span className="text-sm text-neutral-400">out of 5</span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Based on {MOCK_REVIEWS.length}+ reviews</p>
        </div>
        <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-colors self-start sm:self-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Write a Review
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {MOCK_REVIEWS.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-100 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-black font-bold flex-shrink-0">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">{r.name}</p>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8 0l2 5.5h5.5l-4.5 3.3 1.7 5.2L8 11.2l-4.7 2.8 1.7-5.2L.5 5.5H6z" /></svg>
                      Verified Buyer
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <Stars rating={r.rating} size="sm" />
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <p className="font-semibold text-neutral-900 mb-1">{r.title}</p>
            <p className="text-sm text-neutral-600 leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RELATED PRODUCTS
═══════════════════════════════════════════════════════════════════════════ */
function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="py-10 bg-[#f8faf8]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold mb-5">Most loved styles...</h2>
        <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible gap-3 md:gap-5 snap-x snap-mandatory lg:snap-none lg:grid-cols-4" style={{ scrollbarWidth: "none" }}>
          {products.slice(0, 4).map((product) => {
            const savePct = product.onSale && product.regularPrice && product.salePrice
              ? Math.round((1 - parseFloat(product.salePrice.replace(/[^0-9.]/g, "")) / parseFloat(product.regularPrice.replace(/[^0-9.]/g, ""))) * 100)
              : 0;
            return (
              <Link key={product.id} href={`/products/${product.slug}`}
                className="flex-none w-[280px] md:w-auto snap-start block group"
              >
                <div className="bg-white px-2 py-2 rounded-lg h-full flex flex-col">
                  <div className="relative">
                    {savePct > 0 && (
                      <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-semibold px-2 py-1 rounded-full bg-black">
                        {savePct}% Off
                      </span>
                    )}
                    <div className="overflow-hidden rounded" style={{ aspectRatio: "1/1" }}>
                      {product.image ? (
                        <Image
                          src={product.image.sourceUrl}
                          alt={product.image.altText || product.name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          sizes="280px"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-100" />
                      )}
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[#F9BC4B] text-xs">★★★★★</span>
                      <span className="text-xs text-neutral-500">(15,243)</span>
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900 truncate mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 text-base font-semibold">{formatPrice(product.salePrice || product.price)}</span>
                      {product.onSale && <span className="text-neutral-400 text-sm line-through">{formatPrice(product.regularPrice)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PRODUCT DETAIL
═══════════════════════════════════════════════════════════════════════════ */
interface Props {
  product: Product;
  relatedProducts?: Product[];
}

export default function ProductDetail({ product, relatedProducts = [] }: Props) {
  const variations = product.variations?.nodes ?? [];

  // Build attribute map
  const attributeMap: Record<string, string[]> = {};
  variations.forEach((v) => {
    v.attributes.nodes.forEach((a) => {
      if (!attributeMap[a.name]) attributeMap[a.name] = [];
      if (!attributeMap[a.name].includes(a.value)) attributeMap[a.name].push(a.value);
    });
  });

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(attributeMap).forEach(([k, v]) => { init[k] = v[0]; });
    return init;
  });
  const [quantity, setQuantity] = useState(1);

  const selectedVariation = variations.find((v) =>
    v.attributes.nodes.every((a) => selectedAttrs[a.name] === a.value)
  ) ?? null;

  // Gallery images
  const images = [
    ...(selectedVariation?.image ? [selectedVariation.image] : []),
    ...(product.image && (!selectedVariation?.image || selectedVariation.image.sourceUrl !== product.image.sourceUrl) ? [product.image] : []),
    ...(product.galleryImages?.nodes ?? []),
  ].filter(Boolean) as { sourceUrl: string; altText: string }[];

  const finalImages = images.length ? images : product.image ? [product.image] : [];
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset image when variant changes
  useEffect(() => { setActiveIdx(0); }, [selectedVariation?.id]);

  const displayPrice = selectedVariation?.price ?? product.price;
  const displayRegularPrice = selectedVariation?.regularPrice ?? product.regularPrice;
  const displaySalePrice = selectedVariation?.salePrice ?? product.salePrice;
  const isOnSale = product.onSale && !!(displaySalePrice && displaySalePrice !== displayRegularPrice);

  const savePct = isOnSale && displayRegularPrice && displaySalePrice
    ? Math.round((1 - parseFloat(displaySalePrice.replace(/[^0-9.]/g, "")) / parseFloat(displayRegularPrice.replace(/[^0-9.]/g, ""))) * 100)
    : 0;

  const handleAttrChange = (name: string, value: string) => {
    setSelectedAttrs((prev) => ({ ...prev, [name]: value }));
  };

  // Cart
  const { setCart, openCart, setLoading } = useCartStore();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setLoading(true);
    try {
      const cart = await addToCart(
        product.databaseId,
        quantity,
        selectedVariation?.databaseId
      );
      if (cart) {
        // Fetch full cart to update drawer
        const fullCart = await fetchCart();
        if (fullCart) setCart(fullCart);
        setAddedToCart(true);
        openCart();
        setTimeout(() => setAddedToCart(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToCart(false);
      setLoading(false);
    }
  };

  const colorAttrName = Object.keys(attributeMap).find((k) => k.toLowerCase().includes("color"));
  const selectedColorName = colorAttrName ? selectedAttrs[colorAttrName] : null;

  return (
    <div className="bg-[#f8faf8] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 lg:pb-10 pt-4 lg:pt-0">

        {/* Breadcrumb */}
        <p className="hidden lg:block py-3 text-sm text-black/50">
          <Link href="/" className="text-black/50 hover:text-black transition-colors">Home</Link>
          {" / "}
          <Link href="/shop" className="text-black/50 hover:text-black transition-colors">Shop</Link>
          {" / "}
          <span>{product.name}</span>
        </p>

        {/* Mobile: title + price ABOVE grid */}
        <div className="lg:hidden mb-3">
          <h1 className="font-heading text-xl font-semibold text-black mb-1">{product.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-red-600">{formatPrice(displaySalePrice || displayPrice)}</span>
            {isOnSale && (
              <span className="text-base line-through text-black/50 font-normal">{formatPrice(displayRegularPrice)}</span>
            )}
            {savePct > 0 && (
              <span className="flex items-center gap-1 py-0.5 px-2 rounded-md text-white text-xs font-medium bg-black">
                Save {savePct}%
              </span>
            )}
          </div>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-10 items-start">

          {/* LEFT — Gallery */}
          <Gallery images={finalImages} activeIdx={activeIdx} setActiveIdx={setActiveIdx} />

          {/* RIGHT — Info panel */}
          <div className="rounded-xl pb-4 pt-0 md:pt-5 px-3 lg:px-5 md:sticky md:top-[80px] bg-[#f8faf8]">

            {/* Social proof */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-neutral-300 border-2 border-white overflow-hidden" />
                ))}
              </div>
              <p className="text-[13px] text-neutral-600">
                Purchased more than <strong>2,437,825+</strong> times.
              </p>
            </div>

            {/* Title + price — desktop only */}
            <div className="hidden lg:flex flex-col lg:flex-row justify-between gap-y-4 gap-x-8 items-start mb-1">
              <h1 className="font-heading text-2xl font-semibold text-black">{product.name}</h1>
              <div className="flex-shrink-0 relative">
                <p className="flex items-baseline gap-2 text-2xl font-semibold text-red-600 whitespace-nowrap">
                  {formatPrice(displaySalePrice || displayPrice)}
                  {isOnSale && (
                    <span className="text-base line-through text-black/50 font-normal">{formatPrice(displayRegularPrice)}</span>
                  )}
                </p>
                {savePct > 0 && (
                  <div className="absolute -bottom-6 left-0 py-[2px] px-[5px] rounded-[6px] flex gap-1 items-center h-[23px] bg-black">
                    <span className="text-white text-[13px] font-medium whitespace-nowrap">Save {savePct}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stars */}
            <button className="flex items-center gap-2 mb-3 mt-4">
              <span className="text-[#F9BC4B] text-base flex gap-0.5">★★★★★</span>
              <span className="font-semibold text-base text-neutral-800">Excellent 5.0</span>
              <span className="text-neutral-300">|</span>
              <span className="font-semibold text-base underline text-neutral-800">15,243+ Reviews</span>
            </button>

            {/* Selling Out Fast */}
            <SellingOutFast />

            {/* Bullet points */}
            <div className="flex flex-col gap-1.5 mb-4">
              {["Premium quality materials", "Free & fast shipping", "Adjustable crossbody strap"].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="text-black font-bold">✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Variant attributes */}
            {Object.entries(attributeMap).map(([attrName, values]) => (
              <div key={attrName} className="mb-4">
                <p className="text-sm font-medium mb-2.5">
                  {attrName}:{" "}
                  <span className="font-normal text-neutral-500">{selectedAttrs[attrName]}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {values.map((val) => {
                    // Find variation image for this color value
                    const varImg = variations.find((v) =>
                      v.attributes.nodes.some((a) => a.name === attrName && a.value === val)
                    )?.image;
                    const isSelected = selectedAttrs[attrName] === val;

                    if (varImg) {
                      return (
                        <button key={val} onClick={() => handleAttrChange(attrName, val)} title={val}
                          className={`relative w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? "border-black" : "border-neutral-200 hover:border-black"}`}
                        >
                          <Image src={varImg.sourceUrl} alt={val} fill className="object-cover" sizes="72px" />
                        </button>
                      );
                    }

                    return (
                      <button key={val} onClick={() => handleAttrChange(attrName, val)}
                        className={`px-4 py-2 min-w-[3rem] rounded-md border text-sm font-medium transition-colors ${isSelected ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-black hover:border-neutral-400"}`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Color / size summary + size chart */}
            {selectedColorName && (
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-sm">Color: <strong>{selectedColorName}</strong></span>
                <button className="text-sm underline hover:opacity-60 transition-opacity" type="button">
                  Size &amp; Fit Chart
                </button>
              </div>
            )}

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Qty</span>
              <div className="flex items-center border border-neutral-300 rounded-md">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-lg leading-none hover:bg-neutral-50 transition-colors"
                >−</button>
                <span className="px-4 text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-lg leading-none hover:bg-neutral-50 transition-colors"
                >+</button>
              </div>
            </div>

            {/* Stock status */}
            {product.stockStatus === "OUT_OF_STOCK" && (
              <p className="text-sm text-red-500 mb-4">Currently out of stock</p>
            )}

            {/* ADD TO CART */}
            <button
              onClick={handleAddToCart}
              disabled={product.stockStatus === "OUT_OF_STOCK" || addingToCart}
              className="w-full bg-black text-white rounded-[10px] py-4 px-4 sm:px-6 flex items-center justify-center gap-3 sm:gap-5 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
            >
              {addingToCart ? (
                <Loader2 size={20} className="animate-spin" />
              ) : addedToCart ? (
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-tight">✓ Added!</span>
              ) : (
                <>
                  <span className="text-sm sm:text-base lg:text-lg font-extrabold uppercase tracking-tight">
                    Add to Cart
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 px-3 sm:px-4 py-1.5 rounded-full flex gap-2 sm:gap-3 border border-white/10">
                      {isOnSale && displayRegularPrice && (
                        <span className="text-white/60 font-medium line-through text-xs sm:text-sm">{formatPrice(displayRegularPrice)}</span>
                      )}
                      <span className="font-light text-white text-xs sm:text-sm">{formatPrice(displaySalePrice || displayPrice)}</span>
                    </div>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M3.6 12a.9.9 0 01.9-.9h12.77l-4.99-4.75a.9.9 0 011.24-1.3l6.6 6.3a.9.9 0 010 1.3l-6.6 6.3a.9.9 0 01-1.24-1.3l4.99-4.75H4.5a.9.9 0 01-.9-.9z" fill="white" />
                    </svg>
                  </div>
                </>
              )}
            </button>

            {/* Shipping strip */}
            <ShippingStrip />

            {/* Customer photo marquee */}
            <CustomerMarquee />
          </div>
        </div>
      </div>

      {/* UGC video strip */}
      <UGCStrip />

      {/* Reviews */}
      <ReviewsSection />

      {/* Related products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
