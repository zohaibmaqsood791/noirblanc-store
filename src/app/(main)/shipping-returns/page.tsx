import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy",
};

export default function ShippingReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 mb-10">Shipping Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Processing Your Order</h2>
            <p>Orders are fulfilled Monday through Friday. Please note, orders are not shipped or delivered on Sundays or holidays. High order volumes may cause delays — please allow extra transit time during peak periods. We will contact you via email or phone if a significant delay occurs.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Shipping Options & Delivery Estimates</h2>
            <p>We offer <strong>Free Standard Shipping</strong> on all orders.</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Handling time: 0–3 business days</li>
              <li>Transit time: 8–12 business days</li>
              <li>Total estimated delivery time: 8–15 business days</li>
            </ul>
            <p className="mt-3">Delivery timeframes are estimates. Actual times may vary based on your location, weather conditions, and other external factors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Order Confirmation</h2>
            <p>You will receive an order confirmation email immediately after purchase. We will ship your order within 1 business day after receiving it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Shipment Confirmation & Order Tracking</h2>
            <p>You will receive a Shipment Confirmation email once your order has shipped, containing your tracking number(s). Tracking numbers become active within 24 hours of shipment.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Returns</h2>
            <p>We offer fast and easy returns on all orders within 30 days of order placement. To begin a return, please contact us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
            <p className="mt-2">Items must be unused, unaltered, and in their original packaging. Once received and inspected, we will notify you by email whether your refund is approved or denied. Please allow 10 days for the refund to be processed once approved.</p>
            <p className="mt-2">No restocking fees apply. The cost of the return label is the customer's responsibility. Shipping costs are non-refundable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Exchanges</h2>
            <p>We only replace items if they are defective or damaged. If you need an exchange, please contact us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a> for instructions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Return Shipping</h2>
            <p>Customers are responsible for return shipping costs. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.</p>
            <p className="mt-2">If you are shipping an item over $75, we recommend using a trackable shipping service or purchasing shipping insurance. We cannot guarantee that we will receive your returned item.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Contact</h2>
            <p>Questions about shipping? Email us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
