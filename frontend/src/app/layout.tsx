import type { Metadata } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/ui/Providers';

// Cuerpo / UI — reemplaza a Inter en el rediseño "Mercado Editorial"
const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets:  ['latin'],
  display:  'swap',
  weight:   ['400', '500', '600', '700'],
});
// Display — titulares, nombres de sección, logo, totales
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets:  ['latin'],
  display:  'swap',
  weight:   ['400', '500', '600', '700', '800'],
});
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co';

export const metadata: Metadata = {
  title:       { default: 'Shopper — Marketplace Colombiano', template: '%s | Shopper' },
  description: 'El marketplace colombiano con miles de tiendas verificadas. Compra con PSE, Nequi, Daviplata y tarjeta. Envíos a toda Colombia. IVA incluido.',
  keywords:    ['marketplace colombia', 'comprar online colombia', 'tiendas colombianas', 'shopper', 'PSE', 'Nequi'],
  authors:     [{ name: 'Shopper Colombia' }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type:        'website',
    locale:      'es_CO',
    siteName:    'Shopper',
    title:       'Shopper — Marketplace Colombiano',
    description: 'Miles de tiendas verificadas. Pagos seguros con PSE, Nequi y tarjeta. Envíos a toda Colombia.',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Shopper Marketplace' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Shopper — Marketplace Colombiano',
    description: 'Miles de tiendas verificadas. Compra online en Colombia de forma segura.',
  },
  robots:     { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  manifest:   '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Shopper' },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable':       'yes',
    'apple-mobile-web-app-capable': 'yes',
    'msapplication-TileColor':      '#c75a2b',
    'theme-color':                  '#221d16',
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

// Datos estructurados globales (Organization + WebSite con caja de búsqueda).
const SITE_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Shopper',
      url: SITE_URL,
      logo: `${SITE_URL}/og-default.png`,
      description: 'Marketplace colombiano de tiendas independientes verificadas.',
    },
    {
      '@type': 'WebSite',
      name: 'Shopper',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${hanken.variable} ${bricolage.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_LD).replace(/</g, '\\u003c') }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
