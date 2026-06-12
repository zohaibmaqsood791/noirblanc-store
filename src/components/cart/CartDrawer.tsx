"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { fetchCart, updateCartItem, removeFromCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

/* ─── ICONS ──────────────────────────────────────────────────────────────── */
function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4H14" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.667 4V13.333C12.667 14 12 14.667 11.333 14.667H4.667C4 14.667 3.333 14 3.333 13.333V4" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.333 4V2.667C5.333 2 6 1.333 6.667 1.333H9.333C10 1.333 10.667 2 10.667 2.667V4" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.667 7.333V11.333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.333 7.333V11.333" stroke="#99A1AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconMinus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.6 8H14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.6 8H14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 1.6V14.4" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── CART LINE ITEM ─────────────────────────────────────────────────────── */
function CartLineItem({
  item,
  onQtyChange,
  onRemove,
  closing,
}: {
  item: CartItem;
  onQtyChange: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  closing: boolean;
}) {
  const { product, variation, quantity, total } = item;
  const attrs = variation?.node.attributes.nodes ?? [];

  return (
    <li className="list-none">
      <div className="flex flex-row gap-4 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-[#F3F4F6] bg-white">

        {/* Image */}
        <Link
          href={`/products/${product.node.slug}`}
          onClick={closing ? undefined : undefined}
          className="flex-shrink-0"
        >
          <div className="w-[100px] h-[100px] sm:w-[118px] sm:h-[118px] overflow-hidden rounded-[14px] border border-[#F3F4F6] bg-[#F9FAFB]">
            {product.node.image ? (
              <Image
                src={product.node.image.sourceUrl}
                alt={product.node.image.altText || product.node.name}
                width={118}
                height={118}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100" />
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Name + delete */}
          <div className="flex justify-between items-start gap-2">
            <Link
              href={`/products/${product.node.slug}`}
              className="text-[#1E2939] font-semibold text-sm leading-tight truncate"
            >
              {product.node.name}
            </Link>
            <button
              onClick={() => onRemove(item.key)}
              title="Remove from cart"
              className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
            >
              <IconTrash />
            </button>
          </div>

          {/* Variant pills */}
          {attrs.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {attrs.map((attr, i) => (
                <div key={attr.name} className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#F1F3F5] text-[#4E5B66] rounded text-[11px]">
                    {attr.value}
                  </span>
                  {i < attrs.length - 1 && (
                    <span className="text-[#D1D5DB] text-xs">•</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Qty stepper + price */}
          <div className="flex items-center justify-between mt-1">
            {/* Stepper */}
            <div className="flex items-center rounded-[11px] border border-[#E5E7EB] bg-transparent">
              <button
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => onQtyChange(item.key, quantity - 1)}
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-1 disabled:opacity-40"
              >
                <IconMinus />
              </button>
              <span className="w-6 sm:w-10 text-[#1E2939] text-center font-bold text-sm">
                {quantity}
              </span>
              <button
                aria-label="Increase quantity"
                onClick={() => onQtyChange(item.key, quantity + 1)}
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 p-1"
              >
                <IconPlus />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-[#101828] font-bold text-base sm:text-lg leading-tight">
                {formatPrice(total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ─── UPSELL PRODUCT ─────────────────────────────────────────────────────── */
function UpsellProduct({ product }: { product: { id: string; name: string; slug: string; price: string; image: { sourceUrl: string; altText: string } | null } }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-[14px] border border-[#E5E7EB] bg-white">
      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
        <div className="w-[68px] h-[68px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB]">
          {product.image ? (
            <Image src={product.image.sourceUrl} alt={product.image.altText || product.name} width={68} height={68} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-100" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <p className="text-[#1E2939] font-semibold text-xs leading-tight line-clamp-2 mb-1">{product.name}</p>
        </Link>
        <span className="text-[#101828] font-bold text-sm">{formatPrice(product.price)}</span>
      </div>
      <button className="flex-shrink-0 flex items-center justify-center gap-1 border border-black bg-white text-black rounded-[10px] py-2 px-3 text-xs font-semibold hover:bg-neutral-50 transition-colors whitespace-nowrap">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3.333 8H12.667M8 3.333V12.667" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        ADD
      </button>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────────────────── */
function CartEmpty({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center h-full">
      <div className="text-5xl mb-4">🛍️</div>
      <h3 className="font-heading text-lg font-semibold text-neutral-900 mb-2">Your cart is empty</h3>
      <p className="text-neutral-500 text-sm mb-6">Add some items to get started!</p>
      <Link
        href="/shop"
        onClick={onClose}
        className="inline-block bg-black text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
      >
        Continue Shopping →
      </Link>
    </div>
  );
}

/* ─── PAYMENT BADGES ─────────────────────────────────────────────────────── */
const PAYMENT_METHODS = ["VISA", "MC", "AMEX", "PAYPAL", "SHOP", "GPAY", "APAY", "DISC"];

/* ─── MAIN DRAWER ────────────────────────────────────────────────────────── */
export default function CartDrawer() {
  const { cart, isOpen, closeCart, setCart } = useCartStore();
  const items = cart?.contents?.nodes ?? [];
  const itemCount = cart?.contents?.itemCount ?? 0;
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch cart on first open
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

  // Calculate discount
  const subtotalNum = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
  const totalNum = parseFloat((cart?.total ?? "0").replace(/[^0-9.]/g, ""));
  const discountNum = Math.max(0, subtotalNum - totalNum);
  const hasDiscount = discountNum > 0.01;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0" leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex flex-col h-full" style={{ backgroundColor: "#f8faf8" }}>

                    {/* ── Header ── */}
                    <div className="flex-shrink-0 flex items-center justify-between py-3 px-6 bg-white border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                          {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-black rounded-full text-white font-bold text-[11px] leading-none">
                              {itemCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <Dialog.Title className="font-heading text-[#101828] font-bold text-lg leading-tight">
                            Your Cart
                          </Dialog.Title>
                          <p className="text-[#6A7282] text-xs">{itemCount} {itemCount === 1 ? "item" : "items"} in cart</p>
                        </div>
                      </div>
                      <button
                        onClick={closeCart}
                        className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        aria-label="Close cart"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M15 5L5 15M5 5L15 15" stroke="#0B1521" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                      {items.length === 0 ? (
                        <CartEmpty onClose={closeCart} />
                      ) : (
                        <div className="flex flex-col gap-4 pt-5">
                          {/* Line items */}
                          <ul className="flex flex-col px-2 sm:px-6 gap-3">
                            {items.map((item) => (
                              <div key={item.key} className={`transition-opacity ${updating === item.key ? "opacity-50 pointer-events-none" : ""}`}>
                                <CartLineItem
                                  item={item}
                                  onQtyChange={handleQtyChange}
                                  onRemove={handleRemove}
                                  closing={false}
                                />
                              </div>
                            ))}
                          </ul>

                          {/* Upsell section */}
                          <div className="px-3 sm:px-6 py-4 flex flex-col gap-3">
                            <h3 className="text-[#1E2939] font-bold text-base">
                              🎀 Complete your look:
                            </h3>
                            <p className="text-xs text-neutral-400">Connect products to enable upsell suggestions.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Footer / Summary ── */}
                    {items.length > 0 && (
                      <div
                        className="flex-shrink-0 flex flex-col gap-2.5 px-4 sm:px-6 py-4 border-t-2 border-[#E5E7EB]"
                        style={{ backgroundColor: "#f8faf8", boxShadow: "0 -8px 30px -4px rgba(0,0,0,0.12)" }}
                      >
                        {/* Subtotal */}
                        <div className="flex justify-between items-center">
                          <p className="text-[#4A5565] font-medium text-sm">
                            Subtotal ({itemCount} {itemCount === 1 ? "Item" : "Items"}):
                          </p>
                          <p className="text-[#1E2939] font-semibold text-sm">
                            {formatPrice(cart?.subtotal)}
                          </p>
                        </div>

                        {/* Discount row */}
                        {hasDiscount && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-neutral-100">
                            <div className="flex items-center gap-1.5 text-neutral-700">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8.39 1.724A1.333 1.333 0 007.448 1.333H2.667a1.333 1.333 0 00-1.334 1.334V7.448a1.333 1.333 0 00.39.943l5.803 5.802a1.333 1.333 0 001.885 0l4.387-4.387a1.333 1.333 0 000-1.885L8.39 1.724z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="5" cy="5" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.33"/>
                              </svg>
                              <span className="font-medium text-sm">Item Discounts:</span>
                            </div>
                            <p className="font-bold text-sm">-${discountNum.toFixed(2)}</p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-2.5 mt-0.5">
                          <p className="text-[#101828] font-bold text-base sm:text-lg">Total:</p>
                          <p className="text-[#101828] font-bold text-lg sm:text-2xl">
                            {formatPrice(cart?.total)}
                          </p>
                        </div>

                        {/* Checkout button */}
                        <Link
                          href="/checkout"
                          onClick={closeCart}
                          className="flex items-center justify-center gap-3 w-full min-h-[48px] rounded-[10px] text-white font-bold text-sm sm:text-base uppercase tracking-wide py-3 px-6 transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(90deg,#0a0a0a 0%,#2a2a2a 50%,#0a0a0a 100%)" }}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M15.833 9.167H4.167A1.667 1.667 0 002.5 10.833v5.834A1.667 1.667 0 004.167 18.333h11.666A1.667 1.667 0 0017.5 16.667v-5.834a1.667 1.667 0 00-1.667-1.666z" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5.833 9.167V5.833a4.167 4.167 0 018.334 0v3.334" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Checkout</span>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3.75 9H14.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 3.75L14.25 9L9 14.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>

                        {/* Payment method badges */}
                        <div className="flex flex-wrap gap-1.5 justify-center items-center mt-1">
                          {PAYMENT_METHODS.map((method) => (
                            <span
                              key={method}
                              className="flex items-center justify-center bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-[9px] font-bold text-neutral-600 tracking-wide"
                              style={{ minWidth: 32, height: 20 }}
                            >
                              {method}
                            </span>
                          ))}
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
