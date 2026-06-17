"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "@/components/cart/CartDrawer";

const navLinks = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Crossbody Bags", href: "/collections/crossbody-bags" },
  { label: "Bag Straps", href: "/collections/bag-straps" },
  { label: "Wallets", href: "/collections/wallets" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart, openCart } = useCartStore();
  const itemCount = cart?.contents?.itemCount ?? 0;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
                alt="Noir & Blanc"
                width={140}
                height={40}
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-700 hover:text-black transition-colors tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-3">
              <button aria-label="Search" className="p-2 hover:opacity-60 transition-opacity">
                <Search size={18} />
              </button>
              <Link href="/account" aria-label="Account" className="p-2 hover:opacity-60 transition-opacity hidden sm:block">
                <User size={18} />
              </Link>
              <button
                onClick={openCart}
                aria-label="Cart"
                className="relative p-2 hover:opacity-60 transition-opacity"
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-neutral-100 bg-white">
            <nav className="flex flex-col px-4 py-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-700 tracking-wide py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
