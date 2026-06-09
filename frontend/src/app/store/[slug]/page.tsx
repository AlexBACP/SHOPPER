import { notFound } from 'next/navigation';
import { Store as TipoTienda } from '@/types';
import StoreClient, { Producto } from './StoreClient';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface PageData {
  tienda: TipoTienda;
  productos: Producto[];
  reputacion: { promedio: number; total: number } | null;
  preview: boolean;
}

async function fetchExtras(storeId: string, opts: RequestInit & { next?: { revalidate: number } }) {
  const productosRaw: Producto[] = await fetch(`${BASE}/stores/${storeId}/products`, opts)
    .then(r => (r.ok ? r.json() : [])).catch(() => []);
  const productos = productosRaw.filter(p => p.is_active !== false);
  const reputacion = await fetch(`${BASE}/reviews/store/${storeId}/summary`, opts)
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  return { productos, reputacion };
}

// Tienda pública normal (publicada), cacheada.
async function getNormal(slug: string): Promise<PageData | null> {
  const tienda: TipoTienda | null = await fetch(`${BASE}/stores/slug/${slug}`, { next: { revalidate: 30 } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  if (!tienda?.id) return null;
  const { productos, reputacion } = await fetchExtras(tienda.id, { next: { revalidate: 30 } });
  return { tienda, productos, reputacion, preview: false };
}

// Vista previa por token: resuelve el theme sin publicar (sin caché).
async function getPreview(token: string): Promise<PageData | null> {
  const pv = await fetch(`${BASE}/stores/theme/preview/${token}`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  if (!pv?.store_id) return null;
  const tienda: TipoTienda | null = await fetch(`${BASE}/stores/${pv.store_id}`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  if (!tienda?.id) return null;
  tienda.theme = pv.theme; // sobrescribe con el theme en vista previa
  const { productos, reputacion } = await fetchExtras(tienda.id, { cache: 'no-store' });
  return { tienda, productos, reputacion, preview: true };
}

export default async function StorePage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const data = preview ? await getPreview(preview) : await getNormal(slug);
  if (!data) notFound();
  return <StoreClient tienda={data.tienda} productos={data.productos} reputacion={data.reputacion} preview={data.preview} />;
}
