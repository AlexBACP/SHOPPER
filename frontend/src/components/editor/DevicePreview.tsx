'use client';
import { useEditorStore } from '@/store/editor.store';
import Storefront from '@/components/store-sections/Storefront';
import type { Producto } from '@/components/store-sections/StorefrontContext';
import type { Store } from '@/types';

// Canvas central: preview en vivo del theme actual con ancho mobile/desktop.
export default function DevicePreview({ store, productos }: { store: Store; productos: Producto[] }) {
  const current       = useEditorStore(s => s.current);
  const device        = useEditorStore(s => s.device);
  const selectedId    = useEditorStore(s => s.selectedSectionId);
  const selectSection = useEditorStore(s => s.selectSection);

  const previewTienda: Store = { ...store, theme: current };
  const sections = current.sections ?? [];

  return (
    <div className="flex-1 overflow-auto bg-[var(--surface-2)] p-4 md:p-8">
      <div className="mx-auto transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5"
        style={{ width: device === 'mobile' ? 420 : '100%', maxWidth: device === 'mobile' ? 420 : 1280 }}>
        {/* select-none: evita selección de texto; los clicks seleccionan la sección */}
        <div className="select-none">
          <Storefront tienda={previewTienda} productos={productos} reputacion={null} sections={sections} useTabs={false}
            preview editable selectedId={selectedId} onSelectSection={selectSection} />
        </div>
      </div>
    </div>
  );
}
