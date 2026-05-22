'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowLeft, Save, Eye, EyeOff, Shield, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [name,       setName]       = useState(user?.name ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [savedInfo,  setSavedInfo]  = useState(false);

  if (!user) return null;

  const saveInfo = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío'); return; }
    setSavingInfo(true);
    try {
      await api.put('/users/me', { name });
      setAuth({ ...user, name }, useAuthStore.getState().accessToken ?? '', useAuthStore.getState().refreshToken ?? '');
      setSavedInfo(true); setTimeout(() => setSavedInfo(false), 2000);
      toast.success('Perfil actualizado');
    } catch { toast.error('Error al actualizar'); } finally { setSavingInfo(false); }
  };

  const savePassword = async () => {
    if (!currentPwd || !newPwd) { toast.error('Completa ambas contraseñas'); return; }
    if (newPwd.length < 6)      { toast.error('Mínimo 6 caracteres');          return; }
    setSavingPwd(true);
    try {
      await api.put('/users/me/password', { current: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd('');
      toast.success('Contraseña actualizada');
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Error al cambiar contraseña'); }
    finally { setSavingPwd(false); }
  };

  const ROLES: Record<string,string> = { buyer:'Comprador', owner:'Vendedor', admin:'Admin', super_admin:'Super Admin' };
  const BADGE: Record<string,string> = {
    buyer:'bg-green-100 text-green-700 border-green-200',
    owner:'bg-purple-100 text-purple-700 border-purple-200',
    admin:'bg-orange-100 text-orange-700 border-orange-200',
    super_admin:'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></Link>
          <div><h1 className="text-xl font-bold text-white">Mi perfil</h1><p className="text-white/50 text-sm">Gestiona tu información personal</p></div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-5">
        {/* Avatar y rol */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
          className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{user.name}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-2">{user.email}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${BADGE[user.role] ?? BADGE.buyer}`}>
                <Shield className="w-3 h-3"/>{ROLES[user.role] ?? 'Usuario'}
              </span>
            </div>
          </div>
          {/* Links rápidos */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
            {[
              { href:'/orders',   label:'Mis pedidos', icon:'📦' },
              { href:'/wishlist', label:'Favoritos',   icon:'❤️' },
              { href:'/',         label:'Explorar',    icon:'🛍️' },
            ].map(({ href, label, icon }) => (
              <a key={href} href={href} className="flex flex-col items-center gap-1.5 p-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-xl transition-colors text-center">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Info personal */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.4 }}
          className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><User className="w-5 h-5 text-[var(--accent)]"/>Información personal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nombre completo</label>
              <div className="relative">
                <input value={name} onChange={e=>setName(e.target.value)} type="text"
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Correo electrónico</label>
              <div className="relative">
                <input value={user.email} disabled type="email"
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed"/>
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">El email no se puede cambiar</p>
            </div>
            <button onClick={saveInfo} disabled={savingInfo}
              className="flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-5 py-2.5 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-60">
              {savingInfo ? <Loader2 className="w-4 h-4 animate-spin"/> : savedInfo ? <><CheckCircle className="w-4 h-4"/>¡Guardado!</> : <><Save className="w-4 h-4"/>Guardar cambios</>}
            </button>
          </div>
        </motion.div>

        {/* Cambiar contraseña */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.4 }}
          className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-[var(--accent)]"/>Cambiar contraseña</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Contraseña actual</label>
              <div className="relative">
                <input type={showCur?'text':'password'} value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
                <button type="button" onClick={()=>setShowCur(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showCur?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input type={showNew?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
                <button type="button" onClick={()=>setShowNew(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showNew?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button onClick={savePassword} disabled={savingPwd||!currentPwd||!newPwd}
              className="flex items-center gap-2 bg-[var(--nav-bg)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-40">
              {savingPwd?<Loader2 className="w-4 h-4 animate-spin"/>:<><Lock className="w-4 h-4"/>Cambiar contraseña</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
