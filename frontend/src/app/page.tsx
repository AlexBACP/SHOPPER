import { Store as TipoTienda } from '@/types';
import HomeClient, { ProductoDestacado } from './HomeClient';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Añade los campos de tienda que esperan las tarjetas (nombreTienda/slugTienda/idTienda).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapear(arr: any[]): ProductoDestacado[] {
  return (arr ?? []).map((p: any) => ({
    ...p,
    nombreTienda: p.storeName ?? '',
    slugTienda:   p.storeSlug ?? '',
    idTienda:     p.store_id  ?? '',
  }));
}

async function getHomeData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = (url: string, fallback: any): Promise<any> =>
    fetch(`${BASE}${url}`, { next: { revalidate: 30 } }).then(r => (r.ok ? r.json() : fallback)).catch(() => fallback);

  const [stores, destacadosRes, ofertasRes, stats] = await Promise.all([
    j('/stores', []),
    j('/products/search?limit=18', { resultados: [] }),
    j('/products/search?hasDiscount=true&sortBy=discount&limit=12', { resultados: [] }),
    j('/stats', null),
  ]);

  const tiendas: TipoTienda[] = (Array.isArray(stores) ? stores : []).filter((t: TipoTienda) => t.is_published);
  return {
    tiendas,
    destacados:  mapear(destacadosRes?.resultados),
    ofertas:     mapear(ofertasRes?.resultados),
    statsReales: stats ?? null,
  };
}

export default async function Page() {
  const data = await getHomeData();
  return <HomeClient {...data} />;
}
