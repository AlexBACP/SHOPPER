import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

const BASE = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:3001';
const SITE = process.env.NEXT_PUBLIC_SITE_URL  ?? 'https://shopper.co';

interface StoreLite { id: string; slug: string; name: string; description?: string; logo_url?: string }

async function load(slug: string) {
  try {
    const stores: StoreLite[] = await fetch(`${BASE}/stores`, { next: { revalidate: 60 } }).then(r => r.json());
    const store = stores.find(s => s.slug === slug);
    if (!store) return null;
    const rating = await fetch(`${BASE}/reviews/store/${store.id}/summary`, { next: { revalidate: 60 } })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    return { store, rating };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: 'Tienda no encontrada' };
  const { store } = data;
  const url = `${SITE}/store/${slug}`;
  return {
    title:       `${store.name} — Shopper`,
    description: store.description?.slice(0, 160) ?? `Descubre los productos de ${store.name} en Shopper, el marketplace colombiano. Compra con confianza, envío a toda Colombia.`,
    alternates:  { canonical: url },
    openGraph: {
      title:       `${store.name} — Shopper Marketplace`,
      description: store.description ?? `Compra en ${store.name}`,
      url,
      images:      store.logo_url ? [{ url: store.logo_url, width: 400, height: 400 }] : [],
      type:        'website',
    },
    twitter: { card: 'summary', title: `${store.name} en Shopper` },
  };
}

export default async function StoreLayout({ params, children }: Props) {
  const { slug } = await params;
  const data = await load(slug);

  let jsonLd: Record<string, unknown> | null = null;
  if (data) {
    const { store, rating } = data;
    const url = `${SITE}/store/${slug}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: store.name,
      description: store.description,
      image: store.logo_url || undefined,
      url,
      ...(rating && rating.total > 0
        ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.promedio, reviewCount: rating.total } }
        : {}),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
