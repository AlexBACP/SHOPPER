'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type Estado = 'verifying' | 'success' | 'error' | 'expired' | 'resent';

function VerifyContent() {
  const sp    = useSearchParams();
  const token = sp.get('token');
  const email = sp.get('email') ?? '';

  const [estado,  setEstado]  = useState<Estado>('verifying');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setEstado('error'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setEstado('success'))
      .catch((err) => {
        const msg = err?.response?.data?.message ?? '';
        setEstado(msg.toLowerCase().includes('expir') ? 'expired' : 'error');
      });
  }, [token]);

  const reenviar = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setEstado('resent');
    } catch { /* silenciar */ }
    finally { setLoading(false); }
  };

  const CONFIG = {
    verifying: {
      icon: <Loader2 className="w-14 h-14 text-[var(--accent)] animate-spin" />,
      bg:   'bg-[var(--accent-subtle)] border-[var(--accent-border)]',
      title:'Verificando tu correo...',
      desc: 'Por favor espera un momento.',
      cta:  null,
    },
    success: {
      icon: <CheckCircle className="w-14 h-14 text-[var(--selva)]" />,
      bg:   'bg-green-50 border-[var(--selva)]/30',
      title:'¡Email verificado!',
      desc: 'Tu cuenta está activa. Ya puedes iniciar sesión y comprar en Shopper.',
      cta:  <Link href="/auth/login" className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-md text-sm">Iniciar sesión <ArrowRight className="w-4 h-4" /></Link>,
    },
    error: {
      icon: <XCircle className="w-14 h-14 text-red-500" />,
      bg:   'bg-red-50 border-red-200',
      title:'Enlace inválido',
      desc: 'El enlace de verificación no es válido. Solicita uno nuevo.',
      cta:  email ? (
        <button onClick={reenviar} disabled={loading}
          className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-md text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reenviar verificación
        </button>
      ) : null,
    },
    expired: {
      icon: <Mail className="w-14 h-14 text-[var(--primary)]" />,
      bg:   'bg-[var(--accent-subtle)] border-[var(--accent-border)]',
      title:'Enlace expirado',
      desc: 'El enlace de verificación ha expirado (válido por 24 horas). Te enviamos uno nuevo.',
      cta:  email ? (
        <button onClick={reenviar} disabled={loading}
          className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-md text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reenviar correo
        </button>
      ) : null,
    },
    resent: {
      icon: <CheckCircle className="w-14 h-14 text-[var(--selva)]" />,
      bg:   'bg-[var(--selva-soft)] border-[var(--selva)]/30',
      title:'Correo reenviado',
      desc: `Enviamos un nuevo enlace de verificación a ${email}. Revisa tu bandeja de entrada.`,
      cta:  <Link href="/auth/login" className="text-sm text-[var(--primary)] hover:underline">Ir al login</Link>,
    },
  };

  const c = CONFIG[estado];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm w-full"
      >
        <div className={`w-24 h-24 ${c.bg} border rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm`}>
          {c.icon}
        </div>
        <h1 className="text-2xl font-black text-[var(--ink)] mb-3">{c.title}</h1>
        <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-8">{c.desc}</p>
        {c.cta}
        {estado !== 'verifying' && (
          <p className="mt-6 text-xs text-[var(--ink-soft)]">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@shopper.co" className="text-[var(--primary)] hover:underline">
              soporte@shopper.co
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  }><VerifyContent /></Suspense>;
}
