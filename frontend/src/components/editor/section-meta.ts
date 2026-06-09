// Etiqueta + icono por tipo de sección (para el árbol y el menú "Agregar").
import {
  Megaphone, LayoutPanelTop, Image as ImageIcon, Star, Grid3x3,
  FileText, MessageSquareQuote, HelpCircle, Images, Video, Mail, PanelBottom,
} from 'lucide-react';
import type { SectionType } from '@/types';

export interface SectionMeta {
  label: string;
  icon: React.ElementType;
  /** Tipos que el usuario puede insertar manualmente desde "Agregar sección". */
  addable: boolean;
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  announcement:      { label: 'Anuncio',             icon: Megaphone,          addable: true  },
  header:            { label: 'Encabezado',          icon: LayoutPanelTop,     addable: false },
  hero:              { label: 'Hero / Banner',       icon: ImageIcon,          addable: true  },
  featured_products: { label: 'Productos destacados',icon: Star,               addable: true  },
  product_grid:      { label: 'Catálogo',            icon: Grid3x3,            addable: true  },
  about:             { label: 'Sobre la tienda',     icon: FileText,           addable: true  },
  testimonials:      { label: 'Testimonios',         icon: MessageSquareQuote, addable: true  },
  faq:               { label: 'Preguntas frecuentes',icon: HelpCircle,         addable: true  },
  gallery:           { label: 'Galería',             icon: Images,             addable: true  },
  video:             { label: 'Video',               icon: Video,              addable: true  },
  contact:           { label: 'Contacto',            icon: Mail,               addable: true  },
  footer:            { label: 'Pie de página',       icon: PanelBottom,        addable: false },
};
