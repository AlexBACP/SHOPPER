'use client';
import Link from 'next/link';
import { ArrowLeft, Monitor, Smartphone, Undo2, Redo2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/errors';
import { useEditorStore } from '@/store/editor.store';
import EditorExtras from './EditorExtras';

// Barra superior: volver, nombre, compartir/versiones, dispositivo, undo/redo, guardar.
export default function EditorToolbar({ storeName, storeSlug }: { storeName: string; storeSlug: string }) {
  const device    = useEditorStore(s => s.device);
  const setDevice = useEditorStore(s => s.setDevice);
  const undo      = useEditorStore(s => s.undo);
  const redo      = useEditorStore(s => s.redo);
  const canUndo   = useEditorStore(s => s.history.length > 0);
  const canRedo   = useEditorStore(s => s.future.length > 0);
  const dirty     = useEditorStore(s => s.dirty);
  const saving    = useEditorStore(s => s.saving);
  const save      = useEditorStore(s => s.save);

  const onSave = async () => {
    try { await save(); toast.success('Diseño guardado'); }
    catch (e) { handleApiError(e, 'No pudimos guardar el diseño. Intenta de nuevo.'); }
  };

  return (
    <header className="flex items-center justify-between gap-3 px-4 h-14 border-b border-[var(--line)] bg-[var(--bone-2)] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/owner/stores" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="text-sm font-bold text-[var(--ink)] truncate" style={{ fontFamily: 'var(--font-display)' }}>{storeName}</span>
        {dirty && <span className="text-[10px] text-[var(--primary-2)] font-semibold whitespace-nowrap">● Sin guardar</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <EditorExtras slug={storeSlug} />
        <div className="w-px h-5 bg-[var(--line)] mx-0.5" />
        <div className="flex bg-[var(--bone-3)] rounded-lg p-0.5">
          <button onClick={() => setDevice('desktop')} aria-label="Vista escritorio"
            className={`p-1.5 rounded-md transition-all ${device === 'desktop' ? 'bg-[var(--bone-2)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]'}`}><Monitor className="w-4 h-4" /></button>
          <button onClick={() => setDevice('mobile')} aria-label="Vista móvil"
            className={`p-1.5 rounded-md transition-all ${device === 'mobile' ? 'bg-[var(--bone-2)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]'}`}><Smartphone className="w-4 h-4" /></button>
        </div>
        <button onClick={undo} disabled={!canUndo} aria-label="Deshacer" className="p-1.5 rounded-md text-[var(--ink-soft)] hover:bg-[var(--bone-3)] disabled:opacity-30 transition-all"><Undo2 className="w-4 h-4" /></button>
        <button onClick={redo} disabled={!canRedo} aria-label="Rehacer" className="p-1.5 rounded-md text-[var(--ink-soft)] hover:bg-[var(--bone-3)] disabled:opacity-30 transition-all"><Redo2 className="w-4 h-4" /></button>
        <button onClick={onSave} disabled={!dirty || saving}
          className="ml-1 flex items-center gap-1.5 bg-[var(--primary)] hover:bg-[var(--primary-2)] text-[var(--bone-2)] font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Guardar
        </button>
      </div>
    </header>
  );
}
