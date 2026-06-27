import { redirect } from "next/navigation";

// Redirect /[locale]/anything → /anything (non-locale pages don't have locale variants)
export default async function LocaleFallback({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { slug } = await params;
  redirect(`/${slug.join("/")}`);
}
