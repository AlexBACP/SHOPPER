// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface OrderEmailItem {
  title:    string;
  sku:      string;
  quantity: number;
  price:    number;
  image?:   string;
}

export interface OrderConfirmationData {
  buyerName:       string;
  buyerEmail:      string;
  orderId:         string;
  items:           OrderEmailItem[];
  /** Suma de precios de productos (IVA incluido). */
  subtotal?:       number;
  /** Monto del descuento aplicado en pesos. */
  discount?:       number;
  /** IVA contenido en el precio (informativo). */
  ivaIncluded?:    number;
  /** Costo de envío. */
  shipping?:       number;
  /** Total a pagar (IVA ya incluido). */
  total:           number;
  shippingName:    string;
  shippingAddress: string;
  shippingCity:    string;
  shippingNotes?:  string;
}

export interface OwnerNewOrderData {
  ownerName:    string;
  ownerEmail:   string;
  storeName:    string;
  orderId:      string;
  items:        OrderEmailItem[];
  total:        number;
  buyerName:    string;
  shippingCity: string;
}

export interface StatusUpdateData {
  buyerName:  string;
  buyerEmail: string;
  orderId:    string;
  newStatus:  string;
  total:      number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n);

// ── Paleta Obsidian Gold ──────────────────────────────────────────────────────
const COLOR = {
  bg:       '#09090b',
  surface:  '#111113',
  surface2: '#18181b',
  border:   '#27272a',
  text:     '#fafafa',
  muted:    '#a1a1aa',
  dim:      '#52525b',
  gold:     '#f59e0b',
  goldBri:  '#fbbf24',
  success:  '#22c55e',
  danger:   '#ef4444',
  blue:     '#3b82f6',
};

// ── Bloques reutilizables ─────────────────────────────────────────────────────

const BASE = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${COLOR.bg};color:${COLOR.text};margin:0;padding:0;`;
const CARD = `background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:16px;padding:32px;max-width:560px;margin:40px auto;`;
const BTN  = (color = COLOR.gold, textColor = '#09090b') =>
  `display:inline-block;background:${color};color:${textColor};text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;margin-top:8px;`;
const HR   = `<hr style="border:none;border-top:1px solid ${COLOR.border};margin:24px 0;" />`;

const LOGO = `
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
    <div style="width:34px;height:34px;background:linear-gradient(135deg,${COLOR.gold},${COLOR.goldBri});border-radius:10px;display:flex;align-items:center;justify-content:center;">
      <span style="color:#09090b;font-size:18px;font-weight:900;line-height:1;">S</span>
    </div>
    <span style="font-size:20px;font-weight:800;color:${COLOR.text};letter-spacing:-0.02em;">Shopper</span>
  </div>
`;

const FOOTER = (orderId?: string) => `
  ${HR}
  <p style="color:${COLOR.dim};font-size:11px;margin:0;line-height:1.6;">
    ${orderId ? `Orden #${orderId.slice(0, 8).toUpperCase()} · ` : ''}Shopper Marketplace Colombia<br/>
    Si no reconoces esta actividad escríbenos a hola@shopper.co
  </p>
`;

function filaItem(item: OrderEmailItem): string {
  return `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid ${COLOR.border};">
        <span style="color:${COLOR.text};font-size:14px;font-weight:500;">${item.title}</span>
        <span style="color:${COLOR.dim};font-size:12px;display:block;margin-top:2px;">
          SKU: ${item.sku} &nbsp;·&nbsp; ×${item.quantity}
        </span>
      </td>
      <td style="padding:11px 0;border-bottom:1px solid ${COLOR.border};text-align:right;white-space:nowrap;">
        <span style="color:${COLOR.goldBri};font-size:14px;font-weight:700;">${fmt(item.price * item.quantity)}</span>
      </td>
    </tr>
  `;
}

function tablaItems(items: OrderEmailItem[]): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tbody>${items.map(filaItem).join('')}</tbody>
    </table>
  `;
}

function totalRow(total: number): string {
  return `
    <div style="display:flex;justify-content:space-between;padding-top:14px;border-top:1px solid #2a2a2a;">
      <span style="font-size:15px;font-weight:700;color:${COLOR.text};">Total</span>
      <span style="font-size:16px;font-weight:800;color:${COLOR.gold};">${fmt(total)}</span>
    </div>
  `;
}

/** Línea simple etiqueta/valor para el desglose. */
function lineaResumen(label: string, value: string, color = COLOR.muted): string {
  return `
    <div style="display:flex;justify-content:space-between;font-size:13px;color:${color};margin-bottom:7px;">
      <span>${label}</span><span>${value}</span>
    </div>
  `;
}

/**
 * Desglose del pedido con IVA incluido. El IVA se muestra como línea
 * informativa (ya está dentro del precio) y nunca se suma al total.
 */
