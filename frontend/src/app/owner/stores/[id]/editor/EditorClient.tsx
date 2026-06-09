'use client';
import { useEffect, useState } from 'react';
import { Loader2, Monitor } from 'lucide-react';
import api from '@/lib/api';
import type { Store } from '@/types';
import type { Producto } from '@/components/store-sections/StorefrontContext';
import { useEditorStore } from '@/store/editor.store';
import { defaultSectionsFromLegacy } from '@/lib/store-sections';
import EditorToolbar   from '@/components/editor/EditorToolbar';
import SectionTree     from '@/components/editor/SectionTree';
import SectionSettings from '@/components/editor/SectionSettings';
import DevicePreview   from '@/components/editor/DevicePreview';

export default function EditorClient({ storeId }: { storeId: string }) {
  const [store, setStore]         = useState<Store | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const init         = useEditorStore(s => s.init);
  const dirty        = useEditorStore(s => s.dirty);
  const hasDraft     = useEditorStore(s => s.hasDraft);
  const discardDraft = useEditorStore(s => s.discardDraft);
  const undo         = useEditorStore(s => s.undo);
  const redo         = useEditorStore(s => s.redo);

  // Cargar tienda + productos e inicializar el editor
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sr, pr] = await Promise.all([
          api.get(`/stores/${storeId}`),
          api.get(`/stores/${storeId}/products`).catch(() => ({ data: [] })),
        ]);
        if (!alive) return;
        const s: Store = sr.data;
        setStore(s);
        setProductos((pr.data ?? []) as Producto[]);
        init(storeId, s.theme ?? {}, defaultSectionsFromLegacy());
      } catch {
        if (alive) setError('No se pudo cargar la tienda');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [storeId, init]);

  // Aviso al salir con cambios sin guardar
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // Atajos Cmd/Ctrl+Z (undo) y Cmd/Ctrl+Shift+Z (redo)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );
  if (error || !store) return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink-soft)]">{error || 'Tienda no encontrada'}</div>
  );

  return (
    <>
      {/* En móvil el editor no cabe → mensaje amable */}
      <div className="lg:hidden h-screen flex flex-col items-center justify-center text-center px-8 bg-[var(--bg)]">
        <Monitor className="w-12 h-12 text-[var(--border-hover)] mb-4" />
        <h2 className="text-lg font-bold text-[var(--ink)] mb-2">Edita tu tienda desde un computador</h2>
        <p className="text-sm text-[var(--ink-soft)]">El editor visual necesita más espacio. Ábrelo en una pantalla grande para una mejor experiencia.</p>
      </div>

      {/* Editor (solo desktop) */}
      <div className="hidden lg:flex flex-col h-screen bg-[var(--bg)] overflow-hidden">
        <EditorToolbar storeName={store.name} storeSlug={store.slug} />
        {hasDraft && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center justify-between">
            <span>Restauramos un borrador sin guardar de tu sesión anterior.</span>
            <button onClick={discardDraft} className="font-semibold hover:underline shrink-0 ml-3">Descartar borrador</button>
          </div>
        )}
        <div className="flex flex-1 min-h-0 relative">
          <aside className="w-64 shrink-0 border-r border-[var(--line)] bg-[var(--bone-2)]"><SectionTree /></aside>
          <DevicePreview store={store} productos={productos} />
          <SectionSettings />
        </div>
      </div>
    </>
  );
}
