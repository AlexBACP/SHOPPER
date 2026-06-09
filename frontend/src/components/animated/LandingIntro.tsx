'use client';

/**
 * LandingIntro — animación de entrada de marca para la landing.
 *
 * Diseño "Mercado Editorial": sobre tinta cálida (--nav-bg) revela el
 * logotipo + wordmark "Shopper" con una línea terracota que se dibuja, y
 * luego abre como telón hacia arriba dejando ver la página.
 *
 * · Se reproduce UNA sola vez por sesión (sessionStorage).
 * · Respeta prefers-reduced-motion: si el usuario pide menos movimiento,
 *   no se muestra (la página carga directo).
 * · No bloquea: al terminar se desmonta por completo.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogoIcon } from '@/components/ui/LogoIcon';

const SESSION_KEY = 'shopper-intro-seen';
const EASE = [0.16, 1, 0.3, 1] as const;

export default function LandingIntro() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');

  useEffect(() => {
    // Ya vista en esta sesión o el usuario prefiere menos movimiento → omitir.
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* ignore */ }
    if (seen || reduced) { setPhase('done'); return; }

    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    setPhase('playing');
    const t = setTimeout(() => setPhase('done'), 1800); // se abre el telón tras la intro
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <AnimatePresence>
      {phase === 'playing' && (
        <motion.div
          key="landing-intro"
          aria-hidden
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--nav-bg)' }}
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: EASE, delay: 0 }}
          onClick={() => setPhase('done')}            // permite saltar tocando
        >
          {/* Resplandor cálido detrás */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-[60vh] w-[60vh] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
          />

          <div className="relative flex flex-col items-center gap-5 px-6 text-center">
            {/* Marca */}
            <motion.span
              className="grid h-16 w-16 place-items-center rounded-2xl shadow-lg"
              style={{ background: 'var(--primary)' }}
              initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
            >
              <LogoIcon className="h-8 w-8" />
            </motion.span>

            {/* Wordmark con reveal de máscara */}
            <div className="overflow-hidden">
              <motion.h1
                className="text-5xl font-extrabold tracking-tight md:text-6xl"
                style={{ color: 'var(--bone-2)', fontFamily: 'var(--font-display)' }}
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
              >
                Shopper
              </motion.h1>
            </div>

            {/* Línea terracota que se dibuja */}
            <motion.span
              className="block h-[3px] w-28 rounded-full"
              style={{ background: 'var(--accent)', transformOrigin: 'center' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
            />

            {/* Tagline */}
            <motion.p
              className="text-sm uppercase tracking-[0.25em]"
              style={{ color: 'var(--accent-bright)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
            >
              Hecho en Colombia
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
