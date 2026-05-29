'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2, Lock, Eye, EyeOff, Crown } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';

const emailSchema = z.object({ email: z.string().email('Correo inválido') });
const resetSchema = z.object({
  code:     z.string().min(4, 'Código requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;
type Step = 'email' | 'sent' | 'reset' | 'done';

const inputCls = "w-full px-4 py-3 text-sm border border-[var(--input-border)] rounded-xl bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all";

export default function ForgotPasswordPage() {
  const [step,      setStep]      = useState<Step>('email');
  const [email,     setEmail]     = useState('');
  const [showPwd,   setShowPwd]   = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSendEmail = async (data: EmailForm) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep('sent');
    } catch {
      toast.error('No encontramos una cuenta con ese correo');
    }
  };

  const onReset = async (data: ResetForm) => {
    try {
      await api.post('/auth/reset-password', { email, code: data.code, password: data.password });
      setStep('done');
      toast.success('Contraseña actualizada');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Código inválido o expirado');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Panel decorativo */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[var(--nav-bg)] p-12 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white">Shopper</span>
        </Link>
        <div className="relative z-10">
          <p className="text-4xl font-black text-white leading-tight mb-4">
            Recupera el acceso<br />a tu cuenta<br />
            <span className="text-[var(--accent)]">en minutos.</span>
          </p>
          <p className="text-white/50 text-sm">Te enviamos un código de verificación a tu correo para restablecer tu contraseña de forma segura.</p>
        </div>
        <p className="text-white/20 text-xs relative z-10">© {new Date().getFullYear()} Shopper Colombia</p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8 self-start">
          <ArrowLeft className="w-4 h-4" /> Volver al login
        </Link>

        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">

            {/* Paso 1: Email */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 bg-orange-100 border border-orange-200 rounded-2xl flex items-center justify-center mb-5">
                  <Mail className="w-7 h-7 text-orange-600" />
                </div>
                <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">¿Olvidaste tu contraseña?</h1>
                <p className="text-sm text-[var(--text-muted)] mb-6">Ingresa tu correo y te enviaremos un código para restablecerla.</p>
                <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Correo electrónico</label>
                    <input type="email" placeholder="tu@email.com" {...emailForm.register('email')} className={inputCls} autoFocus />
                    {emailForm.formState.errors.email && <p className="text-xs text-red-500 mt-1">{emailForm.formState.errors.email.message}</p>}
                  </div>
                  <button type="submit" disabled={emailForm.formState.isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black py-3.5 rounded-xl text-sm transition-all hover:shadow-md disabled:opacity-60">
                    {emailForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar código <Mail className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Paso 2: Correo enviado */}
            {step === 'sent' && (
              <motion.div key="sent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center mb-5">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-black text-[var(--text-primary)] mb-1">Revisa tu correo</h1>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  Enviamos un código de 6 dígitos a <strong className="text-[var(--text-primary)]">{email}</strong>. Ingresa el código y tu nueva contraseña.
                </p>
                <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Código de verificación</label>
                    <input type="text" placeholder="123456" {...resetForm.register('code')} maxLength={8}
                      className={`${inputCls} text-center font-mono text-xl tracking-widest`} autoFocus />
                    {resetForm.formState.errors.code && <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.code.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Nueva contraseña</label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" {...resetForm.register('password')} className={`${inputCls} pr-12`} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {resetForm.formState.errors.password && <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.password.message}</p>}
                  </div>
                  <button type="submit" disabled={resetForm.formState.isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black py-3.5 rounded-xl text-sm transition-all hover:shadow-md disabled:opacity-60">
                    {resetForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" />Restablecer contraseña</>}
                  </button>
                  <button type="button" onClick={() => setStep('email')} className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                    ← Cambiar correo
                  </button>
                </form>
              </motion.div>
            )}

            {/* Paso 3: Éxito */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                  className="w-20 h-20 bg-green-100 border border-green-200 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
                <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">¡Contraseña actualizada!</h1>
                <p className="text-sm text-[var(--text-muted)] mb-8">Tu contraseña fue restablecida exitosamente. Ahora puedes iniciar sesión.</p>
                <Link href="/auth/login"
                  className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black px-8 py-4 rounded-xl transition-all hover:shadow-md">
                  Iniciar sesión <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
