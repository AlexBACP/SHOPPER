// src/webhooks/webhooks.controller.ts
import {
  Controller, Post, Body, Headers, HttpCode,
  BadRequestException, Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import { Inject } from '@nestjs/common';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT } from '../database/mongodb/mongodb.provider';
import { WompiService } from '../wompi/wompi.service';

interface EventoWompi {
  event:     string;   // 'transaction.updated'
  data:      { transaction: { id: string; reference: string; status: string } };
  timestamp: number;
  signature: { checksum: string; properties: string[] };
  sent_at:   string;
}

/**
 * Webhooks de Wompi.
 *
 * Wompi envía un POST a este endpoint cuando el estado de una
 * transacción cambia. Verificamos la firma y actualizamos la orden.
 *
 * Configurar en el dashboard de Wompi:
 *   URL: https://tu-api.com/webhooks/wompi
 *   Eventos: transaction.updated
 */
@SkipThrottle()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
    private readonly wompiService: WompiService,
  ) {}

  /** Devuelve a MongoDB el stock que se descontó al crear la orden. */
  private async restaurarStock(ordenId: string): Promise<void> {
    try {
      const { rows: items } = await this.pool.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [ordenId],
      );
      const products = this.mongo.db().collection('products');
      for (const it of items) {
        if (!it.product_id || !it.quantity) continue;
        try {
          await products.updateOne(
            { _id: new ObjectId(it.product_id) },
            { $inc: { stock: it.quantity }, $set: { updated_at: new Date() } },
          );
        } catch { /* product_id no es un ObjectId válido — ignorar */ }
      }
      this.logger.log(`Stock restaurado para la orden cancelada ${ordenId}`);
    } catch (err) {
      this.logger.error(`No se pudo restaurar stock de la orden ${ordenId}:`, err);
    }
  }

  @Post('wompi')
  @HttpCode(200)
  async manejarEventoWompi(
    @Body() evento: EventoWompi,
    @Headers('x-event-checksum') checksum: string,
  ): Promise<{ recibido: boolean }> {

    // 1. Verificar firma del evento
    if (checksum) {
      const esValido = this.wompiService.verificarFirmaEvento(
        /* eventId  */ evento.data?.transaction?.id ?? '',
        /* status   */ evento.data?.transaction?.status ?? '',
        evento.timestamp,
        checksum,
      );
      if (!esValido) {
        this.logger.warn('Webhook de Wompi con firma inválida — rechazado');
        throw new BadRequestException('Firma de evento inválida');
      }
    }

    // 2. Procesar solo eventos de transacción
    if (evento.event !== 'transaction.updated') {
      return { recibido: true };
    }

    const { id: transaccionId, reference: ordenId, status } = evento.data.transaction;
    this.logger.log(`Wompi webhook → transacción ${transaccionId} | orden ${ordenId} | estado ${status}`);

    // 3. Mapear estado Wompi → estado orden en Shopper
    const mapaEstados: Record<string, string> = {
      APPROVED: 'confirmed',
      DECLINED: 'cancelled',
      VOIDED:   'cancelled',
      ERROR:    'cancelled',
    };

    const nuevoEstado = mapaEstados[status];
    if (!nuevoEstado) return { recibido: true };

    // 4. Actualizar la orden en PostgreSQL
    try {
      const res = await this.pool.query(
        `UPDATE orders
         SET status = $1, updated_at = NOW()
         WHERE id = $2 AND status IN ('pending', 'pending_payment')`,
        [nuevoEstado, ordenId],
      );
      this.logger.log(`Orden ${ordenId} actualizada a '${nuevoEstado}'`);

      // Si el pago falló y la orden se canceló AHORA (rowCount>0, no un evento
      // repetido), devolvemos el stock que se había descontado al crearla.
      if (nuevoEstado === 'cancelled' && (res.rowCount ?? 0) > 0) {
        await this.restaurarStock(ordenId);
      }
    } catch (err) {
      this.logger.error(`Error actualizando orden ${ordenId}:`, err);
    }

    return { recibido: true };
  }
}
