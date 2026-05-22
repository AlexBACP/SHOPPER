'use client';

/* ═══════════════════════════════════════════════════════════════════
   Skeletons — componentes de carga elegantes
   Tema claro: gradiente gris sobre blanco
═══════════════════════════════════════════════════════════════════ */

import { motion } from 'framer-motion';

// ── Base skeleton pulse ───────────────────────────────────────────
function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

// ── Shimmer effect wrapper ────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      <Bone className="h-44 rounded-none" />
      <div className="p-3.5 space-y-2.5">
        <Bone className="h-3 w-2/3" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-3 w-1/3" />
        <Bone className="h-5 w-2/5" />
        <Bone className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonStore() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      <Bone className="h-28 rounded-none" />
      <div className="p-4 space-y-2">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0">
      <Bone className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-2/3" />
        <Bone className="h-3 w-1/3" />
      </div>
      <Bone className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-3">
      <Bone className="w-11 h-11 rounded-xl" />
      <Bone className="h-7 w-3/5" />
      <Bone className="h-4 w-4/5" />
      <Bone className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-28" />
        </div>
        <Bone className="h-8 w-24 rounded-xl" />
      </div>
      {/* Barras simuladas */}
      <div className="flex items-end gap-2 h-40 mt-4">
        {[70, 45, 90, 55, 80, 35, 65].map((h, i) => (
          <div key={i} className="flex-1 flex items-end">
            <Bone className="w-full rounded-t-lg" style={{ height: `${h}%` } as React.CSSProperties} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map(m => (
          <Bone key={m} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="w-full bg-[var(--surface-3)] rounded-none" style={{ height: 'clamp(220px, 35vw, 420px)' }}>
      <div className="w-full h-full flex items-center px-12 gap-8">
        <div className="flex-1 space-y-4">
          <Bone className="h-5 w-32 rounded-full" />
          <Bone className="h-10 w-3/4" />
          <Bone className="h-10 w-1/2" />
          <Bone className="h-4 w-2/3" />
          <Bone className="h-12 w-40 rounded-xl" />
        </div>
        <Bone className="w-32 h-32 rounded-3xl shrink-0 hidden md:block" />
      </div>
    </div>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-4" />
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-4" />
        <Bone className="h-3 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <Bone key={i} className="w-16 h-16 rounded-xl" />)}
          </div>
          <Bone className="flex-1 aspect-square rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-8 w-full" />
          <Bone className="h-6 w-3/4" />
          <Bone className="h-5 w-20 rounded-full" />
          <Bone className="h-10 w-1/2" />
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4">
            <Bone className="h-8 w-2/5" />
            <Bone className="h-4 w-3/5" />
            <Bone className="h-10 w-full rounded-xl" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid de cards genérico
export function SkeletonGrid({ n = 8, cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }: { n?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

// Tabla
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <Bone className="h-5 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
