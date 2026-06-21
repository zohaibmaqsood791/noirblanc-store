import type { MetadataRoute } from 'next';
import { graphqlClient } from '@/lib/graphql/client';

const GET_ALL_COLLECTIONS = `
  query GetAllCollections($first: Int, $after: String) {
    productCategories(first: $first, after: $after) {
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

async function getAllCollections() {
  const collections = [];
  let hasNextPage = true;
  let after: string | null = null;

  try {
    while (hasNextPage) {
      const data: any = await graphqlClient.request(GET_ALL_COLLECTIONS, {
        first: 100,
        after,
      });

      collections.push(...data.productCategories.nodes);
      hasNextPage = data.productCategories.pageInfo.hasNextPage;
      after = data.productCategories.pageInfo.endCursor;
    }
  } catch (error) {
    console.error('Error fetching collections for sitemap:', error);
  }

  return collections;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const collections = await getAllCollections();

  return collections.map((collection: any) => ({
    url: `https://noirblancnyc.com/collections/${collection.slug}`,
    lastModified: collection.modified || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
}