function desgloseRow(d: { subtotal?: number; discount?: number; ivaIncluded?: number; shipping?: number; total: number }): string {
  if (d.subtotal === undefined) return totalRow(d.total);
  const filas = [
    lineaResumen('Subtotal', fmt(d.subtotal)),
    d.discount && d.discount > 0 ? lineaResumen('Descuento', `−${fmt(d.discount)}`, COLOR.success) : '',
    d.ivaIncluded !== undefined ? lineaResumen('IVA incluido (19%)', fmt(d.ivaIncluded), COLOR.dim) : '',
    d.shipping !== undefined
      ? lineaResumen('Envío', d.shipping === 0 ? 'Gratis' : fmt(d.shipping), d.shipping === 0 ? COLOR.success : COLOR.muted)
      : '',
  ].join('');
  return `${filas}${totalRow(d.total)}`;
}

// ── Config de estados ─────────────────────────────────────────────────────────
const CONFIG_STATUS: Record<string, { emoji: string; badge: string; titulo: string; mensaje: string; borderColor: string }> = {
  confirmed: {
    emoji: '',
    badge: `background:${COLOR.success}18;border:1px solid ${COLOR.success}35;`,
    titulo: 'Orden confirmada',
    mensaje: 'Tu orden fue confirmada y pronto comenzaremos a prepararla. Te avisaremos cuando esté lista para envío.',
    borderColor: COLOR.success,
  },
  processing: {
    emoji: '',
    badge: `background:${COLOR.blue}18;border:1px solid ${COLOR.blue}35;`,
    titulo: 'Preparando tu pedido',
    mensaje: 'Estamos empacando y preparando todos tus productos con cuidado. Pronto estará en camino.',
    borderColor: COLOR.blue,
  },
  shipped: {
    emoji: '',
    badge: `background:${COLOR.gold}18;border:1px solid ${COLOR.gold}40;`,
    titulo: '¡Tu pedido está en camino!',
    mensaje: 'Tu pedido fue despachado y está en ruta hacia ti. Espera recibir noticias del transportador.',
    borderColor: COLOR.gold,
  },
  delivered: {
    emoji: '',
    badge: `background:${COLOR.success}18;border:1px solid ${COLOR.success}35;`,
    titulo: '¡Pedido entregado!',
    mensaje: 'Tu pedido fue entregado exitosamente. Esperamos que estés disfrutando tus productos.',
    borderColor: COLOR.success,
  },
  cancelled: {
    emoji: '',
    badge: `background:${COLOR.danger}18;border:1px solid ${COLOR.danger}35;`,
    titulo: 'Orden cancelada',
    mensaje: 'Tu orden fue cancelada. Si realizaste algún pago, el reembolso será procesado en los próximos días hábiles.',
    borderColor: COLOR.danger,
  },
  refunded: {
    emoji: '↩',
    badge: `background:#71717a18;border:1px solid #71717a40;`,
    titulo: 'Reembolso procesado',
    mensaje: 'El reembolso de tu orden ha sido procesado. El dinero llegará a tu método de pago original en 3-5 días hábiles.',
    borderColor: '#71717a',
  },
};

