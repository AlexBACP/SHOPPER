import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/auth/login`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/auth/register`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/terms`,                   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,                 lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];

  try {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${API}/stores`, { next: { revalidate: 3600 } });
    const stores = await res.json();
    const pubStores = stores.filter((s: { is_published: boolean }) => s.is_published);

    const storePages: MetadataRoute.Sitemap = pubStores.map((s: { slug: string }) => ({
      url:             `${BASE_URL}/store/${s.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    return [...staticPages, ...storePages];
  } catch {
    return staticPages;
  }
}
