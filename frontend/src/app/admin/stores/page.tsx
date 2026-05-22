'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Search, Eye, EyeOff, Trash2, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Shield, Users, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';

const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.05 } } };
const item    = { hidden:{opacity:0,y:12}, visible:{opacity:1,y:0,transition:{ease:[0.16,1,0.3,1] as [number,number,number,number],duration:0.4}} };

export default function AdminStoresPage() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'all'|'published'|'hidden'>('all');

  const cargar = async () => {
    setLoading(true);
    try { const r = await api.get('/stores'); setTiendas(r.data); }
    catch { toast.error('Error al cargar tiendas'); } finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const togglePublish = async (t: any) => {
    try {
      await api.put(`/stores/${t.id}`, { is_published: !t.is_published });
      toast.success(t.is_published ? 'Tienda ocultada' : '¡Tienda publicada!');
      cargar();
    } catch { toast.error('Error al actualizar'); }
  };

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try { await api.delete(`/stores/${id}`); toast.success('Tienda eliminada'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const filtradas = tiendas.filter(t => {
    const matchQ = t.name.toLowerCase().includes(busqueda.toLowerCase()) || t.slug.toLowerCase().includes(busqueda.toLowerCase());
    const matchF = filtro === 'all' || (filtro === 'published' && t.is_published) || (filtro === 'hidden' && !t.is_published);
    return matchQ && matchF;
  });

  const pub    = tiendas.filter(t=>t.is_published).length;
  const ocultas = tiendas.filter(t=>!t.is_published).length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[var(--accent)]"/>
              <div><h1 className="text-xl font-bold text-white">Panel Admin — Tiendas</h1><p className="text-white/50 text-sm">{tiendas.length} tiendas en la plataforma</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/stores/users" className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg px-3 py-2 text-sm transition-all">
                <Users className="w-4 h-4"/>Usuarios
              </Link>
              <button onClick={cargar} disabled={loading} className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg px-3 py-2 text-sm transition-all">
                <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Actualizar
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[{label:'Total',value:tiendas.length,color:'text-white'},{label:'Publicadas',value:pub,color:'text-green-300'},{label:'Ocultas',value:ocultas,color:'text-yellow-300'}].map(s=>(
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-white/50 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar tienda o slug..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
          </div>
          <div className="flex gap-2">
            {([['all','Todas'],['published','Publicadas'],['hidden','Ocultas']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setFiltro(v)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all ${filtro===v?'bg-[var(--accent)] border-[var(--accent)] text-white':'bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>
                {l}
              </button>
            ))}
          </div>
          <span className="text-sm text-[var(--text-muted)] self-center">{filtradas.length} resultados</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-44 rounded-xl"/>)}</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20"><Store className="w-12 h-12 text-[var(--border-hover)] mx-auto mb-4"/><p className="text-[var(--text-secondary)] font-medium">Sin resultados</p></div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtradas.map(t=>(
              <motion.div key={t.id} variants={item} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-24 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
                  {t.logo_url?<img src={t.logo_url} alt={t.name} className="w-12 h-12 rounded-xl object-cover shadow-md"/>
                    :<div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-md"><span className="text-white text-xl font-black">{t.name[0]?.toUpperCase()}</span></div>}
                  <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${t.is_published?'bg-green-100 text-green-700 border-green-200':'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {t.is_published?<><CheckCircle className="w-3 h-3"/>Publicada</>:<><AlertCircle className="w-3 h-3"/>Oculta</>}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-[var(--text-primary)] truncate mb-0.5 group-hover:text-[var(--accent-dark)] transition-colors">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">/{t.slug}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>togglePublish(t)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${t.is_published?'border-gray-200 text-gray-600 hover:bg-gray-50':'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {t.is_published?<><EyeOff className="w-3.5 h-3.5"/>Ocultar</>:<><Eye className="w-3.5 h-3.5"/>Publicar</>}
                    </button>
                    <Link href={`/store/${t.slug}`} target="_blank"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] font-medium transition-all">
                      <ExternalLink className="w-3.5 h-3.5"/>Ver
                    </Link>
                    <button onClick={()=>eliminar(t.id,t.name)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-all ml-auto">
                      <Trash2 className="w-3.5 h-3.5"/>Eliminar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
