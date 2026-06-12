"use client";

import { useState } from "react";
import { Package, User, MapPin, LogOut, ChevronRight } from "lucide-react";

type Tab = "orders" | "profile" | "addresses";

// Mock — replace with real auth/data later
const mockOrders = [
  {
    id: "#NB-10042",
    date: "June 8, 2025",
    status: "Delivered",
    total: "$128.00",
    items: "Mini Crossbody, Chain Strap",
  },
  {
    id: "#NB-10039",
    date: "May 22, 2025",
    status: "Delivered",
    total: "$84.00",
    items: "Card Holder Wallet",
  },
];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [isLoggedIn] = useState(false); // set to true to preview logged-in state

  if (!isLoggedIn) {
    return <LoginView />;
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <section className="bg-white border-b border-neutral-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">My Account</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Welcome back, Jane</p>
            </div>
            <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="md:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {(
              [
                { id: "orders", label: "Orders", icon: Package },
                { id: "profile", label: "Profile", icon: User },
                { id: "addresses", label: "Addresses", icon: MapPin },
              ] as { id: Tab; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors border-b border-neutral-50 last:border-0 ${
                  tab === id
                    ? "bg-black text-white font-medium"
                    : "text-neutral-600 hover:bg-[#FAFAFA]"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {tab === "orders" && (
            <div>
              <h2 className="font-heading text-lg font-bold mb-5">Order History</h2>
              {mockOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-neutral-400 text-sm">
                  No orders yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {mockOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{order.id}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-50 text-green-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{order.items}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-sm">{order.total}</span>
                        <ChevronRight size={16} className="text-neutral-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div>
              <h2 className="font-heading text-lg font-bold mb-5">Profile</h2>
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">First Name</label>
                    <input defaultValue="Jane" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Last Name</label>
                    <input defaultValue="Doe" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email</label>
                  <input defaultValue="jane@example.com" type="email" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Phone</label>
                  <input defaultValue="" placeholder="+1 (555) 000-0000" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <button className="bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {tab === "addresses" && (
            <div>
              <h2 className="font-heading text-lg font-bold mb-5">Saved Addresses</h2>
              <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-neutral-400 text-sm">
                No saved addresses yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function LoginView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-neutral-500 text-sm">
            {mode === "login"
              ? "Welcome back to Noir & Blanc"
              : "Join Noir & Blanc for faster checkout and order tracking"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">First Name</label>
                  <input placeholder="Jane" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Last Name</label>
                  <input placeholder="Doe" className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-neutral-500 hover:text-black transition-colors">
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide mt-2"
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button onClick={() => setMode("register")} className="text-black font-medium hover:underline">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-black font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
