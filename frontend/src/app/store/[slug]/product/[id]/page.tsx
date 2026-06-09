import { notFound } from 'next/navigation';
import { Store as StoreType } from '@/types';
import ProductClient, { Product } from './ProductClient';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Datos server-side: el contenido del producto se renderiza en el HTML (SEO + primer pintado).
async function getData(slug: string, id: string): Promise<{ store: StoreType; product: Product } | null> {
  try {
    const store: StoreType | null = await fetch(`${BASE}/stores/slug/${slug}`, { next: { revalidate: 30 } })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    if (!store?.id) return null;
    const product: Product | null = await fetch(`${BASE}/stores/${store.id}/products/${id}`, { next: { revalidate: 30 } })
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    if (!product?._id || product.is_active === false) return null;
    return { store, product };
  } catch { return null; }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const data = await getData(slug, id);
  if (!data) notFound();
  return <ProductClient store={data.store} product={data.product} slug={slug} />;
}
