'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, Eye, EyeOff, Edit, ExternalLink, ArrowLeft, Loader2, CheckCircle, AlertCircle, Check, Palette,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import ImageUploader from '@/components/ui/ImageUploader';
import type { StoreTheme } from '@/types';

const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.06 } } };
const item    = { hidden:{ opacity:0, y:14 }, visible:{ opacity:1, y:0, transition:{ ease:[0.16,1,0.3,1] as [number,number,number,number], duration:0.45 } } };

interface Tienda { id:string; name:string; slug:string; description?:string; logo_url?:string; is_published:boolean; created_at:string; theme?: StoreTheme; }

// Paleta de acentos sugeridos para personalizar la tienda
const ACCENTS = ['#c75a2b', '#2f5d4f', '#8a2f3f', '#2f4f7a', '#b8862f', '#6a3f7a', '#1f1a14'];

// ── Asistente "Completa tu tienda": mide qué tan lista está la tienda ──
interface Completable { logo?: string; description?: string; banner?: string; tagline?: string; whatsapp?: string }
function completeness(f: Completable) {
  const items = [
    { label: 'Logo',              done: !!f.logo },
    { label: 'Descripción',       done: !!(f.description && f.description.trim()) },
    { label: 'Banner / portada',  done: !!f.banner },
    { label: 'Mensaje destacado', done: !!(f.tagline && f.tagline.trim()) },
    { label: 'WhatsApp',          done: !!(f.whatsapp && f.whatsapp.replace(/\D/g, '')) },
  ];
  const done = items.filter(i => i.done).length;
  return { pct: Math.round((done / items.length) * 100), items };
}

const inputCls = "w-full px-4 py-2.5 text-sm border border-[var(--line)] rounded-lg bg-[var(--bone)] text-[var(--ink)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all";

