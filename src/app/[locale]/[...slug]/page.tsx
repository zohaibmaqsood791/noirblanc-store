import { redirect, notFound } from "next/navigation";

const KNOWN_PAGES = ["contact", "faq", "privacy-policy", "refund-policy", "shipping-returns", "terms", "track-order", "size-guide"];

// Redirect /[locale]/known-page → /known-page; block everything else (bot probes, WP paths)
export default async function LocaleFallback({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { slug } = await params;
  if (!KNOWN_PAGES.includes(slug[0])) notFound();
  redirect(`/${slug.join("/")}`);
}
