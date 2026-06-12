import type { Metadata } from "next";
import { Raleway, Poppins } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Noir & Blanc",
    default: "Noir & Blanc — Premium Accessories",
  },
  description:
    "Shop premium crossbody bags, straps, and wallets. Crafted for the modern woman.",
  metadataBase: new URL("https://noirblanc.store"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${poppins.variable}`}>
      <body className="font-body antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
