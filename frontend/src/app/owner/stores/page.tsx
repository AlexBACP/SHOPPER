'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Eye, EyeOff, Edit, ExternalLink, ArrowLeft, Loader2, CheckCircle, AlertCircle, Crown, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import ImageUploader from '@/components/ui/ImageUploader';

const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.06 } } };
const item    = { hidden:{ opacity:0, y:14 }, visible:{ opacity:1, y:0, transition:{ ease:[0.16,1,0.3,1] as [number,number,number,number], duration:0.45 } } };

interface Tienda { id:string; name:string; slug:string; description?:string; logo_url?:string; is_published:boolean; created_at:string; }

function Modal({ tienda, onClose, onSaved }: { tienda: Partial<Tienda>|null; onClose: ()=>void; onSaved: ()=>void }) {
  const [name, setName] = useState(tienda?.name ?? '');
  const [desc, setDesc] = useState(tienda?.description ?? '');
  const [logo, setLogo] = useState(tienda?.logo_url ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (tienda?.id) await api.patch(`/stores/${tienda.id}`, { name, description: desc, logo_url: logo });
      else await api.post('/stores', { name, description: desc, logo_url: logo });
      toast.success(tienda?.id ? 'Tienda actualizada' : 'Tienda creada');
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[var(--nav-bg)] px-6 py-4 flex items-center gap-3">
          <Crown className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="font-bold text-white">{tienda?.id ? 'Editar tienda' : 'Nueva tienda'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nombre *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Artesanías del Río"
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" /></div>
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Descripción</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Describe tu tienda..."
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all resize-none" /></div>
          <div>
            <ImageUploader
              folder="stores"
              label="Logo de la tienda"
              value={logo}
              onChange={(url) => setLogo(url)}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">O pega una URL directamente:</p>
            <input value={logo} onChange={e=>setLogo(e.target.value)} placeholder="https://..." type="url"
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all mt-1.5" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
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
    } catch { toast.error('Error al actualizar'); }
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
              <motion.div key={t.id} variants={item} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-24 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
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
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => togglePublish(t)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${t.is_published ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {t.is_published ? <><EyeOff className="w-3.5 h-3.5"/>Desactivar</> : <><Eye className="w-3.5 h-3.5"/>Activar</>}
                    </button>
                    <button onClick={() => setModal(t)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] font-medium transition-all">
                      <Edit className="w-3.5 h-3.5"/>Editar
                    </button>
                    <Link href={`/store/${t.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] font-medium transition-all">
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
