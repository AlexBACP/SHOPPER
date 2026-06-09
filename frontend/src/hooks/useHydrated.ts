'use client';
import { useEffect, useState } from 'react';

/**
 * Devuelve `false` durante el render del servidor y el primer render del
 * cliente, y `true` una vez montado. Sirve para evitar el "hydration
 * mismatch" al leer estado persistido (carrito, lista de deseos) que solo
 * existe en el navegador.
 *
 * Patrón: `const hydrated = useHydrated(); const n = hydrated ? count() : 0;`
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
