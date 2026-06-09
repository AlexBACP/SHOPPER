'use client';

/**
 * BotonFacturaDIAN — botón doble (PDF + Excel) para descargar la factura
 * electrónica DIAN académica.
 *
 * Uso en /orders/[id]/page.tsx:
 *   <BotonFacturaDIAN pedido={order} override={{ seller: {...} }} />
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DatosFactura, pedidoAFacturaDIAN as TipoPedidoAFactura } from './InvoiceDIAN';

interface Props {
  pedido: Parameters<typeof TipoPedidoAFactura>[0];
  /** Override de datos del vendedor / comprador / invoice */
  override?: Partial<DatosFactura>;
  /** Mostrar solo PDF, solo Excel, o ambos (default: ambos) */
  formats?: 'pdf' | 'xlsx' | 'both';
}

type Loading = false | 'pdf' | 'xlsx';

export default function BotonFacturaDIAN({ pedido, override, formats = 'both' }: Props) {
  const [loading, setLoading] = useState<Loading>(false);

  const handlePDF = async () => {
    setLoading('pdf');
    try {
      const { generarFacturaDIAN, pedidoAFacturaDIAN } = await import('./InvoiceDIAN');
      const datos = pedidoAFacturaDIAN(pedido, override);
      await generarFacturaDIAN(datos);
      toast.success('Factura PDF descargada');
    } catch (err) {
      console.error(err);
      toast.error('No pudimos generar la factura PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleXLSX = async () => {
    setLoading('xlsx');
    try {
      const { pedidoAFacturaDIAN } = await import('./InvoiceDIAN');
      const { generarFacturaDIANExcel } = await import('./InvoiceDIANExcel');
      const datos = pedidoAFacturaDIAN(pedido, override);
      await generarFacturaDIANExcel(datos);
      toast.success('Factura Excel descargada');
    } catch (err) {
      console.error(err);
      toast.error('No pudimos generar la factura Excel');
    } finally {
      setLoading(false);
    }
  };

  const btnBase = "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="inline-flex flex-wrap items-center gap-2.5">
      {(formats === 'pdf' || formats === 'both') && (
        <motion.button
          onClick={handlePDF}
          disabled={!!loading}
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: loading ? 0 : -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className={btnBase}
          style={{
            background: 'var(--ink)',
            color: 'var(--bone-2)',
            boxShadow: '0 4px 14px rgba(40,30,18,.18)',
          }}
          aria-label="Descargar factura en PDF"
        >
          {loading === 'pdf'
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando PDF…</>
            : <><FileText className="h-4 w-4" /> Factura PDF</>
          }
        </motion.button>
      )}

      {(formats === 'xlsx' || formats === 'both') && (
        <motion.button
          onClick={handleXLSX}
          disabled={!!loading}
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: loading ? 0 : -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className={btnBase}
          style={{
            background: 'var(--bone-2)',
            color: 'var(--ink)',
            border: '1.5px solid var(--ed-hairline, var(--border))',
          }}
          aria-label="Descargar factura en Excel"
        >
          {loading === 'xlsx'
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando XLSX…</>
            : <><FileSpreadsheet className="h-4 w-4" style={{ color: '#1F7244' }} /> Factura Excel</>
          }
        </motion.button>
      )}
    </div>
  );
}
