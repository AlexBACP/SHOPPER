import { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/owner/',
          '/admin/',
          '/checkout/',
          '/orders/',
          '/auth/',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
