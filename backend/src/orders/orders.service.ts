// src/orders/orders.service.ts
import {
  Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import Redis from 'ioredis';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT }  from '../database/mongodb/mongodb.provider';
import { REDIS_CLIENT }  from '../redis/redis.provider';
import { EmailService }         from '../email/email.service';
import { UsersService }         from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WompiService }         from '../wompi/wompi.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './order.interface';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
    @Inject(REDIS_CLIENT)  private readonly redis: Redis,
    private readonly emailService:         EmailService,
    private readonly usersService:         UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly wompiService:         WompiService,
  ) {}

  private get products() {
    return this.mongo.db().collection('products');
  }

  private async getCart(cartId: string): Promise<{ items: any[]; updatedAt: string }> {
    const raw = await this.redis.get(`cart:${cartId}`);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw);
  }

  private async clearCart(cartId: string): Promise<void> {
    await this.redis.del(`cart:${cartId}`);
  }

  // ── Checkout ──────────────────────────────────────────

  async checkout(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.getCart(buyerId);
    if (cart.items.length === 0) throw new BadRequestException('El carrito está vacío');

    // 1. Validar stock
    for (const item of cart.items) {
      let product: any;
      try {
        product = await this.products.findOne({ _id: new ObjectId(item.productId) });
      } catch {
        throw new BadRequestException(`ID de producto inválido: ${item.productId}`);
      }
      if (!product || !product.is_active)
        throw new BadRequestException(`El producto "${item.title}" ya no está disponible`);
      if (product.stock < item.quantity)
        throw new BadRequestException(`Stock insuficiente para "${item.title}". Disponible: ${product.stock}`);
    }

    // 2. Total
    const total = cart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    // 3. Transacción PostgreSQL
    const client = await this.pool.connect();
    let order: Order;
    try {
      await client.query('BEGIN');

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, status, total, shipping_name, shipping_address, shipping_city, shipping_notes)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6) RETURNING *`,
        [buyerId, total, dto.shipping_name, dto.shipping_address, dto.shipping_city, dto.shipping_notes ?? null],
      );
      order = orderRows[0];

      for (const item of cart.items) {
        await client.query(
          `INSERT INTO order_items (order_id, store_id, product_id, title, sku, price, quantity, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, item.storeId, item.productId, item.title, item.sku, item.price, item.quantity, item.image ?? null],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // 4. Decrementar stock en MongoDB
    for (const item of cart.items) {
      await this.products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity }, $set: { updated_at: new Date() } },
      );
    }

    // 5. Vaciar carrito
    await this.clearCart(buyerId);

    // 6. Obtener orden completa con items
    const fullOrder = await this.findById(order.id, buyerId);

    // 7. Enviar emails + notificaciones en tiempo real (sin await)
    this.sendOrderEmails(fullOrder, buyerId, dto).catch(() => null);
    this.emitirNotificacionesPedido(fullOrder, dto.shipping_name, dto.shipping_city).catch(() => null);

    return fullOrder;
  }

  // ── Envío de emails post-checkout ────────────────────

  private async sendOrderEmails(order: Order, buyerId: string, dto: CreateOrderDto): Promise<void> {
    const buyer = await this.usersService.findById(buyerId);
    if (!buyer || !order.items?.length) return;

    // Definir el tipo del item de email
    type EmailItem = {
      title: string;
      sku: string;
      quantity: number;
      price: number;
      image: string;
    };

    const emailItems: EmailItem[] = order.items.map((i) => ({
      title:    i.title,
      sku:      i.sku,
      quantity: i.quantity,
      price:    Number(i.price),
      image:    i.image || '', // Valor por defecto si no hay imagen
    }));

    // Email al comprador
    await this.emailService.sendOrderConfirmation({
      buyerName:       buyer.name,
      buyerEmail:      buyer.email,
      orderId:         order.id,
      items:           emailItems,
      total:           Number(order.total),
      shippingName:    dto.shipping_name,
      shippingAddress: dto.shipping_address,
      shippingCity:    dto.shipping_city,
      shippingNotes:   dto.shipping_notes,
    });

    // Agrupar items por tienda para notificar a cada owner
    const byStore: Record<string, EmailItem[]> = {}; // ✅ CORREGIDO: usando EmailItem[]
    for (const item of order.items) {
      if (!byStore[item.store_id]) {
        byStore[item.store_id] = [];
      }
      byStore[item.store_id].push({
        title:    item.title,
        sku:      item.sku,
        quantity: item.quantity,
        price:    Number(item.price),
        image:    item.image || '', // ✅ Incluye la imagen
      });
    }

    // Buscar la tienda y su owner para cada grupo
    for (const [storeId, storeItems] of Object.entries(byStore)) {
      try {
        const { rows: storeRows } = await this.pool.query(
          'SELECT * FROM stores WHERE id = $1',
          [storeId],
        );
        if (!storeRows[0]) continue;
        const store = storeRows[0];

        const owner = await this.usersService.findById(store.owner_id);
        if (!owner) continue;

        const storeTotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);

        await this.emailService.sendOwnerNewOrder({
          ownerName:    owner.name,
          ownerEmail:   owner.email,
          storeName:    store.name,
          orderId:      order.id,
          items:        storeItems,
          total:        storeTotal,
          buyerName:    buyer.name,
          shippingCity: dto.shipping_city,
        });
      } catch {
        // Si falla un owner, continuar con los demás
      }
    }
  }

  // ── Queries ──────────────────────────────────────────

  async findById(orderId: string, requesterId: string, requesterRole?: string): Promise<Order> {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!rows[0]) throw new NotFoundException('Orden no encontrada');
    const order: Order = rows[0];
    if (order.user_id !== requesterId && requesterRole !== 'admin' && requesterRole !== 'super_admin') {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }
    const { rows: items } = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at', [orderId],
    );
    return { ...order, items };
  }

  async findByBuyer(buyerId: string): Promise<Order[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [buyerId],
    );
    return rows;
  }

  async findByStore(storeId: string): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT o.*, oi.store_id FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE oi.store_id = $1 ORDER BY o.created_at DESC`,
      [storeId],
    );
    for (const order of rows) {
      const { rows: items } = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 AND store_id = $2', [order.id, storeId],
      );
      order.items = items;
    }
    return rows;
  }

  async findAll(): Promise<Order[]> {
    const { rows } = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
  }

  /** Emite notificaciones WebSocket a los owners de cada tienda involucrada. */
  private async emitirNotificacionesPedido(order: Order, buyerName: string, ciudad: string): Promise<void> {
    if (!order.items?.length) return;

    // Agrupar items por tienda
    const porTienda = new Map<string, typeof order.items>();
    for (const item of order.items) {
      if (!porTienda.has(item.store_id)) porTienda.set(item.store_id, []);
      porTienda.get(item.store_id)!.push(item);
    }

    for (const [storeId, items] of porTienda) {
      try {
        const { rows } = await this.pool.query(
          'SELECT id, name, owner_id FROM stores WHERE id = $1',
          [storeId],
        );
        if (!rows[0]) continue;
        const { owner_id, name: storeName } = rows[0] as { owner_id: string; name: string };

        const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

        this.notificationsService.notificarNuevoPedido(owner_id, {
          pedidoId:        order.id,
          total,
          numProductos:    items.reduce((s, i) => s + i.quantity, 0),
          compradorNombre: buyerName,
          ciudad:          ciudad ?? '',
          timestamp:       new Date().toISOString(),
          storeId,
          storeName,
        });
      } catch {
        // No bloquear si falla una tienda
      }
    }
  }

  /**
   * Prepara un checkout con Wompi:
   *  1. Valida stock y crea la orden en estado 'pending'
   *  2. Genera la firma de integridad de Wompi
   *  3. Devuelve la URL de pago para redirigir al usuario
   */
  async prepararCheckoutWompi(
    buyerId:     string,
    dto:         CreateOrderDto,
    frontendUrl: string,
  ): Promise<{ orderId: string; urlPago: string; wompiConfigurado: boolean }> {
    // 1. Crear la orden (misma lógica que checkout normal)
    const fullOrder = await this.checkout(buyerId, dto);

    const wompiConfigurado = this.wompiService.estaConfigurado;

    if (!wompiConfigurado) {
      // Sin credenciales Wompi → devolver la orden creada sin URL de pago real
      return { orderId: fullOrder.id, urlPago: '', wompiConfigurado: false };
    }

    // 2. Preparar datos de Wompi
    const montoCentavos = Math.round(Number(fullOrder.total) * 100);
    const buyer         = await this.usersService.findById(buyerId);
    const urlRedireccion = `${frontendUrl}/checkout/success?ref=${fullOrder.id}`;

    const { urlCheckout } = this.wompiService.prepararCheckout({
      referencia:       fullOrder.id,
      montoCentavos,
      emailComprador:   buyer?.email  ?? '',
      nombreComprador:  buyer?.name   ?? '',
      urlRedireccion,
    });

    return { orderId: fullOrder.id, urlPago: urlCheckout, wompiConfigurado: true };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, _requesterId: string, requesterRole: string): Promise<Order> {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!rows[0]) throw new NotFoundException('Orden no encontrada');
    const isAdmin = requesterRole === 'admin' || requesterRole === 'super_admin';
    if (!isAdmin) throw new ForbiddenException('Solo los administradores pueden cambiar el estado');
    const { rows: updated } = await this.pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [dto.status, orderId],
    );
    const ordenActualizada: Order = updated[0];

    // Notificar al comprador por email (sin await — no bloquea la respuesta)
    this.notificarCambioEstado(ordenActualizada).catch(() => null);

    return ordenActualizada;
  }

  private async notificarCambioEstado(orden: Order): Promise<void> {
    const buyer = await this.usersService.findById(orden.user_id);
    if (!buyer) return;
    await this.emailService.sendStatusUpdate({
      buyerName:  buyer.name,
      buyerEmail: buyer.email,
      orderId:    orden.id,
      newStatus:  orden.status as string,
      total:      Number(orden.total),
    });
  }
}