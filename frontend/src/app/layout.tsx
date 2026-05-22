import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/ui/AuthProvider';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import ChatBot from '@/components/ui/ChatBot';
import NotificacionesProvider from '@/components/ui/NotificacionesProvider';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PWABanner    from '@/components/ui/PWABanner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title:       { default: 'Shopper — Marketplace Colombiano', template: '%s | Shopper' },
  description: 'El marketplace colombiano con miles de tiendas verificadas. Compra con PSE, Nequi, Daviplata y tarjeta. Envíos a toda Colombia. IVA incluido.',
  keywords:    ['marketplace colombia', 'comprar online colombia', 'tiendas colombianas', 'shopper', 'PSE', 'Nequi'],
  authors:     [{ name: 'Shopper Colombia' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co'),
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
  robots:  { index: true, follow: true },
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co' },
  manifest:  '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'Shopper',
  },
  formatDetection: { telephone: false },
  other: {
    'mobile-web-app-capable':        'yes',
    'apple-mobile-web-app-capable':  'yes',
    'msapplication-TileColor':       '#FF9900',
    'theme-color':                   '#131921',
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Toaster
                theme="light"
                position="top-right"
                richColors
                expand={false}
                toastOptions={{
                  style: {
                    background:  '#ffffff',
                    border:      '1px solid var(--border)',
                    color:       'var(--text-primary)',
                    fontFamily:  'var(--font-geist-sans)',
                    boxShadow:   'var(--shadow-card-hover)',
                    borderRadius:'12px',
                  },
                }}
              />
              <Navbar />
              <CartDrawer />
              <ChatBot />
              <NotificacionesProvider />
              <PWABanner />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
