"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { applyCoupon, removeCoupon, updateShippingMethod, updateCustomerShippingAddress, fetchCart } from "@/lib/cart";
import { klIdentify, klTrack } from "@/lib/klaviyo";
import { trackFunnel } from "@/lib/funnel";
import { logDebug } from "@/lib/debug-log";
import { captureAttribution, getAttributionLabel, getAttribution } from "@/lib/attribution";
import { gtag } from "@/components/GoogleTag";
import { track } from "@vercel/analytics";
import type { Address, ShippingRate } from "@/types";

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

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface WCCountry { code: string; name: string; states: { code: string; name: string }[] }

/* ─── Fallback constants (used before WooCommerce data loads) ────────────── */
const COUNTRY_CODES: Record<string, string> = {}; // populated dynamically

/* ─── Input component ───────────────────────────────────────────────────── */
function Field({
  id, label, type = "text", value, onChange, placeholder, autoComplete,
}: {
  id?: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        autoComplete={autoComplete}
        className="peer w-full border border-[#D4D4D4] rounded-[5px] px-3 pt-5 pb-2 text-[16px] lg:text-sm text-[#1a1a1a] placeholder-transparent focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white"
      />
      <label className="absolute left-3 top-1.5 text-[10px] text-[#757575] font-medium transition-all peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-[#aaa] peer-placeholder-shown:font-light peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#757575] peer-focus:font-medium pointer-events-none">
        {label}
      </label>
    </div>
  );
}

