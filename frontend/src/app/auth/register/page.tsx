'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, ShoppingCart, Store, Crown, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

const schema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role:     z.enum(['buyer', 'owner']),
});
type FormData = z.infer<typeof schema>;

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,153,0,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--nav-bg)] to-transparent" />

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
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Google',   href: `${BACKEND}/auth/google`,  logo: 'G', color: 'text-red-500' },
              { label: 'Facebook', href: `${BACKEND}/auth/facebook`, logo: 'f', color: 'text-blue-600' },
              { label: 'Apple',    href: `${BACKEND}/auth/apple`,    logo: '🍎', color: 'text-gray-800' },
            ].map(p => (
              <motion.a key={p.label} href={p.href} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-[var(--border)] rounded-lg bg-white hover:bg-[var(--surface-2)] transition-colors">
                <span className={`${p.color} font-black text-base leading-none`}>{p.logo}</span>
                <span className="text-[var(--text-secondary)] text-xs">{p.label}</span>
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
