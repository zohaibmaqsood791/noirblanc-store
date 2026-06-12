import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ order?: string; payment?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const { order, payment } = await searchParams;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/">
            <Image
              src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
              alt="Noir & Blanc"
              width={120}
              height={36}
            />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <CheckCircle size={56} className="mx-auto mb-6 text-green-500" strokeWidth={1.5} />
          <h1 className="font-heading text-3xl font-bold mb-3 tracking-tight">Thank you!</h1>
          {order && (
            <p className="text-neutral-500 text-sm mb-2">Order #{order}</p>
          )}
          {payment && !order && (
            <p className="text-neutral-500 text-sm mb-2 font-mono text-xs">Payment confirmed · {payment.slice(0, 16)}…</p>
          )}
          <p className="text-neutral-600 text-sm leading-relaxed mb-8">
            Your order has been placed and is being processed. You&apos;ll receive a
            confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="bg-black text-white text-sm font-semibold px-8 py-3 hover:bg-neutral-800 transition-colors tracking-wide"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account/orders"
              className="border border-black text-sm font-semibold px-8 py-3 hover:bg-neutral-50 transition-colors tracking-wide"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
