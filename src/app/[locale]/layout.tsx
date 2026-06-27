import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LOCALE_CURRENCY, fetchRates } from "@/lib/currency";

const VALID_LOCALES = ["gb", "au", "ca", "eu", "nz", "ae"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!VALID_LOCALES.includes(locale)) notFound();

  const currency = LOCALE_CURRENCY[locale] ?? "USD";
  const rates = await fetchRates();

  return (
    <CurrencyProvider currency={currency} rates={rates}>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </CurrencyProvider>
  );
}
