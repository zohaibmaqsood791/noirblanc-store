import { graphqlClient } from "@/lib/graphql/client";
import { gql } from "graphql-request";

// Google / Meta product feed (RSS 2.0 + g: namespace). One feed serves Google
// Merchant Center, Facebook Shop, and Instagram Shop.
// Products with color variations are expanded into one item per color, grouped
// by item_group_id. IDs match the Meta Pixel content_ids (WooCommerce databaseId).

export const revalidate = 3600; // cache 1h

const SITE = "https://noirblancnyc.com";
const BRAND = "Noir & Blanc";
const DEFAULT_GENDER = "female";
const DEFAULT_AGE_GROUP = "adult";

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
        sku
        image { sourceUrl }
        galleryImages(first: 10) { nodes { sourceUrl } }
        productCategories { nodes { name } }
        ... on SimpleProduct { price regularPrice salePrice stockStatus }
        ... on VariableProduct {
          price regularPrice salePrice
          variations(first: 100) {
            nodes {
              databaseId
              sku
              price
              regularPrice
              salePrice
              stockStatus
              image { sourceUrl }
              attributes { nodes { name value } }
            }
          }
        }
      }
    }
  }
`;

type Variation = {
  databaseId: number;
  sku?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
  image?: { sourceUrl?: string | null } | null;
  attributes?: { nodes: { name: string; value: string }[] } | null;
};

type FeedProduct = {
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  databaseId: number;
  sku?: string | null;
  image?: { sourceUrl?: string | null } | null;
  galleryImages?: { nodes: { sourceUrl?: string | null }[] } | null;
  productCategories?: { nodes: { name: string }[] } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
  variations?: { nodes: Variation[] } | null;
};

function xml(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeEntities(s: string): string {
  return (s ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&"); // must be last
}

function stripHtml(s: string): string {
  return decodeEntities((s ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function money(v: string | null | undefined): number {
  return parseFloat((v ?? "0").replace(/[^0-9.]/g, "")) || 0;
}

function niceColor(v: string): string {
  return v.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function colorOf(va: Variation): string {
  const attr = (va.attributes?.nodes ?? []).find((a) => /colou?r/i.test(a.name));
  return attr?.value ? niceColor(attr.value) : "";
}

function buildItem(opts: {
  id: number | string;
  groupId?: number;
  title: string;
  description: string;
  slug: string;
  imageLink?: string | null;
  additionalImages?: string[];
  availability: string;
  regular: number;
  sale: number;
  brand: string;
  sku?: string | null;
  color?: string;
  productType?: string;
}): string {
  const onSale = opts.sale > 0 && opts.sale < opts.regular;
  const lines = [
    "    <item>",
    `      <g:id>${opts.id}</g:id>`,
    opts.groupId ? `      <g:item_group_id>${opts.groupId}</g:item_group_id>` : "",
    `      <g:title>${xml(opts.title)}</g:title>`,
    `      <g:description>${xml(opts.description)}</g:description>`,
    `      <g:link>${SITE}/products/${xml(opts.slug)}</g:link>`,
    opts.imageLink ? `      <g:image_link>${xml(opts.imageLink)}</g:image_link>` : "",
    ...(opts.additionalImages ?? []).slice(0, 10).map((u) => `      <g:additional_image_link>${xml(u)}</g:additional_image_link>`),
    `      <g:availability>${opts.availability}</g:availability>`,
    `      <g:price>${opts.regular.toFixed(2)} USD</g:price>`,
    onSale ? `      <g:sale_price>${opts.sale.toFixed(2)} USD</g:sale_price>` : "",
    `      <g:condition>new</g:condition>`,
    `      <g:brand>${xml(opts.brand)}</g:brand>`,
    opts.sku ? `      <g:mpn>${xml(opts.sku)}</g:mpn>` : `      <g:mpn>${opts.id}</g:mpn>`,
    `      <g:identifier_exists>no</g:identifier_exists>`,
    opts.color ? `      <g:color>${xml(opts.color)}</g:color>` : "",
    `      <g:gender>${DEFAULT_GENDER}</g:gender>`,
    `      <g:age_group>${DEFAULT_AGE_GROUP}</g:age_group>`,
    opts.productType ? `      <g:product_type>${xml(opts.productType)}</g:product_type>` : "",
    "    </item>",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function GET() {
  let nodes: FeedProduct[] = [];
  try {
    let after: string | null = null;
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

  const itemBlocks: string[] = [];

  for (const p of nodes) {
    if (!p.slug || !p.databaseId) continue;

    const desc =
      stripHtml(p.shortDescription ?? "") ||
      stripHtml(p.description ?? "").slice(0, 5000) ||
      p.name;
    const productType = (p.productCategories?.nodes ?? [])
      .map((c) => c.name)
      .filter((n) => n && n.toLowerCase() !== "uncategorized")
      .join(" > ");
    const gallery = (p.galleryImages?.nodes ?? [])
      .map((g) => g.sourceUrl)
      .filter((u): u is string => !!u);
    const productRegular = money(p.regularPrice) || money(p.price);
    const productSale = money(p.salePrice);

    const variations = p.variations?.nodes ?? [];

    if (variations.length > 0) {
      // Group variations by color; one feed item per distinct color
      const byColor = new Map<string, Variation>();
      for (const v of variations) {
        const key = colorOf(v) || `var-${v.databaseId}`;
        const existing = byColor.get(key);
        const hasPrice = money(v.price) > 0 || money(v.regularPrice) > 0;
        const inStock = (v.stockStatus ?? "") === "IN_STOCK";
        // Prefer a representative with a real price and in stock
        if (!existing || (hasPrice && (money(existing.price) === 0 || (!(/IN_STOCK/.test(existing.stockStatus ?? "")) && inStock)))) {
          byColor.set(key, v);
        }
      }
      for (const [, v] of byColor) {
        const color = colorOf(v);
        const regular = money(v.regularPrice) || money(v.price) || productRegular;
        const sale = money(v.salePrice) || (productSale > 0 ? productSale : 0);
        itemBlocks.push(
          buildItem({
            id: v.databaseId,
            groupId: p.databaseId,
            title: color ? `${p.name} - ${color}` : p.name,
            description: desc,
            slug: p.slug,
            imageLink: v.image?.sourceUrl ?? p.image?.sourceUrl ?? null,
            additionalImages: gallery,
            availability: (v.stockStatus ?? "IN_STOCK") === "IN_STOCK" ? "in_stock" : "out_of_stock",
            regular,
            sale,
            brand: BRAND,
            sku: v.sku ?? p.sku,
            color,
            productType,
          })
        );
      }
    } else {
      // Simple product — single item
      itemBlocks.push(
        buildItem({
          id: p.databaseId,
          title: p.name,
          description: desc,
          slug: p.slug,
          imageLink: p.image?.sourceUrl ?? null,
          additionalImages: gallery,
          availability: (p.stockStatus ?? "IN_STOCK") === "IN_STOCK" ? "in_stock" : "out_of_stock",
          regular: productRegular,
          sale: productSale,
          brand: BRAND,
          sku: p.sku,
          productType,
        })
      );
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Noir &amp; Blanc</title>
    <link>${SITE}</link>
    <description>Noir &amp; Blanc luxury handbags product feed</description>
${itemBlocks.join("\n")}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
