// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationsGateway, PayloadNuevoPedido } from './notifications.gateway';

/**
 * Servicio de notificaciones.
 * Actúa como fachada para que otros módulos puedan emitir eventos
 * sin depender directamente del Gateway de WebSocket.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  notificarNuevoPedido(ownerId: string, payload: PayloadNuevoPedido): void {
    this.gateway.emitirNuevoPedido(ownerId, payload);
  }
}
