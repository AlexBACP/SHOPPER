import { useState, useEffect, useCallback } from 'react';

/**
 * useState que sincroniza automáticamente con localStorage.
 * Seguro en SSR (no falla en Next.js server-side).
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const toStore = value instanceof Function ? value(stored) : value;
      setStored(toStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(toStore));
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Error guardando "${key}":`, err);
    }
  }, [key, stored]);

  const remove = useCallback(() => {
    setStored(initialValue);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }, [key, initialValue]);

  // Sincronizar si otra pestaña cambia el valor
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try { setStored(JSON.parse(e.newValue)); } catch { /* silenciar */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [stored, setValue, remove];
}
