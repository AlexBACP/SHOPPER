// src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

export interface PayloadNuevoPedido {
  pedidoId:         string;
  total:            number;
  numProductos:     number;
  compradorNombre:  string;
  ciudad:           string;
  timestamp:        string;
  storeId:          string;
  storeName:        string;
}

/**
 * Gateway de WebSocket para notificaciones en tiempo real.
 *
 * Cada cliente se autentica con su JWT al conectarse (handshake.auth.token).
 * Los owners se suscriben automáticamente a la sala `owner:{userId}`.
 * Los admins entran a la sala `admin`.
 *
 * Evento emitido al cliente:
 *   `nuevo:pedido` → PayloadNuevoPedido
 */
@WebSocketGateway({
  cors: {
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notificaciones',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  /** Autenticar y unir a sala al conectarse. */
  async handleConnection(cliente: Socket): Promise<void> {
    const token =
      (cliente.handshake.auth as Record<string, string>)?.token ??
      (cliente.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Socket ${cliente.id} desconectado: sin token`);
      cliente.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; role: string; name: string }>(
        token,
        { secret: process.env.JWT_SECRET },
      );

      // Unir a sala según el rol
      if (payload.role === 'owner') {
        await cliente.join(`owner:${payload.sub}`);
        this.logger.log(`Owner ${payload.name} (${payload.sub}) conectado → sala owner:${payload.sub}`);
      } else if (payload.role === 'admin' || payload.role === 'super_admin') {
        await cliente.join('admin');
        this.logger.log(`Admin ${payload.name} conectado → sala admin`);
      } else {
        // Buyers no reciben notificaciones de pedidos nuevos
        await cliente.join(`buyer:${payload.sub}`);
      }

      // Guardar userId en el socket para referencia
      (cliente as any).userId = payload.sub;
    } catch {
      this.logger.warn(`Socket ${cliente.id} desconectado: token inválido`);
      cliente.disconnect(true);
    }
  }

  handleDisconnect(cliente: Socket): void {
    this.logger.log(`Socket ${cliente.id} desconectado`);
  }

  /** Emitir notificación de nuevo pedido al owner de una tienda. */
  emitirNuevoPedido(ownerId: string, payload: PayloadNuevoPedido): void {
    this.server.to(`owner:${ownerId}`).emit('nuevo:pedido', payload);
    // Los admins también reciben todos los pedidos
    this.server.to('admin').emit('nuevo:pedido', payload);
    this.logger.log(`Notificación enviada → owner:${ownerId} | Pedido ${payload.pedidoId}`);
  }
}
