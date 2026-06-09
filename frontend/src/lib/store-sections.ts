// ─────────────────────────────────────────────────────────────
//  Utilidades del modelo de secciones del editor visual.
//   - SECTION_DEFAULTS: settings iniciales al "Agregar sección".
//   - defaultSectionsFromLegacy: convierte un theme legacy (sin v2)
//     en el array de secciones equivalente para render uniforme.
//   - agrupación top/body/bottom + selección por pestaña (legacy).
// ─────────────────────────────────────────────────────────────
import type {
  StoreSection, SectionType,
  AnnouncementSettings, HeaderSettings, HeroSettings, FeaturedProductsSettings,
  ProductGridSettings, AboutSettings, TestimonialsSettings, FaqSettings,
  GallerySettings, VideoSettings, ContactSettings, FooterSettings,
} from '@/types';

// Settings por defecto para cada tipo (usado al insertar secciones nuevas)
export const SECTION_DEFAULTS: {
  announcement: AnnouncementSettings; header: HeaderSettings; hero: HeroSettings;
  featured_products: FeaturedProductsSettings; product_grid: ProductGridSettings;
  about: AboutSettings; testimonials: TestimonialsSettings; faq: FaqSettings;
  gallery: GallerySettings; video: VideoSettings; contact: ContactSettings; footer: FooterSettings;
} = {
  announcement:      { text: '' },
  header:            { show_search: true, sticky: false },
  hero:              { heading: '', text_align: 'left', height: 'md', overlay_opacity: 0.5 },
  featured_products: { title: 'Destacados', product_ids: [], columns: 4, show_price: true, show_add_to_cart: true },
  product_grid:      { title: '', show_search: true, columns: 4 },
  about:             { title: '' },
  testimonials:      { title: 'Lo que dicen', items: [] },
  faq:               { title: 'Preguntas frecuentes', items: [] },
  gallery:           { title: '', images: [] },
  video:             { title: '', url: '' },
  contact:           { title: 'Contáctanos' },
  footer:            { show_back_link: true },
};

/**
 * Convierte una tienda con theme legacy (sin `version: 2`) en el conjunto
 * de secciones equivalente a lo que renderiza hoy: header + catálogo +
 * información + footer. Mantiene la presentación idéntica (regresión cero).
 */
export function defaultSectionsFromLegacy(): StoreSection[] {
  return [
    { id: 'legacy-header',  type: 'header',       enabled: true, settings: { show_search: true } },
    { id: 'legacy-grid',    type: 'product_grid', enabled: true, settings: { show_search: true } },
    { id: 'legacy-about',   type: 'about',        enabled: true, settings: {} },
    { id: 'legacy-footer',  type: 'footer',       enabled: true, settings: { show_back_link: true } },
  ];
}

// ── Agrupación por zona de layout ─────────────────────────────
const TOP_TYPES    = new Set<SectionType>(['announcement', 'header', 'hero']);
const BOTTOM_TYPES = new Set<SectionType>(['contact', 'footer']);

export const isTopSection    = (t: SectionType) => TOP_TYPES.has(t);
export const isBottomSection = (t: SectionType) => BOTTOM_TYPES.has(t);
export const isBodySection   = (t: SectionType) => !TOP_TYPES.has(t) && !BOTTOM_TYPES.has(t);

/**
 * En modo legacy (con pestañas) decide qué sección del cuerpo está activa
 * según la pestaña seleccionada. En modo v2 (scroll) todas se muestran.
 */
export function isActiveForTab(type: SectionType, tab: 'productos' | 'info', useTabs: boolean): boolean {
  if (!useTabs) return true;
  if (tab === 'productos') return type === 'product_grid' || type === 'featured_products';
  return type === 'about' || type === 'testimonials' || type === 'faq';
}

// ── Plantillas pre-armadas ────────────────────────────────────
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

function section<T extends SectionType>(type: T, overrides: Partial<StoreSection['settings']> = {}): StoreSection {
  return { id: newId(), type, enabled: true, settings: { ...SECTION_DEFAULTS[type], ...overrides } } as StoreSection;
}

export interface StoreTemplate {
  id:          string;
  name:        string;
  description: string;
  build:       () => StoreSection[];   // ids frescos en cada uso
}

export const TEMPLATES: StoreTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Encabezado, catálogo y pie. Directo al grano.',
    build: () => [
      section('header'),
      section('product_grid', { title: '' }),
      section('footer'),
    ],
  },
  {
    id: 'colorido',
    name: 'Colorido',
    description: 'Anuncio, hero, destacados, galería y contacto.',
    build: () => [
      section('announcement', { text: '✨ Envío gratis en pedidos sobre $150.000' }),
      section('header'),
      section('hero', { heading: 'Bienvenido a nuestra tienda', subheading: 'Productos hechos en Colombia', cta_text: 'Ver productos', cta_link: '#', height: 'lg', text_align: 'center' }),
      section('featured_products', { title: 'Lo más vendido' }),
      section('gallery', { title: 'Nuestra galería' }),
      section('contact', { title: '¿Hablamos?' }),
      section('footer'),
    ],
  },
  {
    id: 'tradicional',
    name: 'Tradicional',
    description: 'Hero, catálogo, sobre la tienda y preguntas frecuentes.',
    build: () => [
      section('header'),
      section('hero', { heading: 'Nuestra tienda', height: 'md', text_align: 'left' }),
      section('product_grid', { title: 'Catálogo' }),
      section('about', { title: 'Sobre nosotros' }),
      section('faq', { title: 'Preguntas frecuentes' }),
      section('footer'),
    ],
  },
];
