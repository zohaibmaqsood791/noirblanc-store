"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, User, MapPin, LogOut, ChevronRight, Loader2 } from "lucide-react";
import { loginUser, registerUser, getCustomerOrders, getCustomerProfile } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

type Tab = "orders" | "profile" | "addresses";

const AUTH_KEY = "nb_auth";

function saveAuth(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}
function loadAuth(): AuthUser | null {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadAuth());
    setReady(true);
  }, []);

  const handleLogin = (u: AuthUser) => { saveAuth(u); setUser(u); };
  const handleLogout = () => { clearAuth(); setUser(null); };

  if (!ready) return null;
  if (!user) return <LoginView onSuccess={handleLogin} />;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <section className="bg-white border-b border-neutral-100 py-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">My Account</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Welcome back, {user.firstName || user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="md:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {(
              [
                { id: "orders",    label: "Orders",    icon: Package },
                { id: "profile",   label: "Profile",   icon: User },
                { id: "addresses", label: "Addresses", icon: MapPin },
              ] as { id: Tab; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors border-b border-neutral-50 last:border-0 ${
                  tab === id ? "bg-black text-white font-medium" : "text-neutral-600 hover:bg-[#FAFAFA]"
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
          {tab === "orders"    && <OrdersTab authToken={user.authToken} />}
          {tab === "profile"   && <ProfileTab authToken={user.authToken} user={user} />}
          {tab === "addresses" && <AddressesTab authToken={user.authToken} />}
        </div>
      </div>
    </main>
  );
}

// ── Orders ───────────────────────────────────────────────────────────────────
function OrdersTab({ authToken }: { authToken: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerOrders(authToken).then((o) => { setOrders(o); setLoading(false); });
  }, [authToken]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-5">Order History</h2>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-neutral-400 text-sm">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemNames = order.lineItems?.nodes
              ?.map((li: any) => li.product?.node?.name)
              .filter(Boolean)
              .join(", ");
            const statusColor =
              order.status === "COMPLETED" ? "bg-green-50 text-green-700" :
              order.status === "PROCESSING" ? "bg-blue-50 text-blue-700" :
              "bg-neutral-100 text-neutral-600";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                      {order.status?.charAt(0) + order.status?.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {itemNames && <p className="text-xs text-neutral-500 truncate">{itemNames}</p>}
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: order.total }} />
                  <ChevronRight size={16} className="text-neutral-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────
function ProfileTab({ authToken, user }: { authToken: string; user: AuthUser }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerProfile(authToken).then((p) => { setProfile(p); setLoading(false); });
  }, [authToken]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="font-heading text-lg font-bold mb-5">Profile</h2>
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" defaultValue={profile?.firstName || user.firstName} />
          <Field label="Last Name"  defaultValue={profile?.lastName  || user.lastName} />
        </div>
        <Field label="Email" type="email" defaultValue={profile?.email || user.email} />
        <Field label="Phone" defaultValue={profile?.billing?.phone || ""} placeholder="+1 (555) 000-0000" />
        <button className="bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ── Addresses ────────────────────────────────────────────────────────────────
function AddressesTab({ authToken }: { authToken: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerProfile(authToken).then((p) => { setProfile(p); setLoading(false); });
  }, [authToken]);

  if (loading) return <Spinner />;

  const billing  = profile?.billing;
  const shipping = profile?.shipping;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold">Saved Addresses</h2>
      {[
        { label: "Billing Address", addr: billing },
        { label: "Shipping Address", addr: shipping },
      ].map(({ label, addr }) => (
        <div key={label} className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h3 className="font-semibold text-sm mb-4">{label}</h3>
          {addr?.address1 ? (
            <p className="text-sm text-neutral-600 leading-relaxed">
              {addr.address1}{addr.address2 ? `, ${addr.address2}` : ""}<br />
              {addr.city}, {addr.state} {addr.postcode}<br />
              {addr.country}
            </p>
          ) : (
            <p className="text-sm text-neutral-400">No address saved.</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Login / Register ─────────────────────────────────────────────────────────
function LoginView({ onSuccess }: { onSuccess: (u: AuthUser) => void }) {
  const [mode, setMode]         = useState<"login" | "register" | "forgot">("login");
  const [firstName, setFirst]   = useState("");
  const [lastName, setLast]     = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to send reset email");
      setSuccess("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user: AuthUser;
      if (mode === "login") {
        user = await loginUser(email, password);
      } else {
        user = await registerUser({
          username: email,
          email,
          password,
          firstName,
          lastName,
        });
      }
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-neutral-500 text-sm">Enter your email and we&apos;ll send you a reset link</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">{success}</div>}
          {!success && (
            <form className="space-y-4" onSubmit={submitForgot}>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send Reset Link
              </button>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-neutral-500">
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-black font-medium hover:underline">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </main>
  );

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
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={submit}>
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">First Name</label>
                  <input
                    required value={firstName} onChange={e => setFirst(e.target.value)}
                    placeholder="Jane"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Last Name</label>
                  <input
                    required value={lastName} onChange={e => setLast(e.target.value)}
                    placeholder="Doe"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email Address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                  className="text-xs text-neutral-500 hover:text-black transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("register"); setError(""); }} className="text-black font-medium hover:underline">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="text-black font-medium hover:underline">
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, defaultValue = "", type = "text", placeholder = "" }: {
  label: string; defaultValue?: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
      />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-neutral-400" />
    </div>
  );
}
