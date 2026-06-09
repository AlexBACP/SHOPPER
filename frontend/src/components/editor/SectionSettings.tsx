'use client';
// Drawer derecho con los ajustes de la sección seleccionada.
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/editor.store';
import ImageUploader from '@/components/ui/ImageUploader';
import { SECTION_META } from './section-meta';
import {
  TextField, TextareaField, ToggleField, SelectField, RangeField, ColorField, ImageField,
} from './fields';
import type {
  StoreTheme,
  HeroSettings, FeaturedProductsSettings, ProductGridSettings,
  AboutSettings, AnnouncementSettings, ContactSettings, FooterSettings,
  TestimonialsSettings, FaqSettings, GallerySettings, VideoSettings,
  TestimonialItem, FaqItem,
} from '@/types';

export default function SectionSettings() {
  const current        = useEditorStore(s => s.current);
  const selectedId     = useEditorStore(s => s.selectedSectionId);
  const updateSettings = useEditorStore(s => s.updateSettings);
  const updateThemeMeta= useEditorStore(s => s.updateThemeMeta);
  const selectSection  = useEditorStore(s => s.selectSection);

  const section = current.sections?.find(s => s.id === selectedId) ?? null;
  const meta    = section ? SECTION_META[section.type] : null;

  const set = (patch: Record<string, unknown>) => section && updateSettings(section.id, patch);
  const setTheme = (patch: Partial<StoreTheme>) => updateThemeMeta(patch);

  return (
    <AnimatePresence>
      {section && meta && (
        <motion.aside
          initial={{ x: 340, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 340, opacity: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
          className="absolute top-0 right-0 h-full w-[340px] bg-[var(--bone-2)] border-l border-[var(--line)] shadow-2xl z-20 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] shrink-0">
            <div className="flex items-center gap-2">
              <meta.icon className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-bold text-sm text-[var(--ink)]">{meta.label}</h3>
            </div>
            <button onClick={() => selectSection(null)} aria-label="Cerrar ajustes"
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(() => {
              switch (section.type) {
                case 'header': {
                  const t = current;
                  return <>
                    <p className="text-xs text-[var(--ink-soft)]">Identidad visible en el encabezado de tu tienda.</p>
                    <ColorField label="Color de marca" value={t.accent ?? '#c75a2b'} onChange={v => setTheme({ accent: v })} />
                    <ImageField label="Banner / portada" value={t.banner ?? ''} onChange={v => setTheme({ banner: v || undefined })} folder="stores" />
                    <TextField label="Mensaje destacado" value={t.tagline ?? ''} onChange={v => setTheme({ tagline: v || undefined })} maxLength={80} placeholder="Ej. Envío gratis esta semana" />
                    <TextField label="WhatsApp" value={t.whatsapp ?? ''} onChange={v => setTheme({ whatsapp: v.replace(/[^\d]/g, '') || undefined })} placeholder="57 300 123 4567" />
                  </>;
                }
                case 'hero': {
                  const s = section.settings as HeroSettings;
                  return <>
                    <TextField label="Título" value={s.heading ?? ''} onChange={v => set({ heading: v })} placeholder="Bienvenido a mi tienda" />
                    <TextareaField label="Subtítulo" value={s.subheading ?? ''} onChange={v => set({ subheading: v })} placeholder="Frase de apoyo" />
                    <ImageField label="Imagen de fondo" value={s.image ?? ''} onChange={v => set({ image: v })} folder="stores" />
                    <RangeField label="Oscurecer fondo" value={s.overlay_opacity ?? 0.5} onChange={v => set({ overlay_opacity: v })} />
                    <SelectField label="Alineación" value={s.text_align ?? 'left'}
                      options={[{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]}
                      onChange={v => set({ text_align: v })} />
                    <SelectField label="Altura" value={s.height ?? 'md'}
                      options={[{ value: 'sm', label: 'Baja' }, { value: 'md', label: 'Media' }, { value: 'lg', label: 'Alta' }]}
                      onChange={v => set({ height: v })} />
                    <TextField label="Texto del botón" value={s.cta_text ?? ''} onChange={v => set({ cta_text: v })} placeholder="Ver productos" />
                    <TextField label="Enlace del botón" value={s.cta_link ?? ''} onChange={v => set({ cta_link: v })} placeholder="#" />
                  </>;
                }
                case 'featured_products': {
                  const s = section.settings as FeaturedProductsSettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="Destacados" />
                    <SelectField label="Columnas" value={s.columns ?? 4}
                      options={[{ value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' }]}
                      onChange={v => set({ columns: v })} />
                    <ToggleField label="Mostrar precio" value={s.show_price !== false} onChange={v => set({ show_price: v })} />
                    <ToggleField label="Botón Agregar" value={s.show_add_to_cart !== false} onChange={v => set({ show_add_to_cart: v })} />
                    <p className="text-[11px] text-[var(--ink-soft)]">Por ahora muestra tus primeros productos. El selector manual llega en una próxima fase.</p>
                  </>;
                }
                case 'product_grid': {
                  const s = section.settings as ProductGridSettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="(opcional)" />
                    <ToggleField label="Mostrar buscador" value={s.show_search !== false} onChange={v => set({ show_search: v })} />
                  </>;
                }
                case 'about': {
                  const s = section.settings as AboutSettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="Sobre la tienda" />
                    <TextareaField label="Texto" value={s.body ?? ''} onChange={v => set({ body: v })} rows={5} placeholder="Cuenta la historia de tu marca…" />
                  </>;
                }
                case 'testimonials': {
                  const s = section.settings as TestimonialsSettings;
                  const items = s.items ?? [];
                  const upd = (i: number, patch: Partial<TestimonialItem>) => set({ items: items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="Lo que dicen" />
                    {items.map((it, i) => (
                      <div key={i} className="relative border border-[var(--line)] rounded-lg p-3 space-y-2">
                        <button onClick={() => set({ items: items.filter((_, idx) => idx !== i) })} aria-label="Eliminar testimonio"
                          className="absolute top-2 right-2 text-[var(--ink-soft)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        <TextField label="Nombre" value={it.name} onChange={v => upd(i, { name: v })} placeholder="Ana M." />
                        <TextareaField label="Comentario" value={it.text} onChange={v => upd(i, { text: v })} rows={2} placeholder="Excelente atención…" />
                        <SelectField label="Estrellas" value={it.rating ?? 5}
                          options={[5, 4, 3, 2, 1].map(n => ({ value: n, label: `${n} ★` }))}
                          onChange={v => upd(i, { rating: v })} />
                      </div>
                    ))}
                    <button onClick={() => set({ items: [...items, { name: '', text: '', rating: 5 }] })}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[var(--line)] rounded-lg text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                      <Plus className="w-3.5 h-3.5" /> Agregar testimonio
                    </button>
                  </>;
                }
                case 'faq': {
                  const s = section.settings as FaqSettings;
                  const items = s.items ?? [];
                  const upd = (i: number, patch: Partial<FaqItem>) => set({ items: items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="Preguntas frecuentes" />
                    {items.map((it, i) => (
                      <div key={i} className="relative border border-[var(--line)] rounded-lg p-3 space-y-2">
                        <button onClick={() => set({ items: items.filter((_, idx) => idx !== i) })} aria-label="Eliminar pregunta"
                          className="absolute top-2 right-2 text-[var(--ink-soft)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        <TextField label="Pregunta" value={it.q} onChange={v => upd(i, { q: v })} placeholder="¿Hacen envíos nacionales?" />
                        <TextareaField label="Respuesta" value={it.a} onChange={v => upd(i, { a: v })} rows={2} placeholder="Sí, a todo el país…" />
                      </div>
                    ))}
                    <button onClick={() => set({ items: [...items, { q: '', a: '' }] })}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[var(--line)] rounded-lg text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                      <Plus className="w-3.5 h-3.5" /> Agregar pregunta
                    </button>
                  </>;
                }
                case 'gallery': {
                  const s = section.settings as GallerySettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="(opcional)" />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1.5">Imágenes</span>
                      <ImageUploader folder="stores" multiple value={s.images ?? []} onChange={(urls) => set({ images: urls })} />
                    </div>
                  </>;
                }
                case 'video': {
                  const s = section.settings as VideoSettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="(opcional)" />
                    <TextField label="Enlace YouTube/Vimeo" value={s.url ?? ''} onChange={v => set({ url: v })} placeholder="https://youtube.com/watch?v=…" />
                  </>;
                }
                case 'announcement': {
                  const s = section.settings as AnnouncementSettings;
                  return <>
                    <TextField label="Texto del anuncio" value={s.text ?? ''} onChange={v => set({ text: v })} placeholder="Envío gratis sobre $150.000" />
                    <TextField label="Enlace (opcional)" value={s.link ?? ''} onChange={v => set({ link: v })} placeholder="#" />
                  </>;
                }
                case 'contact': {
                  const s = section.settings as ContactSettings;
                  return <>
                    <TextField label="Título" value={s.title ?? ''} onChange={v => set({ title: v })} placeholder="Contáctanos" />
                    <TextField label="WhatsApp" value={s.whatsapp ?? ''} onChange={v => set({ whatsapp: v })} placeholder="57 300 123 4567" />
                    <TextField label="Email" value={s.email ?? ''} onChange={v => set({ email: v })} placeholder="hola@mitienda.co" />
                  </>;
                }
                case 'footer': {
                  const s = section.settings as FooterSettings;
                  return <ToggleField label="Mostrar 'Volver al inicio'" value={s.show_back_link !== false} onChange={v => set({ show_back_link: v })} />;
                }
                default:
                  return <p className="text-sm text-[var(--ink-soft)]">Esta sección aún no tiene ajustes.</p>;
              }
            })()}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
