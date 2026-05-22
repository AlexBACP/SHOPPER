'use client';

import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200',
        'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]',
        'hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-3)]',
        className,
      )}>
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span key="sun" initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }} className="flex">
            <Sun className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }} className="flex">
            <Moon className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
