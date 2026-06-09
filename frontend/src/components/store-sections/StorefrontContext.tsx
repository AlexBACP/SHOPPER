'use client';
// ─────────────────────────────────────────────────────────────
//  Contexto del escaparate (storefront) público de una tienda.
//  Comparte datos + estado interactivo (búsqueda, carrito, tabs)
//  entre las secciones que renderiza <SectionRenderer />, para que
//  cada sección sea presentacional y el StoreClient orqueste todo.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';
import type { Store } from '@/types';

export interface Producto {
  _id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  sku: string;
  is_active: boolean;
}

export interface StorefrontContextValue {
  tienda:      Store;
  productos:   Producto[];
  reputacion:  { promedio: number; total: number } | null;
  accent:      string;
  /** En modo legacy (theme sin v2) la tienda usa pestañas Productos/Información. */
  useTabs:     boolean;
  tab:         'productos' | 'info';
  setTab:      (t: 'productos' | 'info') => void;
  busqueda:    string;
  setBusqueda: (s: string) => void;
  filtrados:   Producto[];
  agregar:     (p: Producto) => void;
  agregadoId:  string | null;
  compartir:   () => void;
  compartido:  boolean;
  waLink:      string | null;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function StorefrontProvider({ value, children }: {
  value: StorefrontContextValue;
  children: React.ReactNode;
}) {
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront debe usarse dentro de <StorefrontProvider>');
  return ctx;
}
