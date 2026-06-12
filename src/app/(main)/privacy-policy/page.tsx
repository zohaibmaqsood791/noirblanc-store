import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-neutral-500">Last updated: June 2025</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 space-y-10 text-sm leading-relaxed text-neutral-600">

        <div>
          <p>
            Noir & Blanc (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates noirblanc.store. This Privacy Policy describes how we collect, use, and protect your personal information when you visit or make a purchase from our website.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">1. Information We Collect</h2>
          <p className="mb-3">When you use our website or place an order, we may collect the following information:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Personal Identification:</strong> name, email address, phone number</li>
            <li><strong>Shipping Information:</strong> billing and delivery address</li>
            <li><strong>Payment Information:</strong> processed securely by Square; we do not store card numbers</li>
            <li><strong>Usage Data:</strong> browser type, pages visited, time spent on site, referring URLs</li>
            <li><strong>Communications:</strong> messages you send us via email or contact forms</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">2. How We Use Your Information</h2>
          <p className="mb-3">We use collected information to:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Respond to customer service inquiries</li>
            <li>Send promotional emails (you can unsubscribe at any time)</li>
            <li>Improve our website and user experience</li>
            <li>Prevent fraud and maintain security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">3. Sharing Your Information</h2>
          <p className="mb-3">We do not sell your personal data. We may share your information with:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Payment processors</strong> (Square) to process transactions</li>
            <li><strong>Shipping carriers</strong> (UPS, USPS, FedEx) to deliver your orders</li>
            <li><strong>Email service providers</strong> to send transactional and marketing emails</li>
            <li><strong>Analytics providers</strong> to help us understand how our site is used</li>
            <li><strong>Law enforcement</strong> when required by law</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">4. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser. Disabling cookies may affect some features of our website.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. All payment processing is handled by Square, a PCI-DSS Level 1 certified payment processor. However, no method of transmission over the Internet is 100% secure.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Order records are kept for a minimum of 7 years for accounting purposes.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">7. Your Rights</h2>
          <p className="mb-3">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal data</li>
            <li>Opt out of marketing communications</li>
            <li>Data portability</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a>.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party sites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">9. Children&apos;s Privacy</h2>
          <p>
            Our website is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of our website after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-black mb-3">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:hello@noirblanc.store" className="text-black underline">hello@noirblanc.store</a> or visit our{" "}
            <Link href="/contact" className="text-black underline">Contact page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
