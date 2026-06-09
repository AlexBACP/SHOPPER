'use client';

/**
 * InvoiceDIANExcel — Generador de factura electrónica formato DIAN en XLSX.
 *
 * Reutiliza la misma estructura `DatosFactura` que el PDF DIAN, pero produce
 * un archivo de Excel multi-hoja:
 *   · Hoja 1 "Factura" — vendedor, comprador, ítems, IVA, totales
 *   · Hoja 2 "Resumen" — formato impuestos para registro contable
 *
 * El XLSX se genera 100% en el cliente con `xlsx` (sheetjs). No requiere
 * backend, credenciales DIAN ni proveedor tecnológico.
 *
 * ⚠️ ACADÉMICO: el archivo NO está firmado electrónicamente ni reportado a DIAN.
 *    Sirve como documento equivalente / soporte contable para uso interno.
 */

import * as XLSX from 'xlsx';
import type { DatosFactura } from './InvoiceDIAN';

const IVA_DEFAULT = 19;

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/** Genera un CUFE simulado idéntico al del PDF (mismo algoritmo) */
function generarCUFE(d: DatosFactura): string {
  const base = `${d.seller.nit}|${d.invoice.prefix}${d.invoice.number}|${d.invoice.dateIssued.toISOString()}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = ((h << 5) - h + base.charCodeAt(i)) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 96);
}

/**
 * Genera y descarga la factura XLSX tipo DIAN.
 */
export async function generarFacturaDIANExcel(d: DatosFactura): Promise<boolean> {
  const wb = XLSX.utils.book_new();

  // ─────────────── HOJA 1: FACTURA ───────────────
  const fechaEmision = d.invoice.dateIssued.toLocaleDateString('es-CO');
  const fechaVence   = d.invoice.dateDue?.toLocaleDateString('es-CO') ?? '—';
  const numero       = `${d.invoice.prefix}-${String(d.invoice.number).padStart(6, '0')}`;
  const cufe         = generarCUFE(d);

  // Construimos AoA (array of arrays) para tener control total del layout
  const rows: (string | number)[][] = [];

  // Encabezado masthead
  rows.push([`FACTURA ELECTRÓNICA ${numero}`]);
  rows.push([]);
  rows.push(['VENDEDOR', '', '', 'FACTURA']);
  rows.push(['Razón social',  d.seller.name,    '', 'Número',     numero]);
  rows.push(['NIT',           d.seller.nit,     '', 'Emisión',    fechaEmision]);
  rows.push(['Régimen',       d.seller.regime,  '', 'Vencimiento',fechaVence]);
  rows.push(['Dirección',     `${d.seller.address}, ${d.seller.city}`, '', 'Forma de pago', d.invoice.paymentMethod]);
  if (d.seller.phone || d.seller.email) {
    rows.push(['Contacto', `${d.seller.phone ?? ''} ${d.seller.email ?? ''}`.trim(), '', 'Resolución', d.invoice.resolution ?? '—']);
  } else {
    rows.push(['', '', '', 'Resolución', d.invoice.resolution ?? '—']);
  }
  if (d.seller.economicActivity) {
    rows.push(['Actividad económica', d.seller.economicActivity]);
  }
  rows.push([]);

  // Comprador
  rows.push(['COMPRADOR']);
  rows.push(['Nombre',      d.buyer.name]);
  rows.push(['Documento',   `${d.buyer.idType} ${d.buyer.idNumber}`]);
  if (d.buyer.address) rows.push(['Dirección', `${d.buyer.address}${d.buyer.city ? `, ${d.buyer.city}` : ''}`]);
  if (d.buyer.email)   rows.push(['Email',     d.buyer.email]);
  if (d.buyer.phone)   rows.push(['Teléfono',  d.buyer.phone]);
  rows.push([]);

  // Items (encabezado de tabla)
  rows.push(['#', 'Descripción', 'Cantidad', 'Vr. Unitario', 'IVA %', 'Vr. IVA', 'Total']);
  let subtotalSinIva = 0;
  let ivaTotal       = 0;
  d.items.forEach((it, i) => {
    const ivaRate = it.ivaRate ?? IVA_DEFAULT;
    const sub     = it.quantity * it.unitPrice;
    const iva     = sub * (ivaRate / 100);
    subtotalSinIva += sub;
    ivaTotal       += iva;
    rows.push([
      i + 1,
      it.description,
      it.quantity,
      Math.round(it.unitPrice),
      ivaRate,
      Math.round(iva),
      Math.round(sub + iva),
    ]);
  });
  rows.push([]);

  // Totales
  const descuento = d.discount ?? 0;
  const envio     = d.shipping ?? 0;
  const total     = subtotalSinIva + ivaTotal - descuento + envio;
  rows.push(['', '', '', '', '', 'Subtotal',  Math.round(subtotalSinIva)]);
  rows.push(['', '', '', '', '', 'IVA',       Math.round(ivaTotal)]);
  if (descuento > 0) rows.push(['', '', '', '', '', 'Descuento', -Math.round(descuento)]);
  if (envio > 0)     rows.push(['', '', '', '', '', 'Envío',     Math.round(envio)]);
  rows.push(['', '', '', '', '', 'TOTAL A PAGAR', Math.round(total)]);
  rows.push([]);

  // Identificación DIAN
  rows.push(['CUFE', cufe]);
  if (d.invoice.notes) {
    rows.push(['Observaciones', d.invoice.notes]);
  }
  rows.push([]);
  rows.push(['Esta es una representación gráfica de la factura electrónica.']);
  rows.push(['Documento académico generado por Shopper — no firmado digitalmente para DIAN.']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ancho de columnas óptimo
  ws['!cols'] = [
    { wch: 6  },  // A — # / labels
    { wch: 42 },  // B — descripción / valores
    { wch: 12 },  // C — cantidad
    { wch: 16 },  // D — vr unitario
    { wch: 10 },  // E — iva %
    { wch: 16 },  // F — vr iva / etiqueta totales
    { wch: 20 },  // G — total
  ];

  // Merges visuales
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title masthead
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Factura');

  // ─────────────── HOJA 2: RESUMEN DE IMPUESTOS ───────────────
  const resumen: (string | number)[][] = [];
  resumen.push(['Concepto', 'Valor (COP)']);
  resumen.push(['Base gravable (sin IVA)', Math.round(subtotalSinIva)]);
  resumen.push(['IVA 19%',                 Math.round(ivaTotal)]);
  resumen.push(['Descuento',               -Math.round(descuento)]);
  resumen.push(['Envío',                   Math.round(envio)]);
  resumen.push(['TOTAL',                   Math.round(total)]);
  resumen.push([]);
  resumen.push(['Items por tarifa de IVA']);
  resumen.push(['Tarifa', 'Base', 'IVA', 'Total']);

  const porTarifa = new Map<number, { base: number; iva: number }>();
  d.items.forEach(it => {
    const rate = it.ivaRate ?? IVA_DEFAULT;
    const base = it.quantity * it.unitPrice;
    const iva  = base * (rate / 100);
    const acc  = porTarifa.get(rate) ?? { base: 0, iva: 0 };
    porTarifa.set(rate, { base: acc.base + base, iva: acc.iva + iva });
  });
  for (const [rate, vals] of porTarifa.entries()) {
    resumen.push([`${rate}%`, Math.round(vals.base), Math.round(vals.iva), Math.round(vals.base + vals.iva)]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(resumen);
  ws2['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Impuestos');

  // ─────────────── DESCARGAR ───────────────
  const filename = `factura-${d.invoice.prefix}-${d.invoice.number}.xlsx`;
  XLSX.writeFile(wb, filename);
  return true;
}

/**
 * Helper: información en texto plano (TXT) útil para soporte humano,
 * por si el usuario prefiere copiar/pegar antes de abrir Excel.
 */
export function facturaATexto(d: DatosFactura): string {
  const lines: string[] = [];
  const fechaEmision = d.invoice.dateIssued.toLocaleDateString('es-CO');
  const numero       = `${d.invoice.prefix}-${String(d.invoice.number).padStart(6, '0')}`;

  lines.push(`FACTURA ELECTRÓNICA ${numero}`);
  lines.push(`Emisión: ${fechaEmision}    Forma de pago: ${d.invoice.paymentMethod}`);
  lines.push('');
  lines.push(`Vendedor: ${d.seller.name} · NIT ${d.seller.nit}`);
  lines.push(`Comprador: ${d.buyer.name} · ${d.buyer.idType} ${d.buyer.idNumber}`);
  lines.push('');
  lines.push('Items:');

  let subBase = 0, ivaT = 0;
  d.items.forEach((it, i) => {
    const rate = it.ivaRate ?? IVA_DEFAULT;
    const sub = it.quantity * it.unitPrice;
    const iva = sub * (rate / 100);
    subBase += sub; ivaT += iva;
    lines.push(`  ${i + 1}. ${it.description}  ×${it.quantity}  ${fmtMoney(it.unitPrice)}  IVA ${rate}%  ${fmtMoney(sub + iva)}`);
  });

  lines.push('');
  lines.push(`Subtotal: ${fmtMoney(subBase)}`);
  lines.push(`IVA:      ${fmtMoney(ivaT)}`);
  lines.push(`TOTAL:    ${fmtMoney(subBase + ivaT - (d.discount ?? 0) + (d.shipping ?? 0))}`);
  lines.push('');
  lines.push(`CUFE: ${generarCUFE(d)}`);
  return lines.join('\n');
}
