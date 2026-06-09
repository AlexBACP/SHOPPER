// src/shipping/shipping.constants.ts
// ─────────────────────────────────────────────────────────────
//  Lógica de envíos para Colombia: transportadoras soportadas,
//  cálculo de costo por zona y armado del link de rastreo público.
//
//  Esta lógica está DUPLICADA en frontend/src/lib/shipping.ts —
//  si cambias una zona o tarifa aquí, actualiza también el front.
// ─────────────────────────────────────────────────────────────

export type CarrierId = 'servientrega' | 'interrapidisimo' | 'coordinadora' | 'envia';

export interface CarrierInfo {
  id:    CarrierId;
  name:  string;
  /** Construye la URL pública de rastreo a partir del N° de guía. */
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

export const CARRIER_IDS = Object.keys(CARRIERS) as CarrierId[];

// ── Costo de envío por zona (COP) ─────────────────────────────
export const FREE_SHIPPING_THRESHOLD = 150_000;

const TARIFA_PRINCIPAL = 9_900;   // centros urbanos / cobertura amplia
const TARIFA_NACIONAL  = 14_900;  // resto del país
const TARIFA_ESPECIAL  = 24_900;  // zonas apartadas

// Departamentos con cobertura principal (tarifa baja)
const ZONA_PRINCIPAL = new Set([
  'Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico',
  'Santander', 'Risaralda', 'Quindío', 'Caldas',
]);

// Departamentos apartados (tarifa especial)
const ZONA_ESPECIAL = new Set([
  'Amazonas', 'Guainía', 'Guaviare', 'Vaupés', 'Vichada',
  'San Andrés', 'Chocó', 'Putumayo',
]);

/**
 * Calcula el costo de envío según el departamento de destino y el
 * subtotal del pedido. Gratis si el subtotal supera el umbral.
 */
export function calcShippingCost(dept: string | null | undefined, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const d = (dept ?? '').trim();
  if (ZONA_ESPECIAL.has(d))  return TARIFA_ESPECIAL;
  if (ZONA_PRINCIPAL.has(d)) return TARIFA_PRINCIPAL;
  return TARIFA_NACIONAL;
}

/** Devuelve el link de rastreo o null si la transportadora no se reconoce. */
export function buildTrackingUrl(carrier: string | null | undefined, guia: string | null | undefined): string | null {
  if (!carrier || !guia) return null;
  const info = CARRIERS[carrier as CarrierId];
  return info ? info.track(guia) : null;
}
