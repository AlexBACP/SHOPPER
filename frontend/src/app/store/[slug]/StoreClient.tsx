'use client';

import { useMemo } from 'react';
import { Store as TipoTienda } from '@/types';
import Storefront from '@/components/store-sections/Storefront';
import type { Producto } from '@/components/store-sections/StorefrontContext';
import { defaultSectionsFromLegacy } from '@/lib/store-sections';

// Re-exportado para no romper el import en page.tsx (`import { Producto }`).
export type { Producto };

export default function StoreClient({ tienda, productos, reputacion, preview = false }: {
  tienda: TipoTienda;
  productos: Producto[];
  reputacion: { promedio: number; total: number } | null;
  preview?: boolean;
}) {
  const theme = tienda.theme ?? {};
  // theme v2 → secciones del editor; legacy → secciones equivalentes (pestañas).
  const esV2 = theme.version === 2 && !!theme.sections?.length;
  const sections = useMemo(
    () => (esV2 ? theme.sections! : defaultSectionsFromLegacy()),
    [esV2, theme.sections],
  );

  return (
    <>
      {preview && (
        <div className="sticky top-0 z-50 bg-[var(--ink)] text-[var(--bone-2)] text-center text-xs py-2 px-4 font-medium">
          👁️ Vista previa — este diseño aún no está publicado
        </div>
      )}
      <Storefront
        tienda={tienda}
        productos={productos}
        reputacion={reputacion}
        sections={sections}
        useTabs={!esV2}
      />
    </>
  );
}
