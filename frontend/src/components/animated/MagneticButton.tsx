'use client';

/**
 * MagneticButton — botón con efecto magnético (sigue el cursor sutilmente).
 * Ideal para CTAs principales. Usa spring physics de Framer Motion.
 *
 * Uso:
 *   <MagneticButton onClick={...}>Agregar al carrito</MagneticButton>
 */

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, ReactNode, MouseEvent } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'accent' | 'outline';
  className?: string;
  /** Intensidad del efecto magnético (0.2 = sutil, 0.6 = fuerte). Default 0.3 */
  strength?: number;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export default function MagneticButton({
  children,
  onClick,
  variant   = 'primary',
  className = '',
  strength  = 0.3,
  disabled  = false,
  type      = 'button',
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics — natural, no robótico
  const xSpring = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const ySpring = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) * strength;
    const dy = (e.clientY - rect.top  - rect.height / 2) * strength;
    x.set(dx);
    y.set(dy);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const styles = {
    primary: {
      background: 'var(--btn-primary-bg)',
      color:      'var(--btn-primary-text)',
      border:     '1px solid var(--btn-primary-bg)',
    },
    accent: {
      background: 'var(--accent)',
      color:      'var(--btn-cart-text)',
      border:     '1px solid var(--accent)',
    },
    outline: {
      background: 'transparent',
      color:      'var(--text-primary)',
      border:     '1.5px solid var(--text-primary)',
    },
  } as const;

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: xSpring,
        y: ySpring,
        ...styles[variant],
        boxShadow: 'var(--shadow-btn)',
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <motion.span style={{ x: xSpring, y: ySpring }} className="pointer-events-none flex items-center gap-2">
        {children}
      </motion.span>
    </motion.button>
  );
}
