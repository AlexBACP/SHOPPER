export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'owner' | 'buyer';
}

// ── Secciones del editor visual de tienda (theme v2) ──────────
export type SectionType =
  | 'announcement'      // barra superior
  | 'header'            // logo + nav + (legacy: banner/hero/tabs)
  | 'hero'              // banner principal
  | 'featured_products' // grid de productos destacados
  | 'product_grid'      // todo el catálogo
  | 'about'             // texto sobre la tienda
  | 'testimonials'      // reseñas
  | 'faq'               // preguntas frecuentes
  | 'gallery'           // mosaico de imágenes
  | 'video'             // embed YouTube/Vimeo
  | 'contact'           // CTA WhatsApp/email
  | 'footer';

// Settings por tipo de sección (tipado estricto, sin `any`)
export interface AnnouncementSettings { text?: string; link?: string }
export interface HeaderSettings       { show_search?: boolean; sticky?: boolean }
export interface HeroSettings {
  heading?: string; subheading?: string; cta_text?: string; cta_link?: string;
  image?: string; overlay_opacity?: number;
  text_align?: 'left' | 'center' | 'right'; height?: 'sm' | 'md' | 'lg';
}
export interface FeaturedProductsSettings {
  title?: string; product_ids?: string[]; columns?: 2 | 3 | 4 | 5;
  show_price?: boolean; show_add_to_cart?: boolean;
}
export interface ProductGridSettings  { title?: string; show_search?: boolean; columns?: 2 | 3 | 4 | 5 }
export interface AboutSettings        { title?: string; body?: string }
export interface TestimonialItem      { name: string; text: string; rating?: number }
export interface TestimonialsSettings { title?: string; items?: TestimonialItem[] }
export interface FaqItem              { q: string; a: string }
export interface FaqSettings          { title?: string; items?: FaqItem[] }
export interface GallerySettings      { title?: string; images?: string[] }
export interface VideoSettings        { title?: string; url?: string }
export interface ContactSettings      { title?: string; whatsapp?: string; email?: string }
export interface FooterSettings       { show_back_link?: boolean }

interface SectionCommon { id: string; enabled: boolean }

// Unión discriminada por `type` → cada sección conoce sus settings
export type StoreSection =
  | (SectionCommon & { type: 'announcement';      settings: AnnouncementSettings })
  | (SectionCommon & { type: 'header';            settings: HeaderSettings })
  | (SectionCommon & { type: 'hero';              settings: HeroSettings })
  | (SectionCommon & { type: 'featured_products'; settings: FeaturedProductsSettings })
  | (SectionCommon & { type: 'product_grid';      settings: ProductGridSettings })
  | (SectionCommon & { type: 'about';             settings: AboutSettings })
  | (SectionCommon & { type: 'testimonials';      settings: TestimonialsSettings })
  | (SectionCommon & { type: 'faq';               settings: FaqSettings })
  | (SectionCommon & { type: 'gallery';           settings: GallerySettings })
  | (SectionCommon & { type: 'video';             settings: VideoSettings })
  | (SectionCommon & { type: 'contact';           settings: ContactSettings })
  | (SectionCommon & { type: 'footer';            settings: FooterSettings });

export interface StoreTheme {
  // ── Legacy (mantener — retrocompatibilidad) ──────────────
  accent?: string;       // color de acento (hex), ej. "#c75a2b"
  banner?: string;       // URL de imagen de portada
  tagline?: string;      // mensaje/anuncio de la tienda
  whatsapp?: string;     // WhatsApp de contacto (solo dígitos, con indicativo país)
  layout?: 'grid' | 'list';

  // ── Editor visual v2 ─────────────────────────────────────
  version?: 2;
  typography?: {
    display?: 'bricolage' | 'instrument' | 'system';
    body?:    'hanken' | 'system';
  };
  palette?: { accent: string; bg?: string; text?: string };
  sections?: StoreSection[];   // el orden importa
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  theme?: StoreTheme;
  is_published: boolean;
}

export interface Variant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface Product {
  _id: string;
  store_id: string;
  title: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  variants: Variant[];
  attributes: Record<string, any>;
  is_active: boolean;
}