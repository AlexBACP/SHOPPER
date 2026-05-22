'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShoppingCart, Store, Crown, ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';

const ROLES: Record<string,{label:string;color:string;icon:React.ElementType}> = {
  buyer:       { label:'Comprador',  color:'bg-green-100  text-green-700  border-green-200',  icon:ShoppingCart },
  owner:       { label:'Vendedor',   color:'bg-purple-100 text-purple-700 border-purple-200', icon:Store        },
  admin:       { label:'Admin',      color:'bg-orange-100 text-orange-700 border-orange-200', icon:Shield       },
  super_admin: { label:'Super Admin',color:'bg-red-100    text-red-700    border-red-200',    icon:Crown        },
};

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargar = async () => {
    setLoading(true);
    try { const r = await api.get('/users'); setUsers(r.data); }
    catch { toast.error('Error al cargar usuarios'); } finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const cambiarRol = async (id:string, nuevoRol:string) => {
    try {
      await api.put(`/users/${id}`, { role: nuevoRol });
      toast.success('Rol actualizado');
      cargar();
    } catch { toast.error('Error al cambiar rol'); }
  };

  const filtrados = users.filter(u =>
    u.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.04 } } };
  const item    = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{ease:[0.16,1,0.3,1] as [number,number,number,number],duration:0.4}} };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Link href="/admin/stores" className="text-white/60 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></Link>
              <div><h1 className="text-xl font-bold text-white">Gestión de usuarios</h1><p className="text-white/50 text-sm">{users.length} usuarios registrados</p></div>
            </div>
            <button onClick={cargar} disabled={loading} className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg px-3 py-2 text-sm transition-all">
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Actualizar
            </button>
          </div>
          {/* Stats roles */}
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(ROLES).map(([rol,cfg])=>{
              const count = users.filter(u=>u.role===rol).length;
              return (
                <div key={rol} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-black text-white">{count}</p>
                  <p className="text-white/50 text-xs">{cfg.label}s</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar usuario..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{filtrados.length} resultados</span>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16"><Users className="w-12 h-12 text-[var(--border-hover)] mx-auto mb-4"/><p className="text-[var(--text-secondary)] font-medium">Sin usuarios</p></div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
              {filtrados.map((u,i)=>{
                const rolCfg = ROLES[u.role] ?? ROLES.buyer;
                const RolIcon = rolCfg.icon;
                return (
                  <motion.div key={u.id??u._id} variants={item}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-2)] transition-colors ${i<filtrados.length-1?'border-b border-[var(--border)]':''}`}>
                    <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{u.name ?? 'Sin nombre'}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0"/>{u.email}</p>
                    </div>
                    <span className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 ${rolCfg.color}`}>
                      <RolIcon className="w-3 h-3"/>{rolCfg.label}
                    </span>
                    <select value={u.role} onChange={e=>cambiarRol(u.id??u._id, e.target.value)}
                      className="text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 bg-white outline-none focus:border-[var(--accent)] transition-colors cursor-pointer shrink-0">
                      {Object.entries(ROLES).map(([r,{label}])=><option key={r} value={r}>{label}</option>)}
                    </select>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
