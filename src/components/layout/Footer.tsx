import Link from "next/link";
import Image from "next/image";

const shopLinks = [
  { label: "New In", href: "/shop?category=new-in" },
  { label: "Crossbody Bags", href: "/shop?category=crossbody-bags" },
  { label: "Bag Straps", href: "/shop?category=bag-straps" },
  { label: "Wallets", href: "/shop?category=wallets" },
];

const helpLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "FAQ", href: "/faq" },
  { label: "Size Guide", href: "/size-guide" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
              alt="Noir & Blanc"
              width={120}
              height={36}
              className="brightness-0 invert mb-4"
            />
            <p className="text-neutral-400 text-sm leading-relaxed">
              Premium accessories designed for the modern woman. Crafted with
              intention, built to last.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-4">Shop</h4>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-neutral-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-4">Help</h4>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-neutral-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-4">Stay in the Loop</h4>
            <p className="text-neutral-400 text-sm mb-4">
              New drops, exclusive offers, and style inspo — straight to your inbox.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-neutral-900 border border-neutral-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-black text-sm font-medium px-4 py-2 rounded hover:bg-neutral-200 transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-xs">
            © {new Date().getFullYear()} Noir & Blanc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-neutral-500 text-xs hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
