import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PropsBotón extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'ghost' | 'peligro' | 'éxito' | 'contorno' | 'azul' | 'dorado';
  tamaño?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  cargando?: boolean;
  iconoIzq?: ReactNode;
  iconoDer?: ReactNode;
  brillo?: boolean;
  /* mantener los props heredados en inglés para compatibilidad */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warm' | 'success' | 'outline' | 'blue';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  glow?: boolean;
}

export function Button({
  variante,
  tamaño,
  cargando,
  iconoIzq,
  iconoDer,
  brillo = false,
  /* props en inglés (compatibilidad) */
  variant,
  size,
  loading,
  leftIcon,
  rightIcon,
  glow,
  className,
  children,
  disabled,
  ...props
}: PropsBotón) {
  /* Prioridad: props en español > props en inglés > defaults */
  const varianteActiva = variante ?? mapVariante(variant) ?? 'primario';
  const tamañoActivo   = tamaño ?? size ?? 'md';
  const estáCargando   = cargando ?? loading ?? false;
  const iconLeft       = iconoIzq ?? leftIcon;
  const iconRight      = iconoDer ?? rightIcon;
  const tieneGlow      = brillo ?? glow ?? false;

  const base = [
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none focus-visible:outline-2 focus-visible:outline-offset-2',
    'active:scale-[0.97]',
    'btn-shimmer',          /* efecto barrido de luz al hover */
  ].join(' ');

  const variantes: Record<string, string> = {
    primario:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#09090b] font-bold shadow-lg shadow-amber-900/40 focus-visible:outline-[var(--accent)]',
    dorado:     'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#09090b] font-bold shadow-lg shadow-amber-900/40 focus-visible:outline-[var(--accent)]',
    secundario: 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] focus-visible:outline-[var(--accent)]',
    ghost:      'hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-[var(--accent)]',
    peligro:    'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 focus-visible:outline-red-500',
    éxito:      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 focus-visible:outline-emerald-500',
    azul:       'bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white shadow-lg shadow-blue-900/40 focus-visible:outline-[var(--blue)]',
    contorno:   'border border-[var(--accent-border)] text-[var(--accent-bright)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)] focus-visible:outline-[var(--accent)]',
  };

  const tamaños: Record<string, string> = {
    xs: 'text-xs  px-2.5 py-1.5 gap-1.5',
    sm: 'text-sm  px-3   py-2   gap-2',
    md: 'text-sm  px-4   py-2.5 gap-2',
    lg: 'text-base px-5  py-3   gap-2.5',
    xl: 'text-base px-7  py-4   gap-3',
  };

  const claseGlow = tieneGlow
    ? 'shadow-[0_0_28px_rgba(245,158,11,0.45)] hover:shadow-[0_0_40px_rgba(245,158,11,0.60)]'
    : '';

  return (
    <button
      className={cn(base, variantes[varianteActiva], tamaños[tamañoActivo], claseGlow, className)}
      disabled={disabled || estáCargando}
      {...props}
    >
      {estáCargando ? (
        <>
          <svg className="animar-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {iconLeft  && <span className="shrink-0">{iconLeft}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}

/* Mapea variantes en inglés a español */
function mapVariante(v?: string): string | undefined {
  const mapa: Record<string, string> = {
    primary:   'primario',
    secondary: 'secundario',
    ghost:     'ghost',
    danger:    'peligro',
    warm:      'primario',
    success:   'éxito',
    outline:   'contorno',
    blue:      'azul',
  };
  return v ? mapa[v] : undefined;
}
