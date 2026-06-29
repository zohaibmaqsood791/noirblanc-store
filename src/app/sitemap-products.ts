import type { MetadataRoute } from 'next';
import { graphqlClient } from '@/lib/graphql/client';

const GET_ALL_PRODUCTS = `
  query GetAllProducts($first: Int, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        slug
        modified
      }
    }
  }
`;

async function getAllProducts() {
  const products = [];
  let hasNextPage = true;
  let after: string | null = null;

  try {
    while (hasNextPage) {
      const data: any = await graphqlClient.request(GET_ALL_PRODUCTS, {
        first: 100,
        after,
      });

      products.push(...data.products.nodes);
      hasNextPage = data.products.pageInfo.hasNextPage;
      after = data.products.pageInfo.endCursor;
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  return products.map((product: any) => ({
    url: `https://noirblancny.com/products/${product.slug}`,
    lastModified: product.modified || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
