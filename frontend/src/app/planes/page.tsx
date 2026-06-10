import type { Metadata } from 'next';
import PricingSection from '@/components/ui/pricing-section';

export const metadata: Metadata = {
  title:       'Planes para vendedores',
  description: 'Abre tu tienda gratis en Shopper y sube de plan cuando vendas más. Comisiones desde 0%, productos ilimitados y soporte dedicado según tu plan.',
};

export default function PlanesPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <PricingSection />
    </main>
  );
}
