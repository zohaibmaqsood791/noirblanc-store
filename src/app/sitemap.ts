import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://noirblancny.com',
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://noirblancny.com/shop',
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://noirblancny.com/collections',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://noirblancny.com/account/orders',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
