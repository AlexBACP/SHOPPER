'use client';

/**
 * InvoiceDIAN — Generador de factura electrónica formato DIAN (Colombia).
 *
 * Genera PDF 100% en el cliente — NO requiere conexión al backend ni firmas.
 * Incluye los campos típicos de una factura electrónica colombiana:
 *   · Datos del vendedor (NIT, dirección, régimen)
 *   · Datos del comprador (NIT/CC, dirección)
 *   · Numeración consecutiva con prefijo + resolución DIAN
 *   · Subtotal, IVA 19%, descuentos, total
 *   · QR code con resumen (formato DIAN-like)
 *   · CUFE simulado (Código Único de Facturación Electrónica)
 *   · Forma de pago, fecha emisión / vencimiento
 *
 * ⚠️ ACADÉMICO: este PDF NO está firmado digitalmente ni reportado a DIAN.
 *    Para uso real necesitas un proveedor tecnológico autorizado (PT).
 *
 * Requiere:  npm i jspdf jspdf-autotable qrcode
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface ItemFactura {
  description: string;
  quantity:    number;
  unitPrice:   number;
  /** % de IVA por item (default 19) */
  ivaRate?:    number;
}

export interface DatosFactura {
  // ── Vendedor (tienda) ──
  seller: {
    name:           string;          // Razón social
    nit:            string;          // Ej. "900.123.456-7"
    address:        string;
    city:           string;
    phone?:         string;
    email?:         string;
    regime:         'Común' | 'Simplificado' | 'No responsable de IVA';
    economicActivity?: string;
    logoBase64?:    string;          // dataURL opcional
  };

  // ── Comprador ──
  buyer: {
    name:    string;
    idType:  'CC' | 'NIT' | 'CE' | 'PA';
    idNumber:string;
    address?:string;
    city?:   string;
    phone?:  string;
    email?:  string;
  };

  // ── Factura ──
  invoice: {
    prefix:      string;             // Ej. "SHO"
    number:      number;             // Ej. 1024
    resolution?: string;             // Ej. "DIAN 18764000001 del 2024-08-15"
    dateIssued:  Date;
    dateDue?:    Date;
    paymentMethod: 'PSE' | 'Nequi' | 'Daviplata' | 'Tarjeta' | 'Contraentrega' | 'Transferencia' | 'Efectivo';
    notes?:      string;
  };

