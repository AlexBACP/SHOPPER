'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle, Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { useRateLimit } from '@/hooks/useRateLimit';
import { LogoIcon } from '@/components/ui/LogoIcon';
import FloatingProductsBackground from '@/components/ui/FloatingProductsBackground';

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email('Correo inválido') });
const resetSchema = z.object({
  code:     z.string().trim().min(4, 'Código requerido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Incluye al menos una mayúscula')
    .regex(/[0-9]/, 'Incluye al menos un número'),
});
type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;
type Step = 'email' | 'sent' | 'done';

export default function ForgotPasswordPage() {
  const [step,    setStep]    = useState<Step>('email');
  const [email,   setEmail]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const rl = useRateLimit({ maxRequests: 3, windowMs: 5 * 60_000 });

  const onSendEmail = async (data: EmailForm) => {
    if (!rl.canRequest()) {
      const secs = Math.ceil(rl.getRemainingTime() / 1000);
      toast.error(`Demasiadas solicitudes. Espera ${secs} segundos y vuelve a intentar.`);
      return;
    }
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep('sent');
    } catch (err: unknown) {
      handleApiError(err, 'No encontramos una cuenta con ese correo.');
    }
  };

  const onReset = async (data: ResetForm) => {
    try {
      await api.post('/auth/reset-password', { email, code: data.code, password: data.password });
      setStep('done');
      toast.success('Contraseña actualizada');
    } catch (err: unknown) {
      handleApiError(err, 'El código es inválido o ya expiró. Solicita uno nuevo.');
    }
  };

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
            <span className="row">Recupera el</span>
            <span className="row indent"><span className="it">acceso</span></span>
            <span className="row">en minutos.</span>
          </h2>
          <p className="eda-cover-lead">
            Te enviamos un código de verificación a tu correo para restablecer tu contraseña de forma segura.
          </p>

          <ul className="eda-cover-list">
            {[
              { t: 'Ingresa tu correo',     d: 'Validamos que exista tu cuenta' },
              { t: 'Revisa tu bandeja',     d: 'Te enviamos un código de 6 dígitos' },
              { t: 'Define una nueva clave', d: 'Cifrada y nunca compartida' },
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
          <span>Soporte 24/7</span>
        </div>
      </aside>

      {/* Form */}
      <main className="eda-pane">
        <div className="eda-pane-top">
          <Link href="/" className="eda-pane-logo">
            <span className="badge"><LogoIcon /></span>
            <span className="nm">Shopper</span>
          </Link>
          <Link href="/auth/login" className="eda-pane-back">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
          </Link>
        </div>

        <div className="eda-form-wrap">
          <AnimatePresence mode="wait">

            {/* Paso 1 — Email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="eda-form-icon"><Mail className="w-7 h-7" /></div>
                <header className="eda-form-h">
                  <h1>¿Olvidaste tu <span className="it">contraseña</span>?</h1>
                  <p>Ingresa tu correo y te enviaremos un código para restablecerla.</p>
                </header>

                <form onSubmit={emailForm.handleSubmit(onSendEmail)} noValidate>
                  <div className="eda-field">
                    <label className="eda-field-label" htmlFor="fp-email">Correo electrónico</label>
                    <div className="eda-input-wrap">
                      <input
                        id="fp-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="tu@email.com"
                        className="eda-input"
                        {...emailForm.register('email')}
                      />
                      <Mail className="w-4 h-4 eda-input-icon" aria-hidden />
                    </div>
                    {emailForm.formState.errors.email && (
                      <span className="eda-field-err">
                        <AlertCircle className="w-3.5 h-3.5" /> {emailForm.formState.errors.email.message}
                      </span>
                    )}
                  </div>

                  <button type="submit" disabled={emailForm.formState.isSubmitting} className="eda-cta alt">
                    {emailForm.formState.isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                      : <>Enviar código <Mail className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Paso 2 — Código + nueva contraseña */}
            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="eda-form-icon ok"><Mail className="w-7 h-7" /></div>
                <header className="eda-form-h">
                  <h1>Revisa tu <span className="it">correo</span></h1>
                  <p>
                    Enviamos un código de 6 dígitos a <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
                    Ingrésalo junto a tu nueva contraseña.
                  </p>
                </header>

                <form onSubmit={resetForm.handleSubmit(onReset)} noValidate>
                  <div className="eda-field">
                    <label className="eda-field-label" htmlFor="fp-code">Código de verificación</label>
                    <div className="eda-input-wrap">
                      <input
                        id="fp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={8}
                        placeholder="123456"
                        className="eda-input code"
                        {...resetForm.register('code')}
                      />
                    </div>
                    {resetForm.formState.errors.code && (
                      <span className="eda-field-err">
                        <AlertCircle className="w-3.5 h-3.5" /> {resetForm.formState.errors.code.message}
                      </span>
                    )}
                  </div>

                  <div className="eda-field">
                    <label className="eda-field-label" htmlFor="fp-pwd">Nueva contraseña</label>
                    <div className="eda-input-wrap">
                      <input
                        id="fp-pwd"
                        type={showPwd ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="8+ caracteres, 1 mayúscula y 1 número"
                        className="eda-input"
                        {...resetForm.register('password')}
                      />
                      <button
                        type="button"
                        className="eda-input-toggle"
                        onClick={() => setShowPwd(v => !v)}
                        aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {resetForm.formState.errors.password && (
                      <span className="eda-field-err">
                        <AlertCircle className="w-3.5 h-3.5" /> {resetForm.formState.errors.password.message}
                      </span>
                    )}
                  </div>

                  <button type="submit" disabled={resetForm.formState.isSubmitting} className="eda-cta alt">
                    {resetForm.formState.isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                      : <><Lock className="w-4 h-4" /> Restablecer contraseña</>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="eda-foot"
                    style={{ background: 'none', border: 0, cursor: 'pointer', width: '100%' }}
                  >
                    ← Cambiar correo
                  </button>
                </form>
              </motion.div>
            )}

            {/* Paso 3 — Éxito */}
            {step === 'done' && (
              <motion.div
                key="done"
                className="eda-success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              >
                <div className="eda-success-icon">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2>¡Contraseña <span className="it">actualizada</span>!</h2>
                <p>Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión.</p>
                <Link href="/auth/login" className="eda-cta alt" style={{ maxWidth: 240, margin: '0 auto' }}>
                  Iniciar sesión <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
