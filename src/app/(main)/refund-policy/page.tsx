import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 mb-10">Return Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Returns</h2>
            <p>We offer fast and easy returns on all orders within 30 days of order placement. If 30 days have passed since your purchase, we cannot offer a refund or exchange.</p>
            <p className="mt-2">To begin the return process, please contact us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
            <p className="mt-2">To be eligible for a return, your item must be unused, unaltered, and in the same condition you received it, in its original packaging.</p>
            <p className="mt-2">Once your return is received and inspected, we will email you to notify you of receipt and whether your refund has been approved or denied. Please allow 10 days for the refund to be processed once approved.</p>
            <p className="mt-2">This policy applies to transactions in USD. The amount will automatically be converted into the customer's local currency as needed. No restocking charges apply to returns. The cost of the return label is the customer's responsibility.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Exchanges</h2>
            <p>We only replace items if they are defective or damaged. If you need to exchange an item, please contact us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a> for instructions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Return Shipping</h2>
            <p>Customers are responsible for paying return shipping costs. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.</p>
            <p className="mt-2">If you are shipping an item over $75, we recommend using a trackable shipping service or purchasing shipping insurance. We cannot guarantee that we will receive your returned item.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Contact</h2>
            <p>Questions about returns? Email us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
