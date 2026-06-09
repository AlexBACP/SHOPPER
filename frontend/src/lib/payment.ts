/**
 * @file payment.ts
 * @description Utilidades para integrar pasarelas de pago colombianas.
 *
 * PASARELAS DISPONIBLES EN COLOMBIA:
 * ──────────────────────────────────
 * 1. Wompi (Bancolombia)  — wompi.com
 *    Comisión: 2.99% + $900 COP por transacción
 *    Métodos: PSE, Nequi, Tarjetas, Efecty
 *
 * 2. PayU Colombia        — payu.com.co
 *    Comisión: 3.49% + IVA
 *    Métodos: PSE, tarjetas, Baloto, efectivo
 *
 * 3. ePayco               — epayco.com
 *    Comisión: 2.45% + $500 COP
 *    Métodos: PSE, tarjetas, Nequi, Daviplata
 *
 * IMPLEMENTACIÓN SUGERIDA (backend NestJS):
 * ──────────────────────────────────────────
 * 1. Instalar SDK: npm install @wompi/sdk-node  (o payu-sdk-node)
 * 2. Crear endpoint POST /payments/create-transaction
 * 3. El backend crea la transacción y retorna la URL de pago o el token
 * 4. El frontend redirige al usuario o muestra widget embebido
 * 5. Wompi/PayU llama el webhook de confirmación al backend
 * 6. Backend actualiza el estado del pedido en DB
 *
 * VARIABLES DE ENTORNO REQUERIDAS (backend):
 * WOMPI_PUBLIC_KEY=pub_test_...
 * WOMPI_PRIVATE_KEY=prv_test_...
 * WOMPI_INTEGRITY_SECRET=test_integrity_...
 * WOMPI_EVENTS_SECRET=test_events_...
 */

export type PaymentGateway = 'wompi' | 'payu' | 'epayco';

export interface PaymentRequest {
  orderId:        string;
  amount:         number;     // en centavos para Wompi, en pesos para PayU
  currency:       'COP';
  customerEmail:  string;
  customerName:   string;
  customerPhone?: string;
  description:    string;
  redirectUrl:    string;     // URL de retorno tras el pago
  webhookUrl:     string;     // URL del backend para confirmación
}

export interface PaymentResponse {
  success:        boolean;
  transactionId?: string;
  redirectUrl?:   string;     // URL a la que redirigir al usuario
  widgetToken?:   string;     // Token para widget embebido (Wompi)
  error?:         string;
}

/**
 * Crea una transacción de pago a través del backend.
 * El backend se comunica con la pasarela y retorna la URL o token.
 */
export async function createPayment(
  gateway: PaymentGateway,
  request: PaymentRequest
): Promise<PaymentResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ gateway, ...request }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.message ?? 'Error al crear el pago' };
  }
  return res.json();
}

/**
 * Verifica el estado de una transacción.
 */
export async function verifyPayment(
  gateway: PaymentGateway,
  transactionId: string
): Promise<{ status: 'pending' | 'approved' | 'declined' | 'voided'; amount: number }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/verify?gateway=${gateway}&id=${transactionId}`
  );
  return res.json();
}

/**
 * Genera el checksum de integridad para Wompi (SHA-256).
 * NUNCA incluir el INTEGRITY_SECRET en el frontend.
 * Esta función debe ejecutarse en el BACKEND.
 *
 * Formato: SHA256(reference + amount_in_cents + currency + integrity_secret)
 */
export function generateWompiIntegrityNote(): string {
  return `
    IMPORTANTE: El signature de integridad de Wompi debe generarse
    en el backend (NestJS), nunca en el cliente.

    Endpoint backend sugerido: POST /payments/wompi-signature
    Body: { reference: string, amount: number, currency: 'COP' }
    Response: { signature: string }
  `;
}
