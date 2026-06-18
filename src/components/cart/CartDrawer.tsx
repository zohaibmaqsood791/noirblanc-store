"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { fetchCart, updateCartItem, removeFromCart, addToCart, fetchUpsellProducts } from "@/lib/cart";
import * as pixel from "@/lib/pixel";
import { gtag, pushDataLayer, AW_ID } from "@/components/GoogleTag";
import type { UpsellProduct } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

const GREEN      = "#538125";
const OLIVE_DARK = "#343F20";

function parseNum(s?: string | null) {
  return parseFloat((s ?? "0").replace(/[^0-9.]/g, "")) || 0;
}

/* ── inline SVGs ──────────────────────────────────────────────────────────── */
function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M12 4.7125C12 4.8185 11.9375 4.934 11.8125 5.059L9.1945 7.6115L9.8145 11.2175C9.8195 11.251 9.822 11.2995 9.822 11.362C9.82487 11.4531 9.7984 11.5426 9.7465 11.6175C9.72151 11.652 9.68829 11.6797 9.64986 11.698C9.61143 11.7163 9.56902 11.7248 9.5265 11.7225C9.435 11.7225 9.339 11.6935 9.238 11.6355L6 9.9345L2.762 11.6365C2.656 11.694 2.56 11.723 2.4735 11.723C2.3725 11.723 2.297 11.688 2.2465 11.618C2.19442 11.5432 2.16778 11.4536 2.1705 11.3625C2.1705 11.3335 2.1755 11.2855 2.1855 11.218L2.8055 7.6125L0.1805 5.0595C0.06 4.929 0 4.814 0 4.7125C0 4.535 0.135 4.424 0.404 4.381L4.024 3.8545L5.6465 0.573496C5.738 0.375996 5.8555 0.277496 6 0.277496C6.1445 0.277496 6.262 0.375996 6.3535 0.573496L7.976 3.8545L11.596 4.381C11.8655 4.424 12 4.535 12 4.7125Z" fill="#EBBF20"/>
    </svg>
  );
}

