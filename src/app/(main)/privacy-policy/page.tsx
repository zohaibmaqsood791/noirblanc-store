import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-neutral-900 mb-10">Privacy Policy</h1>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 1 – What Do We Do With Your Information?</h2>
            <p>When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such as your name, address and email address.</p>
            <p className="mt-2">When you browse our store, we also automatically receive your computer's internet protocol (IP) address in order to provide us with information that helps us learn about your browser and operating system.</p>
            <p className="mt-2">With your permission, we may send you emails about our store, new products and other updates.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 2 – Consent</h2>
            <h3 className="font-semibold text-neutral-800 mb-2">How do you get my consent?</h3>
            <p>When you provide us with personal information to complete a transaction, verify your credit card, place an order, arrange for a delivery or return a purchase, we imply that you consent to our collecting it and using it for that specific reason only.</p>
            <p className="mt-2">If we ask for your personal information for a secondary reason, like marketing, we will either ask you directly for your expressed consent, or provide you with an opportunity to say no.</p>
            <h3 className="font-semibold text-neutral-800 mt-4 mb-2">How do I withdraw my consent?</h3>
            <p>If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or disclosure of your information, at any time, by contacting us at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 3 – Disclosure</h2>
            <p>We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 4 – Payment</h2>
            <p>We use Square to process payments. Your purchase transaction data is stored only as long as is necessary to complete your purchase transaction. After that is complete, your purchase transaction information is deleted. Credit card information is encrypted using secure socket layer technology (SSL) and stored with AES-256 encryption. Although no method of transmission over the Internet or electronic storage is 100% secure, we follow all PCI-DSS requirements and implement additional generally accepted industry standards.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 5 – Third-Party Services</h2>
            <p>In general, the third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform the services they provide to us.</p>
            <p className="mt-2">However, certain third-party service providers, such as payment gateways and other payment transaction processors, have their own privacy policies in respect to the information we are required to provide to them for your purchase-related transactions.</p>
            <p className="mt-2">We also use Google Analytics to track site visitors and page views.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 6 – Security</h2>
            <p>To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.</p>
            <p className="mt-2">If you provide us with your credit card information, the information is encrypted using secure socket layer technology (SSL) and stored with AES-256 encryption. We follow all PCI-DSS requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 7 – Cookies</h2>
            <p>We use cookies to maintain your shopping session and track order progress. Necessary cookies enable core site functionality. Additional cookies may be used to enhance your experience and for analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 8 – Age of Consent</h2>
            <p>By using this site, you represent that you are at least the age of majority in your state or province of residence.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Section 9 – Changes to This Privacy Policy</h2>
            <p>We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Questions & Contact Information</h2>
            <p>If you would like to access, correct, amend or delete any personal information we have about you, register a complaint, or simply want more information, contact our Privacy Compliance Officer at <a href="mailto:hello@noirblancnyc.com" className="underline text-neutral-900">hello@noirblancnyc.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
