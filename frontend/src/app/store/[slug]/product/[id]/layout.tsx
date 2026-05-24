import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string; id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  try {
    const { slug, id } = await params;
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const stRes = await fetch(`${base}/stores`, { next: { revalidate: 60 } });
    const stores = await stRes.json();
    const store  = stores.find((s: { slug: string; id: string; name: string }) => s.slug === slug);
    if (!store) return { title: 'Producto — Shopper' };
    const prRes  = await fetch(`${base}/stores/${store.id}/products`, { next: { revalidate: 60 } });
    const prods  = await prRes.json();
    const prod   = prods.find((p: { _id: string; title: string; description?: string; price: number; images?: string[] }) => p._id === id);
    if (!prod) return { title: 'Producto — Shopper' };
    const fmt    = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
    return {
      title:       `${prod.title} — ${store.name} | Shopper`,
      description: prod.description ?? `Compra ${prod.title} en ${store.name}. Precio: ${fmt(prod.price)}. Envío a toda Colombia.`,
      openGraph: {
        title:       `${prod.title} — ${store.name}`,
        description: `${fmt(prod.price)} · Compra segura con PSE, Nequi y tarjeta`,
        images:      prod.images?.[0] ? [{ url: prod.images[0], width: 600, height: 600, alt: prod.title }] : [],
        type:        'website',
      },
      twitter: {
        card:        'summary_large_image',
        title:       `${prod.title} · ${fmt(prod.price)}`,
        description: `Disponible en Shopper Colombia`,
      },
    };
  } catch {
    return { title: 'Producto — Shopper' };
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
