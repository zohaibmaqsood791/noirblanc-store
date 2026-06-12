import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-neutral-500">Last updated: June 2025</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 space-y-10 text-sm leading-relaxed text-neutral-600">

        <div>
          <p>
            Welcome to Noir & Blanc. By accessing or using our website at noirblanc.store, you agree to be bound by these Terms of Service. Please read them carefully before placing an order or using our services.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">1. Acceptance of Terms</h2>
          <p>
            By using this website, you confirm that you are at least 18 years of age and agree to comply with and be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our website.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">2. Products & Pricing</h2>
          <p className="mb-3">
            We reserve the right to modify, discontinue, or update product descriptions, images, and pricing at any time without notice. We make every effort to display accurate product information, but we do not warrant that product descriptions or prices are error-free.
          </p>
          <p>
            In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect price and will notify you promptly.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">3. Orders & Payment</h2>
          <p className="mb-3">
            By placing an order, you represent that you are authorized to use the payment method provided. All orders are subject to availability and confirmation of the order price. We reserve the right to refuse or cancel any order at our discretion.
          </p>
          <p>
            Payment is processed securely by Square. We accept Visa, Mastercard, American Express, Discover, Apple Pay, and Google Pay.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">4. Shipping & Delivery</h2>
          <p>
            Delivery times are estimates only and not guaranteed. We are not responsible for delays caused by carriers, customs, weather, or other circumstances outside our control. Risk of loss and title for items pass to you upon delivery to the carrier. For full details, see our{" "}
            <Link href="/shipping-returns" className="text-black underline">Shipping & Returns</Link> page.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">5. Returns & Refunds</h2>
          <p>
            Our return and refund policy is outlined in detail on our{" "}
            <Link href="/refund-policy" className="text-black underline">Refund Policy</Link> page. By making a purchase, you agree to the terms of that policy.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">6. Intellectual Property</h2>
          <p>
            All content on this website, including text, images, logos, graphics, and software, is the property of Noir & Blanc and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">7. User Conduct</h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Use our website for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Transmit any harmful, offensive, or disruptive content</li>
            <li>Impersonate any person or entity</li>
            <li>Engage in any activity that interferes with the proper functioning of our website</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">8. Disclaimer of Warranties</h2>
          <p>
            Our website and products are provided &quot;as is&quot; without any warranties, express or implied. We do not warrant that our website will be uninterrupted, error-free, or free of viruses or other harmful components. To the fullest extent permitted by law, we disclaim all warranties.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Noir & Blanc shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products, even if we have been advised of the possibility of such damages.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">10. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of New York County, New York.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. Changes take effect immediately upon posting. Your continued use of our website constitutes acceptance of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a> or visit our{" "}
            <Link href="/contact" className="text-black underline">Contact page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
