'use client';
import { memo } from 'react';
import type { StoreSection } from '@/types';
import HeaderSection           from './HeaderSection';
import AnnouncementSection     from './AnnouncementSection';
import HeroSection             from './HeroSection';
import FeaturedProductsSection from './FeaturedProductsSection';
import ProductGridSection      from './ProductGridSection';
import AboutSection            from './AboutSection';
import TestimonialsSection     from './TestimonialsSection';
import FaqSection              from './FaqSection';
import GallerySection          from './GallerySection';
import VideoSection            from './VideoSection';
import ContactSection          from './ContactSection';
import FooterSection           from './FooterSection';

// Despacha cada sección a su componente. Memoizado: solo re-renderiza si
// cambia el objeto `section` (las secciones vienen memoizadas en StoreClient),
// pero los consumidores siguen reaccionando al contexto del escaparate.
function SectionRendererBase({ section }: { section: StoreSection }) {
  switch (section.type) {
    case 'header':            return <HeaderSection />;
    case 'announcement':      return <AnnouncementSection     settings={section.settings} />;
    case 'hero':              return <HeroSection             settings={section.settings} />;
    case 'featured_products': return <FeaturedProductsSection settings={section.settings} />;
    case 'product_grid':      return <ProductGridSection      settings={section.settings} />;
    case 'about':             return <AboutSection            settings={section.settings} />;
    case 'testimonials':      return <TestimonialsSection     settings={section.settings} />;
    case 'faq':               return <FaqSection              settings={section.settings} />;
    case 'gallery':           return <GallerySection          settings={section.settings} />;
    case 'video':             return <VideoSection            settings={section.settings} />;
    case 'contact':           return <ContactSection          settings={section.settings} />;
    case 'footer':            return <FooterSection           settings={section.settings} />;
    default:                  return null;
  }
}

const SectionRenderer = memo(SectionRendererBase);
export default SectionRenderer;
