import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { CurrencyProvider } from "@/context/CurrencyContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider currency="USD" rates={{}}>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
    </CurrencyProvider>
  );
}