  items:       ItemFactura[];
  discount?:   number;               // descuento total (COP)
  shipping?:   number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/** Genera un CUFE simulado (no oficial — solo demo) */
function generarCUFE(d: DatosFactura): string {
  const base = `${d.seller.nit}|${d.invoice.prefix}${d.invoice.number}|${d.invoice.dateIssued.toISOString()}`;
  // SHA-256-like fake (solo demo, no es criptográfico real)
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = ((h << 5) - h + base.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 96);
}

/**
 * Genera y descarga la factura PDF tipo DIAN.
 * @returns true si tuvo éxito.
 */
export async function generarFacturaDIAN(d: DatosFactura): Promise<boolean> {
  // Paleta (en línea con Mercado Editorial — pero PDF necesita valores hex)
  const COLOR = {
    ink:    '#221d16',   // tinta cálida
    accent: '#c75a2b',   // terracota
    sub:    '#6b6155',
    border: '#ddd2c0',
    bg:     '#faf6ef',
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 15; // margen

  // ─────────────── HEADER ───────────────
  doc.setFillColor(COLOR.ink);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor('#faf6ef');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(d.seller.name.toUpperCase(), M, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIT ${d.seller.nit}  ·  Régimen ${d.seller.regime}`, M, 17);
  doc.text(`${d.seller.address}, ${d.seller.city}`, M, 21);
  if (d.seller.phone || d.seller.email) {
    doc.text(`${d.seller.phone ?? ''}  ${d.seller.email ?? ''}`.trim(), M, 25);
  }

  // Caja de factura (derecha)
  doc.setFillColor(COLOR.accent);
  doc.rect(pageW - 70, 0, 70, 28, 'F');
  doc.setTextColor('#faf6ef');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FACTURA ELECTRÓNICA', pageW - M, 10, { align: 'right' });
  doc.setFontSize(16);
  doc.text(`${d.invoice.prefix}-${String(d.invoice.number).padStart(6, '0')}`, pageW - M, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Emisión: ${d.invoice.dateIssued.toLocaleDateString('es-CO')}`, pageW - M, 23, { align: 'right' });

  // ─────────────── RESOLUCIÓN DIAN ───────────────
  doc.setTextColor(COLOR.sub);
  doc.setFontSize(7);
  if (d.invoice.resolution) {
    doc.text(`Autorización ${d.invoice.resolution}`, M, 33);
  }
  if (d.seller.economicActivity) {
    doc.text(`Actividad económica: ${d.seller.economicActivity}`, M, 36);
  }

  // ─────────────── COMPRADOR ───────────────
  let y = 44;
  doc.setDrawColor(COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, pageW - M, y);
  y += 6;

  doc.setTextColor(COLOR.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FACTURAR A', M, y);
  doc.text('FORMA DE PAGO', pageW / 2, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR.sub);
  doc.text(d.buyer.name, M, y);
  doc.text(d.invoice.paymentMethod, pageW / 2, y);
  y += 4;

  doc.text(`${d.buyer.idType} ${d.buyer.idNumber}`, M, y);
  if (d.invoice.dateDue) {
    doc.text(`Vence: ${d.invoice.dateDue.toLocaleDateString('es-CO')}`, pageW / 2, y);
  }
  y += 4;

  if (d.buyer.address) { doc.text(`${d.buyer.address}${d.buyer.city ? `, ${d.buyer.city}` : ''}`, M, y); y += 4; }
  if (d.buyer.email)   { doc.text(d.buyer.email, M, y); y += 4; }

  // ─────────────── TABLA DE ITEMS ───────────────
  y += 4;
  const body = d.items.map((it, i) => {
    const ivaRate = it.ivaRate ?? 19;
    const subtotal = it.quantity * it.unitPrice;
    const iva = subtotal * (ivaRate / 100);
    return [
      String(i + 1),
      it.description,
      String(it.quantity),
      fmt(it.unitPrice),
      `${ivaRate}%`,
      fmt(iva),
      fmt(subtotal + iva),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descripción', 'Cant.', 'Vr. Unit.', 'IVA', 'Vr. IVA', 'Total']],
    body,
    theme: 'plain',
    headStyles: {
      fillColor:   COLOR.ink,
      textColor:   '#faf6ef',
      fontStyle:   'bold',
      fontSize:    8,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor:   COLOR.ink,
      fontSize:    8.5,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: COLOR.bg },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 26, halign: 'right'  },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 22, halign: 'right'  },
      6: { cellWidth: 28, halign: 'right'  },
    },
    margin: { left: M, right: M },
  });

  // ─────────────── TOTALES ───────────────
  // @ts-expect-error — lastAutoTable es agregado por el plugin en runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  const subtotalSinIva = d.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const ivaTotal       = d.items.reduce((acc, it) => acc + it.quantity * it.unitPrice * ((it.ivaRate ?? 19) / 100), 0);
  const descuento      = d.discount ?? 0;
  const envio          = d.shipping ?? 0;
  const total          = subtotalSinIva + ivaTotal - descuento + envio;

  const totalsX = pageW - M - 65;
  const drawTotalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(bold ? COLOR.ink : COLOR.sub);
    doc.text(label, totalsX, y);
    doc.text(value, pageW - M, y, { align: 'right' });
    y += bold ? 7 : 5;
  };

  drawTotalRow('Subtotal',  fmt(subtotalSinIva));
  drawTotalRow('IVA (19%)', fmt(ivaTotal));
  if (descuento > 0) drawTotalRow('Descuento', `- ${fmt(descuento)}`);
  if (envio > 0)     drawTotalRow('Envío',     fmt(envio));

