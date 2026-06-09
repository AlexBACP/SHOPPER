'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User, Mail, ArrowRight, Eye, EyeOff, ShoppingCart, Store, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon';
import FloatingProductsBackground from '@/components/ui/FloatingProductsBackground';

const schema = z.object({
  name:     z.string().trim().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  email:    z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Incluye al menos una mayúscula')
    .regex(/[0-9]/, 'Incluye al menos un número'),
  role:     z.enum(['buyer', 'owner']),
});
type FormData = z.infer<typeof schema>;

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
      handleApiError(err, 'No pudimos crear tu cuenta. Intenta de nuevo en un momento.');
    }
  };

  if (done) {
    return (
      <div className="eda-page">
        <aside className="eda-cover">
          <FloatingProductsBackground />
          <div className="eda-cover-mast">
            <Link href="/" className="eda-cover-logo">
              <span className="badge"><LogoIcon /></span>
              <span className="nm">Shopper</span>
            </Link>
          </div>
          <div className="eda-cover-body">
            <h2 className="eda-cover-h">
              <span className="row">Tu cuenta</span>
              <span className="row indent"><span className="it">está lista.</span></span>
            </h2>
          </div>
          <div className="eda-cover-foot"><span>© 2026 Shopper Colombia</span></div>
        </aside>
        <main className="eda-pane">
          <motion.div
            className="eda-success eda-form-wrap"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="eda-success-icon">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2>¡Cuenta <span className="it">creada</span>!</h2>
            <p>Redirigiendo al inicio de sesión…</p>
            <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--primary)' }} />
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="eda-page">
      {/* Panel izquierdo con productos flotantes */}
      <aside className="eda-cover">
        <FloatingProductsBackground />
        <div className="eda-cover-mast">
          <Link href="/" className="eda-cover-logo">
            <span className="badge"><LogoIcon /></span>
            <span className="nm">Shopper</span>
          </Link>
        </div>

        <div className="eda-cover-body">
          <h2 className="eda-cover-h">
            <span className="row">Únete a miles de</span>
            <span className="row indent">
              <span className="it">
                {role === 'owner' ? 'vendedores' : 'compradores'}
              </span>
            </span>
            <span className="row">{role === 'owner' ? 'exitosos.' : 'satisfechos.'}</span>
          </h2>
          <p className="eda-cover-lead">
            {role === 'owner'
              ? 'Abre tu tienda gratis y llega a miles de clientes en toda Colombia.'
              : 'Descubre productos únicos de las mejores tiendas independientes del país.'}
          </p>

          <ul className="eda-cover-list">
            {(role === 'owner'
              ? [
                  { t: 'Sin comisiones iniciales',  d: 'Primer mes 0% de plataforma' },
                  { t: 'Panel de control completo', d: 'Pedidos, inventario, métricas' },
                  { t: 'Soporte dedicado',           d: 'Atendemos en menos de 24h' },
                ]
              : [
                  { t: 'Pagos 100% seguros',     d: 'Cifrado SSL 256-bit con Wompi' },
                  { t: 'Envíos a todo Colombia', d: 'Cobertura nacional verificada' },
                  { t: 'Compra sin enredos',      d: 'Un solo carrito para todas las tiendas' },
                ]
            ).map((it, i) => (
              <li className="eda-cover-item" key={it.t}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="t">{it.t}</div>
                  <div className="d">{it.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="eda-cover-foot">
          <span>© 2026 Shopper Colombia</span>
          <Link href="/" style={{ color: 'inherit' }}>shopper.co</Link>
        </div>
      </aside>

      {/* Formulario */}
      <main className="eda-pane">
        <div className="eda-pane-top">
          <Link href="/" className="eda-pane-logo">
            <span className="badge"><LogoIcon /></span>
            <span className="nm">Shopper</span>
          </Link>
        </div>

        <motion.div
          className="eda-form-wrap"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="eda-form-h">
            <h1>Empieza <span className="it">hoy mismo</span></h1>
            <p>Gratis. Sin tarjeta requerida. Listo en menos de un minuto.</p>
          </header>

          {/* Selector rol */}
          <div className="eda-roles" role="radiogroup" aria-label="Tipo de cuenta">
            {[
              { val: 'buyer' as const, Icon: ShoppingCart, label: 'Comprador' },
              { val: 'owner' as const, Icon: Store,         label: 'Vendedor'  },
            ].map(r => {
              const Ic = r.Icon;
              return (
                <button
                  key={r.val}
                  type="button"
                  className="eda-role"
                  role="radio"
                  aria-checked={role === r.val}
                  aria-pressed={role === r.val}
                  onClick={() => setValue('role', r.val)}
                >
                  <Ic className="w-4 h-4" />
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* OAuth */}
          <div className="eda-oauth">
            {[
              { label: 'Google',   href: `${BACKEND}/auth/google`,   icon: <GoogleIcon /> },
              { label: 'Facebook', href: `${BACKEND}/auth/facebook`, icon: <FacebookIcon /> },
            ].map(p => (
              <a key={p.label} href={p.href} className="eda-oauth-btn">
                {p.icon}<span>{p.label}</span>
              </a>
            ))}
          </div>

          <div className="eda-divider"><span>o con tu email</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="eda-field">
              <label className="eda-field-label" htmlFor="name">Nombre completo</label>
              <div className="eda-input-wrap">
                <input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  className="eda-input"
                  {...register('name')}
                />
                <User className="w-4 h-4 eda-input-icon" aria-hidden />
              </div>
              {errors.name && (
                <span className="eda-field-err">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name.message}
                </span>
              )}
            </div>

            <div className="eda-field">
              <label className="eda-field-label" htmlFor="email">Correo electrónico</label>
              <div className="eda-input-wrap">
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="eda-input"
                  {...register('email')}
                />
                <Mail className="w-4 h-4 eda-input-icon" aria-hidden />
              </div>
              {errors.email && (
                <span className="eda-field-err">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
                </span>
              )}
            </div>

            <div className="eda-field">
              <label className="eda-field-label" htmlFor="password">Contraseña</label>
              <div className="eda-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8+ caracteres, 1 mayúscula y 1 número"
                  autoComplete="new-password"
                  className="eda-input"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="eda-input-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="eda-field-err">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
                </span>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="eda-cta alt">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</>
                : <>Crear cuenta gratis <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="eda-foot">
            ¿Ya tienes cuenta? <Link href="/auth/login">Iniciar sesión</Link>
          </p>
          <p className="eda-foot tiny">
            Al registrarte aceptas nuestros{' '}
            <Link href="/terms" style={{ textDecoration: 'underline' }}>Términos</Link>
            {' '}y{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline' }}>Privacidad</Link>.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
