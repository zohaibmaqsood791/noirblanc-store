"use client";

import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, XCircle, ExternalLink, Search } from "lucide-react";

interface TrackingResult {
  orderNumber: string;
  status: string;
  rawStatus: string;
  dateCreated: string;
  total: string;
  currency: string;
  items: { name: string; quantity: number }[];
  tracking: {
    provider: string;
    number: string;
    url: string;
    dateShipped: string | null;
    lastEvent?: string | null;
    lastEventTime?: string | null;
    live?: boolean;
    events?: { description: string; location: string | null; time: string | null }[];
  } | null;
  shipping: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

const IN_TRANSIT = ["Shipped", "In Transit", "Out for Delivery"];
const PENDING    = ["Processing", "On Hold", "Pending Payment", "Pending"];
const PROBLEM    = ["Cancelled", "Refunded", "Delivery Issue", "Exception", "Expired"];

function StatusIcon({ status }: { status: string }) {
  if (status === "Delivered")        return <CheckCircle className="text-green-600" size={22} />;
  if (IN_TRANSIT.includes(status))   return <Truck className="text-blue-600" size={22} />;
  if (PENDING.includes(status))      return <Clock className="text-yellow-600" size={22} />;
  if (PROBLEM.includes(status))      return <XCircle className="text-red-500" size={22} />;
  return <Package className="text-neutral-500" size={22} />;
}

function StatusBadge({ status }: { status: string }) {
  let cls = "bg-neutral-100 text-neutral-700";
  if (status === "Delivered")      cls = "bg-green-100 text-green-800";
  else if (IN_TRANSIT.includes(status)) cls = "bg-blue-100 text-blue-800";
  else if (PENDING.includes(status))    cls = "bg-yellow-100 text-yellow-800";
  else if (PROBLEM.includes(status))    cls = "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [result, setResult]           = useState<TrackingResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Order not found."); }
      else { setResult(data); }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Track Your Order</h1>
          <p className="text-sm text-neutral-500 mt-1">Enter your order number and email to see the latest update.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Order Number
            </label>
            <input
              type="text"
              placeholder="#14991"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-sm font-semibold py-3.5 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-pulse">Looking up your order...</span>
            ) : (
              <><Search size={15} /> Track Order</>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">

            {/* Status card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={result.status} />
                  <span className="font-semibold text-neutral-900">Order #{result.orderNumber}</span>
                </div>
                <StatusBadge status={result.status} />
              </div>

              <div className="text-sm text-neutral-500 space-y-1">
                <p>Placed: {new Date(result.dateCreated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                <p>Total: <span className="font-medium text-neutral-800">${parseFloat(result.total).toFixed(2)}</span></p>
              </div>
            </div>

            {/* Tracking info */}
            {result.tracking ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-sm text-neutral-800 flex items-center gap-2 mb-4">
                  <Truck size={16} /> Shipment Tracking
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Carrier</span>
                    <span className="font-medium text-neutral-800">{result.tracking.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tracking #</span>
                    <span className="font-mono text-neutral-800">{result.tracking.number}</span>
                  </div>
                  {result.tracking.dateShipped && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipped</span>
                      <span className="text-neutral-800">
                        {new Date(result.tracking.dateShipped).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Full tracking timeline (newest first) */}
                {result.tracking.events && result.tracking.events.length > 0 ? (
                  <div className="mt-5 pt-4 border-t border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Tracking History</p>
                    <ol className="relative border-l border-neutral-200 ml-1.5 space-y-4">
                      {result.tracking.events.map((ev, i) => (
                        <li key={i} className="ml-4">
                          <span className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-[#538125]" : "bg-neutral-300"}`} />
                          <p className={`text-sm ${i === 0 ? "text-neutral-900 font-medium" : "text-neutral-700"}`}>{ev.description}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {ev.location ? `${ev.location} · ` : ""}
                            {ev.time ? new Date(ev.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : result.tracking.live === false ? (
                  <p className="mt-4 text-xs text-neutral-400">
                    Live tracking is being set up for this shipment — detailed scans will appear here shortly. Use &ldquo;Track Package&rdquo; below for the latest from the carrier.
                  </p>
                ) : null}
                {result.tracking.url ? (
                  <a
                    href={result.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-neutral-200 text-sm font-semibold py-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Track on Carrier Site <ExternalLink size={14} />
                  </a>
                ) : (
                  <a
                    href={`https://t.17track.net/en#nums=${result.tracking.number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-neutral-200 text-sm font-semibold py-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Track Package <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <Clock className="mx-auto text-neutral-300 mb-2" size={28} />
                <p className="text-sm font-medium text-neutral-700">Not yet shipped</p>
                <p className="text-xs text-neutral-400 mt-1">Your order is being prepared. You&apos;ll receive a tracking number once it ships.</p>
              </div>
            )}

            {/* Items */}
            {result.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-sm text-neutral-800 flex items-center gap-2 mb-3">
                  <Package size={16} /> Items
                </h2>
                <ul className="space-y-2">
                  {result.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-neutral-700">{item.name}</span>
                      <span className="text-neutral-500">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shipping address */}
            {result.shipping.address1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-sm text-neutral-800 mb-2">Shipping To</h2>
                <address className="not-italic text-sm text-neutral-600 leading-relaxed">
                  {result.shipping.name && <>{result.shipping.name}<br /></>}
                  {result.shipping.address1}<br />
                  {result.shipping.address2 && <>{result.shipping.address2}<br /></>}
                  {result.shipping.city}, {result.shipping.state} {result.shipping.postcode}<br />
                  {result.shipping.country}
                </address>
              </div>
            )}

            {/* Help */}
            <p className="text-center text-xs text-neutral-400">
              Need help?{" "}
              <a href="mailto:hello@noirblancny.com" className="underline text-neutral-600">
                hello@noirblancny.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