  // Línea divisoria antes del total
  doc.setDrawColor(COLOR.ink);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y - 2, pageW - M, y - 2);
  y += 2;

  drawTotalRow('TOTAL A PAGAR', fmt(total), true);

  // ─────────────── CUFE + QR ───────────────
  y += 6;
  const cufe = generarCUFE(d);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR.ink);
  doc.text('CUFE', M, y);

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR.sub);
  // Partir el CUFE en líneas
  const cufeLines = cufe.match(/.{1,48}/g) ?? [cufe];
  cufeLines.forEach((line, i) => doc.text(line, M, y + 4 + i * 3));

  // QR (resumen DIAN-like)
  const qrPayload = [
    `NumFac=${d.invoice.prefix}${d.invoice.number}`,
    `FecFac=${d.invoice.dateIssued.toISOString()}`,
    `NitFac=${d.seller.nit}`,
    `DocAdq=${d.buyer.idNumber}`,
    `ValFac=${subtotalSinIva.toFixed(2)}`,
    `ValIva=${ivaTotal.toFixed(2)}`,
    `ValTot=${total.toFixed(2)}`,
    `CUFE=${cufe}`,
  ].join('\n');

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 220 });
    doc.addImage(qrDataUrl, 'PNG', pageW - M - 35, y, 35, 35);
  } catch { /* fallback silencioso */ }

  // ─────────────── NOTAS + FOOTER ───────────────
  if (d.invoice.notes) {
    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLOR.ink);
    doc.text('Observaciones', M, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLOR.sub);
    doc.text(d.invoice.notes, M, y, { maxWidth: pageW - M * 2 - 40 });
  }

  // Footer
  doc.setDrawColor(COLOR.border);
  doc.line(M, 285, pageW - M, 285);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(COLOR.sub);
  doc.text(
    'Esta es una representación gráfica de la factura electrónica. Documento generado por Shopper.',
    pageW / 2, 290, { align: 'center' }
  );

  // ─────────────── DESCARGAR ───────────────
  const filename = `factura-${d.invoice.prefix}-${d.invoice.number}.pdf`;
  doc.save(filename);
  return true;
}

/* ───────────────────────────────────────────────────────────────
   Helper: convertir un Pedido del backend al formato DatosFactura
─────────────────────────────────────────────────────────────── */

/** Shape real del pedido que devuelve el backend de Shopper (GET /orders/:id). */
interface PedidoBackend {
  id:               string;
  items?:           { title: string; quantity: number; price: number }[];
  total:            number;
  shipping_cost?:   number;
  discount_pct?:    number;
  shipping_name?:   string;
  shipping_address?: string;
  shipping_city?:   string;
  payment_method?:  string;
  created_at?:      string;
}

const IVA_RATE = 0.19;

/** Mapea el código de método de pago al rótulo legible de la factura. */
const PAGO_LABEL: Record<string, DatosFactura['invoice']['paymentMethod']> = {
  pse:       'PSE',
  nequi:     'Nequi',
  daviplata: 'Daviplata',
  card:      'Tarjeta',
  cod:       'Contraentrega',
};

/**
 * Convierte un pedido de Shopper al formato de factura DIAN.
 *
 * IMPORTANTE: en Shopper los precios YA incluyen IVA (19%). La factura calcula
 * el IVA sobre la base, así que aquí pasamos `unitPrice = precio / 1.19` (base
 * gravable) para que `base + IVA` reproduzca el precio con IVA y el total cuadre
 * con `pedido.total`.
 */
export function pedidoAFacturaDIAN(
  pedido: PedidoBackend,
  override?: Partial<DatosFactura>,
): DatosFactura {
  const numero = parseInt(pedido.id.slice(-6), 16) || Date.now() % 1_000_000;
  const items  = pedido.items ?? [];

  // Subtotal bruto (con IVA incluido) y descuento en pesos a partir del %.
  const brutoSubtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const discountAmount = brutoSubtotal * (Number(pedido.discount_pct ?? 0) / 100);

  return {
    seller: {
      name:    'Tienda Shopper',
      nit:     '900.000.000-0',
      address: 'Sin dirección',
      city:    'Bogotá',
      regime:  'Común',
      ...override?.seller,
    },
    buyer: {
      name:    pedido.shipping_name ?? 'Consumidor final',
      idType:  'CC',
      idNumber:'222222222222',
      address: pedido.shipping_address,
      city:    pedido.shipping_city,
      ...override?.buyer,
    },
    invoice: {
      prefix:     'SHO',
      number:     numero,
      resolution: 'DIAN 18764000001 del 2024-08-15 — Académico SENA',
      dateIssued: pedido.created_at ? new Date(pedido.created_at) : new Date(),
      paymentMethod: PAGO_LABEL[pedido.payment_method ?? ''] ?? 'PSE',
      ...override?.invoice,
    },
    // Precio sin IVA (base) para que la factura sume el IVA y reproduzca el bruto.
    items: items.map(it => ({
      description: it.title,
      quantity:    it.quantity,
      unitPrice:   it.price / (1 + IVA_RATE),
      ivaRate:     19,
    })),
    discount: discountAmount,
    shipping: Number(pedido.shipping_cost ?? 0),
  };
}