/* ── CART LINE ITEM ───────────────────────────────────────────────────────── */
function CartLineItem({
  item,
  variantImages,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  variantImages: Record<number, string>;
  onQtyChange: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
}) {
  const { product, variation, quantity, total } = item;
  const attrs = variation?.node.attributes.nodes ?? [];

  const varId = variation?.node?.databaseId;
  const storedUrl = varId ? variantImages[varId] : undefined;
  const imgSrc = storedUrl ?? variation?.node.image?.sourceUrl ?? product.node.image?.sourceUrl;
  const imgAlt = variation?.node.image?.altText || product.node.image?.altText || product.node.name;

  // Use sale price (current price before coupon) as base so Save reflects coupon discount only
  const basePriceStr = variation?.node.salePrice ?? variation?.node.price ?? product.node.salePrice ?? product.node.price;
  const regNum = parseNum(basePriceStr) * quantity;
  const totalNum = parseNum(total);
  const hasSale = regNum > totalNum + 0.01;
  const savePct = hasSale && regNum > 0 ? Math.round((1 - totalNum / regNum) * 100) : 0;

  const attrDisplay = attrs.map((a) => ({
    label: a.value,
    name: a.name.replace(/^pa_/i, ""),
  }));

  return (
    <div className="flex items-start flex-row gap-3 sm:gap-4 self-stretch p-2 sm:p-4 rounded-2xl border border-[#F3F4F6] bg-white">
      {/* Image */}
      <figure className="relative rounded-[14px] border border-[#F3F4F6] bg-[#F9FAFB] flex-shrink-0 w-[100px] sm:w-[118px]">
        <Link href={`/products/${product.node.slug}`}>
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={imgAlt}
              width={118}
              height={118}
              className="w-[100px] sm:w-[118px] h-[100px] sm:h-[118px] object-contain object-center rounded-[14px]"
            />
          ) : (
            <div className="w-[100px] sm:w-[118px] h-[100px] sm:h-[118px] bg-neutral-100 rounded-[14px]" />
          )}
        </Link>
        {/* SAVE badge — top-left */}
        {savePct > 0 && (
          <div className="absolute top-2 left-2 inline-flex justify-center items-center gap-1 rounded-[10px] bg-[#538125] shadow py-1 px-2">
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
              <path d="M1 6.2V2.5C1 1.67 1.67 1 2.5 1H6.2L11 5.8V9.5C11 10.33 10.33 11 9.5 11H5.8L1 6.2Z" stroke="white" strokeWidth="1.1"/>
              <circle cx="3.2" cy="3.2" r="0.6" fill="white"/>
            </svg>
            <span className="text-white font-bold text-[11px] leading-4 uppercase whitespace-nowrap">
              Save {savePct}%
            </span>
          </div>
        )}
      </figure>

      {/* Info */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Name + delete */}
        <div className="flex flex-row gap-1.5 justify-between max-w-full">
          <Link href={`/products/${product.node.slug}`}
            className="block text-[#1E2939] font-semibold text-sm sm:text-base leading-5 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
            {product.node.name}
          </Link>
          <button type="button" onClick={() => onRemove(item.key)} className="w-4 h-5 flex-shrink-0" title="Remove from cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12.667 4V13.333C12.667 14 12 14.667 11.333 14.667H4.667C4 14.667 3.333 14 3.333 13.333V4" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.333 4V2.667C5.333 2 6 1.333 6.667 1.333H9.333C10 1.333 10.667 2 10.667 2.667V4" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.667 7.333V11.333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.333 7.333V11.333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Variant pills */}
        {attrDisplay.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {attrDisplay.map((attr, i) => (
              <div key={attr.name} className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-[#F1F3F5] text-[#4E5B66] rounded-[4px] text-[11px] sm:text-xs font-normal leading-none capitalize">
                  {attr.label}
                </span>
                {i < attrDisplay.length - 1 && <span className="text-[#D1D5DB] text-[10px]">•</span>}
              </div>
            ))}
          </div>
        )}

        {/* Discount label */}
        {hasSale && (
          <div className="mt-1">
            <p className="text-[#538125] font-semibold text-[12px] leading-5 bg-[linear-gradient(90deg,rgba(83,129,37,0.10)_0%,rgba(0,0,0,0.00)_100%)] px-2 py-0.5 w-fit rounded-[10px] flex items-center gap-1">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <path d="M8.39 1.724A1.333 1.333 0 007.448 1.333H2.667a1.333 1.333 0 00-1.334 1.334V7.448a1.333 1.333 0 00.39.943l5.803 5.802a1.333 1.333 0 001.885 0l4.387-4.387a1.333 1.333 0 000-1.885L8.39 1.724z" stroke="#538125" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5" cy="5" r="0.5" fill="#538125" stroke="#538125" strokeWidth="1.2"/>
              </svg>
              Save ${(regNum - totalNum).toFixed(2)}
            </p>
          </div>
        )}

        {/* Qty + price */}
        <div className="mt-1 flex items-center justify-between self-stretch w-full">
          <div className="flex items-center rounded-[11px] sm:rounded-[14px] border border-[#E5E7EB] bg-transparent">
            <button type="button" disabled={quantity <= 1}
              onClick={() => onQtyChange(item.key, quantity - 1)}
              className="flex flex-col items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-1 sm:p-2 disabled:opacity-40">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-3 sm:w-4 h-3 sm:h-4">
                <path d="M1.6 8H14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="w-6 sm:w-10 text-[#1E2939] text-center font-bold text-sm sm:text-base leading-6">
              {quantity}
            </span>
            <button type="button" onClick={() => onQtyChange(item.key, quantity + 1)}
              className="flex flex-col items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-1 sm:p-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-3 sm:w-4 h-3 sm:h-4">
                <path d="M1.6 8H14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 1.6V14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="text-right flex flex-col">
            {hasSale && (
              <div className="text-[#99A1AF] text-right font-normal text-xs sm:text-sm leading-5 line-through">
                ${regNum.toFixed(2)}
              </div>
            )}
            <div className="text-[#101828] text-right font-bold text-base sm:text-[20px] leading-7">
              {formatPrice(total)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── UPSELL ───────────────────────────────────────────────────────────────── */
function UpsellCard({ product, onAdded }: { product: UpsellProduct; onAdded: () => void }) {
  const [adding, setAdding] = useState(false);
  const { setCart } = useCartStore();

  const rawPrice = parseNum(product.price);
  const rawReg   = parseNum(product.regularPrice);
  const hasSale  = rawReg > rawPrice + 0.01;
  const savePct  = hasSale && rawReg > 0 ? Math.round((1 - rawPrice / rawReg) * 100) : 0;

  const handleAdd = async () => {
    setAdding(true);
    const cart = await addToCart(
      parseInt(product.id.replace(/\D/g, ""), 10),
      1,
      product.firstVariationId ?? undefined
    );
    if (cart) setCart(cart);
    setAdding(false);
    onAdded();
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-[14px] border border-[#E5E7EB] bg-white">
      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
        <div className="w-[68px] h-[68px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB]">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image.sourceUrl} alt={product.image.altText || product.name}
              className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <p className="text-[#1E2939] font-semibold text-xs leading-tight line-clamp-2 mb-1">{product.name}</p>
        </Link>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#101828] font-bold text-sm">{formatPrice(product.price)}</span>
          {hasSale && <span className="text-[#99A1AF] line-through text-xs">{formatPrice(product.regularPrice)}</span>}
          {savePct > 0 && (
            <span className="bg-[#538125]/10 text-[#538125] font-semibold text-[10px] px-1.5 py-0.5 rounded">
              Save {savePct}%
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={adding}
        className="flex-shrink-0 flex items-center justify-center gap-1 border border-[#538125] bg-white text-[#538125] rounded-[10px] py-2 px-3 text-xs font-semibold hover:bg-[#f0f7e8] transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {adding ? (
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#538125" strokeWidth="3"/>
            <path className="opacity-75" fill="#538125" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3.333 8H12.667M8 3.333V12.667" stroke="#538125" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
        ADD
      </button>
    </div>
  );
}

function CartUpsell({ items, onAdded }: { items: CartItem[]; onAdded: () => void }) {
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const hasLuma = items.some((item) => {
    const slug  = item.product?.node?.slug ?? "";
    const title = (item.product?.node?.name ?? "").toLowerCase();
    return slug.includes("luma-crossbody") || title.includes("luma crossbody");
  });

  useEffect(() => {
    setLoading(true);
    const query = hasLuma ? "strap" : "Luma Crossbody Bag";
    fetchUpsellProducts(query).then((p) => { setProducts(hasLuma ? p : p.slice(0, 3)); setLoading(false); });
  }, [hasLuma]);

  if (loading) return <div className="px-2 sm:px-6 py-3 text-xs text-neutral-400">Loading suggestions…</div>;
  if (!products.length) return null;

  return (
    <div className="px-2 sm:px-6 py-4 flex flex-col gap-3">
      <h3 className="text-[#1E2939] font-bold text-base flex items-center gap-2">
        {hasLuma ? "🎀 Complete your look:" : "💚 Customers also love:"}
      </h3>
      <div className={hasLuma ? "flex flex-col gap-2 max-h-64 overflow-y-auto pr-1" : "flex flex-col gap-2"}>
        {products.map((p) => <UpsellCard key={p.id} product={p} onAdded={onAdded} />)}
      </div>
    </div>
  );
}

/* ── EMPTY STATE ──────────────────────────────────────────────────────────── */
function CartEmpty({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center h-full">
      <div className="text-5xl mb-4">🛍️</div>
      <h3 className="font-heading text-lg font-semibold text-neutral-900 mb-2">Your cart is empty</h3>
      <p className="text-neutral-500 text-sm mb-6">Add some items to get started!</p>
      <Link href="/shop" onClick={onClose}
        className="inline-block text-white font-semibold text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: GREEN }}>
        Continue Shopping →
      </Link>
    </div>
  );
}

/* ── PAYMENT LOGOS ────────────────────────────────────────────────────────── */
const PAYMENT_LOGOS = [
  { alt: "American Express", src: "/payment-logos/amex.svg" },
  { alt: "Diners",           src: "/payment-logos/diners.svg" },
  { alt: "Apple Pay",        src: "/payment-logos/apple-pay.svg" },
  { alt: "Discover",         src: "/payment-logos/discover.svg" },
  { alt: "Google Pay",       src: "/payment-logos/google-pay.svg" },
  { alt: "Maestro",          src: "/payment-logos/maestro.svg" },
  { alt: "Mastercard",       src: "/payment-logos/mastercard.svg" },
  { alt: "PayPal",           src: "/payment-logos/paypal.svg" },
  { alt: "ShopPay",          src: "/payment-logos/shoppay.svg" },
  { alt: "Visa",             src: "/payment-logos/visa.svg" },
];

/* ── MAIN DRAWER ──────────────────────────────────────────────────────────── */
export default function CartDrawer() {
  const { cart, isOpen, closeCart, setCart, variantImages } = useCartStore();
  const items = cart?.contents?.nodes ?? [];
  const itemCount = cart?.contents?.itemCount ?? 0;
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !cart) {
      fetchCart().then((c) => { if (c) setCart(c); });
    }
  }, [isOpen]);

  const handleQtyChange = async (key: string, qty: number) => {
    if (qty < 1) return handleRemove(key);
    setUpdating(key);
    await updateCartItem(key, qty);
    const full = await fetchCart();
    if (full) setCart(full);
    setUpdating(null);
  };

  const handleRemove = async (key: string) => {
    setUpdating(key);
    await removeFromCart([key]);
    const full = await fetchCart();
    if (full) setCart(full);
    setUpdating(null);
  };

  const subtotalNum = parseNum(cart?.subtotal);
  const totalNum    = parseNum(cart?.total);
  const discountNum = Math.max(0, subtotalNum - totalNum);
  const hasDiscount = discountNum > 0.01;
  const shippingNum = parseNum(cart?.shippingTotal);
  const isFreeShip  = shippingNum === 0;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        {/* Backdrop */}
        <Transition.Child as={Fragment}
          enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full overflow-hidden">
              <Transition.Child as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto overflow-hidden lg:rounded-tl-md lg:rounded-bl-md w-screen sm:w-[480px] lg:w-[600px] h-full">
                  <div className="bg-white flex flex-col h-full">

                    {/* ── Header ── */}
                    <div className="shrink-0">
                      <div className="flex items-center justify-between py-3 px-4 sm:px-6 bg-white border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-4 sm:gap-5">
                          <div className="relative flex items-center justify-center">
                            {/* Cart icon */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8">
                              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                              <line x1="3" y1="6" x2="21" y2="6"/>
                              <path d="M16 10a4 4 0 01-8 0"/>
                            </svg>
                            {itemCount > 0 && (
                              <div className="absolute -top-2 -right-2 flex w-5 h-5 justify-center items-center bg-[#538125] rounded-full text-white font-bold text-[12px] leading-4">
                                {itemCount}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Dialog.Title className="text-[#101828] font-bold text-lg sm:text-xl leading-8">
                              Your Cart
                            </Dialog.Title>
                            <p className="text-[#6A7282] font-normal text-xs leading-4">
                              {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                            </p>
                          </div>
                        </div>
                        <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer group" aria-label="Close cart">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#0B1521] opacity-70 group-hover:opacity-100">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                      {items.length === 0 ? (
                        <CartEmpty onClose={closeCart} />
                      ) : (
                        <div className="relative flex flex-col gap-4 pt-5">

                          {/* Free shipping banner */}
                          <div className="px-2 sm:px-6">
                            <div className="w-full rounded-[10px] py-2 px-4 text-xs sm:text-[13px] leading-[18px] font-medium flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#EAEEE3", color: "#2B4C18" }}>
                              <div className="w-6 h-6 rounded-full bg-[#538125] flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                                  <rect x="0.5" y="3" width="8" height="6" rx="0.7" stroke="white" strokeWidth="1.1"/>
                                  <path d="M8.5 6h2.8l2 2.2V11H8.5V6z" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
                                  <circle cx="3.2" cy="11" r="1.2" fill="white"/>
                                  <circle cx="11" cy="11" r="1.2" fill="white"/>
                                </svg>
                              </div>
                              <p className="text-[#273C17] text-[13px] font-normal leading-relaxed">
                                <strong className="font-semibold">FREE Shipping </strong>included
                              </p>
                            </div>
                          </div>

                          {/* Line items */}
                          <div className="flex flex-col px-2 sm:px-6 gap-2">
                            {items.map((item) => (
                              <div key={item.key} className={`transition-opacity ${updating === item.key ? "opacity-50 pointer-events-none" : ""}`}>
                                <CartLineItem
                                  item={item}
                                  variantImages={variantImages ?? {}}
                                  onQtyChange={handleQtyChange}
                                  onRemove={handleRemove}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Smart upsell section */}
                          <CartUpsell items={items} onAdded={async () => {
                            const full = await fetchCart();
                            if (full) setCart(full);
                          }} />

                        </div>
                      )}
                    </div>

                    {/* ── Footer ── */}
                    {items.length > 0 && (
                      <div className="shrink-0">
                        <div className="flex flex-col items-start gap-2.5 px-4 sm:px-6 py-4 bg-white border-t-2 border-[#E5E7EB] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">

                          {/* Subtotal */}
                          <div className="flex justify-between items-center w-full">
                            <p className="text-[#4A5565] font-medium text-[14px] leading-5">
                              Subtotal ({itemCount} {itemCount === 1 ? "Item" : "Items"}):
                            </p>
                            <p className="text-[#1E2939] font-semibold text-[14px] leading-5">
                              {formatPrice(cart?.subtotal)}
                            </p>
                          </div>

                          {/* Olive summary box — discounts + shipping */}
                          {(hasDiscount || isFreeShip) && (
                            <div className="flex flex-col gap-3 rounded-[10px] bg-[#EAEEE3] overflow-hidden px-3 py-2.5 w-full">
                              {hasDiscount && (
                                <div className="flex items-center justify-between self-stretch">
                                  <div className="flex items-center gap-1 text-[#343F20]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                      <path d="M8.39 1.724A1.333 1.333 0 007.448 1.333H2.667a1.333 1.333 0 00-1.334 1.334V7.448a1.333 1.333 0 00.39.943l5.803 5.802a1.333 1.333 0 001.885 0l4.387-4.387a1.333 1.333 0 000-1.885L8.39 1.724z" stroke="#343F20" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                                      <circle cx="5" cy="5" r="0.5" fill="#343F20" stroke="#343F20" strokeWidth="1.33"/>
                                    </svg>
                                    <span className="font-medium text-[14px] leading-5">Item Discounts:</span>
                                  </div>
                                  <p className="font-bold text-[14px] leading-5 text-[#343F20]">-${discountNum.toFixed(2)}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between self-stretch">
                                <div className="flex items-center gap-1 text-[#343F20]">
                                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                                    <rect x="0.7" y="4" width="9" height="7" rx="0.8" stroke="#343F20" strokeWidth="1.2"/>
                                    <path d="M9.7 7h3.2l2.3 2.5V13H9.7V7z" stroke="#343F20" strokeWidth="1.2" strokeLinejoin="round"/>
                                    <circle cx="3.7" cy="13" r="1.4" fill="#343F20"/>
                                    <circle cx="12.5" cy="13" r="1.4" fill="#343F20"/>
                                  </svg>
                                  <span className="font-medium text-[14px] leading-5">SHIPPING:</span>
                                </div>
                                <p className="font-bold text-[14px] leading-5 uppercase text-[#343F20]">
                                  {isFreeShip ? "FREE" : formatPrice(cart?.shippingTotal)}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-2.5 mt-1 w-full">
                            <p className="text-[#101828] font-bold text-base sm:text-[20px] leading-7">Total:</p>
                            <p className="text-[#101828] text-right font-bold text-base sm:text-[25px] leading-9">
                              {formatPrice(cart?.total)}
                            </p>
                          </div>

                          {/* Checkout button — gradient */}
                          <div className="flex flex-col gap-2 w-full items-center justify-between">
                            <Link href="/checkout" onClick={() => {
                                pixel.initiateCheckout({ value: totalNum, numItems: itemCount });
                                // Google Ads + GA4: begin_checkout
                                gtag("event", "begin_checkout", {
                                  send_to: AW_ID,
                                  value: totalNum,
                                  currency: "USD",
                                  google_business_vertical: "retail",
                                });
                                pushDataLayer({ event: "begin_checkout", value: totalNum, currency: "USD" });
                                closeCart();
                              }}
                              className="flex justify-center items-center gap-3 w-full rounded-[8px] sm:rounded-[14px] border-0 text-white text-center font-bold text-sm sm:text-[18px] leading-7 uppercase py-3 sm:py-3 px-3 sm:px-6 min-h-[47px] transition-opacity hover:opacity-90"
                              style={{ background: `linear-gradient(90deg,#538125 0%,#558326 8%,#578626 15%,#588827 23%,#5A8B28 31%,#5C8D28 38%,#5E9029 46%,#60922A 54%,#62952B 62%,#64972B 69%,#659A2C 77%,#679C2D 85%,#699E2D 92%,#6BA12E 100%)` }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M15.833 9.167H4.167A1.667 1.667 0 002.5 10.833v5.834A1.667 1.667 0 004.167 18.333h11.666A1.667 1.667 0 0017.5 16.667v-5.834a1.667 1.667 0 00-1.667-1.666z" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5.833 9.167V5.833a4.167 4.167 0 018.334 0v3.334" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Checkout
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M3.75 9H14.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 3.75L14.25 9L9 14.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Link>

                            {/* Payment logos — bare, no card borders */}
                            <div className="flex flex-wrap gap-2.5 justify-center items-center">
                              {PAYMENT_LOGOS.map((logo) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={logo.alt} src={logo.src} alt={logo.alt} width={38} height={24}
                                  className="object-contain object-center max-h-5 w-auto" />
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
