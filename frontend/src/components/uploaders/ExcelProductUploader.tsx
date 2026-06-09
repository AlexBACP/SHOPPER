'use client';

/**
 * ExcelProductUploader — carga masiva de productos desde un archivo Excel.
 *
 * Flujo:
 *   1. El owner arrastra/selecciona un .xlsx, .xls o .csv
 *   2. Se parsea cliente-side con SheetJS (xlsx)
 *   3. Se muestra una preview validada (errores en rojo)
 *   4. Al confirmar, se hace POST en lote al backend NestJS
 *
 * Requiere:  npm i xlsx
 *
 * Formato esperado del Excel (encabezados — ESPAÑOL, primera fila):
 *   título | descripción | categoría | precio | stock | sku | imagen
 *
 * Animaciones: drop zone con pulso, lista con stagger reveal,
 * filas inválidas con shake sutil al hacer scroll.
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet, Upload, X, Check, AlertTriangle,
  Loader2, Download, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface FilaProducto {
  title:       string;
  description: string;
  category:    string;
  price:       number;
  stock:       number;
  sku:         string;
  image:       string;
  __error?:    string;
  __rowNumber: number;
}

const CATS_VALIDAS = ['moda','hogar','tecnologia','artesanias','alimentos','deportes','belleza','ninos'];

interface Props {
  storeId: string;
  onSuccess?: () => void;
}

export default function ExcelProductUploader({ storeId, onSuccess }: Props) {
  const [filas,    setFilas]   = useState<FilaProducto[]>([]);
  const [archivo,  setArchivo] = useState<File | null>(null);
  const [dragging, setDrag]    = useState(false);
  const [uploading,setUpload]  = useState(false);
  const [progress, setProgress]= useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Normaliza encabezado: minúsculas, sin tildes, sin espacios */
  const normalizar = (s: string): string => String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().toLowerCase().replace(/\s+/g,'_');

  const validarFila = (f: Partial<FilaProducto>, row: number): FilaProducto => {
    const fila: FilaProducto = {
      title:       String(f.title       ?? '').trim(),
      description: String(f.description ?? '').trim(),
      category:    String(f.category    ?? '').trim().toLowerCase(),
      price:       Number(f.price)       || 0,
      stock:       Number(f.stock)       || 0,
      sku:         String(f.sku         ?? '').trim().toUpperCase(),
      image:       String(f.image       ?? '').trim(),
      __rowNumber: row,
    };

    const errores: string[] = [];
    if (!fila.title)              errores.push('Falta título');
    if (fila.price <= 0)          errores.push('Precio inválido');
    if (fila.stock < 0)           errores.push('Stock negativo');
    if (!fila.sku)                errores.push('Falta SKU');
    if (fila.category && !CATS_VALIDAS.includes(fila.category)) {
      errores.push(`Categoría "${fila.category}" no existe`);
    }
    if (errores.length) fila.__error = errores.join(' · ');
    return fila;
  };

  const procesarArchivo = async (file: File) => {
    setArchivo(file);
    try {
      const XLSX = await import('xlsx');           // carga diferida
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: 'array' });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      // Mapeo flexible de encabezados (ES / EN / variantes con tilde)
      const mapeo: Record<string, keyof FilaProducto> = {
        titulo: 'title', título: 'title', title: 'title', nombre: 'title',
        descripcion: 'description', descripción: 'description', description: 'description', desc: 'description',
        categoria: 'category', categoría: 'category', category: 'category',
        precio: 'price', price: 'price',
        stock: 'stock', inventario: 'stock', cantidad: 'stock',
        sku: 'sku', codigo: 'sku', código: 'sku',
        imagen: 'image', image: 'image', foto: 'image', url: 'image',
      };

      const procesadas = raw.map((row, idx) => {
        const f: Partial<FilaProducto> = {};
        for (const k of Object.keys(row)) {
          const key = mapeo[normalizar(k)];
          if (key) f[key] = row[k] as never;
        }
        return validarFila(f, idx + 2); // +2 = fila Excel real (1 = headers)
      });

      setFilas(procesadas);
      const validas = procesadas.filter(p => !p.__error).length;
      toast.success(`${validas} de ${procesadas.length} filas válidas`);
    } catch (err) {
      console.error(err);
      toast.error('No pudimos leer el archivo. ¿Es un Excel válido?');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  };

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const descargarPlantilla = async () => {
    const XLSX = await import('xlsx');             // carga diferida
    const data = [
      { titulo:'Mochila Wayuu', descripcion:'Tejido tradicional, fibra natural', categoria:'artesanias', precio:180000, stock:12, sku:'WAY-001', imagen:'' },
      { titulo:'Café especial 500g', descripcion:'Origen Huila, tueste medio', categoria:'alimentos', precio:38000, stock:50, sku:'CAF-001', imagen:'' },
      { titulo:'Audífonos Bluetooth', descripcion:'Cancelación de ruido', categoria:'tecnologia', precio:250000, stock:8, sku:'AUD-001', imagen:'' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'plantilla-shopper.xlsx');
    toast.success('Plantilla descargada. Llénala y vuelve a subirla.');
  };

  const subir = async () => {
    const validas = filas.filter(f => !f.__error);
    if (validas.length === 0) return toast.error('No hay filas válidas');

    setUpload(true);
    setProgress(0);
    let ok = 0, fail = 0;

    for (let i = 0; i < validas.length; i++) {
      const f = validas[i];
      try {
        await api.post(`/stores/${storeId}/products`, {
          title:       f.title,
          description: f.description,
          category:    f.category || undefined,
          price:       f.price,
          stock:       f.stock,
          sku:         f.sku,
          images:      f.image ? [f.image] : [],
        });
        ok++;
      } catch { fail++; }
      setProgress(Math.round(((i + 1) / validas.length) * 100));
    }

    setUpload(false);
    if (ok > 0) toast.success(`${ok} producto(s) creado(s)`);
    if (fail > 0) toast.error(`${fail} producto(s) fallaron`);
    if (fail === 0) {
      setFilas([]);
      setArchivo(null);
      onSuccess?.();
    }
  };

  const validas    = filas.filter(f => !f.__error).length;
  const invalidas  = filas.length - validas;

  return (
    <div className="space-y-6">
      {/* ────── HEADER ────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            className="flex items-center gap-2 text-lg font-medium"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Carga masiva de productos
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sube un Excel con tu inventario. Se crea todo en un clic.
          </p>
        </div>

        <button
          type="button"
          onClick={descargarPlantilla}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors"
          style={{
            background: 'var(--surface)',
            border:     '1px solid var(--border)',
            color:      'var(--text-primary)',
          }}
        >
          <Download className="h-4 w-4" />
          Descargar plantilla
        </button>
      </div>

      {/* ────── DROPZONE ────── */}
      {filas.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all"
          style={{
            borderColor: dragging ? 'var(--accent)' : 'var(--border-hover)',
            background:  dragging ? 'var(--accent-subtle)' : 'var(--surface)',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleSelect}
            className="hidden"
          />

          <motion.div
            animate={dragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full"
            style={{
              background: 'var(--accent-subtle)',
              color:      'var(--accent)',
            }}
          >
            <Upload className="h-7 w-7" />
          </motion.div>

          <div className="mt-4 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
            {dragging ? 'Suelta el archivo aquí' : 'Arrastra un Excel o haz clic para seleccionar'}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            .xlsx · .xls · .csv  ·  máx. 5MB
          </div>
        </motion.div>
      )}

      {/* ────── PREVIEW ────── */}
      <AnimatePresence>
        {filas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border:     '1px solid var(--border)',
            }}
          >
            {/* Resumen */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b p-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />
                  <strong>{validas}</strong> válidas
                </span>
                {invalidas > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" style={{ color: 'var(--danger)' }} />
                    <strong>{invalidas}</strong> con errores
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {archivo?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setFilas([]); setArchivo(null); }}
                  disabled={uploading}
                  className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ background: 'var(--surface-2)' }}
                  aria-label="Descartar"
                >
                  <X className="h-4 w-4" />
                </button>

                <motion.button
                  onClick={subir}
                  disabled={uploading || validas === 0}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
                  style={{
                    background: 'var(--btn-primary-bg)',
                    color:      'var(--btn-primary-text)',
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo… {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Crear {validas} producto{validas !== 1 ? 's' : ''}
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Progreso */}
            {uploading && (
              <div
                className="h-1 w-full overflow-hidden"
                style={{ background: 'var(--surface-2)' }}
              >
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                  style={{ background: 'var(--accent)' }}
                />
              </div>
            )}

            {/* Tabla */}
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead
                  className="sticky top-0 backdrop-blur"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <tr>
                    {['#', 'Producto', 'Cat.', 'Precio', 'Stock', 'SKU', 'Estado'].map(h => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.4) }}
                      className="border-t"
                      style={{
                        borderColor: 'var(--border)',
                        background: f.__error ? 'var(--danger-subtle)' : 'transparent',
                      }}
                    >
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {f.__rowNumber}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {f.title || <em style={{ color: 'var(--text-muted)' }}>(vacío)</em>}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {f.category || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(f.price)}
                      </td>
                      <td className="px-3 py-2">{f.stock}</td>
                      <td className="px-3 py-2 font-mono text-xs">{f.sku || '—'}</td>
                      <td className="px-3 py-2">
                        {f.__error ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs"
                            style={{ color: 'var(--danger)' }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {f.__error}
                          </span>
                        ) : (
                          <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