/* Address field with Google Places autocomplete (proxied via /api/places). */
type PlaceResult = { address1: string; city: string; state: string; postcode: string; countryCode: string };
function AddressAutocomplete({
  label, value, onChange, onSelectPlace, autoComplete,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  onSelectPlace: (place: PlaceResult) => void;
  autoComplete?: string;
}) {
  const [suggestions, setSuggestions] = useState<{ placeId: string; main: string; secondary: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const sessionRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  if (!sessionRef.current && typeof crypto !== "undefined" && crypto.randomUUID) {
    sessionRef.current = crypto.randomUUID();
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = (input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?action=autocomplete&session=${sessionRef.current}&input=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
        setActive(-1);
      } catch { setSuggestions([]); setOpen(false); }
    }, 250);
  };

  const selectSuggestion = async (placeId: string) => {
    setOpen(false);
    try {
      const res = await fetch(`/api/places?action=details&session=${sessionRef.current}&placeId=${encodeURIComponent(placeId)}`);
      const place: PlaceResult = await res.json();
      onSelectPlace(place);
      // New session token for the next lookup (Google billing best practice)
      if (typeof crypto !== "undefined" && crypto.randomUUID) sessionRef.current = crypto.randomUUID();
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); selectSuggestion(suggestions[active].placeId); }
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={label}
        autoComplete={autoComplete}
        className="peer w-full border border-[#D4D4D4] rounded-[5px] px-3 pt-5 pb-2 text-[16px] lg:text-sm text-[#1a1a1a] placeholder-transparent focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white"
      />
      <label className="absolute left-3 top-1.5 text-[10px] text-[#757575] font-medium transition-all peer-placeholder-shown:top-[14px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-[#aaa] peer-placeholder-shown:font-light peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#757575] peer-focus:font-medium pointer-events-none">
        {label}
      </label>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-[#D4D4D4] rounded-[5px] shadow-lg max-h-72 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s.placeId); }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2.5 text-sm cursor-pointer ${i === active ? "bg-[#f3f3f3]" : "hover:bg-[#f7f7f7]"}`}
            >
              <span className="font-medium text-[#1a1a1a]">{s.main}</span>
              {s.secondary && <span className="text-[#717171]">, {s.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
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
        className="peer w-full border border-[#D4D4D4] rounded-[5px] px-3 pt-5 pb-2 text-[16px] lg:text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors bg-white appearance-none"
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
  discountCode, setDiscountCode, addressReady, hideTotal = false,
}: {
  discountCode: string; setDiscountCode: (v: string) => void; addressReady: boolean; hideTotal?: boolean;
}) {
  const { cart, setCart } = useCartStore();
  const items = cart?.contents?.nodes ?? [];
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const appliedCoupons = cart?.appliedCoupons ?? [];
  const shippingTotal = cart?.shippingTotal ?? "0";
  // "has shipping selected" = a method is chosen (even if free)
  const hasShippingMethod = (cart?.chosenShippingMethods?.length ?? 0) > 0;
  const shippingNum = parseFloat(shippingTotal.replace(/[^0-9.]/g, "") || "0");
  // Derive tax: total - subtotal - shipping + discount (WooCommerce includes tax in total)
  const subtotalNum2 = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
  const shippingNum2 = parseFloat(shippingTotal.replace(/[^0-9.]/g, ""));
  const discountNum2 = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));
  const totalNum2 = parseFloat((cart?.total ?? "0").replace(/[^0-9.]/g, ""));
  const taxNum = Math.max(0, totalNum2 - subtotalNum2 - shippingNum2 + discountNum2);

  async function handleApplyCoupon() {
    if (!discountCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const updated = await applyCoupon(discountCode.trim());
      if (updated) {
        setCart(updated);
        setDiscountCode("");
      } else {
        setCouponError("Invalid or expired coupon code.");
      }
    } catch (e: unknown) {
      // Show the actual WooCommerce error message (e.g. "Coupon does not exist!")
      const msg = e instanceof Error ? e.message : "Could not apply coupon. Please try again.";
      setCouponError(msg);
    }
    setCouponLoading(false);
  }

  async function handleRemoveCoupon(code: string) {
    const updated = await removeCoupon(code);
    if (updated) setCart(updated);
  }

  const savings = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));

  return (
    <div className="space-y-5">
      {/* Items */}
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 items-center">
            <div className="relative flex-shrink-0 w-[64px] h-[64px]">
              <div className="w-full h-full rounded-[8px] border border-[#E0E0E0] overflow-hidden bg-white">
                {item.product.node.image && (
                  <Image src={item.product.node.image.sourceUrl} alt={item.product.node.name} fill className="object-contain p-1" sizes="64px" />
                )}
              </div>
              <span className="absolute -top-2 -right-2 bg-[#1a1a1a] text-white text-[10px] w-[20px] h-[20px] rounded-full flex items-center justify-center font-semibold leading-none z-10">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] leading-snug">{item.product.node.name}</p>
              {item.variation?.node.attributes.nodes.map((a) => (
                <p key={a.name} className="text-xs text-[#717171] mt-0.5">{a.value}</p>
              ))}
            </div>
            <p className="text-sm font-semibold text-[#1a1a1a] ml-2 whitespace-nowrap">{formatPrice(item.total)}</p>
          </li>
        ))}
      </ul>

      {/* Applied coupons */}
      {appliedCoupons.length > 0 && (
        <div className="space-y-1">
          {appliedCoupons.map((c) => (
            <div key={c.code} className="flex items-center justify-between bg-[#F0FAF7] rounded px-3 py-2">
              <span className="text-xs font-medium text-[#007A5C] uppercase tracking-wide">{c.code}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#007A5C]">-{formatPrice(c.discountAmount)}</span>
                <button onClick={() => handleRemoveCoupon(c.code)} className="text-[#717171] hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discount code input */}
      <div className="space-y-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => { setDiscountCode(e.target.value); setCouponError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            placeholder="Discount code"
            className="flex-1 border border-[#D4D4D4] rounded-[5px] px-3 py-2.5 text-[16px] bg-white focus:outline-none focus:border-[#1a1a1a] transition-colors"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={couponLoading || !discountCode.trim()}
            className="px-4 py-2.5 border border-[#D4D4D4] rounded-[5px] text-sm font-medium text-[#555] bg-white hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {couponLoading ? "…" : "Apply"}
          </button>
        </div>
        {couponError && <p className="text-xs text-red-500">{couponError}</p>}
      </div>

      {/* Totals */}
      <div className="space-y-3 pt-3 border-t border-[#E0E0E0]">
        <div className="flex justify-between text-sm">
          <span className="text-[#717171]">Subtotal</span>
          <span className="font-medium text-[#1a1a1a]">{formatPrice(cart?.subtotal) || "—"}</span>
        </div>
        {savings > 0.01 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#007A5C]">Discount</span>
            <span className="font-medium text-[#007A5C]">-{formatPrice(cart?.discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[#717171] flex items-center gap-1">
            Shipping
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#B5B5B5" strokeWidth="1.2"/><path d="M8 7v5" stroke="#B5B5B5" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="5" r="0.7" fill="#B5B5B5"/></svg>
          </span>
          {addressReady && hasShippingMethod
            ? <span className={`font-medium ${shippingNum === 0 ? "text-[#007A5C]" : "text-[#1a1a1a]"}`}>
                {shippingNum === 0 ? "FREE" : formatPrice(shippingTotal)}
              </span>
            : <span className="text-[#717171] italic text-xs self-center">{addressReady ? "Calculating…" : "Enter shipping address"}</span>
          }
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#717171] flex items-center gap-1">
            Estimated taxes
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#B5B5B5" strokeWidth="1.2"/><path d="M8 7v5" stroke="#B5B5B5" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="5" r="0.7" fill="#B5B5B5"/></svg>
          </span>
          <span className="font-medium text-[#1a1a1a]">{taxNum > 0 ? `$${taxNum.toFixed(2)}` : "—"}</span>
        </div>
      </div>

      {/* Total — hidden in mobile expanded view (shown in the trigger row instead) */}
      {!hideTotal && (
        <div className="flex justify-between items-center pt-3 border-t border-[#E0E0E0]">
          <span className="text-base font-semibold text-[#1a1a1a]">Total</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-[#717171]">USD</span>
            <span className="text-[22px] font-bold text-[#1a1a1a]">{formatPrice(cart?.total) || "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { cart, setCart } = useCartStore();
  const router = useRouter();

  const BOT_DOMAINS = ['storebotmail', 'joonix.net', 'mailinator', 'guerrillamail', 'tempmail', 'throwam', 'yopmail', 'sharklasers', 'trashmail'];
  const isBotEmail = (e: string) => BOT_DOMAINS.some(d => e.toLowerCase().includes(d));

  const [email, setEmail] = useState("");
  const emailLoggedRef = useRef(false);
  const [emailNews, setEmailNews] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // bot trap — real users never fill this
  const [address, setAddress] = useState<Address>({
    firstName: "", lastName: "", address1: "", address2: "",
    city: "", state: "", postcode: "", country: "United States",
  });
  const [shipMethod, setShipMethod] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile collapse
  const [discountOpen, setDiscountOpen] = useState(false); // mobile discount toggle
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [wcCountries, setWcCountries] = useState<WCCountry[]>([]);
  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: "", lastName: "", address1: "", address2: "",
    city: "", state: "", postcode: "", country: "United States",
  });
  const [addressReady, setAddressReady] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // WooCommerce rate.cost can come back as "$0.00" — strip currency symbols before parsing
  const money = (v: string | null | undefined) => parseFloat((v ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const [cardMounted, setCardMounted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [googlePayMounted, setGooglePayMounted] = useState(false);
  const [applePayMounted, setApplePayMounted] = useState(false);
  const cardRef = useRef<SquareCard | null>(null);
  const googlePayRef = useRef<SqExpressButton | null>(null);
  const applePayRef = useRef<SqExpressButton | null>(null);
  const paymentsRef = useRef<SquarePayments | null>(null);
  const [paymentsReady, setPaymentsReady] = useState(false);
  // Keep chargeToken ref so express-pay event listeners always call the latest version
  // (avoids stale closure capturing old email/address/cart state)
  const chargeTokenRef = useRef<(token: string, email?: string, addr?: typeof address, overrides?: { total?: number; shipMethod?: string; shipTotal?: number }) => Promise<void>>(async () => {});
  // Apple Pay shipping state (populated by shippingcontactchanged before tokenize resolves)
  const applePayShipMethodRef = useRef<string>("");
  const applePayShippingTotalRef = useRef<number>(0);
  const applePayTotalRef = useRef<number>(0);
  // Full contact stored during shippingcontactchanged (email is available there)
  const applePayContactRef = useRef<Record<string, any> | null>(null);

  // Fetch WooCommerce country/state data on mount
  useEffect(() => {
    fetch("https://noirblanc.store/?rest_route=/noirblanc/v1/countries")
      .then((r) => r.json())
      .then((data: WCCountry[]) => {
        // Put United States first, then rest alphabetically
        // Strip " (XX)" code suffix WooCommerce sometimes appends to country names
        const cleaned = data.map((c) => ({ ...c, name: c.name.replace(/\s*\([A-Z]{2}\)$/, "") }));
        const us = cleaned.find((c) => c.code === "US");
        const rest = cleaned.filter((c) => c.code !== "US");
        const sorted = us ? [us, ...rest] : cleaned;
        setWcCountries(sorted);
        // Populate COUNTRY_CODES map dynamically (use cleaned names)
        cleaned.forEach((c) => { COUNTRY_CODES[c.name] = c.code; });
      })
      .catch(() => {
        // Fallback if endpoint fails
        const fallback: WCCountry[] = [
          { code: "US", name: "United States", states: [] },
          { code: "CA", name: "Canada", states: [] },
          { code: "GB", name: "United Kingdom", states: [] },
          { code: "AU", name: "Australia", states: [] },
        ];
        setWcCountries(fallback);
        fallback.forEach((c) => { COUNTRY_CODES[c.name] = c.code; });
      });
  }, []);

  // Always fetch fresh cart on mount to clear stale data from localStorage
  useEffect(() => {
    fetchCart().then((fresh) => {
      if (fresh) {
        setCart(fresh);
        const chosen = fresh.chosenShippingMethods ?? [];
        if (chosen.length > 0) {
          // WooCommerce session already has a shipping method selected (from a previous visit).
          // Restore it so the shipping line and total display correctly without requiring
          // the user to re-enter their address.
          setShipMethod(chosen[0]);
          setAddressReady(true);
        } else {
          setShipMethod("");
          setAddressReady(false);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.contents?.nodes ?? [];
  const totalNum = parseFloat((cart?.total ?? "0").replace(/[^0-9.]/g, ""));
  const availableRates = cart?.availableShippingMethods?.[0]?.rates ?? [];

  // Keep a ref to totalNum so Square express-pay always uses the latest total
  // without triggering a full remount of the card form on every price change
  const totalNumRef = useRef(totalNum);
  useEffect(() => { totalNumRef.current = totalNum; }, [totalNum]);

  // Klaviyo: identify the shopper and fire "Started Checkout" once we have a
  // valid email + items in the cart. This powers the abandoned-checkout flow.
  const startedCheckoutRef = useRef(false);
  const klEmailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vercel Web Analytics: "Reached Checkout" funnel step — fire once the
  // Capture attribution on page load
  useEffect(() => {
    const attribution = captureAttribution();
    logDebug("attribution_captured", "", { source: attribution.source, medium: attribution.medium, campaign: attribution.campaign });
  }, []);

  // Log when valid email is first entered
  useEffect(() => {
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (validEmail && !emailLoggedRef.current && !isBotEmail(email)) {
      emailLoggedRef.current = true;
      const attribution = getAttributionLabel();
      logDebug("email_entered", email, { attribution });
    }
  }, [email]);

  // checkout page has a real cart (mirrors Shopify's "Reached checkout").
  const reachedCheckoutRef = useRef(false);
  useEffect(() => {
    if (reachedCheckoutRef.current || items.length === 0 || totalNum <= 0) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem('nb_checkout_pinged')) return;
    reachedCheckoutRef.current = true;
    sessionStorage.setItem('nb_checkout_pinged', '1');
    track("Reached Checkout", { value: totalNum, items: items.length });
    logDebug("reached_checkout", "", { value: totalNum, items: items.length });
    trackFunnel("checkout");

    // GA4: begin_checkout event
    gtag("event", "begin_checkout", {
      value: totalNum,
      currency: "USD",
      items: items.map((item, i) => ({
        item_id: String(item.product.node.databaseId),
        item_name: item.product.node.name,
        quantity: item.quantity,
        price: parseFloat((item.product.node.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
      })),
    });
  }, [items.length, totalNum]);
  // Stable signature so the effect doesn't re-run on every render (items is a fresh array each time)
  const itemsKey = items.map((i) => `${i.product.node.databaseId}:${i.quantity}`).join(",");
  useEffect(() => {
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!validEmail || items.length === 0 || totalNum <= 0 || isBotEmail(email)) return;
    if (klEmailDebounce.current) clearTimeout(klEmailDebounce.current);
    klEmailDebounce.current = setTimeout(() => {
      logDebug("klIdentify_called", email, { firstName: address.firstName, lastName: address.lastName });
      klIdentify(email, { first_name: address.firstName || undefined, last_name: address.lastName || undefined });

      if (startedCheckoutRef.current) return;
      startedCheckoutRef.current = true;

      logDebug("klTrack_started_checkout", email, { value: totalNum, itemCount: items.length });
      klTrack("Started Checkout", {
        $email: email,
        value: totalNum,
        ItemNames: items.map((i) => i.product.node.name),
        Items: items.map((i) => ({
          ProductID: i.variation?.node.databaseId ?? i.product.node.databaseId,
          ProductName: i.product.node.name,
          Quantity: i.quantity,
          ItemPrice: parseFloat((i.product.node.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
          ImageURL: i.product.node.image?.sourceUrl ?? null,
        })),
        CheckoutURL: typeof window !== "undefined" ? window.location.href : undefined,
      });
    }, 1000);
    return () => { if (klEmailDebounce.current) clearTimeout(klEmailDebounce.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, itemsKey, totalNum, address.firstName, address.lastName]);

  // Sync shipMethod whenever cart changes (e.g. coupon applied changes chosen method)
  useEffect(() => {
    const chosen = cart?.chosenShippingMethods ?? [];
    if (chosen.length > 0 && chosen[0] !== shipMethod) {
      setShipMethod(chosen[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // When address fields are sufficiently filled, update WooCommerce session to get shipping rates
  const handleAddressChange = useCallback((newAddress: typeof address) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    const ready = !!(newAddress.address1 && newAddress.city && newAddress.state && newAddress.postcode && newAddress.country);
    setAddressReady(ready);
    if (!ready) return;
    addressDebounceRef.current = setTimeout(async () => {
      const updated = await updateCustomerShippingAddress({
        address1: newAddress.address1,
        city: newAddress.city,
        state: newAddress.state,
        postcode: newAddress.postcode,
        country: COUNTRY_CODES[newAddress.country] ?? newAddress.country,
      });
      if (updated) {
        setCart(updated);
        const rates = updated.availableShippingMethods?.[0]?.rates ?? [];
        // Always auto-select the cheapest (first) rate
        if (rates.length > 0) {
          const firstRate = rates[0];
          const afterSelect = await updateShippingMethod(firstRate.id);
          if (afterSelect) {
            setCart(afterSelect);
            setShipMethod(firstRate.id);
          } else {
            setShipMethod(firstRate.id);
          }
        }
      }
    }, 800);
  }, [setCart]);

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

  /* Effect 1: Initialize Square payments instance + mount card form (once on SDK ready) */
  useEffect(() => {
    if (!sdkReady) return;
    let active = true;

    async function mountCard() {
      if (!window.Square || !active) return;
      try {
        const p = await window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        );
        if (!active) return;
        paymentsRef.current = p;
        setPaymentsReady(true);

        const card = await p.card({
          style: {
            ".input-container": { borderColor: "#D4D4D4", borderRadius: "8px", borderWidth: "1px" },
            ".input-container.is-focus": { borderColor: "#1a1a1a", borderWidth: "1px" },
            ".input-container.is-error": { borderColor: "#E22C2C", borderWidth: "1px" },
            ".message-text": { color: "#717171" },
            ".message-text.is-error": { color: "#E22C2C" },
            ".message-icon": { color: "#717171" },
            ".message-icon.is-error": { color: "#E22C2C" },
            input: { backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: "14px", fontWeight: "400" },
            "input::placeholder": { color: "#aaaaaa" },
            "input.is-focus": { backgroundColor: "#ffffff", color: "#1a1a1a" },
            "input.is-focus::placeholder": { color: "#cccccc" },
            "input.is-error": { color: "#1a1a1a" },
            "input.is-error::placeholder": { color: "#aaaaaa" },
          },
        });
        if (!active) { card.destroy(); return; }
        await card.attach("#sq-card");
        if (!active) { card.destroy(); return; }
        cardRef.current = card;
        setCardMounted(true);
      } catch (e) {
        console.error("[Square] card mount error:", e);
      }
    }

    mountCard();
    return () => {
      active = false;
      if (cardRef.current) { cardRef.current.destroy(); cardRef.current = null; }
      setCardMounted(false);
    };
  }, [sdkReady]);

  /* Effect 2: Mount / remount express pay buttons whenever the cart total changes.
     This ensures Apple Pay and Google Pay always show the correct amount (incl. discounts).
     The card form above is intentionally separate and stays mounted. */
  useEffect(() => {
    const p = paymentsRef.current;
    if (!p || !paymentsReady || totalNum <= 0) return;
    let active = true;

    async function mountExpressPay() {
      if (!p || !active) return;

      const makeGPayRequest = () => p.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: totalNum.toFixed(2), label: "Noir & Blanc" },
        // Need contact info — Google Pay returns the buyer email in the billing contact.
        // Without this, buyerEmail is empty and Square rejects with "buyer_email_address is not valid".
        requestBillingContact: true,
        requestShippingContact: true,
      });

      const apSub = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
      const apDisc = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));
      const apSubAfterDisc = Math.max(apSub - apDisc, 0);
      const makeAPayRequest = () => p.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        lineItems: [
          { amount: apSubAfterDisc.toFixed(2), label: "Subtotal" },
          { amount: "0.00", label: "Shipping" },
        ],
        total: { amount: totalNum.toFixed(2), label: "Noir & Blanc" },
        requestBillingContact: false,
        requestShippingContact: true,
        shippingOptions: [{ id: "pending", label: "Calculating...", amount: "0.00" }],
      });

      // ── Google Pay ──
      try {
        const gp = await p.googlePay(makeGPayRequest());
        if (!active) { gp.destroy(); return; }
        try {
          await (gp.attach as any)("#sq-google-pay", { buttonType: "plain", buttonColor: "black", buttonSizeMode: "fill" });
        } catch (attachErr) {
          console.warn("[GPay] attach failed:", attachErr);
          gp.destroy();
          throw attachErr;
        }
        if (!active) { gp.destroy(); return; }

        const gpContainer = document.getElementById("sq-google-pay");
        if (gpContainer) {
          gpContainer.addEventListener("click", async () => {
            try {
              // Square googlePay.tokenize() returns the result directly — the
              // ontokenization event does not fire reliably, so use the return value.
              const r: any = await gp.tokenize!();
              if (!r || r.status !== "OK" || !r.token) {
                if (r?.status !== "Cancel") {
                  setPayError(r?.errors?.[0]?.message ?? `Google Pay failed (${r?.status})`);
                }
                return;
              }
              // Extract email + shipping contact from the Google Pay result
              const details = r.details ?? {};
              const billing = details?.card?.billing ?? details?.billing ?? {};
              const shipping = details?.shipping?.contact ?? details?.shipping ?? {};
              const gpEmail = billing.email || shipping.email || details?.email || r?.email || email;
              const gpAddress = {
                firstName: billing.givenName ?? shipping.givenName ?? address.firstName,
                lastName: billing.familyName ?? shipping.familyName ?? address.lastName,
                address1: (billing.addressLines ?? [])[0] ?? (shipping.addressLines ?? [])[0] ?? address.address1,
                address2: (billing.addressLines ?? [])[1] ?? address.address2,
                city: billing.city ?? shipping.city ?? address.city,
                state: billing.state ?? shipping.state ?? address.state,
                postcode: billing.postalCode ?? shipping.postalCode ?? address.postcode,
                country: ((billing.countryCode ?? shipping.countryCode ?? address.country) || "US").toUpperCase(),
                phone: billing.phone ?? shipping.phone ?? address.phone,
              };
              await chargeTokenRef.current(r.token, gpEmail, gpAddress);
            } catch (err: any) {
              const msg = String(err?.message ?? err ?? "");
              if (!/cancel|abort/i.test(msg)) setPayError("Google Pay failed. Please try again.");
            }
          });
        }
        googlePayRef.current = gp;
        setGooglePayMounted(true);
      } catch (gpErr) {
        console.info("[Square] Google Pay not available:", gpErr);
      }

      // ── Apple Pay — listener must be on paymentRequest, not on the ap button ──
      try {
        // Reset Apple Pay refs for this session
        applePayShipMethodRef.current = "";
        applePayShippingTotalRef.current = 0;
        applePayTotalRef.current = 0;
        applePayContactRef.current = null;

        const apRequest = makeAPayRequest() as any;

        // shippingcontactchanged must be registered on the paymentRequest object
        // shippingcontactchanged must be SYNCHRONOUS — Square does not await async handlers.
        // Return immediately with current cart rates; update WooCommerce in the background.
        apRequest.addEventListener("shippingcontactchanged", (contact: any) => {
          applePayContactRef.current = contact;

          const currentRates = cart?.availableShippingMethods?.[0]?.rates ?? [];
          const shippingOptions = currentRates.length > 0
            ? currentRates.map((r: ShippingRate) => ({ id: r.id, label: r.label, amount: money(r.cost).toFixed(2) }))
            : [{ id: "free_shipping", label: "Standard Shipping", amount: "0.00" }];

          const cheapest = currentRates.length > 0
            ? currentRates.reduce((a: ShippingRate, b: ShippingRate) => money(a.cost) <= money(b.cost) ? a : b)
            : { id: "free_shipping", cost: "0.00", label: "Standard Shipping", methodId: "" };

          applePayShipMethodRef.current = cheapest.id;
          const shipAmt = money(cheapest.cost);
          applePayShippingTotalRef.current = shipAmt;
          const sub = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
          const disc = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));
          const newTotal = Math.max(sub - disc + shipAmt, 0.01);
          applePayTotalRef.current = newTotal;

          const lineItems = [
            { amount: Math.max(sub - disc, 0).toFixed(2), label: "Subtotal" },
            { amount: shipAmt.toFixed(2), label: "Shipping" },
          ];
          const returnVal = { lineItems, shippingOptions, total: { amount: newTotal.toFixed(2), label: "Noir & Blanc" } };

          const city = contact?.city ?? "";
          const state = contact?.state ?? "";
          const postcode = contact?.postalCode ?? "";
          const country = (contact?.countryCode ?? "US").toUpperCase();
          updateCustomerShippingAddress({ address1: "", city, state, postcode, country })
            .then(updatedCart => {
              if (!updatedCart) return;
              const rates = updatedCart.availableShippingMethods?.[0]?.rates ?? [];
              if (rates.length === 0) return;
              const best = rates.reduce((a: ShippingRate, b: ShippingRate) => money(a.cost) <= money(b.cost) ? a : b);
              updateShippingMethod(best.id).catch(() => {});
              applePayShipMethodRef.current = best.id;
              const s = money(best.cost);
              applePayShippingTotalRef.current = s;
              const newSub = parseFloat((updatedCart.subtotal ?? "0").replace(/[^0-9.]/g, ""));
              const newDisc = parseFloat((updatedCart.discountTotal ?? "0").replace(/[^0-9.]/g, ""));
              applePayTotalRef.current = Math.max(newSub - newDisc + s, 0.01);
            })
            .catch(() => {});

          return returnVal;
        });

        apRequest.addEventListener("shippingoptionchanged", (option: any) => {
          const shipAmt = money(option?.amount);
          applePayShipMethodRef.current = option?.id ?? applePayShipMethodRef.current;
          applePayShippingTotalRef.current = shipAmt;
          const sub = parseFloat((cart?.subtotal ?? "0").replace(/[^0-9.]/g, ""));
          const disc = parseFloat((cart?.discountTotal ?? "0").replace(/[^0-9.]/g, ""));
          const newTotal = Math.max(sub - disc + shipAmt, 0.01);
          applePayTotalRef.current = newTotal;
          const lineItems = [
            { amount: Math.max(sub - disc, 0).toFixed(2), label: "Subtotal" },
            { amount: shipAmt.toFixed(2), label: "Shipping" },
          ];
          const returnVal = { lineItems, total: { amount: newTotal.toFixed(2), label: "Noir & Blanc" } };
          return returnVal;
        });

        const ap = await p.applePay(apRequest) as any;
        if (!active) { ap?.destroy?.(); return; }
        applePayRef.current = ap;
        setApplePayMounted(true);
      } catch (apErr) {
        console.info("[Square] Apple Pay not available:", apErr);
      }
    }

    // Tear down old buttons, clear Google Pay DOM div, then remount with fresh total
    if (googlePayRef.current) { googlePayRef.current.destroy(); googlePayRef.current = null; }
    if (applePayRef.current) { applePayRef.current.destroy(); applePayRef.current = null; }
    setGooglePayMounted(false);
    setApplePayMounted(false);

    // Square's destroy() doesn't clear the injected iframe from the DOM —
    // manually wipe the container so the next attach() call starts fresh.
    const gpDiv = document.getElementById("sq-google-pay");
    if (gpDiv) gpDiv.innerHTML = "";

    mountExpressPay();
    return () => {
      active = false;
      if (googlePayRef.current) { googlePayRef.current.destroy(); googlePayRef.current = null; }
      if (applePayRef.current) { applePayRef.current.destroy(); applePayRef.current = null; }
      setGooglePayMounted(false);
      setApplePayMounted(false);
    };
  }, [totalNum, paymentsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  async function chargeToken(token: string, overrideEmail?: string, overrideAddress?: typeof address, overrides?: { total?: number; shipMethod?: string; shipTotal?: number }) {
    if (honeypot || isBotEmail(email)) { setPaying(false); return; } // bot trap
    setPayError(null);
    setPaying(true);
    try {
      const wcItems = items.map((item) => ({
        productId:   item.product.node.databaseId,
        variationId: item.variation?.node.databaseId ?? undefined,
        quantity:    item.quantity,
        name:        item.product.node.name,
      }));

      const effectiveEmail   = overrideEmail   ?? email;
      const effectiveAddress = overrideAddress ?? address;
      const effectiveCountry = overrideAddress
        ? (overrideAddress.country.length === 2 ? overrideAddress.country : (COUNTRY_CODES[overrideAddress.country] ?? overrideAddress.country))
        : (COUNTRY_CODES[address.country] ?? address.country);
      const effectiveTotal      = overrides?.total     ?? totalNum;
      const effectiveShipMethod = overrides?.shipMethod ?? shipMethod;
      const effectiveShipTotal  = overrides?.shipTotal  ?? parseFloat((cart?.shippingTotal ?? "0").replace(/[^0-9.]/g, ""));

      const attribution = getAttribution();
      const res = await fetch("/api/square/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId:       token,
          amountCents:    Math.round(effectiveTotal * 100),
          buyerEmail:     effectiveEmail,
          billing:        { ...effectiveAddress, email: effectiveEmail, country: effectiveCountry },
          shipping:       { ...effectiveAddress, country: effectiveCountry },
          items:          wcItems,
          shippingMethod: effectiveShipMethod,
          shippingTotal:  effectiveShipTotal,
          coupons:        (cart?.appliedCoupons ?? []).map((c) => c.code),
          attribution:    {
            source:   attribution.source,
            medium:   attribution.medium ?? "",
            campaign: attribution.campaign ?? "",
            content:  attribution.content ?? "",
            referrer: attribution.referrer ?? "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.error ?? "Payment failed. Please try again.";
        setPayError(errMsg);
        setPaying(false);
        return;
      }
      // Save order details for the thank you page
      const orderData = {
        orderNumber: data.orderNumber ?? null,
        email: effectiveEmail,
        firstName: effectiveAddress.firstName,
        lastName: effectiveAddress.lastName,
        address: {
          address1: effectiveAddress.address1,
          address2: effectiveAddress.address2,
          city: effectiveAddress.city,
          state: effectiveAddress.state,
          postcode: effectiveAddress.postcode,
          country: effectiveAddress.country,
        },
        items: items.map((item) => ({
          // SKU matches Shopify Content ID in Meta catalog for dynamic ad matching
          productId: item.variation?.node.sku ?? item.product.node.sku ?? item.variation?.node.databaseId ?? item.product.node.databaseId,
          name: item.product.node.name,
          quantity: item.quantity,
          total: (parseFloat((item.product.node.price ?? "0").replace(/[^0-9.]/g, "")) * item.quantity).toFixed(2),
          image: item.product.node.image?.sourceUrl ?? null,
          variation: item.variation?.node.attributes.nodes.map((a) => `${a.value}`).join(" / ") ?? null,
        })),
        subtotal: cart?.subtotal ?? null,
        shippingTotal: cart?.shippingTotal ?? null,
        discountTotal: cart?.discountTotal ?? null,
        total: totalNum.toFixed(2),
        coupons: (cart?.appliedCoupons ?? []).map((c) => c.code),
      };
      try { sessionStorage.setItem("nb_order", JSON.stringify(orderData)); } catch {}
      setCart(null);
      const successParams = new URLSearchParams();
      if (data.orderNumber) successParams.set("order", data.orderNumber);
      else successParams.set("payment", data.paymentId);
      successParams.set("total", totalNum.toFixed(2));
      router.push(`/checkout/success?${successParams.toString()}`);
    } catch (err) {
      console.error("[chargeToken] threw:", err);
      setPayError("An unexpected error occurred. Please try again.");
      setPaying(false);
    }
  }

  async function handlePay() {
    if (!cardRef.current) return;
    // Bot trap: honeypot field filled = bot, silently reject
    if (honeypot) {
      setPaying(false);
      return;
    }
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

  // Sync ref every render so ontokenization listeners always call latest chargeToken
  chargeTokenRef.current = chargeToken;

  const hasExpressCheckout = googlePayMounted || applePayMounted;

  return (
    <><div className="min-h-screen bg-white checkout-font" style={{ fontFamily: '"Poppins", sans-serif' }}>

      {/* ── Header ── */}
      <header className="border-b border-[#E0E0E0] bg-white">
        {/* Mobile header: logo + social proof + cart */}
        <div className="lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="w-8" />
            <Link href="/" className="flex flex-col items-center">
              <img src="/nb-logo.svg" alt="Noir & Blanc" className="h-8 w-auto" />
            </Link>
            <Link href="/shop" className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#1a1a1a] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </Link>
          </div>
          {/* Social proof strip */}
          <div className="border-t border-[#F0F0F0] px-4 py-2 flex items-center gap-3">
            <img src="/checkout-icons/avatars.svg" alt="Happy customers" className="h-7 w-auto flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-[#1a1a1a] leading-tight">18,347+ HAPPY CUSTOMERS</span>
              <div className="flex items-center gap-3 text-[10px] text-[#555] font-medium mt-0.5">
                <span className="flex items-center gap-1"><img src="/checkout-icons/truck.svg" alt="" className="h-3 w-auto" />Fast Shipping</span>
                <span className="flex items-center gap-1"><img src="/checkout-icons/security.svg" alt="" className="h-3 w-auto" />1-Year warranty</span>
                <span className="flex items-center gap-1"><img src="/checkout-icons/lock.svg" alt="" className="h-3 w-auto" />Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
        {/* Desktop header: full social proof banner */}
        <div className="hidden lg:flex w-full px-8 py-3 items-center justify-between">
          <div className="flex items-center justify-center gap-5 flex-1">
            <Link href="/" className="flex-shrink-0 flex flex-col items-center">
              <img src="/nb-logo.svg" alt="Noir & Blanc" className="h-10 w-auto" />
            </Link>
            <div className="w-px bg-[#1a1a1a] mx-1" style={{ height: 56 }} />
            <div className="flex flex-col items-start gap-1.5">
              <img src="/checkout-icons/avatars.svg" alt="Happy customers" className="h-10 w-auto" />
              <img src="/checkout-icons/stars.svg" alt="5 stars" className="h-[14px] w-auto" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[20px] lg:text-[26px] font-semibold text-[#1a1a1a] leading-none tracking-tight">18,347+ HAPPY CUSTOMERS</span>
              <div className="flex items-center gap-5 text-[12px] text-[#333] font-medium">
                <div className="flex items-center gap-1.5"><img src="/checkout-icons/truck.svg" alt="" className="h-[18px] w-auto" /><span>Fast Shipping</span></div>
                <div className="flex items-center gap-1.5"><img src="/checkout-icons/security.svg" alt="" className="h-[18px] w-auto" /><span>1-Year warranty</span></div>
                <div className="flex items-center gap-1.5"><img src="/checkout-icons/lock.svg" alt="" className="h-[18px] w-auto" /><span>Secure Checkout</span></div>
              </div>
            </div>
          </div>
          <Link href="/shop" className="flex-shrink-0 relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#1a1a1a] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Mobile order summary toggle (top bar) ── */}
      <div className="lg:hidden border-b border-[#E0E0E0] bg-[#F5F5F5]">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-2 text-[#1a1a1a] text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="font-medium">Order summary</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#1a1a1a]">${totalNum.toFixed(2)}</span>
        </button>
        {summaryOpen && (
          <div className="px-4 py-4 bg-white border-t border-[#E0E0E0]">
            <OrderSummary discountCode={discountCode} setDiscountCode={setDiscountCode} addressReady={addressReady} />
          </div>
        )}
      </div>

      {/* ── Main layout: true full-bleed two-col — left=white, right=gray ── */}
      <div className="lg:flex lg:min-h-screen">

        {/* LEFT column: white, ~53% width. Form is RIGHT-aligned (toward divider), max-w 580px, 40px padding — matches Shopify exactly */}
        <div className="lg:w-[53%] bg-white flex lg:justify-end">
          <div className="w-full max-w-[580px] px-4 sm:px-6 lg:pl-10 lg:pr-10">
          <div className="py-8 lg:py-10">

            {/* Express checkout — ALWAYS render these divs so Square's iframe is never destroyed by React */}
            <div className={hasExpressCheckout ? "mb-6" : ""}>
              {hasExpressCheckout && (
                <p className="text-xs text-center text-[#717171] mb-3 font-medium tracking-wide uppercase">Express checkout</p>
              )}
              {/* When 2 buttons: side by side. When 1: centered with max-width */}
              <div className={`flex gap-3 ${googlePayMounted && applePayMounted ? "" : "justify-center"}`}>
                {/* Google Pay — Square injects iframe here; never unmount this div */}
                <div
                  id="sq-google-pay"
                  style={{
                    height: googlePayMounted ? 48 : 0,
                    overflow: "hidden",
                    borderRadius: 5,
                    flex: googlePayMounted && applePayMounted ? "1" : "0 0 auto",
                    minWidth: googlePayMounted && !applePayMounted ? 240 : undefined,
                    width: googlePayMounted && applePayMounted ? "100%" : undefined,
                  }}
                />
                {/* Apple Pay */}
                {applePayMounted && (
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  <button
                    type="button"
                    onClick={async () => {
                      const ap = applePayRef.current as any;
                      if (!ap) return;
                      try {
                        const result: SqTokenResult & { details?: any } = await ap.tokenize();
                        if (!result || result.status !== "OK" || !result.token) {
                          // User dismissing the Apple Pay sheet returns status "Cancel" — not an error
                          if (result?.status !== "Cancel") {
                            setPayError(result?.errors?.[0]?.message ?? `Apple Pay failed (${result?.status})`);
                          }
                          return;
                        }
                        const billing = result.details?.card?.billing ?? result.details?.billing ?? {};
                        const shipping = result.details?.shipping?.contact ?? applePayContactRef.current ?? {};
                        const apEmail = billing.email || shipping.email || email;
                        const apAddress = {
                          firstName: billing.givenName ?? shipping.givenName ?? address.firstName,
                          lastName: billing.familyName ?? shipping.familyName ?? address.lastName,
                          address1: (billing.addressLines ?? [])[0] ?? (shipping.addressLines ?? [])[0] ?? address.address1,
                          address2: (billing.addressLines ?? [])[1] ?? address.address2,
                          city: billing.city ?? shipping.city ?? address.city,
                          state: billing.state ?? shipping.state ?? address.state,
                          postcode: billing.postalCode ?? shipping.postalCode ?? address.postcode,
                          country: ((billing.countryCode ?? shipping.countryCode ?? address.country) || "US").toUpperCase(),
                          phone: billing.phone ?? shipping.phone ?? address.phone,
                        };
                        const overrides = {
                          total: applePayTotalRef.current > 0 ? applePayTotalRef.current : undefined,
                          shipMethod: applePayShipMethodRef.current || undefined,
                          shipTotal: applePayShippingTotalRef.current > 0 ? applePayShippingTotalRef.current : undefined,
                        };
                        await chargeTokenRef.current(result.token, apEmail, apAddress, overrides);
                      } catch (err: any) {
                        // Suppress cancel/abort errors from dismissing the sheet
                        const msg = String(err?.message ?? err ?? "");
                        if (!/cancel|abort/i.test(msg)) {
                          setPayError("Apple Pay failed. Please try again.");
                        }
                        console.error("[Apple Pay] tokenize threw:", err);
                      }
                    }}
                    className="apple-pay-button"
                    style={{ flex: googlePayMounted ? "1" : "0 0 240px" }}
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
                <button className="text-sm text-[#1a1a1a] underline hover:opacity-70">Sign in</button>
              </div>
              <div className="space-y-3">
                <Field
                  id="contact-email"
                  label="Email or mobile phone number"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                {/* Honeypot — hidden from real users, bots fill it */}
                <input
                  type="text"
                  name="phone_number_backup"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
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
                  onChange={(v) => { const a = { ...address, country: v, state: "" }; setAddress(a); handleAddressChange(a); }}
                  options={wcCountries.length ? wcCountries.map((c) => c.name) : ["United States", "Canada", "United Kingdom", "Australia"]}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="First name (optional)" value={address.firstName} onChange={(v) => setAddress({ ...address, firstName: v })} autoComplete="given-name" />
                  <Field label="Last name" value={address.lastName} onChange={(v) => setAddress({ ...address, lastName: v })} autoComplete="family-name" />
                </div>
                <AddressAutocomplete
                  label="Address"
                  value={address.address1}
                  autoComplete="street-address"
                  onChange={(v) => { const a = { ...address, address1: v }; setAddress(a); handleAddressChange(a); }}
                  onSelectPlace={(place) => {
                    // Map ISO country code (e.g. "US") to the WooCommerce country name the select expects
                    const wcCountry = wcCountries.find((c) => c.code === place.countryCode);
                    const a = {
                      ...address,
                      address1: place.address1 || address.address1,
                      city: place.city,
                      state: place.state,
                      postcode: place.postcode,
                      country: wcCountry?.name ?? address.country,
                    };
                    setAddress(a);
                    handleAddressChange(a);
                  }}
                />
                <Field label="Apartment, suite, etc. (optional)" value={address.address2 ?? ""} onChange={(v) => setAddress({ ...address, address2: v })} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="City" value={address.city} onChange={(v) => { const a = { ...address, city: v }; setAddress(a); handleAddressChange(a); }} autoComplete="address-level2" />
                  {(() => {
                    const selectedCountry = wcCountries.find((c) => c.name === address.country);
                    const states = selectedCountry?.states ?? [];
                    return states.length > 0 ? (
                      <SelectField
                        label="State"
                        value={address.state}
                        onChange={(v) => { const a = { ...address, state: v }; setAddress(a); handleAddressChange(a); }}
                        options={["—", ...states.map((s) => s.code)]}
                      />
                    ) : (
                      <Field label="State / Province" value={address.state} onChange={(v) => { const a = { ...address, state: v }; setAddress(a); handleAddressChange(a); }} />
                    );
                  })()}
                  <Field label="ZIP code" value={address.postcode} onChange={(v) => { const a = { ...address, postcode: v }; setAddress(a); handleAddressChange(a); }} autoComplete="postal-code" />
                </div>
                <Field
                  label="Phone (optional)"
                  type="tel"
                  value={address.phone ?? ""}
                  onChange={(v) => setAddress({ ...address, phone: v })}
                  autoComplete="tel"
                />
                <p className="text-xs text-[#757575] -mt-1">May be used to assist delivery</p>
              </div>
            </section>

            {/* Shipping method */}
            <section className="mb-6">
              <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">Shipping method</h2>
              {addressReady && availableRates.length > 0 ? (
                <div className="border border-[#D4D4D4] rounded-[5px] overflow-hidden divide-y divide-[#E0E0E0]">
                  {availableRates.map((rate) => {
                    const isSelected = shipMethod === rate.id;
                    // Always use rate.cost for display; for selected rate override with WC's computed shippingTotal
                    // (WC applies coupon/discount logic to shippingTotal, so it's the authoritative value)
                    const rateCost = parseFloat(rate.cost ?? "0") || 0;
                    const wcShipping = parseFloat((cart?.shippingTotal ?? "0").replace(/[^0-9.]/g, "") || "0");
                    const displayCost = isSelected ? wcShipping : rateCost;
                    const isFree = displayCost === 0;
                    return (
                      <label
                        key={rate.id}
                        className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#F0F5FF]" : "bg-white hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ship"
                            value={rate.id}
                            checked={isSelected}
                            onChange={async () => {
                              setShipMethod(rate.id);
                              const updated = await updateShippingMethod(rate.id);
                              if (updated) setCart(updated);
                            }}
                            className="accent-[#1a1a1a]"
                          />
                          <p className="text-sm font-medium text-[#1a1a1a]">{rate.label}</p>
                        </div>
                        <span className={`text-sm font-medium ${isFree ? "text-[#007A5C]" : "text-[#1a1a1a]"}`}>
                          {isFree ? "FREE" : `$${displayCost.toFixed(2)}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-[#D4D4D4] rounded-[5px] px-4 py-3 bg-[#FAFAFA]">
                  <p className="text-sm text-[#717171]">
                    {addressReady ? "Calculating shipping rates…" : "Enter your shipping address to view available shipping methods."}
                  </p>
                </div>
              )}
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

              <div className="border border-[#D4D4D4] rounded-[8px] overflow-hidden">
                {/* Tab header */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-[#F6F6F6] border-b border-[#D4D4D4]">
                  <span className="text-sm font-semibold text-[#1a1a1a]">Credit card</span>
                  <div className="flex items-center gap-1.5 relative group">
                    {[
                      { name: "VISA", src: "/checkout-icons/visa.svg" },
                      { name: "Mastercard", src: "/checkout-icons/mastercard.svg" },
                      { name: "Amex", src: "/checkout-icons/amex.svg" },
                    ].map((card) => (
                      <img key={card.name} src={card.src} alt={card.name} width={38} height={24} className="rounded-[3px]" />
                    ))}
                    <div className="relative">
                      <button className="bg-white border border-[#E0E0E0] rounded px-1.5 text-[9px] font-semibold text-[#555] h-6 flex items-center hover:border-[#999] transition-colors">+5</button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-wrap gap-1 bg-[#1a1a1a] rounded-[6px] p-2 w-[140px] z-10 shadow-lg">
                        {[
                          { name: "Discover", src: "/checkout-icons/discover.svg" },
                          { name: "Diners", src: "/checkout-icons/diners.svg" },
                          { name: "Elo", src: "/checkout-icons/elo.svg" },
                          { name: "JCB", src: "/checkout-icons/jcb.svg" },
                          { name: "UnionPay", src: "/checkout-icons/unionpay.svg" },
                        ].map((card) => (
                          <img key={card.name} src={card.src} alt={card.name} width={38} height={24} className="rounded-[3px]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Square card form */}
                <div className="p-4 bg-white">
                  {!cardMounted && (
                    <div className="flex items-center justify-center h-[160px]">
                      <svg className="animate-spin h-5 w-5 text-neutral-300" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                  <div id="sq-card" className={!cardMounted ? "hidden" : ""} />
                </div>
              </div>

              {/* Billing address toggle */}
              <div className="mt-3 border border-[#D4D4D4] rounded-[5px] overflow-hidden">
                <label className="flex items-center gap-2.5 cursor-pointer px-4 py-3">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D4D4D4] accent-[#1a1a1a]"
                  />
                  <span className="text-sm text-[#1a1a1a]">Use shipping address as billing address</span>
                </label>
                {/* Billing address form — shown when unchecked */}
                {!sameAsBilling && (
                  <div className="border-t border-[#E0E0E0] px-4 pb-4 pt-3 space-y-3">
                    <SelectField
                      label="Country/Region"
                      value={billingAddress.country}
                      onChange={(v) => setBillingAddress({ ...billingAddress, country: v, state: "" })}
                      options={wcCountries.length ? wcCountries.map((c) => c.name) : ["United States", "Canada", "United Kingdom", "Australia"]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="First name (optional)" value={billingAddress.firstName} onChange={(v) => setBillingAddress({ ...billingAddress, firstName: v })} autoComplete="billing given-name" />
                      <Field label="Last name" value={billingAddress.lastName} onChange={(v) => setBillingAddress({ ...billingAddress, lastName: v })} autoComplete="billing family-name" />
                    </div>
                    <Field label="Address" value={billingAddress.address1} onChange={(v) => setBillingAddress({ ...billingAddress, address1: v })} autoComplete="billing street-address" />
                    <Field label="Apartment, suite, etc. (optional)" value={billingAddress.address2 ?? ""} onChange={(v) => setBillingAddress({ ...billingAddress, address2: v })} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="City" value={billingAddress.city} onChange={(v) => setBillingAddress({ ...billingAddress, city: v })} autoComplete="billing address-level2" />
                      {(() => {
                        const selectedCountry = wcCountries.find((c) => c.name === billingAddress.country);
                        const states = selectedCountry?.states ?? [];
                        return states.length > 0 ? (
                          <SelectField label="State" value={billingAddress.state} onChange={(v) => setBillingAddress({ ...billingAddress, state: v })} options={["—", ...states.map((s) => s.code)]} />
                        ) : (
                          <Field label="State / Province" value={billingAddress.state} onChange={(v) => setBillingAddress({ ...billingAddress, state: v })} />
                        );
                      })()}
                      <Field label="ZIP code" value={billingAddress.postcode} onChange={(v) => setBillingAddress({ ...billingAddress, postcode: v })} autoComplete="billing postal-code" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Mobile: Add discount + Total accordion ── */}
            <div className="lg:hidden mb-5">
              {!discountOpen ? (
                /* ── Collapsed: pill + Total row ── */
                <div className="space-y-3">
                  <button
                    onClick={() => setDiscountOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#D4D4D4] rounded-full text-sm font-medium text-[#1a1a1a] bg-white"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    Add discount
                  </button>
                  <button onClick={() => setDiscountOpen(true)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {items[0]?.product.node.image && (
                        <div className="w-10 h-10 rounded-[6px] border border-[#E0E0E0] overflow-hidden bg-white flex-shrink-0">
                          <img src={items[0].product.node.image.sourceUrl} alt="" className="w-full h-full object-contain p-0.5" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#1a1a1a]">Total</p>
                        <p className="text-xs text-[#717171]">{items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#717171]">USD</span>
                      <span className="text-base font-bold text-[#1a1a1a]">${totalNum.toFixed(2)}</span>
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </button>
                </div>
              ) : (
                /* ── Expanded: full order summary replaces pill + Total row ── */
                <div>
                  <button onClick={() => setDiscountOpen(false)} className="w-full flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-[#1a1a1a]">Order summary</span>
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="rotate-180"><path d="M2 4l4 4 4-4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <OrderSummary discountCode={discountCode} setDiscountCode={setDiscountCode} addressReady={addressReady} />
                </div>
              )}
            </div>

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
              ) : "Pay now"}
            </button>

            {/* Footer links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 pb-10 text-xs text-[#717171]">
              {["Refund policy","Shipping","Privacy policy","Terms of service","Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-[#1a1a1a] hover:underline transition-colors">{l}</a>
              ))}
            </div>
          </div>{/* end py-8 */}
          </div>{/* end max-w-[580px] */}
        </div>{/* end left column */}

        {/* RIGHT column: gray sticky order summary (desktop only), ~47% width matching Shopify */}
        <div className="hidden lg:flex lg:flex-col lg:w-[47%] bg-[#F5F5F5] border-l border-[#E0E0E0]">
          <div className="sticky top-0 flex justify-start">
            {/* Inner content: 480px wide, 40px padding — matches Shopify exactly */}
            <div className="w-full py-10" style={{ maxWidth: 560, paddingLeft: 40, paddingRight: 40 }}>
              <OrderSummary discountCode={discountCode} setDiscountCode={setDiscountCode} addressReady={addressReady} />
            </div>
          </div>
        </div>

      </div>{/* end lg:flex */}

    </div>
    </>
  );
}
