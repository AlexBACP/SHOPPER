'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, ArrowRight, Eye, EyeOff, ShoppingCart, Store, Crown, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import FloatingProductsBackground from '@/components/ui/FloatingProductsBackground';

const schema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role:     z.enum(['buyer', 'owner']),
});
type FormData = z.infer<typeof schema>;

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/* Logos oficiales de marca (SVG reales, no emojis) */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'buyer' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/register', data);
      setDone(true);
      toast.success('¡Cuenta creada! Inicia sesión.');
      setTimeout(() => window.location.href = '/auth/login', 2000);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al registrar');
    }
  };

  if (done) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">¡Cuenta creada!</h2>
        <p className="text-[var(--text-muted)]">Redirigiendo al login...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[var(--nav-bg)] p-12 relative overflow-hidden">
        <FloatingProductsBackground />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--nav-bg)] to-transparent pointer-events-none" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white">Shopper</span>
        </Link>

        <div className="relative z-10">
          <p className="text-4xl font-black text-white leading-tight mb-4">
            Únete a miles de<br />
            {role === 'owner'
              ? <><span className="text-[var(--accent)]">vendedores</span><br />exitosos.</>
              : <><span className="text-[var(--accent)]">compradores</span><br />satisfechos.</>
            }
          </p>
          <p className="text-white/50 text-base">
            {role === 'owner'
              ? 'Abre tu tienda gratis y llega a miles de clientes en toda Colombia.'
              : 'Descubre productos únicos de las mejores tiendas independientes del país.'}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {(role === 'owner'
              ? ['Sin comisiones iniciales', 'Panel de control completo', 'Soporte dedicado']
              : ['Pagos 100% seguros', 'Envíos a todo Colombia', 'Compra sin complicaciones']
            ).map(t => (
              <div key={t} className="flex items-center gap-3 text-white/60 text-sm">
                <CheckCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2025 Shopper Colombia</p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-[var(--text-primary)]">Shopper</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Crear cuenta</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Gratis. Sin tarjeta requerida.</p>

          {/* Selector rol */}
          <div className="flex gap-2 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg mb-6">
            {[
              { val: 'buyer', icon: ShoppingCart, label: 'Comprador' },
              { val: 'owner', icon: Store,         label: 'Vendedor'  },
            ].map(r => (
              <button key={r.val} type="button" onClick={() => setValue('role', r.val as 'buyer' | 'owner')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  role === r.val ? 'bg-white text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                <r.icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            ))}
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Google',   href: `${BACKEND}/auth/google`,   icon: <GoogleIcon /> },
              { label: 'Facebook', href: `${BACKEND}/auth/facebook`, icon: <FacebookIcon /> },
            ].map((p, i) => (
              <motion.a key={p.label} href={p.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center justify-center gap-2.5 py-3 border border-[var(--border)] rounded-xl bg-white overflow-hidden hover:border-[var(--text-muted)] hover:shadow-md transition-all">
                <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">{p.icon}</span>
                <span className="relative z-10 text-[var(--text-secondary)] text-sm font-semibold">{p.label}</span>
                {/* Shimmer al hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </motion.a>
            ))}
          </div>

          <div className="relative flex items-center mb-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="px-3 text-xs text-[var(--text-muted)] bg-[var(--bg)]">o con tu email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nombre completo</label>
              <div className="relative">
                <input type="text" placeholder="Tu nombre" {...register('name')}
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

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
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" {...register('password')}
                  className="w-full pl-4 pr-10 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <motion.button type="submit" disabled={isSubmitting} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold py-3 rounded-lg text-sm transition-all hover:shadow-md disabled:opacity-60">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Crear cuenta gratis <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-[var(--blue)] font-medium hover:underline">Iniciar sesión</Link>
          </p>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Al registrarte aceptas nuestros <Link href="/terms" className="underline">Términos</Link> y <Link href="/privacy" className="underline">Privacidad</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
