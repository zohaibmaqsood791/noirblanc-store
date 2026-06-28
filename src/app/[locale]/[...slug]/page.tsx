import { redirect, notFound } from "next/navigation";

// Block obvious bot/WP probe paths; redirect everything else to strip the locale prefix
const BOT_PATTERNS = /\.(php|asp|aspx|jsp|cgi|env|git|htaccess|xml|sql)$/i;
const WP_PATHS = /^wp-|^xmlrpc|^\.well-known\/.*\.php/i;

export default async function LocaleFallback({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  if (BOT_PATTERNS.test(path) || WP_PATHS.test(path)) notFound();
  redirect(`/${path}`);
}
