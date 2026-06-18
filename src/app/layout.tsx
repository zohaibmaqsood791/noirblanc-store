import type { Metadata } from "next";
import { Raleway, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import GoogleTag from "@/components/GoogleTag";
import StructuredData from "@/components/StructuredData";

const GA4_ID = "G-LCCZT27BDH";
const AW_ID  = "AW-17089443241";

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
  metadataBase: new URL("https://noirblanc.store"),
  title: {
    template: "%s | Noir & Blanc",
    default: "Luxury Handbags, Exclusive Drops & Special Offers | Noir & Blanc",
  },
  description:
    "Discover Noir & Blanc luxury handbags collection. Sign up for our newsletter to be the first to know about exclusive drops, special offers, and limited product launches. Elevate your style with our timeless, meticulously crafted handbags. Shop the latest trends at Noir & Blanc.",
  keywords: ["luxury handbags", "designer bags", "crossbody bags", "leather bags", "Noir & Blanc", "women's handbags"],
  verification: {
    google: "h0lN5S8mG5esv4PyJ2sZ_LNA3v_-0AuH1BkDsrxa5oI",
  },
  openGraph: {
    siteName: "Noir & Blanc",
    title: "Luxury Handbags, Exclusive Drops & Special Offers | Noir & Blanc",
    description:
      "Discover Noir & Blanc luxury handbags collection. Sign up for our newsletter to be the first to know about exclusive drops, special offers, and limited product launches. Elevate your style with our timeless, meticulously crafted handbags. Shop the latest trends at Noir & Blanc.",
    url: "https://noirblanc.store",
    type: "website",
    images: [
      {
        url: "https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_4815d651-07c5-4bff-8aac-5309b5a4e354.png?v=1777465275",
        width: 1536,
        height: 2752,
        alt: "Noir & Blanc Luxury Handbags",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Handbags, Exclusive Drops & Special Offers | Noir & Blanc",
    description:
      "Discover Noir & Blanc luxury handbags collection. Sign up for our newsletter to be the first to know about exclusive drops, special offers, and limited product launches. Elevate your style with our timeless, meticulously crafted handbags. Shop the latest trends at Noir & Blanc.",
    images: ["https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_4815d651-07c5-4bff-8aac-5309b5a4e354.png?v=1777465275"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${poppins.variable}`}>
      <head>
        {/* Google tag — init must be in <head> before gtag.js loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}', { send_page_view: false });
gtag('config', '${AW_ID}');
            `.trim(),
          }}
        />
        <Script
          id="gtag-lib"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
      </head>
      <body className="font-body antialiased bg-white text-neutral-900">
        <StructuredData />
        <MetaPixel />
        <GoogleTag />
        {children}
      </body>
    </html>
  );
}
