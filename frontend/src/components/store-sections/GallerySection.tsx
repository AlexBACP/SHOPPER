'use client';
import { motion } from 'framer-motion';
import { Images } from 'lucide-react';
import type { GallerySettings } from '@/types';

// Mosaico de imágenes de la tienda.
export default function GallerySection({ settings }: { settings: GallerySettings }) {
  const images = settings.images ?? [];

  return (
    <motion.div key="gallery" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {settings.title && <h2 className="text-xl font-bold text-[var(--ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{settings.title}</h2>}

      {images.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-[var(--text-muted)]">
          <Images className="w-10 h-10 mb-2 text-[var(--border-hover)]" />
          <p className="text-sm">Sube imágenes a la galería desde el panel</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
