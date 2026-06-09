import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string; id: string }>;
  children: React.ReactNode;
}

const BASE = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:3001';
const SITE = process.env.NEXT_PUBLIC_SITE_URL  ?? 'https://shopper.co';
const fmt  = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface StoreLite   { id: string; slug: string; name: string }
interface ProductLite { _id: string; title: string; description?: string; price: number; stock?: number; sku?: string; images?: string[] }

// Carga tienda + producto + resumen de reseñas (Next deduplica el fetch entre metadata y layout)
async function load(slug: string, id: string) {
  try {
    const stores: StoreLite[] = await fetch(`${BASE}/stores`, { next: { revalidate: 60 } }).then(r => r.json());
    const store = stores.find(s => s.slug === slug);
    if (!store) return null;
    const prod: ProductLite | null = await fetch(`${BASE}/stores/${store.id}/products/${id}`, { next: { revalidate: 60 } })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    if (!prod || !prod._id) return null;
    const rating = await fetch(`${BASE}/reviews/product/${id}/summary`, { next: { revalidate: 60 } })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    return { store, prod, rating };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) return { title: 'Producto — Shopper' };
  const { store, prod } = data;
  const url = `${SITE}/store/${slug}/product/${id}`;
  return {
    title:       `${prod.title} — ${store.name} | Shopper`,
    description: prod.description?.slice(0, 160) ?? `Compra ${prod.title} en ${store.name}. Precio: ${fmt(prod.price)}. Envío a toda Colombia, pago con PSE, Nequi y tarjeta.`,
    alternates:  { canonical: url },
    openGraph: {
      title:       `${prod.title} — ${store.name}`,
      description: `${fmt(prod.price)} · Compra segura con PSE, Nequi y tarjeta`,
      url,
      images:      prod.images?.[0] ? [{ url: prod.images[0], width: 600, height: 600, alt: prod.title }] : [],
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${prod.title} · ${fmt(prod.price)}`,
      description: 'Disponible en Shopper Colombia',
      images:      prod.images?.[0] ? [prod.images[0]] : [],
    },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const { slug, id } = await params;
  const data = await load(slug, id);

  let jsonLd: Record<string, unknown> | null = null;
  if (data) {
    const { store, prod, rating } = data;
    const url = `${SITE}/store/${slug}/product/${id}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: prod.title,
      image: prod.images?.length ? prod.images : undefined,
      description: prod.description,
      sku: prod.sku,
      brand: { '@type': 'Brand', name: store.name },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'COP',
        price: prod.price,
        availability: (prod.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: store.name },
      },
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
