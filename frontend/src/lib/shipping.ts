// src/lib/shipping.ts
// ─────────────────────────────────────────────────────────────
//  Transportadoras, cálculo de costo por zona y link de rastreo.
//  ESPEJO de backend/src/shipping/shipping.constants.ts — mantener
//  ambos archivos sincronizados (zonas, tarifas y URLs de rastreo).
// ─────────────────────────────────────────────────────────────
import { FREE_SHIPPING_THRESHOLD } from '@/config/constants';

export type CarrierId = 'servientrega' | 'interrapidisimo' | 'coordinadora' | 'envia';

export interface CarrierInfo {
  id:    CarrierId;
  name:  string;
  track: (guia: string) => string;
}

export const CARRIERS: Record<CarrierId, CarrierInfo> = {
  servientrega: {
    id:    'servientrega',
    name:  'Servientrega',
    track: (g) => `https://www.servientrega.com/wps/portal/rastreo-envio?numeroGuia=${encodeURIComponent(g)}`,
  },
  interrapidisimo: {
    id:    'interrapidisimo',
    name:  'Interrapidísimo',
    track: (g) => `https://interrapidisimo.com/sigue-tu-envio/?guia=${encodeURIComponent(g)}`,
  },
  coordinadora: {
    id:    'coordinadora',
    name:  'Coordinadora',
    track: (g) => `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/?guia=${encodeURIComponent(g)}`,
  },
  envia: {
    id:    'envia',
    name:  'Envía',
    track: (g) => `https://envia.co/rastreo?guia=${encodeURIComponent(g)}`,
  },
};

export const CARRIER_LIST = Object.values(CARRIERS);

// ── Costo de envío por zona (COP) ─────────────────────────────
const TARIFA_PRINCIPAL = 9_900;
const TARIFA_NACIONAL  = 14_900;
const TARIFA_ESPECIAL  = 24_900;

const ZONA_PRINCIPAL = new Set([
  'Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico',
  'Santander', 'Risaralda', 'Quindío', 'Caldas',
]);

const ZONA_ESPECIAL = new Set([
  'Amazonas', 'Guainía', 'Guaviare', 'Vaupés', 'Vichada',
  'San Andrés', 'Chocó', 'Putumayo',
]);

/** Costo de envío según departamento y subtotal. Gratis sobre el umbral. */
export function costoEnvio(dept: string | null | undefined, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const d = (dept ?? '').trim();
  if (ZONA_ESPECIAL.has(d))  return TARIFA_ESPECIAL;
  if (ZONA_PRINCIPAL.has(d)) return TARIFA_PRINCIPAL;
  return TARIFA_NACIONAL;
}

/** Link de rastreo público o null si no se reconoce la transportadora. */
export function trackingUrl(carrier: string | null | undefined, guia: string | null | undefined): string | null {
  if (!carrier || !guia) return null;
  const info = CARRIERS[carrier as CarrierId];
  return info ? info.track(guia) : null;
}

/** Nombre legible de la transportadora. */
export function carrierName(carrier: string | null | undefined): string {
  if (!carrier) return '';
  return CARRIERS[carrier as CarrierId]?.name ?? carrier;
}
