import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://noirblancnyc.com',
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://noirblancnyc.com/shop',
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://noirblancnyc.com/collections',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://noirblancnyc.com/account/orders',
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
