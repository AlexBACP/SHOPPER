'use client';
import { useState } from 'react';
import { History, Share2, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/errors';
import { useEditorStore, type ThemeSnapshot } from '@/store/editor.store';

// Botones de toolbar: Compartir vista previa + Historial de versiones.
export default function EditorExtras({ slug }: { slug: string }) {
  const loadSnapshots   = useEditorStore(s => s.loadSnapshots);
  const restoreSnapshot = useEditorStore(s => s.restoreSnapshot);
  const createPreview   = useEditorStore(s => s.createPreview);

  const [open, setOpen]             = useState(false);
  const [snaps, setSnaps]           = useState<ThemeSnapshot[]>([]);
  const [loading, setLoading]       = useState(false);
  const [sharing, setSharing]       = useState(false);
  const [restoringId, setRestoring] = useState<string | null>(null);

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try { setSnaps(await loadSnapshots()); }
      catch (e) { handleApiError(e, 'No pudimos cargar las versiones guardadas. Intenta de nuevo.'); }
      finally { setLoading(false); }
    }
  };

  const restore = async (id: string) => {
    setRestoring(id);
    try { await restoreSnapshot(id); toast.success('Versión restaurada'); setOpen(false); }
    catch (e) { handleApiError(e, 'No pudimos restaurar esa versión. Intenta de nuevo.'); }
    finally { setRestoring(null); }
  };

  const share = async () => {
    setSharing(true);
    try {
      const token = await createPreview();
      const url = `${window.location.origin}/store/${slug}?preview=${token}`;
      await navigator.clipboard?.writeText(url);
      toast.success('Enlace de vista previa copiado (válido 7 días)');
    } catch (e) { handleApiError(e, 'No pudimos crear el enlace de vista previa. Intenta de nuevo.'); }
    finally { setSharing(false); }
  };

  return (
    <>
      <button onClick={share} disabled={sharing} aria-label="Compartir vista previa"
        className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--bone-3)] hover:text-[var(--ink)] transition-all disabled:opacity-50">
        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        <span className="hidden xl:inline">Compartir</span>
      </button>

      <div className="relative">
        <button onClick={toggle} aria-label="Versiones"
          className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--bone-3)] hover:text-[var(--ink)] transition-all">
          <History className="w-4 h-4" /> <span className="hidden xl:inline">Versiones</span>
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-1 w-72 bg-[var(--bone-2)] border border-[var(--line)] rounded-xl shadow-xl z-30 overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--line)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Historial de versiones</div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {loading ? (
                <div className="py-6 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-[var(--ink-soft)]" /></div>
              ) : snaps.length === 0 ? (
                <p className="px-2 py-4 text-xs text-center text-[var(--ink-soft)]">Aún no hay versiones. Guarda para crear la primera.</p>
              ) : snaps.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-[var(--bone-3)]">
                  <span className="text-sm text-[var(--ink)] truncate">{s.label || fmtDate(s.created_at)}</span>
                  <button onClick={() => restore(s.id)} disabled={restoringId === s.id}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-2)] shrink-0 disabled:opacity-50">
                    {restoringId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
