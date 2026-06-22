"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { addToCart, fetchCart } from "@/lib/cart";
import * as pixel from "@/lib/pixel";
import { klTrack } from "@/lib/klaviyo";
import { track } from "@vercel/analytics";
import { gtag, pushDataLayer, AW_ID } from "@/components/GoogleTag";
import { useCartStore } from "@/store/cartStore";
import type { Product, ProductVariation } from "@/types";
import type { Review } from "@/lib/reviews";

const GREEN      = "#538125";
const GREEN_DARK = "#343F20";
const BG         = "#f8faf8";

/* ═══════════════════════════════════════════════════════════════════════════
   GALLERY
═══════════════════════════════════════════════════════════════════════════ */
function Gallery({
  images,
  activeIdx,
  setActiveIdx,
  isCrossbodyBag = false,
}: {
  images: { sourceUrl: string; altText: string }[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  isCrossbodyBag?: boolean;
}) {
  const prev = () => setActiveIdx((activeIdx - 1 + images.length) % images.length);
  const next = () => setActiveIdx((activeIdx + 1) % images.length);

  if (!images.length)
    return <div className="w-full bg-neutral-100 rounded-xl" style={{ paddingBottom: "100%", height: 0 }} />;

  return (
    <div className="md:sticky md:top-[80px] md:h-fit">
      {/* MOBILE */}
      <div className="md:hidden">
        <div className="relative w-full overflow-hidden rounded-xl mb-3 bg-white" style={{ paddingBottom: "100%", height: 0 }}>
          <Image src={images[activeIdx].sourceUrl} alt={images[activeIdx].altText || "Product"} fill className="object-cover" priority sizes="100vw" />
          {isCrossbodyBag && activeIdx === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 rounded-xl px-5 py-3 text-center shadow-sm z-10 w-[75%]">
              <p className="text-sm font-bold text-neutral-900 leading-snug">2 FREE STRAPS & KEYRING Worth $75</p>
              <p className="text-sm font-semibold text-neutral-900">With Every Bag.</p>
            </div>
          )}
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
                className={`flex-none w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeIdx ? "border-[#538125]" : "border-transparent opacity-70"}`}
              >
                <Image src={img.sourceUrl} alt={img.altText || ""} width={80} height={80} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div className="relative w-full overflow-hidden rounded-xl mb-3 bg-white" style={{ paddingBottom: "100%", height: 0 }}>
          <Image src={images[activeIdx].sourceUrl} alt={images[activeIdx].altText || "Product"} fill className="object-cover" priority sizes="50vw" />
          {isCrossbodyBag && activeIdx === 0 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/95 rounded-xl px-6 py-3 text-center shadow-sm z-10 w-[65%]">
              <p className="text-base font-bold text-neutral-900 leading-snug">2 FREE STRAPS & KEYRING Worth $75</p>
              <p className="text-base font-semibold text-neutral-900">With Every Bag.</p>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`relative w-full overflow-hidden rounded-xl transition-all ${i === activeIdx ? "ring-2 ring-[#538125] ring-offset-1" : "opacity-80 hover:opacity-100"}`}
                style={{ paddingBottom: "100%", height: 0 }}
              >
                <Image src={img.sourceUrl} alt={img.altText || ""} fill loading="lazy" className="object-cover" sizes="25vw" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLOR VARIANT SWATCHES  (sibling products by name prefix)
═══════════════════════════════════════════════════════════════════════════ */
function Accordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border-t border-neutral-200 mt-4">
      {items.map((item, i) => (
        <div key={i} className="border-b border-neutral-200">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex items-center justify-between w-full py-4 text-left text-sm font-semibold text-neutral-800 hover:text-black transition-colors"
          >
            {item.title}
            <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {open === i && (
            <div className="pb-4 text-sm text-neutral-600 leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SizeModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors">
          <X size={20} />
        </button>
        <h2 className="font-heading text-2xl font-semibold text-center mb-6">Bag &amp; Strap Sizing</h2>
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50">
                <th className="text-left p-3 border border-neutral-200 font-semibold text-neutral-700">Product</th>
                <th className="text-center p-3 border border-neutral-200 font-semibold text-neutral-700">Width</th>
                <th className="text-center p-3 border border-neutral-200 font-semibold text-neutral-700">Height</th>
                <th className="text-center p-3 border border-neutral-200 font-semibold text-neutral-700">Depth</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Luma Crossbody Bag",             w: `7.9"`,  h: `7.5"`,  d: `3.5"` },
                { name: "Vera Weekender Travel Duffel Bag", w: `19.7"`, h: `11.8"`, d: `8.2"` },
                { name: "The Isla Backpack",               w: `13.7"`, h: `17.7"`, d: `5.6"` },
                { name: "Nora Tote",                       w: `16.9"`, h: `9.8"`,  d: `5.3"` },
                { name: "Élysée Zip Around Wallet",        w: `7.5"`,  h: `3.9"`,  d: `1.0"` },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                  <td className="p-3 border border-neutral-200 font-medium text-neutral-800">{row.name}</td>
                  <td className="p-3 border border-neutral-200 text-center text-neutral-600">{row.w}</td>
                  <td className="p-3 border border-neutral-200 text-center text-neutral-600">{row.h}</td>
                  <td className="p-3 border border-neutral-200 text-center text-neutral-600">{row.d}</td>
                </tr>
              ))}
              <tr className="bg-white">
                <td className="p-3 border border-neutral-200 font-medium text-neutral-800">Leather Strap</td>
                <td colSpan={3} className="p-3 border border-neutral-200 text-center text-neutral-600">Adjustable Length = 45.7"</td>
              </tr>
              <tr className="bg-neutral-50">
                <td className="p-3 border border-neutral-200 font-medium text-neutral-800">Fabric Strap</td>
                <td colSpan={3} className="p-3 border border-neutral-200 text-center text-neutral-600">Adjustable Length = 54.7"</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-neutral-400 tracking-widest mt-5 uppercase">All straps are suitable for all heights.</p>
      </div>
    </div>
  );
}

function extractColorName(fullName: string, variants: Product[]): string {
  // Find longest common prefix among all variant names, then return what's left
  const names = variants.map((v) => v.name);
  if (names.length <= 1) return fullName;
  let prefix = names[0];
  for (const n of names) {
    while (!n.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  const color = fullName.slice(prefix.length).trim();
  return color || fullName;
}

function ColorVariantSwatches({ variants, currentSlug }: { variants: Product[]; currentSlug: string }) {
  const router = useRouter();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Track which swatch was clicked so we can show the spinner on that one only.
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  if (variants.length <= 1) return null;

  // Each color is a sibling product page, so switching is a full navigation.
  // useTransition keeps isPending true until the new page is ready, giving us
  // feedback to show the user it's loading.
  const goTo = (slug: string) => {
    if (slug === currentSlug || isPending) return;
    setPendingSlug(slug);
    startTransition(() => router.push(`/products/${slug}`));
  };

  return (
    <div className="mb-4">
      {sizeOpen && <SizeModal onClose={() => setSizeOpen(false)} />}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-sm font-medium" style={{ color: GREEN_DARK }}>
          Color:{" "}
          <span className="font-normal text-neutral-500">
            {extractColorName(variants.find((v) => v.slug === currentSlug)?.name ?? "", variants)}
          </span>
        </p>
        <button onClick={() => setSizeOpen(true)} className="text-xs underline text-neutral-500 hover:text-black transition-colors">
          Bag &amp; Strap Sizes
        </button>
      </div>
      {/* Mobile: horizontal scroll */}
      <div className="block md:hidden overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 pb-2 pt-1">
          {variants.map((v) => {
            const active = v.slug === currentSlug;
            const loading = isPending && pendingSlug === v.slug;
            return (
              <button key={v.id} title={v.name} onClick={() => goTo(v.slug)} disabled={isPending}
                className={`relative flex-none w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${active ? "border-[#538125]" : "border-neutral-200 hover:border-neutral-400"} ${isPending ? "cursor-wait" : ""} ${isPending && !loading ? "opacity-50" : ""}`}
              >
                {v.image ? (
                  <Image src={v.image.sourceUrl} alt={v.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full bg-neutral-200" />
                )}
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 size={22} className="animate-spin text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Desktop: wrap flex */}
      <div className="hidden md:flex flex-wrap gap-2">
        {variants.map((v) => {
          const active = v.slug === currentSlug;
          const loading = isPending && pendingSlug === v.slug;
          return (
            <button key={v.id} title={v.name} onClick={() => goTo(v.slug)} disabled={isPending}
              className={`relative w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${active ? "border-[#538125]" : "border-neutral-200 hover:border-[#538125]"} ${isPending ? "cursor-wait" : ""} ${isPending && !loading ? "opacity-50" : ""}`}
            >
              {v.image ? (
                <Image src={v.image.sourceUrl} alt={v.name} fill className="object-cover" sizes="72px" />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 size={20} className="animate-spin text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAIR ROW — one configurable item inside the bundle
═══════════════════════════════════════════════════════════════════════════ */
interface BundlePair {
  slug: string;
  name: string;
  image: { databaseId: number; sourceUrl: string; altText: string } | null;
  databaseId: number;       // product databaseId
  variationId?: number;     // variation databaseId (variable products)
  colorLabel?: string;      // color display name
}

function PairRow({
  index,
  pair,
  colorVariants,
  wcVariations,
  onChange,
  onRemove,
}: {
  index: number;
  pair: BundlePair;
  colorVariants: Product[];
  wcVariations: ProductVariation[];
  onChange: (p: BundlePair) => void;
  onRemove: () => void;
}) {
  const [openPicker, setOpenPicker] = useState(false);

  // Deduplicate WC variations by color value for display
  const uniqueColorVariations = wcVariations.reduce<ProductVariation[]>((acc, v) => {
    const colorAttr = v.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"));
    if (!colorAttr) return acc;
    const alreadyHas = acc.some((x) =>
      x.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"))?.value === colorAttr.value
    );
    return alreadyHas ? acc : [...acc, v];
  }, []);

  const useWcVariations = uniqueColorVariations.length > 0;
  const useColorVariants = !useWcVariations && colorVariants.length > 1;
  const hasColors = useWcVariations || useColorVariants;

  const displayImg = pair.image?.sourceUrl;
  const displayLabel = pair.colorLabel || pair.name;

  return (
    <div className="border-b border-neutral-100 last:border-b-0 pb-4 last:pb-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm" style={{ color: GREEN_DARK }}>Bag #{index + 1}</h4>
        <button type="button" onClick={onRemove} className="text-neutral-400 hover:text-neutral-700 p-1" aria-label={`Remove bag ${index + 1}`}>
          <X size={16} />
        </button>
      </div>

      {/* Content row */}
      <div className="flex items-center gap-3">
        {/* Image */}
        <div className="flex-shrink-0 w-[68px] h-[68px] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
          {displayImg ? (
            <Image src={displayImg} alt={displayLabel} width={68} height={68} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase text-neutral-500 tracking-wide font-medium">Color</p>
          <p className="text-sm font-semibold text-neutral-900 truncate capitalize">{displayLabel}</p>
        </div>
        {/* Change button */}
        {hasColors && (
          <button type="button" onClick={() => setOpenPicker((o) => !o)}
            className="flex-shrink-0 text-xs font-semibold border rounded-md px-3 py-1.5 transition-colors"
            style={{ color: GREEN, borderColor: GREEN }}
          >
            {openPicker ? "Done" : "Change"}
          </button>
        )}
      </div>

      {/* Picker grid — WooCommerce variations */}
      {openPicker && useWcVariations && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {uniqueColorVariations.map((v) => {
            const colorVal = v.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"))?.value ?? v.name;
            const isActive = pair.variationId === v.databaseId;
            return (
              <button key={v.id} type="button" title={colorVal}
                onClick={() => {
                  onChange({
                    slug: pair.slug,
                    name: pair.name,
                    image: v.image as BundlePair["image"],
                    databaseId: pair.databaseId,
                    variationId: v.databaseId,
                    colorLabel: colorVal,
                  });
                  setOpenPicker(false);
                }}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isActive ? "border-[#538125]" : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {v.image ? (
                  <Image src={v.image.sourceUrl} alt={colorVal} width={100} height={100} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                    <span className="text-[9px] text-neutral-600 text-center px-1 capitalize">{colorVal}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Picker grid — separate color variant products */}
      {openPicker && useColorVariants && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {colorVariants.map((v) => (
            <button key={v.id} type="button" title={v.name}
              onClick={() => {
                onChange({ slug: v.slug, name: v.name, image: v.image as BundlePair["image"], databaseId: v.databaseId });
                setOpenPicker(false);
              }}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                v.slug === pair.slug ? "border-[#538125]" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              {v.image ? (
                <Image src={v.image.sourceUrl} alt={v.name} width={100} height={100} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-300" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUNDLE SELECTOR
═══════════════════════════════════════════════════════════════════════════ */
const MAX_PAIRS = 3;

const BUNDLE_OPTIONS = [
  { qty: 2, label: "2 Bags", savePct: 20, badge: "MOST POPULAR", badgeBg: "rgb(52, 63, 32)", badgeColor: "#fff" },
  { qty: 3, label: "3 Bags", savePct: 25, badge: "*BEST VALUE*", badgeBg: "rgb(247, 206, 83)", badgeColor: "#000" },
] as const;

function BundleSelector({
  product,
  colorVariants,
  wcVariations,
  salePrice,
  regularPrice,
  pairs,
  setPairs,
  defaultVariation,
}: {
  product: Product;
  colorVariants: Product[];
  wcVariations: ProductVariation[];
  salePrice: string;
  regularPrice: string;
  pairs: BundlePair[];
  setPairs: (p: BundlePair[]) => void;
  defaultVariation?: ProductVariation | null;
}) {
  const uniqueColors = wcVariations.reduce<ProductVariation[]>((acc, v) => {
    const col = v.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"))?.value;
    if (!col) return acc;
    return acc.some((x) => x.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"))?.value === col)
      ? acc : [...acc, v];
  }, []);
  const hasColors = uniqueColors.length > 1 || colorVariants.length > 1;
  const showConfig = pairs.length >= 2 && hasColors;

  // baseNum = what you pay today (sale price if on sale, otherwise regular)
  // origNum = strikethrough (the base before bundle discount)
  const baseNum = parseFloat((salePrice || regularPrice || "0").replace(/[^0-9.]/g, "")) || 0;
  const compareNum = baseNum; // strikethrough = current price (bundle saves on top of this)
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const makeDefaultPair = (): BundlePair => {
    const colorAttr = defaultVariation?.attributes.nodes.find((a) => a.name.toLowerCase().includes("color"));
    return {
      slug: product.slug,
      name: product.name,
      image: (defaultVariation?.image ?? product.image) as BundlePair["image"],
      databaseId: product.databaseId,
      variationId: defaultVariation?.databaseId,
      colorLabel: colorAttr?.value,
    };
  };

  const selectBundle = (qty: number) => {
    const next = Array.from({ length: qty }, (_, i) => pairs[i] ?? makeDefaultPair());
    setPairs(next);
  };

  const setPairColor = (idx: number, p: BundlePair) => {
    const next = [...pairs];
    next[idx] = p;
    setPairs(next);
  };

  const removePair = (idx: number) => {
    const next = pairs.filter((_, i) => i !== idx);
    setPairs(next.length <= 1 ? [next[0] ?? makeDefaultPair()] : next);
  };

  const addPair = () => {
    if (pairs.length >= MAX_PAIRS) return;
    setPairs([...pairs, makeDefaultPair()]);
  };

  const imgUrl = product.image?.sourceUrl ?? null;

  return (
    <div className="pt-2 pb-1.5">
      {/* Divider */}
      <div className="flex items-center w-full mb-5">
        <div className="flex-grow h-px bg-[#E0E0E0]" />
        <h2 className="text-base font-bold text-center leading-8 px-4 whitespace-nowrap">
          Bundle promotion is valid till 11:59 PM
        </h2>
        <div className="flex-grow h-px bg-[#E0E0E0]" />
      </div>

      {/* 2-column bundle option cards */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-6">
        {BUNDLE_OPTIONS.map((b) => {
          const perPair = compareNum * (1 - b.savePct / 100);
          const isActive = pairs.length === b.qty;

          return (
            <button
              key={b.qty}
              type="button"
              onClick={() => selectBundle(b.qty)}
              className={`relative p-2.5 border bg-white rounded-[14px] flex flex-col justify-center items-center transition-all ${
                isActive
                  ? "border-[#538125] ring-2 ring-[#538125]/20"
                  : "border-[#D1D5DC] hover:border-gray-400"
              }`}
            >
              {/* Badge */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 sm:px-4 py-0.5 rounded-full text-[10px] sm:text-[12px] font-bold uppercase whitespace-nowrap z-10"
                style={{ backgroundColor: b.badgeBg, color: b.badgeColor }}
              >
                {b.badge}
              </div>

              {/* Product image */}
              <div className="relative w-[120px] sm:w-[140px] h-[90px] sm:h-[110px] -mt-2 mb-1">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={product.name}
                    width={140}
                    height={110}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-100 rounded" />
                )}
              </div>

              {/* Label */}
              <p className="text-base sm:text-xl font-medium" style={{ color: GREEN_DARK }}>{b.label}</p>

              {/* Price */}
              <div className="flex flex-row items-center gap-0.5 mb-1">
                <span className="text-[#C85A54] font-semibold text-base sm:text-xl">{fmt(perPair)}</span>
                <div className="text-[#6A7282] text-[9px] sm:text-xs ml-1">
                  <span className="line-through">{fmt(compareNum)}</span>
                  <span> Per Bag</span>
                </div>
              </div>

              {/* Save badge */}
              <div className="bg-[#E3ECD5] py-[5px] px-3 sm:px-6 text-black text-[10px] sm:text-sm rounded-md font-medium">
                Save<span className="font-semibold ml-1">{fmt(compareNum - perPair)}</span> per bag
              </div>
            </button>
          );
        })}
      </div>

      {/* Pair configurator */}
      {showConfig && (
        <div className="mb-6">
          {/* Sub-divider */}
          <div className="flex items-center w-full mb-5">
            <div className="flex-grow h-px bg-[#E0E0E0]" />
            <h3 className="text-base font-bold italic text-center px-4">Choose your colors</h3>
            <div className="flex-grow h-px bg-[#E0E0E0]" />
          </div>

          {/* Pair cards */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-4">
            {pairs.map((pair, idx) => (
              <PairRow
                key={idx}
                index={idx}
                pair={pair}
                colorVariants={colorVariants.length > 1 ? colorVariants : []}
                wcVariations={wcVariations}
                onChange={(p) => setPairColor(idx, p)}
                onRemove={() => removePair(idx)}
              />
            ))}

            {/* Add another pair */}
            {pairs.length < MAX_PAIRS && (
              <button
                type="button"
                onClick={addPair}
                className="w-full border-2 border-dashed rounded-xl py-4 px-6 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[#538125]/5"
                style={{ borderColor: "#538125" + "66" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = GREEN)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#538125" + "66")}
              >
                <div className="flex items-center gap-2 font-semibold" style={{ color: GREEN }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Another Bag
                </div>
                <p className="text-xs text-neutral-500">Save 25% on your entire order</p>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELLING OUT FAST
═══════════════════════════════════════════════════════════════════════════ */
function SellingOutFast() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 mb-4 mt-0 lg:mt-2">
      <button type="button" onClick={() => setOpen((o) => !o)}
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
        className="flex flex-row justify-center gap-2 sm:gap-6 lg:gap-4 py-5 px-4 sm:px-8 rounded-2xl border border-[#CAD3BE]"
        style={{ background: "linear-gradient(to right,#EAEEE3 0%,#ECF0E6 11%,#EFF2E9 22%,#F1F4EC 33%,#F3F6EF 44%,#F6F7F3 56%,#F8F9F6 67%,#FAFBF9 78%,#FDFDFC 89%,#FFFFFF 100%)" }}
      >
        <div className="flex flex-row gap-3 sm:gap-5">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-2xl">
              <div className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-[#E5F0DF]">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: GREEN }} />
                  <span className="relative inline-flex rounded-full h-4 w-4" style={{ backgroundColor: GREEN }} />
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center" style={{ color: GREEN_DARK }}>In Stock Ships By</h3>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-center" style={{ color: GREEN }}>{shipDate}</div>
            </div>
          </div>
          <span className="w-px self-stretch bg-[#CAD3BE]" />
        </div>

        <div className="flex flex-row gap-3 sm:gap-5">
          <div className="flex flex-col gap-3 items-center">
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" className="w-7 h-7" style={{ stroke: GREEN }}>
                <path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center" style={{ color: GREEN_DARK }}>30-Day Guarantee</h3>
              <p className="text-[11px] sm:text-xs text-center text-[#364153]">Try Risk-Free For 30 Days</p>
            </div>
          </div>
          <span className="w-px self-stretch bg-[#CAD3BE]" />
        </div>

        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-white rounded-full shadow-2xl">
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
            <h3 className="font-semibold text-xs sm:text-sm leading-tight text-center" style={{ color: GREEN_DARK }}>Free Shipping</h3>
            <div className="text-[11px] sm:text-xs text-center text-[#364153] uppercase tracking-wider">
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
const UGC_IMAGES = [
  "/ugc/ugc-1.webp", "/ugc/ugc-2.webp", "/ugc/ugc-3.webp",
  "/ugc/ugc-4.webp", "/ugc/ugc-5.webp", "/ugc/ugc-6.webp",
  "/ugc/ugc-7.webp", "/ugc/ugc-8.webp", "/ugc/ugc-9.webp",
];

function CustomerMarquee() {
  const track = [...UGC_IMAGES, ...UGC_IMAGES];
  return (
    <div className="mt-6 mb-2">
      <h2 className="font-heading font-semibold text-black text-lg mb-4 md:text-xl">
        18,347+ customers love our bags!
      </h2>
      <div className="overflow-hidden w-full relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, white, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, white, transparent)" }} />
        <div className="flex gap-3" style={{ animation: "marquee 28s linear infinite", width: "max-content" }}>
          {track.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] md:w-[160px] rounded-xl overflow-hidden bg-neutral-100" style={{ aspectRatio: "3/4" }}>
              <Image src={src} alt="Customer photo" width={160} height={213} className="w-full h-full object-cover" loading="lazy" />
            </div>
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
  { id: 1, src: "https://noirblanc.store/wp-content/uploads/2026/06/lv_0_20251026142226.mp4-Free-Online-Video-Compressor.mp4", label: "Your perfect plus-one", poster: "/ugc/ugc-t1.webp" },
  { id: 2, src: "https://noirblanc.store/wp-content/uploads/2026/06/copy_638A8422-D04E-4484-8DC2-E1BC3778B957.mp4-Free-Online-Video-Compressor.mp4", label: "Elevate your everyday", poster: "/ugc/ugc-t2.webp" },
  { id: 3, src: "https://noirblanc.store/wp-content/uploads/2026/06/WhatsApp-Video-2026-06-07-at-00.20.47.mp4", label: "Your work day just got better", poster: "/ugc/ugc-t3.webp" },
  { id: 4, src: "https://noirblanc.store/wp-content/uploads/2026/06/Bag.mp4", label: "Pack with me – Weekend Bag", poster: "/ugc/ugc-t4.webp" },
  { id: 5, src: "https://noirblanc.store/wp-content/uploads/2026/06/This-bag-is-my-everyday-kind-of-luxury-🖤Beautiful-leather-clean-details-and-two-interchangeabl.mp4", label: "Four new styles just dropped", poster: "/ugc/ugc-t5.webp" },
];

function UGCModal({ items, startIndex, onClose }: { items: typeof UGC_ITEMS; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [muted, setMuted] = useState(true);

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
      <div className="relative w-full max-w-[400px] mx-4 rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <video src={items[idx].src} autoPlay loop muted={muted} playsInline className="w-full h-full object-cover" />
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
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"><ChevronLeft size={16} /></button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"><ChevronRight size={16} /></button>
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

function UGCCard({ item, onClick }: { item: typeof UGC_ITEMS[0]; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = () => { video.load(); video.play().then(() => setPlaying(true)).catch(() => {}); };
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { tryPlay(); } else { video.pause(); setPlaying(false); } },
      { threshold: 0.2 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <button type="button" onClick={onClick} className="relative w-full cursor-pointer overflow-hidden rounded-2xl bg-neutral-200 block" style={{ aspectRatio: "9/16" }}>
      <img src={item.poster} alt={item.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <video
        ref={videoRef}
        src={item.src}
        loop muted playsInline preload="none"        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: playing ? 1 : 0 }}
        onCanPlay={() => { videoRef.current?.play().then(() => setPlaying(true)).catch(() => {}); }}
      />
      <div className="absolute bottom-0 left-0 right-0 px-3 pt-10 pb-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none">
        <p className="text-white font-semibold text-[13px] leading-snug line-clamp-2 text-left">{item.label}</p>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${playing ? "opacity-0" : "opacity-100"}`}>
        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-neutral-900 ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
    </button>
  );
}

function UGCStrip() {
  const [open, setOpen] = useState(false);
  const [startIdx, setStartIdx] = useState(0);
  return (
    <section className="py-10 sm:py-12" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="text-center mb-6 sm:mb-8 px-4">
        <p className="text-[12px] sm:text-[13px] text-neutral-500 tracking-wide italic">Real moments from our community</p>
        <h2 className="font-heading text-[22px] sm:text-[28px] font-semibold text-neutral-900 mt-1">18,347+ happy customers (and counting)</h2>
      </div>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory px-3 sm:px-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-6 xl:px-8" style={{ scrollbarWidth: "none" }}>
        {UGC_ITEMS.map((item, i) => (
          <div key={item.id} className="flex-none w-[52vw] sm:w-[36vw] md:w-[28vw] lg:w-full snap-start">
            <UGCCard item={item} onClick={() => { setStartIdx(i); setOpen(true); }} />
          </div>
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

const PAGE_SIZE = 10;
const INITIAL_SIZE = 5;

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [shown, setShown] = useState(INITIAL_SIZE);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!reviews.length) return null;

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const visible = reviews.slice(0, shown);

  return (
    <section id="reviews-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-neutral-100">
        <div>
          <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <Stars rating={avgRating} size="lg" />
            <span className="text-3xl font-bold text-neutral-900">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-neutral-400">out of 5</span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Based on 18,347+ reviews</p>
        </div>
      </div>

      {/* Review cards */}
      <div className="flex flex-col gap-4">
        {visible.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-100 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ color: GREEN }}>
                  {r.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900">{r.name}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: GREEN }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M8 0l2 5.5h5.5l-4.5 3.3 1.7 5.2L8 11.2l-4.7 2.8 1.7-5.2L.5 5.5H6z" />
                    </svg>
                    Verified Buyer
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <Stars rating={r.rating} size="sm" />
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            {r.title && <p className="font-semibold text-neutral-900 mb-1">{r.title}</p>}
            <p className="text-sm text-neutral-600 leading-relaxed">{r.body}</p>

            {/* Review images */}
            {r.images.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {r.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(img)}
                    className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="Review photo" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {shown < reviews.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShown((s) => s + PAGE_SIZE)}
            className="px-8 py-3 rounded-xl border-2 font-semibold text-sm hover:bg-neutral-50 transition-colors"
            style={{ borderColor: GREEN, color: GREEN }}
          >
            Load more reviews
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Review photo"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RELATED PRODUCTS
═══════════════════════════════════════════════════════════════════════════ */
function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="py-10" style={{ backgroundColor: BG }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold mb-5">Most loved styles...</h2>
        <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible gap-3 md:gap-5 snap-x snap-mandatory lg:snap-none lg:grid-cols-4" style={{ scrollbarWidth: "none" }}>
          {products.slice(0, 4).map((product) => {
            const savePct = product.onSale && product.regularPrice && product.salePrice
              ? Math.round((1 - parseFloat(product.salePrice.replace(/[^0-9.]/g, "")) / parseFloat(product.regularPrice.replace(/[^0-9.]/g, ""))) * 100)
              : 0;
            return (
              <Link key={product.id} href={`/products/${product.slug}`} className="flex-none w-[280px] md:w-auto snap-start block group">
                <div className="bg-white px-2 py-2 rounded-lg h-full flex flex-col">
                  <div className="relative">
                    {savePct > 0 && (
                      <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: GREEN }}>
                        {savePct}% Off
                      </span>
                    )}
                    <div className="overflow-hidden rounded" style={{ aspectRatio: "1/1" }}>
                      {product.image ? (
                        <Image src={product.image.sourceUrl} alt={product.image.altText || product.name} width={400} height={400} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" sizes="280px" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100" />
                      )}
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[#F9BC4B] text-xs">★★★★★</span>
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
  colorVariants?: Product[];
  reviews?: Review[];
}

const COLOR_ORDER = ["noir", "ivory"];

function sortColorVariants(variants: Product[]): Product[] {
  return [...variants].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    const idxA = COLOR_ORDER.findIndex((c) => nameA.endsWith(c));
    const idxB = COLOR_ORDER.findIndex((c) => nameB.endsWith(c));
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}

export default function ProductDetail({ product, relatedProducts = [], colorVariants = [], reviews = [] }: Props) {
  const sortedColorVariants = sortColorVariants(colorVariants);
  const variations = product.variations?.nodes ?? [];
  const categories = product.productCategories?.nodes ?? [];
  const isCrossbodyBag = categories.some((cat) => cat.slug === "crossbody-bags");

  // Build attribute map for all WooCommerce variation attributes (color, size, etc.)
  const attributeMap: Record<string, string[]> = {};
  variations.forEach((v) => {
    v.attributes.nodes.forEach((a) => {
      if (!a.value) return; // skip empty
      if (!attributeMap[a.name]) attributeMap[a.name] = [];
      if (!attributeMap[a.name].includes(a.value)) attributeMap[a.name].push(a.value);
    });
  });

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(attributeMap).forEach(([k, v]) => { init[k] = v[0]; });
    return init;
  });

  const selectedVariation = variations.find((v) =>
    v.attributes.nodes.every((a) => selectedAttrs[a.name] === a.value)
  ) ?? null;

  type GalleryImg = { databaseId: number; sourceUrl: string; altText: string };

  const allGallery: GalleryImg[] = [
    ...(product.image ? [product.image] : []),
    ...(product.galleryImages?.nodes ?? []),
  ].filter((img, i, arr) =>
    arr.findIndex((x) => x.sourceUrl === img.sourceUrl) === i
  );

  // ── Alt-text based grouping ──────────────────────────────────────────────
  // Set the alt text of the first image in each color group to "color-{value}"
  // e.g. "color-camel", "color-black", "color-brown", "color-pink"
  // Everything after that marker (until the next marker) belongs to that color.
  //
  // Matching: gallery altText "color-camel" matches variation attribute value
  // "camel" (case-insensitive, strips "color-" prefix).

  // Normalize any string: lowercase, collapse spaces/hyphens/underscores → single hyphen
  const slug = (s: string) => s.toLowerCase().replace(/[-_\s]+/g, "-").trim();

  const altToVarIdx = (alt: string): number => {
    if (!alt.toLowerCase().startsWith("color")) return -1;
    // Strip "color" + any separator(s) from the start → "color-coffee-brown" → "coffee-brown"
    const colorValue = slug(alt.replace(/^color[-_\s]+/i, ""));
    return variations.findIndex((v) =>
      v.attributes.nodes.some((a) => slug(a.value) === colorValue)
    );
  };

  // Walk gallery: each "color-xxx" alt starts a new bucket
  const variantGalleryMap = new Map<number, GalleryImg[]>();
  let currentVarIdx: number | null = null;
  for (const img of allGallery) {
    const matchIdx = altToVarIdx(img.altText ?? "");
    if (matchIdx !== -1) currentVarIdx = matchIdx;
    if (currentVarIdx !== null) {
      const bucket = variantGalleryMap.get(currentVarIdx) ?? [];
      bucket.push(img);
      variantGalleryMap.set(currentVarIdx, bucket);
    }
  }

  const selectedVarIdx = selectedVariation
    ? variations.findIndex((v) => v.id === selectedVariation.id)
    : -1;

  // Get gallery images for the selected variation.
  // Handle duplicate variations (same color + different size):
  // if selectedVarIdx isn't in the map, find any variation with the
  // same color attribute value that IS in the map.
  const getGalleryForVariation = (): GalleryImg[] | null => {
    if (selectedVarIdx === -1) return null;
    // Direct match
    if (variantGalleryMap.has(selectedVarIdx)) return variantGalleryMap.get(selectedVarIdx)!;
    // Find by same color value
    const selColorValue = selectedVariation?.attributes.nodes
      .find((a) => a.name.toLowerCase().includes("color"))?.value;
    if (selColorValue) {
      for (const [mapIdx, imgs] of variantGalleryMap) {
        const hasColor = variations[mapIdx]?.attributes.nodes.some(
          (a) => a.name.toLowerCase().includes("color") && slug(a.value) === slug(selColorValue)
        );
        if (hasColor) return imgs;
      }
    }
    return null;
  };

  const varGallery = getGalleryForVariation();

  const finalImages: GalleryImg[] =
    varGallery
      ? varGallery
      : selectedVariation?.image
      ? [selectedVariation.image as GalleryImg]
      : allGallery.length
      ? allGallery
      : [];

  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [selectedVariation?.id]);

  // Fire ViewContent + view_item whenever the displayed product/variant changes
  useEffect(() => {
    const priceNum = parseFloat((displayPrice ?? "0").replace(/[^0-9.]/g, "")) || 0;
    pixel.viewContent({
      contentId: selectedVariation?.databaseId ?? product.databaseId,
      contentName: product.name,
      value: priceNum,
    });

    // Google Ads: view_item
    gtag("event", "view_item", {
      send_to: AW_ID,
      value: priceNum,
      currency: "USD",
      google_business_vertical: "retail",
      items: [{ id: String(selectedVariation?.databaseId ?? product.databaseId), google_business_vertical: "retail" }],
    });

    // GA4: view_item
    gtag("event", "view_item", {
      value: priceNum,
      currency: "USD",
      items: [{ item_id: String(product.databaseId), item_name: product.name, price: priceNum, quantity: 1 }],
    });

    // Klaviyo: Viewed Product (powers browse-abandonment + product recs)
    klTrack("Viewed Product", {
      ProductID: selectedVariation?.databaseId ?? product.databaseId,
      ProductName: product.name,
      Price: priceNum,
      URL: typeof window !== "undefined" ? window.location.href : `/products/${product.slug}`,
      ImageURL: product.image?.sourceUrl ?? null,
      Categories: (product.productCategories?.nodes ?? []).map((c) => c.name),
    });

    // Vercel Web Analytics: top-of-funnel step
    track("Viewed Product", { product: product.name, value: priceNum });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.databaseId, selectedVariation?.databaseId]);

  const displayPrice        = selectedVariation?.price ?? product.price;
  const displayRegularPrice = selectedVariation?.regularPrice ?? product.regularPrice;
  const displaySalePrice    = selectedVariation?.salePrice ?? product.salePrice;
  const isOnSale            = product.onSale && !!(displaySalePrice && displaySalePrice !== displayRegularPrice);
  const savePct             = isOnSale && displayRegularPrice && displaySalePrice
    ? Math.round((1 - parseFloat(displaySalePrice.replace(/[^0-9.]/g, "")) / parseFloat(displayRegularPrice.replace(/[^0-9.]/g, ""))) * 100)
    : 0;

  // Pairs state — starts as 1 pair = single-item mode (no bundle)
  const [pairs, setPairs] = useState<BundlePair[]>([
    {
      slug: product.slug,
      name: product.name,
      image: product.image as BundlePair["image"],
      databaseId: product.databaseId,
    },
  ]);
  const bundleActive = pairs.length >= 2;

  // Cart
  const { setCart, openCart, setLoading, setVariantImage } = useCartStore();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  /**
   * Unified add-to-cart: handles both single item and bundle.
   * Groups identical product IDs, calls addToCart once per unique product.
   */
  const handleAddToCart = async () => {
    setAddingToCart(true);
    setLoading(true);
    try {
      // Group pairs by (productId + variationId) → qty
      // This handles: multiple pairs of same product with different variations
      const grouped: Record<string, { productId: number; variationId?: number; qty: number }> = {};
      for (const p of pairs) {
        const varId = bundleActive ? p.variationId : selectedVariation?.databaseId;
        const key = `${p.databaseId}-${varId ?? ""}`;
        if (!grouped[key]) grouped[key] = { productId: p.databaseId, variationId: varId, qty: 0 };
        grouped[key].qty += 1;
      }

      // Build a map of variationId → best image URL to show in cart
      // Uses the pair's already-resolved image, or falls back to gallery first image
      const varImgMap: Record<number, string> = {};
      for (const p of pairs) {
        const varId = bundleActive ? p.variationId : selectedVariation?.databaseId;
        if (!varId) continue;
        if (varImgMap[varId]) continue; // already recorded
        // Bundle path: image was set when user picked a color
        if (bundleActive && p.image?.sourceUrl) {
          varImgMap[varId] = p.image.sourceUrl;
        } else {
          // Single-item path: use the currently displayed gallery first image
          const firstGallery = varGallery?.[0]?.sourceUrl ?? selectedVariation?.image?.sourceUrl ?? product.image?.sourceUrl;
          if (firstGallery) varImgMap[varId] = firstGallery;
        }
      }
      // Persist in store so CartDrawer can look them up
      for (const [varId, url] of Object.entries(varImgMap)) {
        setVariantImage(Number(varId), url);
      }

      let lastCart = null;
      for (const { productId, variationId, qty } of Object.values(grouped)) {
        lastCart = await addToCart(productId, qty, variationId);
      }

      // Use lastCart instead of re-fetching (addToCart already returns updated cart with syncBagCoupons)
      if (lastCart) setCart(lastCart);
      setAddedToCart(true);
      openCart();
      setTimeout(() => setAddedToCart(false), 3000);

      // Meta Pixel: AddToCart
      const priceNum = parseFloat((displayPrice ?? "0").replace(/[^0-9.]/g, "")) || 0;
      pixel.addToCart({
        contentId: selectedVariation?.databaseId ?? product.databaseId,
        contentName: product.name,
        value: priceNum * pairs.length,
      });

      // Google Ads: add_to_cart
      const cartValue = priceNum * pairs.length;
      gtag("event", "add_to_cart", {
        send_to: AW_ID,
        value: cartValue,
        currency: "USD",
        google_business_vertical: "retail",
        items: [{ id: String(selectedVariation?.databaseId ?? product.databaseId), google_business_vertical: "retail" }],
      });

      // GA4: add_to_cart
      gtag("event", "add_to_cart", {
        value: cartValue,
        currency: "USD",
        items: [{ item_id: String(product.databaseId), item_name: product.name, price: priceNum, quantity: pairs.length }],
      });

      // Klaviyo: Added to Cart (powers cart-abandonment flow)
      klTrack("Added to Cart", {
        ProductID: selectedVariation?.databaseId ?? product.databaseId,
        ProductName: product.name,
        Quantity: pairs.length,
        Price: priceNum,
        Value: cartValue,
        URL: typeof window !== "undefined" ? window.location.href : `/products/${product.slug}`,
        ImageURL: product.image?.sourceUrl ?? null,
      });

      // Vercel Web Analytics: funnel step
      track("Added to Cart", { product: product.name, value: cartValue });
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToCart(false);
      setLoading(false);
    }
  };

  const buttonPrice = bundleActive
    ? (() => {
        const b = BUNDLE_OPTIONS.find((o) => o.qty === pairs.length);
        if (!b) return formatPrice(displaySalePrice || displayPrice);
        const num = parseFloat((displayRegularPrice || displaySalePrice || displayPrice || "0").replace(/[^0-9.]/g, "")) || 0;
        const total = num * b.qty * (1 - b.savePct / 100);
        return `$${total.toFixed(0)}`;
      })()
    : formatPrice(displaySalePrice || displayPrice);

  const buttonLabel = bundleActive
    ? `Add ${pairs.length} Bags to Cart`
    : "Add to Cart";

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">


      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-6 lg:pb-10 pt-4 lg:pt-0">

        {/* Breadcrumb */}
        <p className="hidden lg:block py-3 text-sm text-black/50">
          <Link href="/" className="text-black/50 hover:text-black transition-colors">Home</Link>
          {" / "}
          <Link href="/shop" className="text-black/50 hover:text-black transition-colors">Shop</Link>
          {" / "}
          <span>{product.name}</span>
        </p>

        {/* Mobile: title + price above grid */}
        <div className="lg:hidden mb-3">
          <h1 className="font-heading text-xl font-semibold text-black mb-1">{product.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-semibold text-red-600">{formatPrice(displaySalePrice || displayPrice)}</span>
            {isOnSale && <span className="text-base line-through text-black/50 font-normal">{formatPrice(displayRegularPrice)}</span>}
            {savePct > 0 && (
              <span className="flex items-center gap-1 py-0.5 px-2 rounded-md text-white text-xs font-medium" style={{ backgroundColor: GREEN }}>
                Save {savePct}%
              </span>
            )}
          </div>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-10 items-start">

          {/* Social proof — mobile only, above gallery */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                  <img src={`/avatars/avatar-${i}.webp`} alt="avatar" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-[13px]" style={{ color: GREEN_DARK + "F2" }}>
              Purchased more than <strong>2,437,825+</strong> times.
            </p>
          </div>

          {/* LEFT — Gallery */}
          <Gallery images={finalImages} activeIdx={activeIdx} setActiveIdx={setActiveIdx} isCrossbodyBag={isCrossbodyBag} />

          {/* RIGHT — Info panel */}
          <div className="rounded-xl md:pb-4 pt-0 md:pt-5 md:px-3 lg:px-5 md:sticky md:top-[80px]" style={{ backgroundColor: BG }}>

            {/* Social proof — desktop only */}
            <div className="hidden lg:flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                    <img src={`/avatars/avatar-${i}.webp`} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[13px]" style={{ color: GREEN_DARK + "F2" }}>
                Purchased more than <strong>2,437,825+</strong> times.
              </p>
            </div>

            {/* Title + price — desktop */}
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
                  <div className="absolute -bottom-6 left-0 py-[2px] px-[5px] rounded-[6px] flex gap-1 items-center h-[23px]" style={{ backgroundColor: GREEN_DARK }}>
                    <span className="text-white text-[13px] font-medium whitespace-nowrap">Save {savePct}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stars */}
            <button className="flex items-center gap-2 mb-3 mt-4">
              <span className="text-[#F9BC4B] text-base flex gap-0.5">★★★★★</span>
              <span className="font-semibold text-base" style={{ color: GREEN_DARK }}>Excellent 5.0</span>
              <span className="text-neutral-300">|</span>
              <span className="font-semibold text-base underline" style={{ color: GREEN_DARK }}>18,347+ Reviews</span>
            </button>

            {/* Selling Out Fast */}
            <SellingOutFast />

            {/* Bullet points */}
            <div className="flex flex-col gap-1.5 mb-4">
              {["Premium full-grain leather", "Free & fast shipping", "Adjustable crossbody strap"].map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="font-bold" style={{ color: GREEN }}>✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {/* Color variant swatches (sibling products) */}
            {!bundleActive && (
              <ColorVariantSwatches variants={sortedColorVariants} currentSlug={product.slug} />
            )}

            {/* WooCommerce native variant attributes (color, size, etc.) */}
            {!bundleActive && Object.entries(attributeMap).map(([attrName, values]) => {
              // Strip WooCommerce "pa_" prefix for display (pa_color → Color)
              const displayName = attrName.replace(/^pa_/i, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
              <div key={attrName} className="mb-4">
                <p className="text-sm font-medium mb-2.5" style={{ color: GREEN_DARK }}>
                  {displayName}: <span className="font-normal text-neutral-500">{selectedAttrs[attrName]}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {values.map((val) => {
                    const varImg = variations.find((v) =>
                      v.attributes.nodes.some((a) => a.name === attrName && a.value === val)
                    )?.image;
                    const isSelected = selectedAttrs[attrName] === val;
                    if (varImg) {
                      return (
                        <button key={val} onClick={() => setSelectedAttrs((p) => ({ ...p, [attrName]: val }))} title={val}
                          className={`relative w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? "border-[#538125]" : "border-neutral-200 hover:border-[#538125]"}`}
                        >
                          <Image src={varImg.sourceUrl} alt={val} fill className="object-cover" sizes="72px" />
                        </button>
                      );
                    }
                    return (
                      <button key={val} onClick={() => setSelectedAttrs((p) => ({ ...p, [attrName]: val }))}
                        className={`px-4 py-2 min-w-[3rem] rounded-md border text-sm font-medium transition-colors ${isSelected ? "border-[#538125] bg-[#edf3e6] text-[#538125]" : "border-neutral-200 bg-white text-black hover:border-neutral-400"}`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })}

            {/* Bundle selector — ABOVE the Add to Cart button */}
            <BundleSelector
              product={product}
              colorVariants={sortedColorVariants}
              wcVariations={variations}
              salePrice={displaySalePrice || displayPrice}
              regularPrice={displayRegularPrice || displaySalePrice || displayPrice}
              pairs={pairs}
              setPairs={setPairs}
              defaultVariation={selectedVariation ?? null}
            />

            {/* Stock status */}
            {product.stockStatus === "OUT_OF_STOCK" && (
              <p className="text-sm text-red-500 mb-4">Currently out of stock</p>
            )}

            {/* ── SINGLE ADD TO CART BUTTON (green, like Hydrogen) ── */}
            <button
              onClick={handleAddToCart}
              disabled={product.stockStatus === "OUT_OF_STOCK" || addingToCart}
              className="w-full text-white rounded-[10px] py-4 px-4 sm:px-6 flex items-center justify-center gap-3 sm:gap-5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
              style={{ backgroundColor: GREEN }}
              onMouseEnter={(e) => !addingToCart && (e.currentTarget.style.backgroundColor = "#4d7a22")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GREEN)}
            >
              {addingToCart ? (
                <Loader2 size={20} className="animate-spin" />
              ) : addedToCart ? (
                <span className="text-sm sm:text-base font-extrabold uppercase tracking-tight">✓ Added to Cart!</span>
              ) : (
                <>
                  <span className="text-sm sm:text-base lg:text-lg font-extrabold uppercase tracking-tight">
                    {buttonLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    {!bundleActive && (
                    <div className="bg-white/10 px-3 sm:px-4 py-1.5 rounded-full flex gap-2 sm:gap-3 border border-white/10">
                      {isOnSale && displayRegularPrice && (
                        <span className="text-white/60 font-medium line-through text-xs sm:text-sm">{formatPrice(displayRegularPrice)}</span>
                      )}
                      <span className="font-light text-white text-xs sm:text-sm">{buttonPrice}</span>
                    </div>
                    )}
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M3.6 12a.9.9 0 01.9-.9h12.77l-4.99-4.75a.9.9 0 011.24-1.3l6.6 6.3a.9.9 0 010 1.3l-6.6 6.3a.9.9 0 01-1.24-1.3l4.99-4.75H4.5a.9.9 0 01-.9-.9z" fill="white" />
                    </svg>
                  </div>
                </>
              )}
            </button>

            {/* Shipping strip */}
            <ShippingStrip />

            {/* Customer marquee */}
            <CustomerMarquee />

          </div>
        </div>
      </div>

      {/* Why Noir & Blanc section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Lifestyle image — hidden on mobile */}
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] w-full hidden md:block">
            <img
              src="/ugc/ugc-2.webp"
              alt="Noir & Blanc lifestyle"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white rounded-xl px-4 py-3 shadow-md flex items-center gap-2">
              <span className="text-2xl font-bold text-neutral-900 leading-none">4.9</span>
              <div className="flex flex-col">
                <span className="text-yellow-400 text-base leading-none">★★★★★</span>
                <span className="text-xs text-neutral-500 mt-0.5">Rated Excellent</span>
              </div>
            </div>
          </div>

          {/* Accordions */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: GREEN }}>BUILT DIFFERENT</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Why Noir &amp; Blanc?</h2>
            <p className="text-neutral-500 text-sm mb-6">Everything you need to know before you buy.</p>
            <Accordion items={[
              ...(product.description ? [{
                title: "Description",
                content: <div dangerouslySetInnerHTML={{ __html: product.description }} className="prose prose-sm max-w-none" />,
              }] : []),
              ...(product.shortDescription ? [{
                title: "Size & Fit",
                content: <div dangerouslySetInnerHTML={{ __html: product.shortDescription }} className="prose prose-sm max-w-none" />,
              }] : []),
              {
                title: "Delivery",
                content: <>We offer <strong>free standard shipping</strong> on all orders. Orders are processed within 1–2 business days and typically arrive within 5–8 business days.</>,
              },
              {
                title: "30-Day Return Policy",
                content: "Every Noir & Blanc bag is backed by our 30-day guarantee. If you're not completely in love with your purchase, simply reach out — we'll arrange a free replacement or refund, no questions asked.",
              },
              {
                title: "365-Day Guarantee",
                content: "At Noir & Blanc, we stand behind the craftsmanship of every piece. All products are covered by our 365-day warranty — if anything goes wrong, we'll make it right with a replacement or full refund.",
              },
            ]} />
          </div>
        </div>
      </div>

      {/* UGC video strip */}
      <UGCStrip />

      {/* Reviews */}
      <ReviewsSection reviews={reviews} />

      {/* Related products */}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
