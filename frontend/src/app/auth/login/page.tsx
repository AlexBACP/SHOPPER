'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Mail, ArrowRight, Eye, EyeOff, ShoppingCart, Store, Loader2, Shield, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { useRateLimit } from '@/hooks/useRateLimit';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/LogoIcon';
import FloatingProductsBackground from '@/components/ui/FloatingProductsBackground';

const loginSchema = z.object({
  email:    z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/* Logos oficiales de marca */
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

export default function LoginPage() {
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null); // si !null → paso del código 2FA
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // Anti-spam: máx 5 intentos cada 5 minutos.
  const rl = useRateLimit({ maxRequests: 5, windowMs: 5 * 60_000 });

  // Guarda sesión y redirige según el rol (lo usan el login normal y el de 2FA).
  const finishLogin = (accessToken: string, refreshToken: string) => {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    setAuth({ id: payload.sub, email: payload.email, role: payload.role, name: payload.name ?? '' }, accessToken, refreshToken);
    toast.success('¡Bienvenido de vuelta!');
    let dest = '/';
    if (payload.role === 'admin' || payload.role === 'super_admin') dest = '/admin/stores';
    else if (payload.role === 'owner') dest = '/owner';
    else if (payload.role === 'buyer') dest = '/dashboard';
    setTimeout(() => { window.location.href = dest; }, 100);
  };

  const onSubmit = async (data: LoginFormData) => {
    if (!rl.canRequest()) {
      const secs = Math.ceil(rl.getRemainingTime() / 1000);
      toast.error(`Demasiados intentos. Espera ${secs} segundos y vuelve a intentar.`);
      return;
    }
    try {
      const res = await api.post('/auth/login', data);
      if (res.data?.requires2fa) {       // el usuario tiene 2FA → pedir código
        setTwoFaToken(res.data.tempToken);
        return;
      }
      finishLogin(res.data.accessToken, res.data.refreshToken);
    } catch (err: unknown) {
      handleApiError(err, 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
    }
  };

  const submit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) { toast.error('Ingresa el código de 6 dígitos'); return; }
    setVerifying(true);
    try {
      const res = await api.post('/auth/2fa/login', { tempToken: twoFaToken, code: code.trim() });
      finishLogin(res.data.accessToken, res.data.refreshToken);
    } catch (err: unknown) {
      handleApiError(err, 'Código incorrecto o expirado.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="eda-page">
      {/* —— Panel izquierdo con productos flotantes —— */}
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
            <span className="row">Tu marketplace</span>
            <span className="row indent"><span className="it">colombiano</span></span>
            <span className="row">de confianza.</span>
          </h2>
          <p className="eda-cover-lead">
            Miles de tiendas verificadas. Pagos seguros con Wompi. Envíos a todo el país.
          </p>

          <ul className="eda-cover-list">
            {[
              { t: 'Pagos 100% seguros', d: 'Cifrado SSL 256-bit con Wompi' },
              { t: '+1.200 tiendas verificadas', d: 'Identidad confirmada por Shopper' },
              { t: 'Compra de múltiples tiendas', d: 'En un solo carrito y pago' },
            ].map((it, i) => (
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

      {/* —— Panel derecho (formulario) —— */}
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
          {twoFaToken ? (
            <>
              <header className="eda-form-h">
                <h1>Verificación <span className="it">en dos pasos</span></h1>
                <p>Ingresa el código de 6 dígitos de tu app autenticadora (Google Authenticator, Authy…).</p>
              </header>
              <form onSubmit={submit2fa} noValidate>
                <div className="eda-field">
                  <label className="eda-field-label" htmlFor="totp">Código de verificación</label>
                  <div className="eda-input-wrap">
                    <input
                      id="totp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="eda-input"
                      style={{ letterSpacing: '.35em', textAlign: 'center', fontWeight: 700 }}
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={verifying} className="eda-cta alt">
                  {verifying
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</>
                    : <>Verificar <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setTwoFaToken(null); setCode(''); }}
                className="eda-foot"
                style={{ background: 'none', border: 0, cursor: 'pointer' }}
              >
                ← Volver al inicio de sesión
              </button>
            </>
          ) : (
          <>
          <header className="eda-form-h">
            <h1>Bienvenido <span className="it">de vuelta</span></h1>
            <p>Accede a tu cuenta para continuar comprando.</p>
          </header>

          {/* OAuth */}
          <div className="eda-oauth">
            {[
              { label: 'Google',   href: `${BACKEND}/auth/google`,   icon: <GoogleIcon /> },
              { label: 'Facebook', href: `${BACKEND}/auth/facebook`, icon: <FacebookIcon /> },
            ].map(p => (
              <a key={p.label} href={p.href} className="eda-oauth-btn">
                {p.icon}
                <span>{p.label}</span>
              </a>
            ))}
          </div>

          <div className="eda-divider"><span>o con tu email</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
              <div className="eda-field-row">
                <label className="eda-field-label" htmlFor="password">Contraseña</label>
                <Link href="/auth/forgot-password" className="eda-field-link">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="eda-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando…</>
                : <>Iniciar sesión <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="eda-foot">
            ¿No tienes cuenta? <Link href="/auth/register">Regístrate gratis</Link>
          </p>

          {/* Promo: vender */}
          <div className="eda-promo">
            <span className="ic"><Store className="w-4 h-4" /></span>
            <div>
              <div className="t">¿Quieres vender con nosotros?</div>
              <div className="d">Abre tu tienda gratis y llega a toda Colombia.</div>
            </div>
            <Link href="/auth/register" className="arr">Vender <ArrowRight className="w-3 h-3" /></Link>
          </div>

          {/* Trust badge mobile */}
          <p className="eda-foot tiny lg:hidden">
            <Shield className="w-3.5 h-3.5 inline -mt-0.5 mr-1" style={{ color: 'var(--selva)' }} />
            Pago protegido con SSL 256-bit · Verificado por Wompi
          </p>

          {/* Suprimido para Lint: warning de unused */}
          <span hidden><ShoppingCart /></span>
          </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
