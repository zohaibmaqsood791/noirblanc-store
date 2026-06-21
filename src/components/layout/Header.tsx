"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { ShoppingBag, Menu, X, User, Search, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "@/components/cart/CartDrawer";

const navLinks = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Crossbody Bags", href: "/collections/crossbody-bags" },
  { label: "Bag Straps", href: "/collections/bag-straps" },
  { label: "Wallets", href: "/collections/leather-wallets" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { cart, openCart } = useCartStore();
  const itemCount = cart?.contents?.itemCount ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMobileOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button — left */}
            <div className="flex items-center w-10 lg:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="p-2"
              >
                <Menu size={20} />
              </button>
            </div>

            {/* Logo — centered on mobile, left on desktop */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:mr-8 flex-shrink-0">
              <Image
                src="/nb-logo.svg"
                alt="Noir & Blanc"
                width={140}
                height={40}
                priority
              />
            </Link>

            {/* Desktop Nav — centered */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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

            {/* Icons — right */}
            <div className="flex items-center gap-3 ml-auto">
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

      </header>

      {/* Mobile nav — slide-in drawer from the left */}
      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={() => setMobileOpen(false)} className="relative z-[60] lg:hidden">
          {/* Backdrop */}
          <Transition.Child as={Fragment}
            enter="transition-opacity ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>

          {/* Panel — full-width drawer */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child as={Fragment}
                enter="transform transition ease-in-out duration-300" enterFrom="-translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen h-full bg-white flex flex-col">
                  {/* Top bar — mirrors the site header: close, logo, icons */}
                  <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
                    <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 -ml-2">
                      <X size={22} />
                    </button>
                    <Dialog.Title as={Link} href="/" onClick={() => setMobileOpen(false)} className="absolute left-1/2 -translate-x-1/2">
                      <Image
                        src="/nb-logo.svg"
                        alt="Noir & Blanc"
                        width={130}
                        height={36}
                      />
                    </Dialog.Title>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setMobileOpen(false); openCart(); }} aria-label="Cart" className="relative p-2">
                        <ShoppingBag size={20} />
                        {itemCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                            {itemCount}
                          </span>
                        )}
                      </button>
                      <Link href="/account" aria-label="Account" className="p-2" onClick={() => setMobileOpen(false)}>
                        <User size={20} />
                      </Link>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="px-4 pt-5 pb-2">
                      <div className="flex items-center gap-3 border border-neutral-300 rounded-xl px-4 h-12 focus-within:border-[#538125] transition-colors">
                        <Search size={18} className="text-neutral-500 shrink-0" />
                        <input
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search"
                          className="flex-1 bg-transparent outline-none text-base placeholder:text-neutral-400"
                        />
                      </div>
                    </form>

                    {/* Promo pill */}
                    <div className="px-4 py-3">
                      <Link
                        href="/collections/new-in"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center h-12 rounded-xl border border-neutral-300 text-[15px] font-medium text-neutral-800 hover:border-[#538125] hover:text-[#538125] transition-colors"
                      >
                        New In
                      </Link>
                    </div>

                    {/* Nav rows */}
                    <nav className="px-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between py-5 border-b border-neutral-200 text-2xl font-semibold text-neutral-900"
                        >
                          {link.label}
                          <ChevronRight size={24} className="text-neutral-400" />
                        </Link>
                      ))}
                      <Link
                        href="/track-order"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-5 border-b border-neutral-200 text-2xl font-semibold text-neutral-900"
                      >
                        Track Order
                        <ChevronRight size={24} className="text-neutral-400" />
                      </Link>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <CartDrawer />
    </>
  );
}
