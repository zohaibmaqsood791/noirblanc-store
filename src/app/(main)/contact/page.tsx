"use client";

import { useState } from "react";
import { Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
          <p className="text-neutral-500 text-lg">
            We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Info */}
        <div className="space-y-8">
          <div>
            <h2 className="font-heading text-xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 text-neutral-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:hello@noirblanc.store" className="text-sm text-neutral-500 hover:text-black transition-colors">
                    hello@noirblanc.store
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 text-neutral-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-neutral-500">New York, NY</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} className="mt-0.5 text-neutral-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-sm text-neutral-500">Within 24–48 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FAFAFA] rounded-2xl p-6">
            <h3 className="font-semibold text-sm mb-2">Before you reach out</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Check our <a href="/faq" className="underline hover:text-black">FAQ</a> and{" "}
              <a href="/shipping-returns" className="underline hover:text-black">Shipping & Returns</a> pages
              — most common questions are answered there.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
                <Mail size={28} className="text-white" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-3">Message Sent!</h2>
              <p className="text-neutral-500 text-sm max-w-xs">
                Thanks for reaching out. We&apos;ll get back to you at <strong>{form.email}</strong> within 24–48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Doe"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@example.com"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                >
                  <option value="">Select a topic…</option>
                  <option value="order">Order Issue</option>
                  <option value="shipping">Shipping Question</option>
                  <option value="return">Return / Exchange</option>
                  <option value="product">Product Question</option>
                  <option value="wholesale">Wholesale Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Message</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us how we can help…"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
