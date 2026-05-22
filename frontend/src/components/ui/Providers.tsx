'use client';

import { ThemeProvider }          from '@/components/ui/ThemeProvider';
import { AuthProvider }           from '@/components/ui/AuthProvider';
import ErrorBoundary              from '@/components/ui/ErrorBoundary';
import Navbar                     from '@/components/layout/Navbar';
import Footer                     from '@/components/layout/Footer';
import CartDrawer                 from '@/components/cart/CartDrawer';
import ChatBot                    from '@/components/ui/ChatBot';
import NotificacionesProvider     from '@/components/ui/NotificacionesProvider';
import PWABanner                  from '@/components/ui/PWABanner';
import { Toaster }                from 'sonner';

const TOASTER_STYLE: React.CSSProperties = {
  background:   '#ffffff',
  border:       '1px solid var(--border)',
  color:        'var(--text-primary)',
  fontFamily:   'var(--font-geist-sans)',
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
