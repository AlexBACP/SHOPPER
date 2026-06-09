'use client';

import { Suspense }               from 'react';
import { ThemeProvider }          from '@/components/ui/ThemeProvider';
import { AuthProvider }           from '@/components/ui/AuthProvider';
import ErrorBoundary              from '@/components/ui/ErrorBoundary';
import Navbar                     from '@/components/layout/Navbar';
import CategoryStrip              from '@/components/layout/CategoryStrip';
import Footer                     from '@/components/layout/Footer';
import CartDrawer                 from '@/components/cart/CartDrawer';
import ChatBot                    from '@/components/ui/ChatBot';
import NotificacionesProvider     from '@/components/ui/NotificacionesProvider';
import PWABanner                  from '@/components/ui/PWABanner';
import { Toaster }                from 'sonner';

const TOASTER_STYLE: React.CSSProperties = {
  background:   'var(--bone-2)',
  border:       '1px solid var(--line)',
  color:        'var(--ink)',
  fontFamily:   'var(--font-sans)',
  boxShadow:    'var(--shadow-card-hover)',
  borderRadius: '12px',
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster
            theme="light"
            position="top-right"
            richColors
            expand={false}
            toastOptions={{ style: TOASTER_STYLE }}
          />
          <Navbar />
          <Suspense fallback={null}><CategoryStrip /></Suspense>
          <CartDrawer />
          <ChatBot />
          <NotificacionesProvider />
          <PWABanner />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
