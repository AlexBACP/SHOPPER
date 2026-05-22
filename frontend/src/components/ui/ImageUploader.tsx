'use client';

// src/components/ui/ImageUploader.tsx
// ─────────────────────────────────────────────────────────
//  Componente reutilizable para subir imágenes a Cloudinary
//  via el endpoint POST /upload/image del backend.
//
//  Uso para logo de tienda (una sola imagen):
//    <ImageUploader
//      folder="stores"
//      value={logoUrl}
//      onChange={(url) => setValue('logo_url', url)}
//    />
//
//  Uso para imágenes de producto (múltiples):
//    <ImageUploader
//      folder="products"
//      multiple
//      value={imageUrls}       // string[]
//      onChange={(urls) => setValue('images', urls)}
//    />
// ─────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, ImageIcon, Plus } from 'lucide-react';
import api from '@/lib/api';
import { imageOpt, blurDataUrl } from '@/lib/cloudinary';

// ── Tipos ────────────────────────────────────────────────

interface SingleProps {
  folder: 'stores' | 'products';
  multiple?: false;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

interface MultiProps {
  folder: 'stores' | 'products';
  multiple: true;
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

type Props = SingleProps | MultiProps;

// ── Helpers ──────────────────────────────────────────────

function isMulti(props: Props): props is MultiProps {
  return props.multiple === true;
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/upload/image?folder=${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url as string;
}

// ── Componente principal ─────────────────────────────────

export default function ImageUploader(props: Props) {
  const { folder, label } = props;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Valores actuales normalizados siempre a string[]
  const currentUrls: string[] = isMulti(props)
    ? (props.value ?? [])
    : props.value
    ? [props.value]
    : [];

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setUploading(true);

      try {
        if (isMulti(props)) {
          // Sube todos en paralelo
          const uploads = await Promise.all(
            Array.from(files).map((f) => uploadFile(f, folder)),
          );
          props.onChange([...currentUrls, ...uploads]);
        } else {
          const url = await uploadFile(files[0], folder);
          props.onChange(url);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Error al subir la imagen');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [props, currentUrls, folder],
  );

  const removeUrl = (idx: number) => {
    if (isMulti(props)) {
      props.onChange(currentUrls.filter((_, i) => i !== idx));
    } else {
      props.onChange('');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Render ────────────────────────────────────────────

  const showDropzone = isMulti(props) || currentUrls.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          {label}
        </label>
      )}

      {/* Previews */}
      {currentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentUrls.map((url, idx) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group w-20 h-20"
            >
              <Image
                src={imageOpt(url, { ancho: 160 })}
                alt=""
                fill
                sizes="80px"
                className="object-cover rounded-xl border border-[var(--border)]"
                placeholder={blurDataUrl(url) ? 'blur' : 'empty'}
                blurDataURL={blurDataUrl(url) || undefined}
              />
              <button
                type="button"
                onClick={() => removeUrl(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-[var(--text-primary)]" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {showDropzone && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer
            transition-all
            ${dragOver
              ? 'border-[var(--accent-bright)] bg-[var(--accent-bright)]/5'
              : 'border-[var(--border-hover)] hover:border-[var(--border-hover)] bg-[var(--surface-2)]'
            }
            ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={isMulti(props)}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-[var(--accent-bright)] animate-spin" />
              <p className="text-sm text-[var(--text-secondary)]">Subiendo…</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-xl flex items-center justify-center">
                {isMulti(props) && currentUrls.length > 0
                  ? <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
                  : <Upload className="w-5 h-5 text-[var(--text-secondary)]" />
                }
              </div>
              <p className="text-sm text-[var(--text-secondary)] text-center">
                {dragOver
                  ? 'Suelta aquí'
                  : isMulti(props) && currentUrls.length > 0
                  ? 'Agregar más imágenes'
                  : 'Arrastra una imagen o haz clic'
                }
              </p>
              <p className="text-xs text-[var(--text-muted)]">JPG, PNG o WebP · máx 5 MB</p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
