import Link from "next/link";
import Image from "next/image";

const BG = "#2D3B1E";

const shopLinks = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Crossbody Bags", href: "/collections/crossbody-bags" },
  { label: "Bag Straps", href: "/collections/bag-straps" },
  { label: "Wallets", href: "/collections/wallets" },
];

const helpLinks = [
  { label: "Help & Support", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "FAQ", href: "/faq" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "Track Order", href: "/account/orders" },
];

const companyLinks = [
  { label: "About Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/noirblancnyc",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/noirblancnyc/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://pinterest.com/noirblancnyc",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@noirandblancnyc",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
  },
];

const paymentIcons = [
  { label: "American Express", src: "/payment-icons/amex.svg" },
  { label: "Diners", src: "/payment-icons/diners.svg" },
  { label: "Apple Pay", src: "/payment-icons/applepay.svg" },
  { label: "Discover", src: "/payment-icons/discover.svg" },
  { label: "Google Pay", src: "/payment-icons/googlepay.svg" },
  { label: "Maestro", src: "/payment-icons/maestro.svg" },
  { label: "Mastercard", src: "/payment-icons/mastercard.svg" },
  { label: "PayPal", src: "/payment-icons/paypal.svg" },
  { label: "Shop Pay", src: "/payment-icons/shoppay.svg" },
  { label: "Visa", src: "/payment-icons/visa.svg" },
];

export default function Footer() {
  return (
    <footer>
      {/* Contact banner */}
      <div className="bg-[#f5f0eb] px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-neutral-900 text-lg">Do you have any questions?</p>
            <p className="text-sm text-neutral-600 mt-0.5">
              Our customer service team is available <strong>Monday – Friday, 9 AM to 5 PM EST.</strong>
            </p>
          </div>
          <Link
            href="/contact"
            className="border border-neutral-900 text-neutral-900 text-sm font-semibold px-6 py-3 hover:bg-neutral-900 hover:text-white transition-colors tracking-widest uppercase whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="text-white" style={{ backgroundColor: BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* Brand col */}
            <div className="lg:col-span-2">
              <Image
                src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
                alt="Noir & Blanc"
                width={130}
                height={38}
                className="brightness-0 invert mb-5"
              />
              <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                At <strong>Noir &amp; Blanc</strong>, we craft premium crossbody bags, straps, and accessories
                designed for the modern woman — timeless style built for real life.
              </p>
              <p className="text-neutral-400 text-sm mb-1">
                <strong className="text-white">Monday – Friday</strong>, 9 AM – 5 PM EST
              </p>
              <a href="mailto:info@noirblancnyc.com" className="text-neutral-300 text-sm hover:text-white transition-colors">
                ✉ info@noirblancnyc.com
              </a>

              {/* Socials */}
              <div className="flex items-center gap-4 mt-6">
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    aria-label={s.label}
                    className="text-neutral-300 hover:text-white transition-colors">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold tracking-widest uppercase mb-3">Newsletter</h4>
              <p className="text-neutral-300 text-sm leading-relaxed mb-5">
                Be the first to access new drops, exclusive promotions, and exciting offers!
              </p>
              <form className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-transparent border border-neutral-500 text-white text-sm px-4 py-2.5 placeholder-neutral-400 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="border border-white text-white text-sm font-semibold py-2.5 hover:bg-white hover:text-neutral-900 transition-colors tracking-wide flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Subscribe
                </button>
              </form>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-sm font-semibold tracking-widest uppercase mb-3">Help</h4>
              <ul className="space-y-2.5">
                {helpLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-neutral-300 text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop + Company */}
            <div className="flex flex-col gap-8">
              <div>
                <h4 className="text-sm font-semibold tracking-widest uppercase mb-3">Shop</h4>
                <ul className="space-y-2.5">
                  {shopLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-neutral-300 text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-widest uppercase mb-3">Company</h4>
                <ul className="space-y-2.5">
                  {companyLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-neutral-300 text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-neutral-600 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-5">
            <p className="text-neutral-400 text-xs">
              © {new Date().getFullYear()} Noir &amp; Blanc New York. All rights reserved.
            </p>
            {/* Payment icons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {paymentIcons.map((p) => (
                <img key={p.label} src={p.src} alt={p.label} width={38} height={24} className="w-8 max-h-[20px] object-contain" loading="lazy" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
