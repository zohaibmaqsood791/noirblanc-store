"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5–7 business days within the US. Expedited shipping (2–3 business days) is available at checkout. International orders typically arrive in 10–14 business days.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! We offer free standard shipping on all US orders over $75. International orders have flat-rate shipping fees that vary by destination.",
      },
      {
        q: "Can I track my order?",
        a: "Absolutely. Once your order ships, you'll receive an email with your tracking number. You can track your package directly on our website or via the carrier's site.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "We begin processing orders quickly, but if you need to make a change, please contact us within 1 hour of placing your order. We'll do our best to accommodate your request.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery for items in their original, unused condition with tags attached. Sale items are final sale.",
      },
      {
        q: "How do I start a return?",
        a: "Email us at hello@noirblanc.store with your order number and reason for return. We'll send you a prepaid return label within 1–2 business days.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 3–5 business days after we receive your return. Your bank may take an additional 3–5 days to post the credit to your account.",
      },
      {
        q: "Can I exchange an item?",
        a: "Yes! Contact us with your order number and the item you'd like to exchange for. We'll check availability and guide you through the process.",
      },
    ],
  },
  {
    category: "Products",
    items: [
      {
        q: "What materials are your bags made from?",
        a: "Our bags are crafted from premium vegan leather and genuine leather, depending on the style. Each product page details the exact materials used.",
      },
      {
        q: "How do I care for my bag?",
        a: "Wipe with a clean, damp cloth for daily cleaning. Avoid prolonged exposure to direct sunlight and store in the dust bag provided. For deeper cleaning, use a leather conditioner appropriate for the material.",
      },
      {
        q: "Are your bags water-resistant?",
        a: "Our bags have a natural water resistance, but are not fully waterproof. We recommend avoiding heavy rain exposure. A leather protector spray can add additional water resistance.",
      },
      {
        q: "Do your products come with a warranty?",
        a: "Yes, all Noir & Blanc products come with a 12-month warranty against manufacturing defects. This does not cover general wear and tear.",
      },
    ],
  },
  {
    category: "Payments & Security",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), Apple Pay, and Google Pay. All transactions are encrypted and secure.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed by Square, a PCI-DSS Level 1 certified payment processor. We never store your card details on our servers.",
      },
      {
        q: "Do you offer buy now, pay later?",
        a: "We're working on adding BNPL options. Sign up for our newsletter to be notified when it launches.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-sm text-neutral-500 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-neutral-500 text-lg">
            Everything you need to know about Noir & Blanc.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="font-heading text-lg font-bold mb-4 pb-2 border-b border-neutral-200">
              {section.category}
            </h2>
            <div>
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center">
          <h3 className="font-heading text-lg font-semibold mb-2">Still have questions?</h3>
          <p className="text-sm text-neutral-500 mb-5">
            Our team is happy to help. We typically respond within 24 hours.
          </p>
          <a
            href="/contact"
            className="inline-block bg-black text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide"
          >
            Contact Us
          </a>
        </div>
      </section>
    </main>
  );
}
