'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useState } from 'react';

export default function PWABanner() {
  const { isInstallable, isOffline, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  return (
    <>
      {/* Banner offline */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            Sin conexión — algunas funciones pueden no estar disponibles
            <button
              onClick={() => window.location.reload()}
              className="ml-2 flex items-center gap-1 underline text-white/80 hover:text-white text-xs font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Reintentar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner instalación */}
      <AnimatePresence>
        {isInstallable && !dismissed && !isOffline && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260, delay: 2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm mx-auto px-4"
          >
            <div className="bg-[var(--nav-bg)] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-slate-900/40 flex items-center gap-3">
              {/* Ícono app */}
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
                  <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Instala Shopper</p>
                <p className="text-xs text-white/60 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs px-3 py-2 rounded-xl transition-all hover:shadow-md disabled:opacity-60"
                >
                  {installing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><Download className="w-3.5 h-3.5" />Instalar</>
                  )}
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
