'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode, useRef, useCallback } from 'react';

interface PropsTarjeta extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactiva?: boolean;
  brillo?: 'dorado' | 'azul' | 'verde' | 'ninguno';
  variante?: 'default' | 'elevada' | 'bordeada' | 'glass' | 'premium';
  inclinar?: boolean;
  /* props en inglés para compatibilidad */
  interactive?: boolean;
  glow?: 'blue' | 'warm' | 'green' | 'none';
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
}

export function Card({
  children,
  interactiva,
  brillo,
  variante,
  inclinar = false,
  interactive,
  glow,
  variant,
  className,
  ...props
}: PropsTarjeta) {
  const cardRef = useRef<HTMLDivElement>(null);

  const esInteractiva = interactiva ?? interactive ?? false;
  const esInclinar    = inclinar;

  /* Mapa de variante */
  const varianteActiva = variante ?? mapVariante(variant) ?? 'default';
  const brilloActivo   = brillo ?? mapBrillo(glow) ?? 'ninguno';

  /* Efecto 3D de inclinación con el mouse */
  const moverMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!esInclinar || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
  }, [esInclinar]);

  const salirMouse = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
  }, []);

  const variantes: Record<string, string> = {
    default:  'bg-[var(--surface)] border border-[var(--border)]',
    elevada:  'bg-[var(--surface-2)] border border-[var(--border)] shadow-[var(--shadow-card)]',
    bordeada: 'bg-[var(--surface)] border-2 border-[var(--border)]',
    glass:    'glass',
    premium:  'tarjeta-premium',
  };

  const brillos: Record<string, string> = {
    ninguno: '',
    dorado:  'glow-gold',
    azul:    'glow-blue',
    verde:   'glow-green',
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'rounded-2xl transition-all duration-300',
        variantes[varianteActiva],
        brillos[brilloActivo],
        esInteractiva && 'cursor-pointer hover:border-[var(--accent-border)] hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(245,158,11,0.15)]',
        esInclinar    && 'transition-transform duration-150 ease-out will-change-transform',
        className,
      )}
      onMouseMove={esInclinar ? moverMouse : undefined}
      onMouseLeave={esInclinar ? salirMouse : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5 border-b border-[var(--border)]', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)] rounded-b-2xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* Helpers de mapeo para compatibilidad con inglés */
function mapVariante(v?: string): string | undefined {
  const mapa: Record<string, string> = {
    default:  'default',
    elevated: 'elevada',
    bordered: 'bordeada',
    glass:    'glass',
  };
  return v ? mapa[v] : undefined;
}

function mapBrillo(g?: string): string | undefined {
  const mapa: Record<string, string> = {
    none:  'ninguno',
    blue:  'azul',
    warm:  'dorado',
    green: 'verde',
  };
  return g ? mapa[g] : undefined;
}

export default Card;
