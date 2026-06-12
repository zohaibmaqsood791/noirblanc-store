import Link from "next/link";
import { Truck, RotateCcw, Clock, MapPin } from "lucide-react";

export default function ShippingReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Shipping & Returns
          </h1>
          <p className="text-neutral-500 text-lg">
            Free shipping on US orders over $75. Easy returns within 30 days.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        {/* Quick overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On US orders over $75" },
            { icon: Clock, title: "5–7 Business Days", desc: "Standard US delivery" },
            { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free, prepaid label" },
            { icon: MapPin, title: "Ships from NYC", desc: "Orders processed in 1–2 days" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-[#FAFAFA] rounded-2xl p-5">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-6">Shipping Policy</h2>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-base mb-3">Domestic Shipping (United States)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA]">
                      <th className="text-left font-semibold py-3 px-4 rounded-tl-xl">Method</th>
                      <th className="text-left font-semibold py-3 px-4">Delivery Time</th>
                      <th className="text-left font-semibold py-3 px-4 rounded-tr-xl">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4">Standard Shipping</td>
                      <td className="py-3 px-4 text-neutral-500">5–7 business days</td>
                      <td className="py-3 px-4 text-neutral-500">$7.99 (Free over $75)</td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4">Expedited Shipping</td>
                      <td className="py-3 px-4 text-neutral-500">2–3 business days</td>
                      <td className="py-3 px-4 text-neutral-500">$14.99</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Overnight Shipping</td>
                      <td className="py-3 px-4 text-neutral-500">Next business day</td>
                      <td className="py-3 px-4 text-neutral-500">$29.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3">International Shipping</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#FAFAFA]">
                      <th className="text-left font-semibold py-3 px-4 rounded-tl-xl">Region</th>
                      <th className="text-left font-semibold py-3 px-4">Delivery Time</th>
                      <th className="text-left font-semibold py-3 px-4 rounded-tr-xl">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4">Canada</td>
                      <td className="py-3 px-4 text-neutral-500">7–10 business days</td>
                      <td className="py-3 px-4 text-neutral-500">$15.99</td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4">Europe</td>
                      <td className="py-3 px-4 text-neutral-500">10–14 business days</td>
                      <td className="py-3 px-4 text-neutral-500">$24.99</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Rest of World</td>
                      <td className="py-3 px-4 text-neutral-500">14–21 business days</td>
                      <td className="py-3 px-4 text-neutral-500">$34.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                * International customers are responsible for all customs duties, import taxes, and fees. These are not included in our shipping charges.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">Order Processing</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Orders placed before 2 PM EST Monday–Friday are processed the same day. Orders placed after 2 PM, on weekends, or on holidays will be processed the next business day. You&apos;ll receive a shipping confirmation email with tracking once your order ships.
              </p>
            </div>
          </div>
        </div>

        {/* Returns */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-6">Return Policy</h2>

          <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
            <div className="bg-[#FAFAFA] rounded-2xl p-6">
              <h3 className="font-semibold text-black mb-2">30-Day Returns</h3>
              <p>
                We accept returns within <strong>30 days</strong> of the delivery date. Items must be in their original, unworn condition with all tags attached and original packaging included.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">How to Return</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Email <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a> with your order number and reason for return.</li>
                <li>We&apos;ll send a prepaid return label within 1–2 business days.</li>
                <li>Pack your item securely and drop it off at any UPS or USPS location.</li>
                <li>Your refund will be processed within 3–5 business days of receipt.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">Non-Returnable Items</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Final sale items</li>
                <li>Items marked as non-returnable on the product page</li>
                <li>Items that have been worn, washed, or damaged</li>
                <li>Items without original tags and packaging</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">Exchanges</h3>
              <p>
                We&apos;re happy to exchange items for a different size or color, subject to availability. Contact us with your order number and what you&apos;d like to exchange for.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-2">Refunds</h3>
              <p>
                Refunds are issued to the original payment method. Please allow 3–5 business days for processing after we receive your return, plus additional time for your bank to post the credit.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-10 text-center">
          <p className="text-sm text-neutral-500 mb-4">Still have questions?</p>
          <Link
            href="/contact"
            className="inline-block bg-black text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  );
}