function Modal({ tienda, onClose, onSaved }: { tienda: Partial<Tienda>|null; onClose: ()=>void; onSaved: ()=>void }) {
  const [name, setName] = useState(tienda?.name ?? '');
  const [desc, setDesc] = useState(tienda?.description ?? '');
  const [logo, setLogo] = useState(tienda?.logo_url ?? '');
  // Personalización
  const [accent,   setAccent]   = useState(tienda?.theme?.accent  ?? ACCENTS[0]);
  const [banner,   setBanner]   = useState(tienda?.theme?.banner   ?? '');
  const [tagline,  setTagline]  = useState(tienda?.theme?.tagline  ?? '');
  const [whatsapp, setWhatsapp] = useState(tienda?.theme?.whatsapp ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    const wa = whatsapp.replace(/[^\d]/g, '');
    const theme: StoreTheme = {
      accent,
      banner:   banner.trim()  || undefined,
      tagline:  tagline.trim() || undefined,
      whatsapp: wa             || undefined,
    };
    const payload = { name, description: desc, logo_url: logo, theme };
    setSaving(true);
    try {
      if (tienda?.id) await api.patch(`/stores/${tienda.id}`, payload);
      else            await api.post('/stores', payload);
      toast.success(tienda?.id ? 'Tienda actualizada' : '¡Tienda creada!');
      onSaved(); onClose();
    } catch (e) { handleApiError(e, 'No pudimos guardar la tienda. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95 }}
        onClick={e => e.stopPropagation()} className="bg-[var(--bone-2)] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-[var(--ink)] px-6 py-4 flex items-center gap-3 shrink-0">
          <Store className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="font-bold text-[var(--bone-2)]" style={{ fontFamily: 'var(--font-display)' }}>{tienda?.id ? 'Editar tienda' : 'Crea y personaliza tu tienda'}</h2>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] overflow-y-auto">
          {/* ── Formulario ── */}
          <div className="p-6 space-y-4 border-r border-[var(--line)]">
            <div>
              <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Nombre *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Artesanías del Río" className={inputCls} />
              <p className="text-[11px] text-[var(--ink-soft)] mt-1">La dirección web se genera automáticamente del nombre.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Descripción</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} placeholder="Cuenta de qué trata tu tienda..." className={`${inputCls} resize-none`} />
            </div>

            {/* Color de acento */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">Color de tu marca</label>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCENTS.map(c => (
                  <button key={c} type="button" onClick={() => setAccent(c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${accent === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bone-2)] ring-[var(--ink)]' : ''}`}
                    style={{ background: c }} aria-label={`Color ${c}`} />
                ))}
                <label className="w-8 h-8 rounded-full border border-dashed border-[var(--line)] grid place-items-center cursor-pointer overflow-hidden relative" title="Color personalizado">
                  <input type="color" value={accent} onChange={e=>setAccent(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Plus className="w-4 h-4 text-[var(--ink-soft)]" />
                </label>
              </div>
            </div>

            {/* Logo */}
            <div>
              <ImageUploader folder="stores" label="Logo de la tienda" value={logo} onChange={(url) => setLogo(url)} />
              <input value={logo} onChange={e=>setLogo(e.target.value)} placeholder="…o pega una URL del logo" type="url" className={`${inputCls} mt-1.5`} />
            </div>

            {/* Banner */}
            <div>
              <ImageUploader folder="stores" label="Banner / portada (opcional)" value={banner} onChange={(url) => setBanner(url)} />
              <input value={banner} onChange={e=>setBanner(e.target.value)} placeholder="…o URL del banner" type="url" className={`${inputCls} mt-1.5`} />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Mensaje destacado (opcional)</label>
              <input value={tagline} onChange={e=>setTagline(e.target.value)} maxLength={80} placeholder="Ej. Envío gratis esta semana" className={inputCls} />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5 flex items-center gap-1.5">
                WhatsApp de contacto
                <span className="text-[10px] font-normal text-[var(--ink-soft)]">— para que los compradores te escriban</span>
              </label>
              <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="Ej. 57 300 123 4567" type="tel" className={inputCls} />
            </div>
          </div>

          {/* ── Vista previa ── */}
          <div className="p-5 bg-[var(--bone-3)]/40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] mb-3">Vista previa</p>
            <div className="rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--bone)] shadow-[var(--shadow-sm)]">
              <div className="h-20 relative" style={{ background: banner ? undefined : `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
                {banner && <img src={banner} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="px-4 pb-4 -mt-6 relative">
                <div className="w-12 h-12 rounded-xl border-2 border-[var(--bone)] grid place-items-center overflow-hidden shadow" style={{ background: accent }}>
                  {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-black">{(name||'T')[0]?.toUpperCase()}</span>}
                </div>
                <h3 className="font-bold text-[var(--ink)] mt-2 truncate" style={{ fontFamily: 'var(--font-display)' }}>{name || 'Tu tienda'}</h3>
                {tagline && <p className="text-xs mt-0.5 font-medium" style={{ color: accent }}>{tagline}</p>}
                {desc && <p className="text-[11px] text-[var(--ink-soft)] mt-1 line-clamp-2">{desc}</p>}
                <div className="flex gap-2 mt-3">
                  <span className="flex-1 text-center text-xs font-bold text-white py-1.5 rounded-lg" style={{ background: accent }}>Visitar</span>
                  {whatsapp.replace(/[^\d]/g,'') && (
                    <span className="text-xs font-bold text-white py-1.5 px-3 rounded-lg bg-[#25D366]">WhatsApp</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--ink-soft)] mt-3 leading-relaxed">
              Así verán tu tienda los compradores. Los cambios se aplican al guardar.
            </p>

            {/* Asistente "Completa tu tienda" — se llena mientras editas */}
            {(() => {
              const c = completeness({ logo, description: desc, banner, tagline, whatsapp });
              const full = c.pct === 100;
              return (
                <div className="mt-5 pt-4 border-t border-[var(--line)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Completa tu tienda</span>
                    <span className="text-xs font-extrabold" style={{ color: full ? 'var(--selva)' : 'var(--primary-2)' }}>{c.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bone-3)] overflow-hidden mb-2.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.pct}%`, background: full ? 'var(--selva)' : accent }} />
                  </div>
                  <ul className="space-y-1.5">
                    {c.items.map(it => (
                      <li key={it.label} className="flex items-center gap-2 text-[11px] transition-colors" style={{ color: it.done ? 'var(--ink)' : 'var(--ink-soft)' }}>
                        <span className="w-4 h-4 rounded-full grid place-items-center shrink-0"
                          style={it.done ? { background: 'var(--selva)', color: '#fff' } : { border: '1px solid var(--line)' }}>
                          {it.done && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </span>
                        {it.label}
                      </li>
                    ))}
                  </ul>
                  {full && <p className="text-[11px] text-[var(--selva)] font-semibold mt-2.5">¡Tu tienda está lista para brillar!</p>}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-[var(--line)] shrink-0 bg-[var(--bone-2)]">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[var(--line)] rounded-lg text-sm text-[var(--ink-soft)] hover:bg-[var(--bone-3)] transition-colors">Cancelar</button>
          <button onClick={save} disabled={saving}
            className="flex-[1.5] py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-2)] text-[var(--bone-2)] font-bold rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (tienda?.id ? 'Guardar cambios' : 'Crear tienda')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OwnerStoresPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<Partial<Tienda>|null|false>(false);

  const cargar = async () => {
    try { const r = await api.get('/stores/my'); setTiendas(r.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const togglePublish = async (t: Tienda) => {
    try {
      await api.patch(`/stores/${t.id}`, { is_published: !t.is_published });
      toast.success(t.is_published ? 'Tienda desactivada' : '¡Tienda activada!');
      cargar();
    } catch (e) { handleApiError(e, 'No pudimos actualizar la tienda. Intenta de nuevo.'); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner" className="text-white/60 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div><h1 className="text-xl font-bold text-white">Mis tiendas</h1><p className="text-white/50 text-sm">{tiendas.length} tienda{tiendas.length!==1?'s':''}</p></div>
          </div>
          <button onClick={() => setModal({})}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" /> Nueva tienda
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-44 rounded-xl"/>)}</div>
        ) : tiendas.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-14 h-14 text-[var(--border-hover)] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Sin tiendas aún</h3>
            <p className="text-[var(--text-muted)] mb-6 text-sm">Crea tu primera tienda y comienza a vender</p>
            <button onClick={() => setModal({})} className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-lg transition-all hover:shadow-md text-sm">
              <Plus className="w-4 h-4" /> Crear tienda gratis
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiendas.map(t => (
              <motion.div key={t.id} variants={item} className="bg-[var(--bone-2)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-24 bg-[var(--bone-3)] flex items-center justify-center relative">
                  {t.logo_url ? <img src={t.logo_url} alt={t.name} className="w-12 h-12 rounded-xl object-cover shadow-md" />
                    : <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-md"><span className="text-white text-xl font-black">{t.name[0]?.toUpperCase()}</span></div>}
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${t.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {t.is_published ? <><CheckCircle className="w-3 h-3"/>Activa</> : <><AlertCircle className="w-3 h-3"/>Inactiva</>}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[var(--text-primary)] mb-0.5">{t.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">/{t.slug}</p>
                  {t.description && <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{t.description}</p>}
                  {(() => {
                    const c = completeness({ logo: t.logo_url, description: t.description, banner: t.theme?.banner, tagline: t.theme?.tagline, whatsapp: t.theme?.whatsapp });
                    return c.pct < 100 ? (
                      <button onClick={() => setModal(t)} className="w-full text-left mb-3 group/c">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-[var(--ink-soft)]">Tienda {c.pct}% completa</span>
                          <span className="text-[10px] text-[var(--primary-2)] font-semibold group-hover/c:underline">Personalizar →</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bone-3)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${c.pct}%` }} />
                        </div>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--selva)] mb-3"><CheckCircle className="w-3 h-3" /> Tienda 100% completa</span>
                    );
                  })()}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => togglePublish(t)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${t.is_published ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {t.is_published ? <><EyeOff className="w-3.5 h-3.5"/>Desactivar</> : <><Eye className="w-3.5 h-3.5"/>Activar</>}
                    </button>
                    <button onClick={() => setModal(t)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] font-medium transition-all">
                      <Edit className="w-3.5 h-3.5"/>Editar info
                    </button>
                    <Link href={`/owner/stores/${t.id}/editor`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent-dark)] hover:bg-[var(--accent)] hover:text-white font-medium transition-all">
                      <Palette className="w-3.5 h-3.5"/>Diseño
                    </Link>
                    <Link href={`/store/${t.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] font-medium transition-all">
                      <ExternalLink className="w-3.5 h-3.5"/>Ver
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {modal !== false && <Modal tienda={modal || {}} onClose={() => setModal(false)} onSaved={cargar} />}
      </AnimatePresence>
    </div>
  );
}
