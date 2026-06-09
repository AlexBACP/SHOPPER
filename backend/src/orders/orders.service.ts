// src/orders/orders.service.ts
import {
  Injectable, Inject, BadRequestException, NotFoundException,
  ForbiddenException, UnauthorizedException, OnModuleInit, Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT }  from '../database/mongodb/mongodb.provider';
import { EmailService }         from '../email/email.service';
import { UsersService }         from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WompiService }         from '../wompi/wompi.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './order.interface';
import { calcShippingCost } from '../shipping/shipping.constants';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);
  /** Minutos tras los cuales una orden 'pending' (pago no completado) se da por abandonada. */
  private readonly EXPIRE_MINUTES = 60;

  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
    private readonly emailService:         EmailService,
    private readonly usersService:         UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly wompiService:         WompiService,
  ) {}

  private get products() {
    return this.mongo.db().collection('products');
  }

  // ── Expiración de órdenes de pago abandonadas ─────────
  //  Caso: el comprador inicia el pago con Wompi (orden 'pending', stock ya
  //  descontado) pero cierra la pestaña y Wompi nunca envía webhook. Sin esto,
  //  ese stock quedaría "reservado" para siempre. Corre al arrancar y cada 15 min.
  onModuleInit(): void {
    const run = () => this.expirarOrdenesPendientes().catch(err =>
      this.logger.error('Error expirando órdenes pendientes:', err));
    setTimeout(run, 30_000);          // 30 s después de arrancar
    setInterval(run, 15 * 60_000);    // cada 15 minutos
  }

  /** Cancela órdenes 'pending' más viejas que EXPIRE_MINUTES y devuelve su stock.
   *  Las órdenes COD y las pagadas no quedan 'pending', así que no se tocan. */
  async expirarOrdenesPendientes(): Promise<void> {
    const { rows } = await this.pool.query(
      `UPDATE orders
         SET status = 'cancelled', updated_at = NOW()
       WHERE status = 'pending'
         AND created_at < NOW() - make_interval(mins => $1)
       RETURNING id`,
      [this.EXPIRE_MINUTES],
    );
    if (!rows.length) return;
    for (const { id } of rows) {
      await this.restaurarStock(id);
    }
    this.logger.log(`Expiradas ${rows.length} orden(es) de pago abandonado — stock devuelto.`);
  }

  /** Devuelve a MongoDB el stock que se descontó al crear la orden. */
  private async restaurarStock(ordenId: string): Promise<void> {
    const { rows: items } = await this.pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [ordenId],
    );
    for (const it of items) {
      if (!it.product_id || !it.quantity) continue;
      try {
        await this.products.updateOne(
          { _id: new ObjectId(it.product_id) },
          { $inc: { stock: it.quantity }, $set: { updated_at: new Date() } },
        );
      } catch { /* product_id no es un ObjectId válido — ignorar */ }
    }
  }

  // ── Checkout ──────────────────────────────────────────

  async checkout(buyerId: string, dto: CreateOrderDto): Promise<Order & { coupon_applied: boolean }> {
    if (!dto.items?.length) throw new BadRequestException('El carrito está vacío');

    // 1. Validar stock contra MongoDB (fuente de verdad del inventario)
    for (const item of dto.items) {
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

    // 2. Validar cupón en backend (fuente de verdad — no confiar en el frontend)
    let discountPct = 0;
    let couponCode: string | null = null;
    if (dto.coupon_code) {
      const code = dto.coupon_code.toUpperCase().trim();
      const { rows: couponRows } = await this.pool.query(
        `SELECT discount_pct FROM coupons
         WHERE code = $1
           AND is_active = true
           AND (max_uses IS NULL OR times_used < max_uses)
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [code],
      );
      if (couponRows[0]) {
        discountPct = couponRows[0].discount_pct as number;
        couponCode  = code;
      }
      // Si el código no existe simplemente se ignora — no lanzamos error
      // para no bloquear el checkout por un cupón que venció justo ahora
    }

    // 3. Total con descuento + costo de envío calculado en backend.
    //    IMPORTANTE: en Shopper los precios YA incluyen IVA (19%). NO se suma
    //    IVA encima — el total de productos es (subtotal − descuento) y el IVA
    //    va contenido en el precio. Sumarlo sobrecobraría al cliente.
    const subtotal  = dto.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount  = subtotal * (discountPct / 100);
    const baseNet   = subtotal - discount;
    // Costo de envío por zona (gratis sobre el umbral). Calculado en backend
    // como fuente de verdad — no confiamos en lo que mande el frontend.
    const shippingCost = calcShippingCost(dto.shipping_dept, subtotal);
    const total     = baseNet + shippingCost;

    // 4. Transacción PostgreSQL — orden + items atómicos
    const client = await this.pool.connect();
    let order: Order;
    try {
      await client.query('BEGIN');

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders
           (buyer_id, status, total, shipping_cost,
            shipping_name, shipping_phone,
            shipping_address, shipping_city, shipping_dept,
            shipping_notes, coupon_code, discount_pct, payment_method)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          buyerId, total, shippingCost,
          dto.shipping_name,    dto.shipping_phone   ?? null,
          dto.shipping_address, dto.shipping_city,
          dto.shipping_dept    ?? null,
          dto.shipping_notes   ?? null,
          couponCode,
          discountPct,
          dto.payment_method   ?? null,
        ],
      );
      order = orderRows[0];

      for (const item of dto.items) {
        await client.query(
          `INSERT INTO order_items
             (order_id, store_id, product_id, title, sku, price, quantity, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, item.storeId, item.productId, item.title, item.sku, item.price, item.quantity, item.image ?? null],
        );
      }

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      // FK violation buyer_id → sesión expirada o usuario eliminado
      if (err.code === '23503' && err.constraint?.includes('buyer_id')) {
        throw new UnauthorizedException('Tu sesión expiró. Por favor cierra sesión e inicia de nuevo.');
      }
      throw err;
    } finally {
      client.release();
    }

    // 5. Incrementar uso del cupón (fuera de TX — fallo aquí no revierte la orden)
    if (couponCode) {
      await this.pool.query(
        'UPDATE coupons SET times_used = times_used + 1 WHERE code = $1',
        [couponCode],
      ).catch(() => null);
    }

    // 6. Decrementar stock en MongoDB (fuera de la TX de PG — aceptamos eventual consistency)
    for (const item of dto.items) {
      await this.products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity }, $set: { updated_at: new Date() } },
      );
    }

    // 7. Obtener orden completa con items
    const fullOrder = await this.findById(order.id, buyerId);

    // 8. Emails + notificaciones WebSocket (fire-and-forget)
    this.sendOrderEmails(fullOrder, buyerId, dto).catch(() => null);
    this.emitirNotificacionesPedido(fullOrder, dto.shipping_name, dto.shipping_city).catch(() => null);

    // coupon_applied = true si el código llegó Y era válido; false si fue ignorado
    return { ...fullOrder, coupon_applied: couponCode !== null };
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

    // Desglose para el resumen del correo (precios con IVA incluido).
    const IVA_RATE   = 0.19;
    const subtotal   = emailItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount   = subtotal * (Number(order.discount_pct ?? 0) / 100);
    const baseNet    = subtotal - discount;
    const shipping   = Number(order.shipping_cost ?? 0);
    const ivaIncluded = baseNet - baseNet / (1 + IVA_RATE);

    // Email al comprador
    await this.emailService.sendOrderConfirmation({
      buyerName:       buyer.name,
      buyerEmail:      buyer.email,
      orderId:         order.id,
      items:           emailItems,
      subtotal,
      discount,
      ivaIncluded,
      shipping,
      total:           Number(order.total),
      shippingName:    dto.shipping_name,
      shippingAddress: dto.shipping_address,
      shippingCity:    dto.shipping_city,
      shippingNotes:   dto.shipping_notes,
    });

    // Agrupar items por tienda para notificar a cada owner
    const byStore: Record<string, EmailItem[]> = {}; // CORREGIDO: usando EmailItem[]
    for (const item of order.items) {
      if (!byStore[item.store_id]) {
        byStore[item.store_id] = [];
      }
      byStore[item.store_id].push({
        title:    item.title,
        sku:      item.sku,
        quantity: item.quantity,
        price:    Number(item.price),
        image:    item.image || '', // Incluye la imagen
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
    if (order.buyer_id !== requesterId && requesterRole !== 'admin' && requesterRole !== 'super_admin') {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }
    const { rows: items } = await this.pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at', [orderId],
    );
    return { ...order, items };
  }

  async findByBuyer(buyerId: string): Promise<Order[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC', [buyerId],
    );
    return rows;
  }

  async findByStore(storeId: string, requesterId: string, requesterRole: string): Promise<any[]> {
    // Verificar que el solicitante es dueño de la tienda (a menos que sea admin)
    const isAdmin = requesterRole === 'admin' || requesterRole === 'super_admin';
    if (!isAdmin) {
      const { rows: storeRows } = await this.pool.query(
        'SELECT owner_id FROM stores WHERE id = $1',
        [storeId],
      );
      if (!storeRows[0]) throw new NotFoundException('Tienda no encontrada');
      if (storeRows[0].owner_id !== requesterId)
        throw new ForbiddenException('No tienes acceso a las órdenes de esta tienda');
    }

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
  ): Promise<{ orderId: string; urlPago: string; wompiConfigurado: boolean; couponApplied: boolean }> {
    // 1. Crear la orden (misma lógica que checkout normal)
    const fullOrder = await this.checkout(buyerId, dto);
    const couponApplied = fullOrder.coupon_applied;

    // Pago contra entrega: no pasa por pasarela. La orden queda confirmada y
    // el pago se cobra en efectivo al momento de la entrega.
    if (dto.payment_method === 'cod') {
      await this.pool.query(
        `UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
        [fullOrder.id],
      ).catch(() => null);
      return { orderId: fullOrder.id, urlPago: '', wompiConfigurado: false, couponApplied };
    }

    // El checkout web de Wompi (CloudFront/WAF) BLOQUEA cualquier redirect-url
    // hacia http://localhost. Por eso el flujo real solo es posible con un
    // dominio público https://. En local (o con WOMPI_SIMULAR=true) usamos un
    // pago SIMULADO: marcamos la orden como pagada y mostramos la pantalla de
    // éxito, sin depender del externo.
    const simular =
      process.env.WOMPI_SIMULAR === 'true' || !/^https:\/\//i.test(frontendUrl);
    const wompiConfigurado = !simular && this.wompiService.estaConfigurado;

    if (!wompiConfigurado) {
      if (simular) {
        // Pago aprobado simulado → orden confirmada
        await this.pool.query(
          `UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
          [fullOrder.id],
        ).catch(() => null);
      }
      // Simulación o sin credenciales → sin URL de pago externa
      return { orderId: fullOrder.id, urlPago: '', wompiConfigurado: false, couponApplied };
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

    return { orderId: fullOrder.id, urlPago: urlCheckout, wompiConfigurado: true, couponApplied };
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, requesterId: string, requesterRole: string): Promise<Order> {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!rows[0]) throw new NotFoundException('Orden no encontrada');

    const isAdmin = requesterRole === 'admin' || requesterRole === 'super_admin';
    const isOwner = requesterRole === 'owner';

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tienes permiso para cambiar el estado de órdenes');
    }

    if (isOwner) {
      // El owner solo puede marcar processing o shipped
      const OWNER_ALLOWED: string[] = ['processing', 'shipped'];
      if (!OWNER_ALLOWED.includes(dto.status)) {
        throw new ForbiddenException(
          `Como vendedor solo puedes cambiar el estado a: ${OWNER_ALLOWED.join(', ')}`,
        );
      }

      // Verificar que el owner tiene al menos un item en esta orden
      const { rows: ownerItems } = await this.pool.query(
        `SELECT oi.id FROM order_items oi
         JOIN stores s ON s.id = oi.store_id
         WHERE oi.order_id = $1 AND s.owner_id = $2
         LIMIT 1`,
        [orderId, requesterId],
      );
      if (!ownerItems.length) {
        throw new ForbiddenException('Esta orden no contiene productos de tu tienda');
      }
    }

    // ── Requisito para marcar como 'shipped': transportadora + guía ──
    // Aplica a cualquiera (owner o admin). La foto del paquete es opcional.
    if (dto.status === 'shipped') {
      if (!dto.carrier || !dto.tracking_number) {
        throw new BadRequestException(
          'Para marcar el pedido como enviado debes indicar la transportadora y el número de guía',
        );
      }
      const { rows: updated } = await this.pool.query(
        `UPDATE orders
           SET status = 'shipped',
               carrier = $1,
               tracking_number = $2,
               proof_image = $3,
               shipped_at = NOW(),
               updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [dto.carrier, dto.tracking_number.trim(), dto.proof_image ?? null, orderId],
      );
      const ordenEnviada: Order = updated[0];
      this.notificarCambioEstado(ordenEnviada).catch(() => null);
      return ordenEnviada;
    }

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
    const buyer = await this.usersService.findById(orden.buyer_id);
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