import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Refund Policy</h1>
          <p className="text-neutral-500">Last updated: June 2025</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-8">

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Overview</h2>
            <p className="text-neutral-600">
              We want you to be completely satisfied with your purchase. If you are not happy with your order, we will work with you to make it right. Please read our refund policy carefully before making a purchase.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Returns & Refunds</h2>
            <p className="text-neutral-600 mb-3">
              We accept returns within <strong>30 days</strong> of the delivery date. To be eligible for a return, items must be:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-neutral-600">
              <li>In their original, unworn condition</li>
              <li>With all original tags attached</li>
              <li>In the original packaging</li>
              <li>Not marked as final sale</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">How to Initiate a Return</h2>
            <p className="text-neutral-600 mb-3">To start a return, please contact us at <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a> with:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-600">
              <li>Your order number</li>
              <li>The item(s) you wish to return</li>
              <li>The reason for the return</li>
            </ol>
            <p className="text-neutral-600 mt-3">
              We will send you a prepaid return shipping label within 1–2 business days.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Refund Processing</h2>
            <p className="text-neutral-600">
              Once we receive your return and inspect the item(s), we will process your refund within <strong>3–5 business days</strong>. Refunds are credited to the original payment method. Please allow your bank or credit card company an additional 3–5 business days to post the credit to your account.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Non-Refundable Items</h2>
            <p className="text-neutral-600 mb-3">The following items are not eligible for a refund:</p>
            <ul className="list-disc list-inside space-y-1.5 text-neutral-600">
              <li>Final sale items</li>
              <li>Items that have been worn, damaged, or altered</li>
              <li>Items returned after 30 days of delivery</li>
              <li>Shipping and handling charges (unless the error was ours)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Defective or Incorrect Items</h2>
            <p className="text-neutral-600">
              If you received a defective item or the wrong product, please contact us within <strong>7 days</strong> of delivery. We will provide a full refund or replacement at no cost to you, including return shipping.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Exchanges</h2>
            <p className="text-neutral-600">
              We offer exchanges for a different size or color, subject to availability. To exchange an item, follow the same process as a return and specify the item you would like instead.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold mb-3">Contact Us</h2>
            <p className="text-neutral-600">
              For any questions about our refund policy, please contact us at{" "}
              <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a> or visit our{" "}
              <Link href="/contact" className="text-black underline">Contact page</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
