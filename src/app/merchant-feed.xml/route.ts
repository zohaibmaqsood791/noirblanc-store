import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";

// Google / Meta product feed (RSS 2.0 + g: namespace). One feed serves Google
// Merchant Center, Facebook Shop, and Instagram Shop.
// Product IDs match the Meta Pixel content_ids (WooCommerce databaseId).

export const revalidate = 3600; // cache 1h

const SITE = "https://noirblancnyc.com";
const BRAND = "Noir & Blanc";

const FEED_QUERY = gql`
  query FeedProducts($first: Int, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        slug
        shortDescription
        description
        databaseId
        image { sourceUrl }
        productCategories { nodes { name } }
        ... on SimpleProduct { price regularPrice salePrice stockStatus }
        ... on VariableProduct { price regularPrice salePrice stockStatus }
      }
    }
  }
`;

type FeedProduct = {
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  databaseId: number;
  image?: { sourceUrl?: string | null } | null;
  productCategories?: { nodes: { name: string }[] } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
};

function xml(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(s: string): string {
  return (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function money(v: string | null | undefined): number {
  return parseFloat((v ?? "0").replace(/[^0-9.]/g, "")) || 0;
}

export async function GET() {
  let nodes: FeedProduct[] = [];
  try {
    let after: string | null = null;
    // Page through the whole catalog
    for (let i = 0; i < 20; i++) {
      const data: { products: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: FeedProduct[] } } =
        await graphqlClient.request(FEED_QUERY, { first: 100, after });
      nodes = nodes.concat(data.products.nodes ?? []);
      if (!data.products.pageInfo?.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
    }
  } catch (e) {
    console.error("[merchant-feed] fetch failed:", e);
  }

  const items = nodes
    .filter((p) => p.slug && p.databaseId)
    .map((p) => {
      const regular = money(p.regularPrice) || money(p.price);
      const sale = money(p.salePrice);
      const onSale = sale > 0 && sale < regular;
      const availability = (p.stockStatus ?? "IN_STOCK") === "IN_STOCK" ? "in_stock" : "out_of_stock";
      // Prefer short description, fall back to full description, then the name
      const desc =
        stripHtml(p.shortDescription ?? "") ||
        stripHtml(p.description ?? "").slice(0, 5000) ||
        p.name;
      const productType = (p.productCategories?.nodes ?? [])
        .map((c) => c.name)
        .filter((n) => n && n.toLowerCase() !== "uncategorized")
        .join(" > ");

      return [
        "    <item>",
        `      <g:id>${p.databaseId}</g:id>`,
        `      <g:title>${xml(p.name)}</g:title>`,
        `      <g:description>${xml(desc)}</g:description>`,
        `      <g:link>${SITE}/products/${xml(p.slug)}</g:link>`,
        p.image?.sourceUrl ? `      <g:image_link>${xml(p.image.sourceUrl)}</g:image_link>` : "",
        `      <g:availability>${availability}</g:availability>`,
        `      <g:price>${(onSale ? regular : regular).toFixed(2)} USD</g:price>`,
        onSale ? `      <g:sale_price>${sale.toFixed(2)} USD</g:sale_price>` : "",
        `      <g:condition>new</g:condition>`,
        `      <g:brand>${xml(BRAND)}</g:brand>`,
        `      <g:mpn>${p.databaseId}</g:mpn>`,
        `      <g:identifier_exists>no</g:identifier_exists>`,
        productType ? `      <g:product_type>${xml(productType)}</g:product_type>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Noir &amp; Blanc</title>
    <link>${SITE}</link>
    <description>Noir &amp; Blanc luxury handbags product feed</description>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
