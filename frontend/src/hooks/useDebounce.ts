import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que el usuario deja de escribir.
 * Útil para búsquedas en tiempo real para no disparar llamadas en cada keystroke.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 400);
 * useEffect(() => { buscar(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delayMs: number = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
