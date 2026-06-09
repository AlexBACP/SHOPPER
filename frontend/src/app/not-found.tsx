'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Home, ArrowLeft, ShoppingBag,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg w-full"
      >
        {/* Ilustración SVG */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
          className="mx-auto mb-8 w-48 h-48"
        >
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="#faf6ef" stroke="#ddd2c0" strokeWidth="2"/>
            <rect x="55" y="70" width="90" height="70" rx="8" fill="#faf6ef" stroke="#ddd2c0" strokeWidth="2"/>
            <rect x="65" y="82" width="40" height="6" rx="3" fill="#ddd2c0"/>
            <rect x="65" y="94" width="60" height="4" rx="2" fill="#ece3d4"/>
            <rect x="65" y="104" width="50" height="4" rx="2" fill="#ece3d4"/>
            <rect x="65" y="114" width="35" height="4" rx="2" fill="#ece3d4"/>
            <circle cx="130" cy="130" r="22" fill="#c75a2b" opacity="0.15"/>
            <circle cx="130" cy="130" r="16" fill="#faf6ef" stroke="#c75a2b" strokeWidth="2.5"/>
            <path d="M124 124l12 12M136 124l-12 12" stroke="#c75a2b" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="70" cy="65" r="8" fill="#e7efe9" stroke="#2f5d4f" strokeWidth="1.5"/>
            <path d="M67 65l2 2 4-4" stroke="#2f5d4f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-8xl font-black text-[var(--text-primary)] mb-2 tracking-tight leading-none">
            4<span className="text-[var(--accent)]">0</span>4
          </h1>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Página no encontrada</h2>
          <p className="text-[var(--text-muted)] text-base mb-8 leading-relaxed max-w-sm mx-auto">
            La página que buscas no existe o fue movida. Explora nuestras tiendas o vuelve al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"
              className="flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3.5 rounded-xl transition-all hover:shadow-[var(--shadow-md)] text-sm">
              <Home className="w-4 h-4" /> Ir al inicio
            </Link>
            <Link href="/#tiendas"
              className="flex items-center justify-center gap-2 bg-[var(--bone-2)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium px-6 py-3.5 rounded-xl transition-all text-sm hover:shadow-md">
              <ShoppingBag className="w-4 h-4" /> Explorar tiendas
            </Link>
            <button onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 bg-[var(--bone-2)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium px-6 py-3.5 rounded-xl transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver atrás
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
