'use client';

/**
 * @file Resenas.tsx
 * @description Componente de reseñas y calificaciones de productos.
 *   - <Estrellas> — display estático de estrellas (solo lectura)
 *   - <SelectorEstrellas> — selector interactivo (hover + click)
 *   - <SeccionResenas> — lista de reseñas + formulario para agregar
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, Trash2, MessageSquare, CheckCircle2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import ImageUploader from '@/components/ui/ImageUploader';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Resena {
  id:          string;
  product_id:  string;
  user_id:     string;
  user_name:   string;
  rating:      number;
  comment:     string | null;
  image:       string | null;
  created_at:  string;
}

export interface ResumenResenas {
  promedio:     number;
  total:        number;
  por_estrella: Record<1|2|3|4|5, number>;
}

export type OrdenResena = 'fotos' | 'recientes' | 'mejores' | 'peores';

const OPCIONES_ORDEN: { value: OrdenResena; label: string }[] = [
  { value: 'fotos',     label: 'Con fotos primero' },
  { value: 'recientes', label: 'Más recientes'     },
  { value: 'mejores',   label: 'Mejor calificadas' },
  { value: 'peores',    label: 'Peor calificadas'  },
];

/** Ordena una copia de las reseñas según el criterio elegido. */
function ordenarResenas(lista: Resena[], orden: OrdenResena): Resena[] {
  const recientes = (a: Resena, b: Resena) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  const copia = [...lista];
  switch (orden) {
    case 'fotos':     return copia.sort((a, b) => (Number(!!b.image) - Number(!!a.image)) || recientes(a, b));
    case 'mejores':   return copia.sort((a, b) => (b.rating - a.rating) || recientes(a, b));
    case 'peores':    return copia.sort((a, b) => (a.rating - b.rating) || recientes(a, b));
    case 'recientes':
    default:          return copia.sort(recientes);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fechaRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const dias  = Math.floor(diff / 86_400_000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias <  30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return new Date(iso).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

// ─── Componente: estrellas (solo lectura) ─────────────────────────────────────

interface EstrellasProps {
  valor:      number;   // 0–5, acepta decimales
  tamaño?:    'sm' | 'md' | 'lg';
  mostrarNum?: boolean;
}

export function Estrellas({ valor, tamaño = 'md', mostrarNum }: EstrellasProps): React.ReactElement {
  const tam = tamaño === 'sm' ? 'w-3 h-3' : tamaño === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const llena    = valor >= n;
        const parcial  = !llena && valor >= n - 0.5;
        return (
          <span key={n} className="relative">
            <Star className={`${tam} text-[var(--border)]`} fill="currentColor" />
            {(llena || parcial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: llena ? '100%' : '50%' }}
              >
                <Star className={`${tam} text-[var(--accent)]`} fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
      {mostrarNum && (
        <span className="ml-1 text-xs font-semibold text-[var(--text-secondary)]">
          {valor.toFixed(1)}
        </span>
      )}
    </span>
  );
}

// ─── Componente: selector de estrellas interactivo ────────────────────────────

interface SelectorEstrellasProps {
  valor:    number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function SelectorEstrellas({ valor, onChange, disabled }: SelectorEstrellasProps): React.ReactElement {
  const [hover, setHover] = useState(0);
  const activo = hover || valor;

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          whileHover={disabled ? {} : { scale: 1.2 }}
          whileTap={disabled ? {} : { scale: 0.9 }}
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} estrellas`}
          disabled={disabled}
          className="focus-visible:outline-none disabled:cursor-not-allowed"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= activo
                ? 'text-[var(--accent)]'
                : 'text-[var(--border)]'
            }`}
            fill="currentColor"
          />
        </motion.button>
      ))}
    </div>
  );
}

// ─── Componente: barra de distribución ───────────────────────────────────────

