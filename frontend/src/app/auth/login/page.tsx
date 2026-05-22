'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShoppingCart, Store, Crown, Loader2, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Link from 'next/link';

const loginSchema = z.object({
  email:    z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const setAuth = useAuthStore(s => s.setAuth);
  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, refreshToken } = res.data;
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      setAuth({ id: payload.sub, email: payload.email, role: payload.role, name: payload.name ?? '' }, accessToken, refreshToken);
      toast.success('¡Bienvenido de vuelta!');
      await new Promise(r => setTimeout(r, 100));
      let dest = '/';
      if (payload.role === 'admin' || payload.role === 'super_admin') dest = '/admin/stores';
      else if (payload.role === 'owner') dest = '/owner';
      else if (payload.role === 'buyer') dest = '/dashboard';
      window.location.href = dest;
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Panel izquierdo decorativo (solo desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[var(--nav-bg)] p-12 relative overflow-hidden">
        {/* Patrón */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,153,0,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Gradiente */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--nav-bg)] to-transparent" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white">Shopper</span>
        </Link>

        <div className="relative z-10">
          <p className="text-4xl font-black text-white leading-tight mb-4">
            Tu marketplace<br />
            <span className="text-[var(--accent)]">colombiano</span> de<br />
            confianza.
          </p>
          <p className="text-white/50 text-base">Miles de tiendas verificadas. Pagos seguros. Envíos a todo el país.</p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: Shield,       text: 'Pagos 100% seguros con SSL 256-bit' },
              { icon: Store,        text: '+1.200 tiendas verificadas' },
              { icon: ShoppingCart, text: 'Compra de múltiples tiendas a la vez' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2025 Shopper Colombia</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

        {/* Logo mobile */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-[var(--text-primary)]">Shopper</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Accede a tu cuenta de Shopper</p>

          {/* Selector de rol */}
          <div className="flex gap-2 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg mb-6">
            {[
              { id: 'buyer',  icon: ShoppingCart, label: 'Comprador' },
              { id: 'seller', icon: Store,         label: 'Vendedor'  },
            ].map(role => (
              <button key={role.id} onClick={() => setActiveRole(role.id as 'buyer' | 'seller')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  activeRole === role.id ? 'bg-white text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                <role.icon className="w-3.5 h-3.5" />
                {role.label}
              </button>
            ))}
          </div>

          {/* Social */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Google',   href: `${BACKEND}/auth/google`,   logo: 'G', color: 'text-red-500' },
              { label: 'Facebook', href: `${BACKEND}/auth/facebook`,  logo: 'f', color: 'text-blue-600' },
              { label: 'Apple',    href: `${BACKEND}/auth/apple`,     logo: '', color: 'text-gray-800' },
            ].map(p => (
              <motion.a key={p.label} href={p.href} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-[var(--border)] rounded-lg bg-white hover:bg-[var(--surface-2)] transition-colors text-sm font-semibold">
                <span className={`${p.color} font-black text-base leading-none`}>{p.logo || '🍎'}</span>
                <span className="text-[var(--text-secondary)] text-xs">{p.label}</span>
              </motion.a>
            ))}
          </div>

          <div className="relative flex items-center mb-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="px-3 text-xs text-[var(--text-muted)] bg-[var(--bg)]">o con tu email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Correo electrónico</label>
              <div className="relative">
                <input type="email" placeholder="tu@email.com" {...register('email')}
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Contraseña</label>
                <Link href="/auth/forgot-password" className="text-xs text-[var(--blue)] hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')}
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold py-3 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-60">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Iniciar sesión <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-[var(--blue)] font-medium hover:underline">
              {activeRole === 'seller' ? 'Abre tu tienda gratis' : 'Regístrate gratis'}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
