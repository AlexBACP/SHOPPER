'use client';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { StoreSection } from '@/types';
import { SECTION_META } from './section-meta';

// Fila del árbol de secciones: drag handle + icono + etiqueta + ocultar/eliminar.
export default function SectionItem({ section, selected, removable, onSelect, onToggle, onRemove }: {
  section: StoreSection; selected: boolean; removable: boolean;
  onSelect: () => void; onToggle: () => void; onRemove: () => void;
}) {
  const controls = useDragControls();
  const meta = SECTION_META[section.type];

  return (
    <Reorder.Item value={section} dragListener={false} dragControls={controls} onClick={onSelect}
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer border transition-colors ${
        selected ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'border-transparent hover:bg-[var(--bone-3)]'
      }`}>
      <button aria-label="Reordenar sección" onPointerDown={e => controls.start(e)} onClick={e => e.stopPropagation()}
        className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-grab active:cursor-grabbing touch-none shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <meta.icon className={`w-4 h-4 shrink-0 ${section.enabled ? 'text-[var(--primary)]' : 'text-[var(--ink-soft)]'}`} />
      <span className={`flex-1 text-sm truncate ${section.enabled ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)] line-through'}`}>{meta.label}</span>
      <button aria-label={section.enabled ? 'Ocultar sección' : 'Mostrar sección'} onClick={e => { e.stopPropagation(); onToggle(); }}
        className="opacity-0 group-hover:opacity-100 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-opacity shrink-0">
        {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      {removable && (
        <button aria-label="Eliminar sección" onClick={e => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 text-[var(--ink-soft)] hover:text-red-500 transition-opacity shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </Reorder.Item>
  );
}