function BarraDistribucion({ por_estrella, total }: {
  por_estrella: Record<1|2|3|4|5, number>;
  total: number;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      {([5, 4, 3, 2, 1] as const).map((n) => {
        const count = por_estrella[n] ?? 0;
        const pct   = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-2 text-[var(--text-muted)] shrink-0">{n}</span>
            <Star className="w-3 h-3 text-[var(--accent)] shrink-0" fill="currentColor" />
            <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: (5 - n) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="w-5 text-right text-[var(--text-muted)] shrink-0">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal: sección de reseñas ────────────────────────────────

interface SeccionResenasProps {
  productId: string;
}

export function SeccionResenas({ productId }: SeccionResenasProps): React.ReactElement {
  const { user, accessToken } = useAuthStore();

  const [resenas,  setResenas]  = useState<Resena[]>([]);
  const [resumen,  setResumen]  = useState<ResumenResenas | null>(null);
  const [miResena, setMiResena] = useState<Resena | null>(null);
  const [cargando, setCargando] = useState(true);
  // Por defecto: con foto primero, luego más recientes (dan más confianza). P1.7
  const [orden,    setOrden]    = useState<OrdenResena>('fotos');

  // Form
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [image,    setImage]    = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rResenas, rResumen] = await Promise.all([
        api.get<Resena[]>(`/reviews/product/${productId}`),
        api.get<ResumenResenas>(`/reviews/product/${productId}/summary`),
      ]);
      setResenas(rResumen.data.total > 0 ? rResenas.data : []);
      setResumen(rResumen.data);
    } catch { /* silenciar */ }
    finally { setCargando(false); }
  }, [productId]);

  const cargarMia = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await api.get<Resena | null>(`/reviews/product/${productId}/mine`);
      setMiResena(r.data);
    } catch { /* silenciar */ }
  }, [productId, accessToken]);

  useEffect(() => {
    cargar();
    cargarMia();
  }, [cargar, cargarMia]);

  const resenasOrdenadas = useMemo(() => ordenarResenas(resenas, orden), [resenas, orden]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Selecciona una calificación'); return; }
    setEnviando(true);
    try {
      await api.post('/reviews', { product_id: productId, rating, comment: comment.trim() || undefined, image: image || undefined });
      toast.success('¡Reseña publicada!');
      setRating(0);
      setComment('');
      setImage('');
      setMostrarForm(false);
      await Promise.all([cargar(), cargarMia()]);
    } catch (err: unknown) {
      handleApiError(err, 'No pudimos publicar tu reseña. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Reseña eliminada');
      setMiResena(null);
      await cargar();
    } catch (e) {
      handleApiError(e, 'No pudimos eliminar la reseña. Intenta de nuevo.');
    }
  };

  const puedeResenar = !!user && !miResena;

  return (
    <section className="mt-10" aria-label="Reseñas del producto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-[var(--accent-bright)]" fill="currentColor" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Reseñas
            {resumen && resumen.total > 0 && (
              <span className="text-[var(--text-muted)] font-normal ml-1.5">({resumen.total})</span>
            )}
          </h2>
        </div>

        {puedeResenar && !mostrarForm && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[var(--accent-subtle)] hover:bg-[var(--accent)]/15 border border-[var(--accent-border)] text-[var(--accent-bright)] rounded-xl transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Escribir reseña
          </motion.button>
        )}
      </div>

      {/* Resumen de calificaciones */}
      {!cargando && resumen && resumen.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-5 items-start"
        >
          {/* Promedio grande */}
          <div className="text-center shrink-0">
            <p className="text-5xl font-black texto-dorado leading-none mb-1">
              {resumen.promedio.toFixed(1)}
            </p>
            <Estrellas valor={resumen.promedio} tamaño="sm" />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {resumen.total} reseña{resumen.total !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Barras */}
          <div className="flex-1 w-full">
            <BarraDistribucion por_estrella={resumen.por_estrella} total={resumen.total} />
          </div>
        </motion.div>
      )}

      {/* Formulario de nueva reseña */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleEnviar} className="bg-[var(--surface-2)] border border-[var(--accent-border)] rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Tu calificación
                </p>
                <SelectorEstrellas valor={rating} onChange={setRating} disabled={enviando} />
              </div>
              <div>
                <label htmlFor="comment" className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
                  Comentario (opcional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  placeholder="¿Qué te pareció el producto?"
                  disabled={enviando}
                  className="w-full bg-[var(--surface-3)] border border-[var(--border)] focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(255,153,0,0.08)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none transition-all disabled:opacity-50"
                />
                <p className="text-right text-xs text-[var(--text-muted)] mt-1">{comment.length}/500</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Foto (opcional)
                </p>
                <ImageUploader folder="reviews" label="" value={image} onChange={(url) => setImage(url)} />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Una foto real del producto da mucha más confianza a otros compradores</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setMostrarForm(false); setRating(0); setComment(''); }}
                  className="flex-1 py-2.5 bg-[var(--surface-3)] hover:bg-[var(--surface-4)] border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || rating === 0}
                  className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,153,0,0.20)]"
                >
                  {enviando
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" /> Publicar reseña</>
                  }
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado de carga */}
      {cargando && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
        </div>
      )}

      {/* Sin reseñas */}
      {!cargando && resenas.length === 0 && !mostrarForm && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Sin reseñas todavía</p>
          <p className="text-xs text-[var(--text-muted)]">Sé el primero en calificar este producto</p>
          {!user && (
            <p className="text-xs text-[var(--text-muted)]">
              <a href="/auth/login" className="text-[var(--accent-bright)] hover:underline">Inicia sesión</a> para dejar una reseña
            </p>
          )}
        </div>
      )}

      {/* Lista de reseñas */}
      {!cargando && resenas.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Selector de orden (P1.7) */}
          {resenas.length > 1 && (
            <div className="flex items-center justify-end gap-2">
              <label htmlFor="orden-resenas" className="text-xs text-[var(--text-muted)]">Ordenar por</label>
              <select
                id="orden-resenas"
                value={orden}
                onChange={e => setOrden(e.target.value as OrdenResena)}
                className="text-xs font-medium border border-[var(--border)] rounded-lg px-2.5 py-1.5 bg-[var(--surface)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                {OPCIONES_ORDEN.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          {resenasOrdenadas.map((resena, i) => (
            <motion.div
              key={resena.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Avatar + nombre */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-xs font-black text-white shrink-0">
                    {resena.user_name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{resena.user_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{fechaRelativa(resena.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Estrellas valor={resena.rating} tamaño="sm" />
                  {/* Botón eliminar (solo la propia reseña) */}
                  {user?.id === resena.user_id && (
                    <button
                      onClick={() => handleEliminar(resena.id)}
                      aria-label="Eliminar reseña"
                      className="w-7 h-7 rounded-lg bg-[var(--surface-3)] hover:bg-[var(--danger-subtle)] border border-[var(--border)] hover:border-[var(--danger-border)] flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--danger)]" />
                    </button>
                  )}
                </div>
              </div>

              {resena.comment && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{resena.comment}</p>
              )}
              {resena.image && (
                <a href={resena.image} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <img src={resena.image} alt="Foto de la reseña"
                    className="w-24 h-24 rounded-xl object-cover border border-[var(--border)] hover:opacity-90 transition-opacity" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Prompt para iniciar sesión */}
      {!user && resenas.length > 0 && (
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          <a href="/auth/login" className="text-[var(--accent-bright)] hover:text-[var(--accent)] transition-colors">
            Inicia sesión
          </a>{' '}para dejar tu reseña
        </p>
      )}
    </section>
  );
}
