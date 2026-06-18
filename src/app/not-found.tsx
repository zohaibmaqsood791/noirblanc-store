import Link from "next/link";
import Image from "next/image";
import NotFoundTracker from "@/components/NotFoundTracker";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <NotFoundTracker />
      <Image
        src="https://noirblancnyc.com/cdn/shop/files/Group_1171277502_2.svg"
        alt="Noir & Blanc"
        width={130}
        height={38}
        priority
      />
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-neutral-900">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-500">
        The page you’re looking for doesn’t exist or may have moved. Let’s get you back to shopping.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="bg-black text-white text-sm font-semibold px-6 py-3.5 rounded-lg hover:bg-neutral-800 transition-colors tracking-wide"
        >
          Shop all
        </Link>
        <Link
          href="/"
          className="border border-neutral-300 text-sm font-semibold px-6 py-3.5 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors tracking-wide"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
