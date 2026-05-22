import { Metadata } from 'next';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/stores`,
      { next: { revalidate: 60 } }
    );
    const stores = await res.json();
    const store  = stores.find((s: { slug: string; name: string; description?: string; logo_url?: string }) => s.slug === params.slug);
    if (!store) return { title: 'Tienda no encontrada' };
    return {
      title:       `${store.name} — Shopper`,
      description: store.description ?? `Descubre los productos de ${store.name} en Shopper, el marketplace colombiano.`,
      openGraph: {
        title:       `${store.name} — Shopper Marketplace`,
        description: store.description ?? `Compra en ${store.name}`,
        images:      store.logo_url ? [{ url: store.logo_url, width: 400, height: 400 }] : [],
        type:        'website',
      },
      twitter: {
        card:  'summary',
        title: `${store.name} en Shopper`,
      },
    };
  } catch {
    return { title: 'Tienda — Shopper' };
  }
}

export default function StoreLayout({ children }: Props) {
  return <>{children}</>;
}
