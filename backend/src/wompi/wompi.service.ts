// src/wompi/wompi.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import axios from 'axios';

export type AmbienteWompi = 'sandbox' | 'production';

export interface DatosCheckout {
  /** ID de la orden (usado como referencia única) */
  referencia:       string;
  /** Monto total en centavos (ej: $100.000 COP → 10000000) */
  montoCentavos:    number;
  /** Email del comprador */
  emailComprador:   string;
  /** Nombre del comprador */
  nombreComprador?: string;
  /** URL de redirección después del pago */
  urlRedireccion:   string;
}

export interface RespuestaCheckout {
  urlCheckout:   string;   // URL completa para redirigir al usuario
  firmaIntegridad: string; // SHA256 de la firma
  publicKey:     string;   // Llave pública de Wompi (para el widget)
}

export interface TransaccionWompi {
  id:         string;
  reference:  string;
  status:     'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  amount_in_cents: number;
  currency:   string;
}

/**
 * Servicio de integración con Wompi.
 *
 * Documentación oficial: https://docs.wompi.co
 *
 * Variables de entorno requeridas:
 *   WOMPI_PUBLIC_KEY       — pub_test_xxxxx (sandbox) o pub_prod_xxxxx
 *   WOMPI_INTEGRITY_SECRET — secret de integridad del checkout
 *   WOMPI_EVENTS_SECRET    — secret para verificar webhooks
 *   WOMPI_ENV              — 'sandbox' | 'production' (default: sandbox)
 */
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);

  private readonly ambiente: AmbienteWompi;
  private readonly publicKey:       string;
  private readonly integritySecret: string;
  private readonly eventsSecret:    string;
  private readonly apiBase:         string;
  private readonly checkoutBase:    string;

  constructor() {
    this.ambiente = (process.env.WOMPI_ENV ?? 'sandbox') as AmbienteWompi;

    this.publicKey       = process.env.WOMPI_PUBLIC_KEY       ?? '';
    this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? '';
    this.eventsSecret    = process.env.WOMPI_EVENTS_SECRET    ?? '';

    this.apiBase      = this.ambiente === 'production'
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';

    this.checkoutBase = 'https://checkout.wompi.co/p/';
  }

  /** Verifica que las credenciales estén configuradas. */
  get estaConfigurado(): boolean {
    return !!this.publicKey && !!this.integritySecret;
  }

  /**
   * Genera la firma de integridad para el checkout de Wompi.
   * Formula: SHA256(referencia + montoCentavos + moneda + integritySecret)
   */
  generarFirmaIntegridad(referencia: string, montoCentavos: number, moneda = 'COP'): string {
    const cadena = `${referencia}${montoCentavos}${moneda}${this.integritySecret}`;
    return createHash('sha256').update(cadena).digest('hex');
  }

  /**
   * Construye todos los datos necesarios para redirigir al checkout de Wompi.
   * El frontend enviará un formulario POST a checkoutBase con estos datos.
   */
  prepararCheckout(datos: DatosCheckout): RespuestaCheckout {
    const firma = this.generarFirmaIntegridad(datos.referencia, datos.montoCentavos);

    // URL con query params (GET redirect)
    const params = new URLSearchParams({
      'public-key':         this.publicKey,
      'currency':           'COP',
      'amount-in-cents':    String(datos.montoCentavos),
      'reference':          datos.referencia,
      'signature:integrity': firma,
      'redirect-url':       datos.urlRedireccion,
      'customer-data:email': datos.emailComprador,
    });

    if (datos.nombreComprador) {
      params.set('customer-data:full-name', datos.nombreComprador);
    }

    return {
      urlCheckout:     `${this.checkoutBase}?${params.toString()}`,
      firmaIntegridad: firma,
      publicKey:       this.publicKey,
    };
  }

  /**
   * Consulta el estado de una transacción en la API de Wompi.
   */
  async consultarTransaccion(transaccionId: string): Promise<TransaccionWompi | null> {
    if (!this.estaConfigurado) return null;
    try {
      const { data } = await axios.get<{ data: TransaccionWompi }>(
        `${this.apiBase}/transactions/${transaccionId}`,
      );
      return data.data;
    } catch (err) {
      this.logger.error(`Error consultando transacción ${transaccionId}:`, err);
      return null;
    }
  }

  /**
   * Verifica la firma de un evento de webhook de Wompi.
   * Formula: SHA256(eventId + eventStatus + timestamp + eventsSecret)
   */
  verificarFirmaEvento(
    eventoId:  string,
    estado:    string,
    timestamp: number,
    checksum:  string,
  ): boolean {
    if (!this.eventsSecret) {
      this.logger.warn('WOMPI_EVENTS_SECRET no configurado — omitiendo verificación');
      return true;
    }
    const cadena = `${eventoId}${estado}${timestamp}${this.eventsSecret}`;
    const esperado = createHash('sha256').update(cadena).digest('hex');
    return esperado === checksum;
  }
}
