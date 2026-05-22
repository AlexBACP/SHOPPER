'use client';

import { useRef, useCallback } from 'react';

interface RateLimitOptions {
  maxRequests: number;   // máx requests permitidas
  windowMs:    number;   // ventana de tiempo en ms
}

interface RateLimitResult {
  canRequest:       () => boolean;
  getRemainingTime: () => number;  // ms hasta poder hacer otra request
  getRequestsLeft:  () => number;
}

export function useRateLimit({ maxRequests = 10, windowMs = 60_000 }: RateLimitOptions): RateLimitResult {
  const timestamps = useRef<number[]>([]);

  const limpiarViejos = useCallback(() => {
    const ahora  = Date.now();
    timestamps.current = timestamps.current.filter(t => ahora - t < windowMs);
  }, [windowMs]);

  const canRequest = useCallback((): boolean => {
    limpiarViejos();
    return timestamps.current.length < maxRequests;
  }, [limpiarViejos, maxRequests]);

  const getRemainingTime = useCallback((): number => {
    limpiarViejos();
    if (timestamps.current.length < maxRequests) return 0;
    const oldest = Math.min(...timestamps.current);
    return Math.max(0, windowMs - (Date.now() - oldest));
  }, [limpiarViejos, maxRequests, windowMs]);

  const getRequestsLeft = useCallback((): number => {
    limpiarViejos();
    return Math.max(0, maxRequests - timestamps.current.length);
  }, [limpiarViejos, maxRequests]);

  // Registrar una request (llamar antes de hacer fetch)
  const originalCanRequest = canRequest;
  const canRequestAndRegister = useCallback((): boolean => {
    if (!originalCanRequest()) return false;
    timestamps.current.push(Date.now());
    return true;
  }, [originalCanRequest]);

  return {
    canRequest:       canRequestAndRegister,
    getRemainingTime,
    getRequestsLeft,
  };
}
