"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, Transition } from "@headlessui/react";
import { ShoppingBag, Menu, X, User } from "lucide-react";
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
                src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
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

          {/* Panel */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <Transition.Child as={Fragment}
                enter="transform transition ease-in-out duration-300" enterFrom="-translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-[80vw] max-w-xs h-full bg-white flex flex-col shadow-xl">
                  <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
                    <Dialog.Title className="font-heading text-base tracking-wide text-neutral-800">Menu</Dialog.Title>
                    <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 -mr-2">
                      <X size={20} />
                    </button>
                  </div>
                  <nav className="flex flex-col px-2 py-3 overflow-y-auto">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm font-medium text-neutral-700 tracking-wide px-2 py-3 rounded-lg hover:bg-neutral-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-neutral-100 mt-2 pt-2 flex flex-col">
                      <Link href="/track-order" className="text-sm font-medium text-neutral-700 tracking-wide px-2 py-3 rounded-lg hover:bg-neutral-50 transition-colors" onClick={() => setMobileOpen(false)}>
                        Track Order
                      </Link>
                      <Link href="/account" className="text-sm font-medium text-neutral-700 tracking-wide px-2 py-3 rounded-lg hover:bg-neutral-50 transition-colors" onClick={() => setMobileOpen(false)}>
                        My Account
                      </Link>
                    </div>
                  </nav>
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
