'use client';
import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { Plus, LayoutTemplate } from 'lucide-react';
import { useEditorStore } from '@/store/editor.store';
import { SECTION_META } from './section-meta';
import { TEMPLATES } from '@/lib/store-sections';
import SectionItem from './SectionItem';
import type { SectionType } from '@/types';

// Panel izquierdo: lista reordenable de secciones + menú "Agregar sección".
export default function SectionTree() {
  const sections      = useEditorStore(s => s.current.sections ?? []);
  const selectedId    = useEditorStore(s => s.selectedSectionId);
  const setOrder      = useEditorStore(s => s.setOrder);
  const selectSection = useEditorStore(s => s.selectSection);
  const toggleSection = useEditorStore(s => s.toggleSection);
  const removeSection = useEditorStore(s => s.removeSection);
  const addSection    = useEditorStore(s => s.addSection);
  const applyTemplate = useEditorStore(s => s.applyTemplate);
  const [menu, setMenu] = useState(false);
  const [tpl, setTpl]   = useState(false);

  const addable = (Object.keys(SECTION_META) as SectionType[]).filter(t => SECTION_META[t].addable);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--line)] shrink-0 flex items-center justify-between relative">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Secciones</h2>
        <button onClick={() => setTpl(t => !t)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:text-[var(--primary-2)] transition-colors">
          <LayoutTemplate className="w-3.5 h-3.5" /> Plantillas
        </button>
        {tpl && (
          <div className="absolute top-full right-3 mt-1 w-60 bg-[var(--bone-2)] border border-[var(--line)] rounded-xl shadow-xl p-1.5 z-20">
            <p className="px-2 py-1 text-[10px] text-[var(--ink-soft)]">Reemplaza las secciones (puedes deshacer)</p>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { applyTemplate(t.build()); setTpl(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--bone-3)] transition-colors">
                <span className="block text-sm font-semibold text-[var(--ink)]">{t.name}</span>
                <span className="block text-[11px] text-[var(--ink-soft)] leading-snug">{t.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <Reorder.Group axis="y" values={sections} onReorder={setOrder} className="space-y-1">
          {sections.map(s => (
            <SectionItem key={s.id} section={s}
              selected={selectedId === s.id}
              removable={SECTION_META[s.type].addable}
              onSelect={() => selectSection(s.id)}
              onToggle={() => toggleSection(s.id)}
              onRemove={() => removeSection(s.id)} />
          ))}
        </Reorder.Group>
      </div>

      <div className="p-3 border-t border-[var(--line)] relative shrink-0">
        <button onClick={() => setMenu(m => !m)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
          <Plus className="w-4 h-4" /> Agregar sección
        </button>
        {menu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[var(--bone-2)] border border-[var(--line)] rounded-xl shadow-xl p-1.5 max-h-72 overflow-y-auto z-10">
            {addable.map(t => {
              const M = SECTION_META[t];
              return (
                <button key={t} onClick={() => { addSection(t); setMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--ink)] hover:bg-[var(--bone-3)] transition-colors text-left">
                  <M.icon className="w-4 h-4 text-[var(--primary)] shrink-0" /> {M.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
