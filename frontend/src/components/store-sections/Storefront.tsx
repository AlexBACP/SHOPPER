'use client';
// ─────────────────────────────────────────────────────────────
//  Núcleo de render del escaparate. Recibe la tienda + sus datos +
//  el array de secciones y los pinta vía <SectionRenderer />.
//  Lo usan tanto la página pública (StoreClient) como el preview
//  en vivo del editor visual (con preview=true → interacciones inertes).
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Store as TipoTienda, StoreSection } from '@/types';
import { useCartStore } from '@/store/cart.store';
import SectionRenderer from './SectionRenderer';
import { StorefrontProvider } from './StorefrontContext';
import type { Producto } from './StorefrontContext';
import { isTopSection, isBottomSection, isActiveForTab } from '@/lib/store-sections';

export default function Storefront({
  tienda, productos, reputacion, sections, useTabs,
  preview = false, editable = false, selectedId = null, onSelectSection,
}: {
  tienda:     TipoTienda;
  productos:  Producto[];
  reputacion: { promedio: number; total: number } | null;
  sections:   StoreSection[];
  useTabs:    boolean;
  /** En el editor (preview) las interacciones de carrito/compartir son inertes. */
  preview?:   boolean;
  /** Modo editor: cada sección es clickeable para seleccionarla. */
  editable?:     boolean;
  selectedId?:   string | null;
  onSelectSection?: (id: string) => void;
}) {
  const [busqueda, setBusqueda]     = useState('');
  const [agregadoId, setAgregadoId] = useState<string | null>(null);
  const [tab, setTab]               = useState<'productos' | 'info'>('productos');
  const [compartido, setCompartido] = useState(false);
  const { addItem, openCart } = useCartStore();

  const theme  = tienda.theme ?? {};
  const accent = theme.accent || 'var(--primary)';
  const waLink = theme.whatsapp
    ? `https://wa.me/${theme.whatsapp}?text=${encodeURIComponent(`¡Hola! Vengo de tu tienda ${tienda.name} en Shopper y quiero más información.`)}`
    : null;
  const filtrados = useMemo(
    () => productos.filter(p => p.title.toLowerCase().includes(busqueda.toLowerCase())),
    [productos, busqueda],
  );

  const agregar = (p: Producto) => {
    if (preview) return;
    addItem({ productId: p._id, storeId: tienda.id, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: p.images?.[0] });
    setAgregadoId(p._id); setTimeout(() => setAgregadoId(null), 1800); openCart();
  };

  const compartir = () => {
    if (preview) return;
    navigator.clipboard?.writeText(window.location.href);
    setCompartido(true); setTimeout(() => setCompartido(false), 2000);
  };

  const ctx = {
    tienda, productos, reputacion, accent,
    useTabs, tab, setTab,
    busqueda, setBusqueda, filtrados,
    agregar, agregadoId,
    compartir, compartido, waLink,
  };

  const top    = sections.filter(s => s.enabled && isTopSection(s.type));
  const body   = sections.filter(s => s.enabled && !isTopSection(s.type) && !isBottomSection(s.type));
  const bottom = sections.filter(s => s.enabled && isBottomSection(s.type));
  const bodyVisible = body.filter(s => isActiveForTab(s.type, tab, useTabs));

  // En modo editor, cada sección se envuelve para poder seleccionarla con
  // un click (capturando el evento para bloquear navegación/carrito internos).
  const slot = (s: StoreSection) => {
    if (!editable) return <SectionRenderer key={s.id} section={s} />;
    return (
      <div key={s.id}
        onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); onSelectSection?.(s.id); }}
        className={`relative cursor-pointer transition-shadow hover:ring-2 hover:ring-inset hover:ring-[var(--accent)]/40 ${
          selectedId === s.id ? 'ring-2 ring-inset ring-[var(--accent)]' : ''
        }`}>
        <SectionRenderer section={s} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <StorefrontProvider value={ctx}>
        {top.map(slot)}

        {bodyVisible.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
            <AnimatePresence mode="wait">
              {bodyVisible.map(slot)}
            </AnimatePresence>
          </div>
        )}

        {bottom.map(slot)}
      </StorefrontProvider>

      {/* Botón flotante de contacto al vendedor — solo mobile (P1.8) */}
      {waLink && !editable && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preguntarle al vendedor por WhatsApp"
          className="md:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-sm pl-3.5 pr-4 py-3 rounded-full shadow-lg active:scale-95 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.559 4.118 1.535 5.845L.057 23.99l6.345-1.663A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.77-.592-5.27-1.607l-.378-.226-3.916 1.026 1.043-3.82-.247-.393A9.961 9.961 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Preguntar
        </a>
      )}
    </div>
  );
}
