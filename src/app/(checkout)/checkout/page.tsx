"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import type { Address } from "@/types";

/* ─── Square SDK types ─────────────────────────────────────────────────── */
interface SqTokenResult {
  status: string;
  token?: string;
  errors?: { message: string }[];
}
interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<SqTokenResult>;
  destroy: () => void;
}
interface SqExpressButton {
  attach?: (selector: string) => Promise<void>;
  tokenize?: () => void;
  destroy: () => void;
  addEventListener: (event: string, handler: (e: { detail: SqTokenResult }) => void) => void;
  removeEventListener: (event: string, handler: (e: { detail: SqTokenResult }) => void) => void;
}
interface SqPaymentRequest {
  [key: string]: unknown;
}
interface SquarePayments {
  card: (options?: Record<string, unknown>) => Promise<SquareCard>;
  paymentRequest: (opts: Record<string, unknown>) => SqPaymentRequest;
  googlePay: (req: SqPaymentRequest) => Promise<SqExpressButton>;
  applePay: (req: SqPaymentRequest) => Promise<SqExpressButton>;
}
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

/* ─── Input component ───────────────────────────────────────────────────── */
function Field({
  label, type = "text", value, onChange, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        autoComplete={autoComplete}
        className="peer w-full border border-[#D4D4D4] rounded-[5px] px-3 pt-5 pb-2 text-sm text-[#1a1a1a] placeholder-transparent focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white"
      />
      <label className="absolute left-3 top-1.5 text-[10px] text-[#757575] font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#999] peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#757575] pointer-events-none">
        {label}
      </label>
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full border border-[#D4D4D4] rounded-[5px] px-3 pt-5 pb-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white appearance-none"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <label className="absolute left-3 top-1.5 text-[10px] text-[#757575] font-medium pointer-events-none">
        {label}
      </label>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 7L11 1" stroke="#757575" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ─── Order Summary ─────────────────────────────────────────────────────── */
function OrderSummary({
  discountCode, setDiscountCode, shipping,
}: {
  discountCode: string; setDiscountCode: (v: string) => void; shipping: number;
}) {
  const { cart } = useCartStore();
  const items = cart?.contents?.nodes ?? [];
  const subtotalNum = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
  const totalNum = subtotalNum + shipping;
  const savings = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));

  return (
    <div className="space-y-4">
      {/* Items */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 items-start">
            <div className="relative flex-shrink-0 w-14 h-14 rounded-[6px] border border-[#E0E0E0] overflow-hidden bg-[#F5F5F5]">
              {item.product.node.image && (
                <Image src={item.product.node.image.sourceUrl} alt={item.product.node.name} fill className="object-cover" sizes="56px" />
              )}
              <span className="absolute -top-1.5 -right-1.5 bg-[#717171] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">{item.product.node.name}</p>
              {item.variation?.node.attributes.nodes.map((a) => (
                <p key={a.name} className="text-xs text-[#717171]">{a.value}</p>
              ))}
            </div>
            <p className="text-sm font-medium text-[#1a1a1a] ml-2 whitespace-nowrap">{formatPrice(item.total)}</p>
          </li>
        ))}
      </ul>

      {/* Discount */}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Discount code or gift card"
          className="flex-1 border border-[#D4D4D4] rounded-[5px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors"
        />
        <button className="px-4 py-2.5 border border-[#D4D4D4] rounded-[5px] text-sm font-medium text-[#717171] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors whitespace-nowrap">
          Apply
        </button>
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
        <div className="flex justify-between text-sm text-[#1a1a1a]">
          <span className="text-[#717171]">Subtotal</span>
          <span>{formatPrice(cart?.subtotal) || "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#717171] flex items-center gap-1">
            Shipping
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#B5B5B5" strokeWidth="1.2"/><path d="M8 7v5" stroke="#B5B5B5" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="5" r="0.7" fill="#B5B5B5"/></svg>
          </span>
          {shipping === 0 ? (
            <span className="text-[#1a1a1a]">
              <span className="line-through text-[#B5B5B5] mr-1">$9.95</span>
              <span className="text-[#007A5C] font-medium">FREE</span>
            </span>
          ) : (
            <span>${shipping.toFixed(2)}</span>
          )}
        </div>
        <div className="flex justify-between text-sm text-[#1a1a1a]">
          <span className="text-[#717171]">Estimated taxes</span>
          <span>—</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-[#E0E0E0]">
          <span className="text-base font-semibold text-[#1a1a1a]">Total</span>
          <div className="text-right">
            <span className="text-xs text-[#717171] mr-1">USD</span>
            <span className="text-2xl font-semibold text-[#1a1a1a]">
              ${totalNum.toFixed(2)}
            </span>
          </div>
        </div>
        {savings > 0.01 && (
          <p className="text-xs font-medium text-[#007A5C] bg-[#F0FAF7] rounded px-2 py-1">
            🎉 TOTAL SAVINGS: ${savings.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { cart, setCart } = useCartStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailNews, setEmailNews] = useState(false);
  const [address, setAddress] = useState<Address>({
    firstName: "", lastName: "", address1: "", address2: "",
    city: "", state: "", postcode: "", country: "United States",
  });
  const [shipMethod, setShipMethod] = useState("standard");
  const [discountCode, setDiscountCode] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile collapse
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [cardMounted, setCardMounted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [googlePayMounted, setGooglePayMounted] = useState(false);
  const [applePayMounted, setApplePayMounted] = useState(false);
  const cardRef = useRef<SquareCard | null>(null);
  const googlePayRef = useRef<SqExpressButton | null>(null);
  const applePayRef = useRef<SqExpressButton | null>(null);

  const items = cart?.contents?.nodes ?? [];
  const shippingCost = shipMethod === "express" ? 12 : shipMethod === "overnight" ? 24 : 0;
  const subtotalNum = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
  const totalNum = subtotalNum + shippingCost;

  /* Load Square SDK */
  useEffect(() => {
    if (window.Square) { setSdkReady(true); return; }
    const isSandbox = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT !== "production";
    const script = document.createElement("script");
    script.src = isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
    script.onload = () => setSdkReady(true);
    document.head.appendChild(script);
  }, []);

  /* Mount Square card + express checkout buttons */
  useEffect(() => {
    if (!sdkReady) return;
    let active = true;

    async function mount() {
      if (!window.Square || !active) return;
      try {
        const p = await window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        );
        if (!active) return;

        // ── Card form ──
        const card = await p.card({
          style: {
            ".input-container": { borderColor: "#D4D4D4", borderRadius: "5px" },
            ".input-container.is-focus": { borderColor: "#1a1a1a" },
            ".input-container.is-error": { borderColor: "#E22C2C" },
            ".message-text": { color: "#717171" },
            input: { color: "#1a1a1a", fontSize: "14px" },
          },
        });
        if (!active) { card.destroy(); return; }
        await card.attach("#sq-card");
        if (!active) { card.destroy(); return; }
        cardRef.current = card;
        setCardMounted(true);

        // ── Separate paymentRequest objects for each button (can't share one instance) ──
        const makeRequest = () => p.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: { amount: totalNum.toFixed(2), label: "Noir & Blanc" },
          requestBillingContact: false,
          requestShippingContact: false,
        });

        // ── Google Pay ──
        try {
          const gp = await p.googlePay(makeRequest());
          if (!active) { gp.destroy(); return; }
          await gp.attach!("#sq-google-pay");
          if (!active) { gp.destroy(); return; }
          gp.addEventListener("ontokenization", async (e) => {
            const { status, token, errors } = e.detail;
            if (status !== "OK" || !token) {
              setPayError(errors?.[0]?.message ?? "Google Pay failed");
              return;
            }
            await chargeToken(token);
          });
          googlePayRef.current = gp;
          setGooglePayMounted(true);
        } catch {
          // Google Pay not available in this browser/env — silently hide
          console.info("[Square] Google Pay not available");
        }

        // ── Apple Pay ──
        // Apple Pay uses tokenize() on click — no attach() like Google Pay
        try {
          const ap = await p.applePay(makeRequest()) as any;
          if (!active) { ap?.destroy?.(); return; }
          ap.addEventListener("ontokenization", async (e: { detail: SqTokenResult }) => {
            const { status, token, errors } = e.detail;
            if (status !== "OK" || !token) {
              setPayError(errors?.[0]?.message ?? "Apple Pay failed");
              return;
            }
            await chargeToken(token);
          });
          applePayRef.current = ap;
          setApplePayMounted(true);
        } catch {
          // Apple Pay not available in this browser/device — silently hide
          console.info("[Square] Apple Pay not available");
        }

      } catch (e) {
        console.error("[Square] mount error:", e);
      }
    }

    mount();
    return () => {
      active = false;
      if (cardRef.current) { cardRef.current.destroy(); cardRef.current = null; }
      if (googlePayRef.current) { googlePayRef.current.destroy(); googlePayRef.current = null; }
      if (applePayRef.current) { applePayRef.current.destroy(); applePayRef.current = null; }
      setCardMounted(false);
      setGooglePayMounted(false);
      setApplePayMounted(false);
    };
  }, [sdkReady, totalNum]);

  async function chargeToken(token: string) {
    setPayError(null);
    setPaying(true);
    try {
      // Build items list from cart for WooCommerce order creation
      const wcItems = items.map((item) => ({
        productId:   item.product.node.databaseId,
        variationId: item.variation?.node.databaseId ?? undefined,
        quantity:    item.quantity,
        name:        item.product.node.name,
      }));

      const res = await fetch("/api/square/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId:       token,
          amountCents:    Math.round(totalNum * 100),
          buyerEmail:     email,
          billing:        { ...address, email },
          shipping:       address,
          items:          wcItems,
          shippingMethod: shipMethod,
          shippingTotal:  shippingCost,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayError(data.error ?? "Payment failed. Please try again.");
        setPaying(false);
        return;
      }
      setCart(null);
      const successParams = data.orderNumber
        ? `order=${data.orderNumber}`
        : `payment=${data.paymentId}`;
      router.push(`/checkout/success?${successParams}`);
    } catch {
      setPayError("An unexpected error occurred. Please try again.");
      setPaying(false);
    }
  }

  async function handlePay() {
    if (!cardRef.current) return;
    setPayError(null);
    setPaying(true);
    const result = await cardRef.current.tokenize();
    if (result.status !== "OK" || !result.token) {
      setPayError(result.errors?.[0]?.message ?? "Card tokenization failed");
      setPaying(false);
      return;
    }
    await chargeToken(result.token);
  }

  const hasExpressCheckout = googlePayMounted || applePayMounted;
  const subtotalDisplay = formatPrice(cart?.subtotal) || `$${totalNum.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="border-b border-[#E0E0E0]">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
              alt="Noir & Blanc"
              width={110}
              height={32}
              style={{ height: "auto" }}
            />
          </Link>
          {/* Social proof */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#1a1a1a]">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#FFB800"><path d="M6 1l1.236 2.506L10 3.882 8 5.833l.472 2.753L6 7.25l-2.472 1.336L4 5.833 2 3.882l2.764-.376z"/></svg>
              ))}
            </div>
            <span className="font-semibold text-[11px] tracking-wide">30K+ HAPPY CUSTOMERS</span>
          </div>
          {/* Cart icon */}
          <Link href="/shop" className="flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.6">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Mobile order summary toggle ── */}
      <div className="lg:hidden border-b border-[#E0E0E0] bg-[#FAFAFA]">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2 text-[#1a6bbf] text-sm font-medium">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span>Order summary</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`}>
              <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-base font-semibold text-[#1a1a1a]">${totalNum.toFixed(2)}</span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 bg-white border-t border-[#E0E0E0]">
            <OrderSummary discountCode={discountCode} setDiscountCode={setDiscountCode} shipping={shippingCost} />
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-16 lg:min-h-screen">

          {/* ── LEFT: Form ── */}
          <div className="py-8 lg:py-10">

            {/* Express checkout — ALWAYS render these divs so Square's iframe is never destroyed by React */}
            <div className={hasExpressCheckout ? "mb-6" : ""}>
              {hasExpressCheckout && (
                <p className="text-xs text-center text-[#717171] mb-3 font-medium tracking-wide uppercase">Express checkout</p>
              )}
              <div className={`grid gap-3 ${googlePayMounted && applePayMounted ? "grid-cols-2" : "grid-cols-1"}`}>
                {/* Google Pay — Square injects iframe here, must never be unmounted */}
                <div
                  id="sq-google-pay"
                  style={{ height: googlePayMounted ? 44 : 0, overflow: "hidden" }}
                />
                {/* Apple Pay — native button using WebKit CSS, calls tokenize() on click */}
                {applePayMounted && (
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore — WebKit-specific CSS properties for Apple Pay button
                  <button
                    type="button"
                    onClick={() => applePayRef.current?.tokenize?.()}
                    className="apple-pay-button"
                    aria-label="Buy with Apple Pay"
                  />
                )}
              </div>
              {hasExpressCheckout && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-[#E0E0E0]" />
                  <span className="text-xs text-[#717171]">Or</span>
                  <div className="flex-1 h-px bg-[#E0E0E0]" />
                </div>
              )}
            </div>

            {/* Contact */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Contact</h2>
                <button className="text-sm text-[#1a6bbf] hover:underline">Sign in</button>
              </div>
              <div className="space-y-3">
                <Field
                  label="Email or mobile phone number"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D4D4D4] accent-[#1a1a1a]"
                  />
                  <span className="text-sm text-[#1a1a1a]">Email me with news and offers</span>
                </label>
              </div>
            </section>

            {/* Delivery */}
            <section className="mb-6">
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Delivery</h2>
              <div className="space-y-3">
                <SelectField
                  label="Country/Region"
                  value={address.country}
                  onChange={(v) => setAddress({ ...address, country: v })}
                  options={COUNTRIES}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" value={address.firstName} onChange={(v) => setAddress({ ...address, firstName: v })} autoComplete="given-name" />
                  <Field label="Last name" value={address.lastName} onChange={(v) => setAddress({ ...address, lastName: v })} autoComplete="family-name" />
                </div>
                <Field label="Address" value={address.address1} onChange={(v) => setAddress({ ...address, address1: v })} autoComplete="street-address" />
                <Field label="Apartment, suite, etc. (optional)" value={address.address2 ?? ""} onChange={(v) => setAddress({ ...address, address2: v })} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} autoComplete="address-level2" />
                  <SelectField
                    label="State"
                    value={address.state}
                    onChange={(v) => setAddress({ ...address, state: v })}
                    options={["—", ...US_STATES]}
                  />
                  <Field label="ZIP code" value={address.postcode} onChange={(v) => setAddress({ ...address, postcode: v })} autoComplete="postal-code" />
                </div>
              </div>
            </section>

            {/* Shipping method */}
            <section className="mb-6">
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Shipping method</h2>
              <div className="border border-[#D4D4D4] rounded-[5px] overflow-hidden divide-y divide-[#E0E0E0]">
                {[
                  { id: "standard", label: "Standard", eta: "5–7 business days", price: "FREE", original: "$9.95" },
                  { id: "express", label: "Express", eta: "2–3 business days", price: "$12.00", original: null },
                  { id: "overnight", label: "Overnight", eta: "Next business day", price: "$24.00", original: null },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                      shipMethod === m.id ? "bg-[#F0F5FF]" : "bg-white hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="ship"
                        value={m.id}
                        checked={shipMethod === m.id}
                        onChange={() => setShipMethod(m.id)}
                        className="accent-[#1a1a1a]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">{m.label}</p>
                        <p className="text-xs text-[#717171]">{m.eta}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {m.original && <span className="line-through text-[#B5B5B5] text-xs mr-1">{m.original}</span>}
                      <span className={`text-sm font-medium ${m.price === "FREE" ? "text-[#007A5C]" : "text-[#1a1a1a]"}`}>{m.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Payment</h2>
                <div className="flex items-center gap-1 text-[11px] text-[#717171]">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="4.5" width="13" height="9" rx="1.5" stroke="#717171" strokeWidth="1.3"/>
                    <path d="M1.5 7.5h13" stroke="#717171" strokeWidth="1.3"/>
                  </svg>
                  All transactions are secure and encrypted
                </div>
              </div>

              <div className="border border-[#D4D4D4] rounded-[5px] overflow-hidden">
                {/* Tab header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#F5F5F5] border-b border-[#D4D4D4]">
                  <span className="text-sm font-medium text-[#1a1a1a]">Credit card</span>
                  <div className="flex gap-1">
                    {["VISA","MC","AMEX"].map((b) => (
                      <span key={b} className="bg-white border border-[#E0E0E0] rounded px-1.5 text-[9px] font-bold text-[#555] h-5 flex items-center">{b}</span>
                    ))}
                    <span className="bg-white border border-[#E0E0E0] rounded px-1.5 text-[8px] font-bold text-[#555] h-5 flex items-center">···</span>
                  </div>
                </div>

                {/* Square card form */}
                <div className="p-4">
                  {!cardMounted && (
                    <div className="flex items-center justify-center h-[90px]">
                      <svg className="animate-spin h-5 w-5 text-neutral-300" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                  <div id="sq-card" style={{ minHeight: 90 }} />
                </div>
              </div>

              {/* Billing address */}
              <div className="mt-3 border border-[#D4D4D4] rounded-[5px] px-4 py-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#D4D4D4] accent-[#1a1a1a]" />
                  <span className="text-sm text-[#1a1a1a]">Use shipping address as billing address</span>
                </label>
              </div>
            </section>

            {/* Error */}
            {payError && (
              <div className="mb-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[5px] px-3 py-2.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
                  <path d="M8 5v3.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="8" cy="11" r="0.75" fill="#EF4444"/>
                </svg>
                {payError}
              </div>
            )}

            {/* Pay now button */}
            <button
              onClick={handlePay}
              disabled={!email || !address.firstName || !address.address1 || !cardMounted || paying}
              className="w-full h-[52px] rounded-[5px] bg-[#1a1a1a] text-white text-base font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Processing…
                </>
              ) : (
                `Pay now`
              )}
            </button>

            {/* Footer links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-6 text-xs text-[#717171]">
              {["Refund policy","Shipping","Privacy policy","Terms of service","Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-[#1a1a1a] hover:underline transition-colors">{l}</a>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order summary (desktop only) ── */}
          <div className="hidden lg:block border-l border-[#E0E0E0] bg-[#FAFAFA] py-10 px-8">
            <div className="sticky top-8">
              <OrderSummary discountCode={discountCode} setDiscountCode={setDiscountCode} shipping={shippingCost} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky Pay Now ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] px-4 py-3 z-20">
        <button
          onClick={handlePay}
          disabled={!email || !address.firstName || !address.address1 || !cardMounted || paying}
          className="w-full h-[50px] rounded-[5px] bg-[#1a1a1a] text-white text-base font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Processing…
            </>
          ) : (
            <>
              <span>Pay now</span>
              <span className="text-sm font-normal opacity-75">· ${totalNum.toFixed(2)}</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-[#717171] mt-2">
          Total savings: ${parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, "")).toFixed(2)}
        </p>
      </div>

      {/* Mobile bottom padding so content isn't hidden behind sticky button */}
      <div className="lg:hidden h-24" />
    </div>
  );
}