// ── EmailService ──────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly transport: nodemailer.Transporter | null;
  private readonly logger = new Logger(EmailService.name);
  private readonly from:   string;
  private readonly web:    string;

  constructor() {
    this.web  = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    this.from = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? 'Shopper <no-reply@shopper.local>';

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      const port = Number(process.env.SMTP_PORT) || 587;
      this.transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,          // 465 = SSL directo; 587 = STARTTLS
        auth: { user, pass },
      });
      this.logger.log(`SMTP configurado (${host}:${port}) — emails activos.`);
    } else {
      this.transport = null;
      this.logger.warn('SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS) — los emails NO se enviarán.');
    }
  }

  // ── 1. Bienvenida ──────────────────────────────────────────────────────────

  async sendWelcome(name: string, email: string): Promise<void> {
    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}
          <h1 style="font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-0.02em;">
            ¡Bienvenido a Shopper, ${name}!
          </h1>
          <p style="color:${COLOR.muted};font-size:15px;line-height:1.65;margin:0 0 24px;">
            Tu cuenta ha sido creada exitosamente. Ya puedes explorar cientos de tiendas
            independientes y encontrar productos únicos de Colombia.
          </p>
          ${HR}
          <p style="color:${COLOR.muted};font-size:13px;margin:0 0 20px;">
            ¿Quieres vender en Shopper? Abre tu propia tienda y llega a miles de compradores.
          </p>
          <a href="${this.web}" style="${BTN()}">Explorar tiendas →</a>
          ${FOOTER()}
        </div>
      </div>
    `;
    await this.send({ to: email, subject: `Bienvenido a Shopper, ${name}`, html });
  }

  // ── 1b. Código para restablecer contraseña ─────────────────────────────────

  async sendPasswordReset(name: string, email: string, code: string): Promise<void> {
    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}
          <h1 style="font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-0.02em;">
            Restablece tu contraseña
          </h1>
          <p style="color:${COLOR.muted};font-size:15px;line-height:1.65;margin:0 0 20px;">
            Hola ${name}, usa este código para crear una nueva contraseña. Vence en 15 minutos.
          </p>
          <div style="font-size:34px;font-weight:800;letter-spacing:.35em;text-align:center;
                      background:#f3ede2;border-radius:12px;padding:18px 0;margin:0 0 22px;">
            ${code}
          </div>
          <p style="color:${COLOR.muted};font-size:13px;line-height:1.6;margin:0;">
            Si no solicitaste esto, ignora este correo: tu contraseña no cambiará.
          </p>
          ${FOOTER()}
        </div>
      </div>
    `;
    await this.send({ to: email, subject: 'Tu código para restablecer la contraseña', html });
  }

  // ── 1c. Verificación de correo (enlace) ─────────────────────────────────────

  async sendVerification(name: string, email: string, token: string): Promise<void> {
    const link = `${this.web}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}
          <h1 style="font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-0.02em;">
            Confirma tu correo
          </h1>
          <p style="color:${COLOR.muted};font-size:15px;line-height:1.65;margin:0 0 24px;">
            Hola ${name}, confirma tu correo para activar tu cuenta y poder abrir tu tienda en Shopper.
            El enlace vence en 24 horas.
          </p>
          <a href="${link}" style="${BTN()}">Verificar mi correo →</a>
          <p style="color:${COLOR.muted};font-size:13px;line-height:1.6;margin:20px 0 0;">
            Si no creaste esta cuenta, ignora este correo.
          </p>
          ${FOOTER()}
        </div>
      </div>
    `;
    await this.send({ to: email, subject: 'Confirma tu correo en Shopper', html });
  }

  // ── 2. Confirmación de orden al comprador ──────────────────────────────────

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
    const shortId = data.orderId.slice(0, 8).toUpperCase();

    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}

          <div style="background:${COLOR.success}18;border:1px solid ${COLOR.success}35;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <span style="color:${COLOR.success};font-size:14px;font-weight:700;"> &nbsp;Orden #${shortId} recibida</span>
          </div>

          <h1 style="font-size:21px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">
            ¡Gracias por tu compra, ${data.buyerName}!
          </h1>
          <p style="color:${COLOR.muted};font-size:14px;line-height:1.65;margin:0 0 26px;">
            Tu orden está siendo procesada. Recibirás otro correo cuando cambie de estado.
          </p>

          ${HR}
          <h2 style="font-size:13px;font-weight:700;color:${COLOR.muted};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px;">Productos</h2>
          ${tablaItems(data.items)}
          ${desgloseRow(data)}
          <p style="color:${COLOR.dim};font-size:11px;margin:8px 0 0;">Los precios incluyen IVA del 19% (legislación colombiana).</p>

          ${HR}
          <h2 style="font-size:13px;font-weight:700;color:${COLOR.muted};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Dirección de envío</h2>
          <p style="color:${COLOR.text};font-size:14px;font-weight:600;margin:0 0 4px;">${data.shippingName}</p>
          <p style="color:${COLOR.muted};font-size:13px;margin:0 0 4px;">${data.shippingAddress}, ${data.shippingCity}</p>
          ${data.shippingNotes ? `<p style="color:${COLOR.dim};font-size:12px;font-style:italic;margin:4px 0 0;">"${data.shippingNotes}"</p>` : ''}

          ${HR}

          <!-- Recibo / factura informal -->
          <div style="background:${COLOR.surface2};border:1px solid ${COLOR.border};border-radius:10px;padding:18px;margin-bottom:24px;">
            <p style="font-size:11px;font-weight:700;color:${COLOR.dim};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Recibo de compra</p>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:${COLOR.muted};margin-bottom:6px;">
              <span>N° Orden</span>
              <span style="color:${COLOR.text};font-family:monospace;font-weight:600;">#${shortId}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:${COLOR.muted};margin-bottom:6px;">
              <span>Fecha</span>
              <span style="color:${COLOR.text};">${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:${COLOR.muted};margin-bottom:6px;">
              <span>Total pagado</span>
              <span style="color:${COLOR.gold};font-weight:700;">${fmt(data.total)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:${COLOR.muted};">
              <span>Ciudad de envío</span>
              <span style="color:${COLOR.text};">${data.shippingCity}</span>
            </div>
          </div>

          <a href="${this.web}/orders" style="${BTN()}">Ver estado del pedido →</a>
          ${FOOTER(data.orderId)}
        </div>
      </div>
    `;

    await this.send({
      to:      data.buyerEmail,
      subject: `Orden confirmada #${shortId} — Shopper`,
      html,
    });
  }

  // ── 3. Nuevo pedido al owner ───────────────────────────────────────────────

  async sendOwnerNewOrder(data: OwnerNewOrderData): Promise<void> {
    const shortId = data.orderId.slice(0, 8).toUpperCase();

    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}

          <div style="background:${COLOR.gold}15;border:1px solid ${COLOR.gold}35;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <span style="color:${COLOR.gold};font-size:14px;font-weight:700;"> &nbsp;Nuevo pedido en ${data.storeName}</span>
          </div>

          <h1 style="font-size:21px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">
            ¡Tienes un nuevo pedido!
          </h1>
          <p style="color:${COLOR.muted};font-size:14px;line-height:1.65;margin:0 0 26px;">
            Hola ${data.ownerName}, <strong style="color:${COLOR.text};">${data.buyerName}</strong>
            acaba de hacer un pedido en tu tienda. Revísalo y confírmalo pronto.
          </p>

          ${HR}
          <h2 style="font-size:13px;font-weight:700;color:${COLOR.muted};text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px;">Productos del pedido</h2>
          ${tablaItems(data.items)}
          ${totalRow(data.total)}

          ${HR}

          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px;">
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Orden</span>
              <span style="color:${COLOR.text};font-family:monospace;font-weight:700;">#${shortId}</span>
            </div>
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Ciudad</span>
              <span style="color:${COLOR.text};">${data.shippingCity}</span>
            </div>
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Total</span>
              <span style="color:${COLOR.gold};font-weight:700;">${fmt(data.total)}</span>
            </div>
          </div>

          <a href="${this.web}/owner/orders" style="${BTN()}">Ver pedidos →</a>
          ${FOOTER(data.orderId)}
        </div>
      </div>
    `;

    await this.send({
      to:      data.ownerEmail,
      subject: `Nuevo pedido #${shortId} en ${data.storeName} — Shopper`,
      html,
    });
  }

  // ── 4. Cambio de estado de la orden ──────────────────────────────────────

  async sendStatusUpdate(data: StatusUpdateData): Promise<void> {
    const shortId = data.orderId.slice(0, 8).toUpperCase();
    const cfg = CONFIG_STATUS[data.newStatus];
    if (!cfg) return; // estado sin email (ej. pending)

    const html = `
      <div style="${BASE}">
        <div style="${CARD}">
          ${LOGO}

          <div style="${cfg.badge}border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <span style="color:${cfg.borderColor};font-size:14px;font-weight:700;">
              ${cfg.emoji} &nbsp;${cfg.titulo}
            </span>
          </div>

          <h1 style="font-size:21px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">
            Hola ${data.buyerName}, tu pedido se actualizó
          </h1>
          <p style="color:${COLOR.muted};font-size:14px;line-height:1.65;margin:0 0 24px;">
            ${cfg.mensaje}
          </p>

          ${HR}

          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px;">
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Orden</span>
              <span style="color:${COLOR.text};font-family:monospace;font-weight:700;">#${shortId}</span>
            </div>
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Estado actual</span>
              <span style="color:${cfg.borderColor};font-weight:700;">${cfg.titulo}</span>
            </div>
            <div>
              <span style="color:${COLOR.dim};display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Total</span>
              <span style="color:${COLOR.gold};font-weight:700;">${fmt(data.total)}</span>
            </div>
          </div>

          <a href="${this.web}/orders" style="${BTN(cfg.borderColor, data.newStatus === 'shipped' || data.newStatus === 'cancelled' ? COLOR.text : '#09090b')}">
            Ver mi orden →
          </a>
          ${FOOTER(data.orderId)}
        </div>
      </div>
    `;

    const asuntos: Record<string, string> = {
      confirmed:  `Orden confirmada #${shortId}`,
      processing: `Preparando tu pedido #${shortId}`,
      shipped:    `¡Tu pedido #${shortId} está en camino!`,
      delivered:  `¡Pedido entregado! #${shortId}`,
      cancelled:  `Orden cancelada #${shortId}`,
      refunded:   `Reembolso procesado #${shortId}`,
    };

    await this.send({
      to:      data.buyerEmail,
      subject: `${asuntos[data.newStatus] ?? 'Actualización de tu orden'} — Shopper`,
      html,
    });
  }

  // ── Helper privado ────────────────────────────────────────────────────────

  private async send({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.transport) {
      this.logger.warn(`Email omitido (SMTP no configurado) → ${to} | ${subject}`);
      return;
    }
    try {
      await this.transport.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email enviado → ${to} | ${subject}`);
    } catch (err: unknown) {
      this.logger.error(`Error enviando email a ${to}: ${(err as Error)?.message}`);
    }
  }
}
