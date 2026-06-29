"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";
import PurchaseEvent from "./PurchaseEvent";

interface OrderItem {
  productId?: number;
  name: string;
  quantity: number;
  total: string | null;
  image: string | null;
  variation: string | null;
}

interface OrderData {
  orderNumber: string | null;
  email: string;
  firstName: string;
  lastName: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: string | null;
  shippingTotal: string | null;
  discountTotal: string | null;
  total: string;
  coupons: string[];
}

function fmt(str: string | null | undefined): string {
  if (!str) return "";
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? str : `$${n.toFixed(2)}`;
}

export default function OrderConfirmation({
  orderParam,
  paymentParam,
  totalParam,
}: {
  orderParam?: string;
  paymentParam?: string;
  totalParam?: string;
}) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [itemsOpen, setItemsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nb_order");
      if (raw) {
        setOrder(JSON.parse(raw));
        sessionStorage.removeItem("nb_order");
      }
    } catch {}
  }, []);

  const totalNum = parseFloat(order?.total ?? totalParam ?? "0") || 0;
  const displayOrder = order?.orderNumber ?? orderParam;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PurchaseEvent
        orderId={displayOrder ?? paymentParam ?? ""}
        total={totalNum}
        items={order?.items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat((item.total ?? "0").replace(/[^0-9.]/g, "")) / Math.max(1, item.quantity),
        }))}
        user={order ? {
          email:     order.email,
          firstName: order.firstName,
          lastName:  order.lastName,
          city:      order.address?.city,
          state:     order.address?.state,
          zip:       order.address?.postcode,
          country:   order.address?.country,
        } : undefined}
      />

      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="https://noirblancny.com/cdn/shop/files/Group_1171277502_2.svg"
              alt="Noir & Blanc"
              width={110}
              height={32}
            />
          </Link>
          {displayOrder && (
            <span className="text-xs text-neutral-500 font-mono hidden sm:block">Order #{displayOrder}</span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — confirmation card */}
          <div className="lg:col-span-3 space-y-4">

            {/* Confirmed banner */}
            <div className="bg-[#1a6b3c] text-white rounded-xl p-6">
              <div className="flex items-start gap-4">
                <CheckCircle size={32} strokeWidth={1.5} className="mt-0.5 flex-shrink-0" />
                <div>
                  {displayOrder && (
                    <p className="text-sm opacity-80 mb-1">Order #{displayOrder}</p>
                  )}
                  <h1 className="text-xl font-bold tracking-tight">
                    {order?.firstName ? `Thank you, ${order.firstName}!` : "Thank you for your order!"}
                  </h1>
                  {order?.email && (
                    <p className="text-sm opacity-80 mt-1">
                      A confirmation has been sent to <span className="font-medium">{order.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order items (collapsible on mobile, always open on desktop) */}
            {order && order.items.length > 0 && (
              <div className="bg-white rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 lg:cursor-default"
                  onClick={() => setItemsOpen((o) => !o)}
                >
                  <span className="font-semibold text-sm text-neutral-800 flex items-center gap-2">
                    <Package size={16} />
                    Order Summary ({order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""})
                  </span>
                  <span className="lg:hidden">
                    {itemsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>
                <div className={`${itemsOpen ? "block" : "hidden"} lg:block border-t border-neutral-100`}>
                  <ul className="divide-y divide-neutral-100">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex gap-3 px-5 py-4">
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <div className="w-full h-full rounded-lg overflow-hidden bg-neutral-100">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                            ) : (
                              <div className="w-full h-full bg-neutral-200" />
                            )}
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 bg-neutral-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                          {item.variation && (
                            <p className="text-xs text-neutral-500 mt-0.5">{item.variation}</p>
                          )}
                        </div>
                        <div className="text-sm font-medium text-neutral-800 flex-shrink-0">
                          {item.total ? fmt(item.total) : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* Totals */}
                  <div className="border-t border-neutral-100 px-5 py-4 space-y-2 text-sm">
                    {order.subtotal && (
                      <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span>{fmt(order.subtotal)}</span>
                      </div>
                    )}
                    {order.shippingTotal && (
                      <div className="flex justify-between text-neutral-600">
                        <span>Shipping</span>
                        <span>{parseFloat(order.shippingTotal.replace(/[^0-9.]/g, "")) === 0 ? "Free" : fmt(order.shippingTotal)}</span>
                      </div>
                    )}
                    {order.discountTotal && parseFloat(order.discountTotal.replace(/[^0-9.]/g, "")) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount {order.coupons.length > 0 && <span className="text-xs text-neutral-500">({order.coupons.join(", ")})</span>}</span>
                        <span>-{fmt(order.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                      <span>Total</span>
                      <span>${totalNum.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping address */}
            {order?.address?.address1 && (
              <div className="bg-white rounded-xl p-5">
                <h2 className="font-semibold text-sm text-neutral-800 flex items-center gap-2 mb-3">
                  <MapPin size={16} />
                  Shipping Address
                </h2>
                <address className="not-italic text-sm text-neutral-600 leading-relaxed">
                  {order.firstName} {order.lastName}<br />
                  {order.address.address1}
                  {order.address.address2 && <>, {order.address.address2}</>}<br />
                  {order.address.city}, {order.address.state} {order.address.postcode}<br />
                  {order.address.country}
                </address>
              </div>
            )}

          </div>

          {/* Right — actions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Estimated delivery */}
            <div className="bg-white rounded-xl p-5">
              <h2 className="font-semibold text-sm text-neutral-800 mb-3">Estimated Delivery</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Package size={18} className="text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">5–8 Business Days</p>
                  <p className="text-xs text-neutral-500">Standard Shipping</p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <Link
                href="/shop"
                className="block w-full bg-black text-white text-sm font-semibold px-6 py-3.5 text-center hover:bg-neutral-800 transition-colors tracking-wide rounded-lg"
              >
                Continue Shopping
              </Link>
              <Link
                href="/account/orders"
                className="block w-full border border-neutral-300 text-sm font-semibold px-6 py-3.5 text-center hover:bg-neutral-50 transition-colors tracking-wide rounded-lg text-neutral-700"
              >
                View Orders
              </Link>
            </div>

            {/* Need help */}
            <div className="bg-white rounded-xl p-5 text-center">
              <p className="text-xs text-neutral-500">
                Questions? Email us at{" "}
                <a href="mailto:hello@noirblancny.com" className="underline text-neutral-700">
                  hello@noirblancny.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
