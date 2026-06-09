'use client';
import { motion } from 'framer-motion';
import { Video as VideoIcon } from 'lucide-react';
import type { VideoSettings } from '@/types';

// Convierte una URL de YouTube/Vimeo en su URL de embed.
function toEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

// Video embebido (YouTube / Vimeo) responsivo 16:9.
export default function VideoSection({ settings }: { settings: VideoSettings }) {
  const embed = toEmbed(settings.url ?? '');

  return (
    <motion.div key="video" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {settings.title && <h2 className="text-xl font-bold text-[var(--ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{settings.title}</h2>}

      {embed ? (
        <div className="relative w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-[var(--line)] shadow-[var(--shadow-sm)]" style={{ aspectRatio: '16 / 9' }}>
          <iframe src={embed} title={settings.title || 'Video'} className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center text-[var(--text-muted)]">
          <VideoIcon className="w-10 h-10 mb-2 text-[var(--border-hover)]" />
          <p className="text-sm">Pega un enlace de YouTube o Vimeo desde el panel</p>
        </div>
      )}
    </motion.div>
  );
}
