'use client';
import Link from 'next/link';
import { Package, Star, Share2, CheckCircle, ShieldCheck, MessageCircle } from 'lucide-react';
import { useStorefront } from './StorefrontContext';

/**
 * Cabecera editorial de tienda: masthead + hero oscuro tipo portada de revista
 * con logo, nombre (display+serif italic), badges, descripción, stats row con
 * hairlines, y tabs Productos/Información en modo legacy.
 */
export default function HeaderSection() {
  const {
    tienda, productos, reputacion, waLink,
    tab, setTab, compartir, compartido, useTabs,
  } = useStorefront();
  const theme = tienda.theme ?? {};

  // Divide el nombre para mezclar display + serif italic
  const parts = tienda.name.trim().split(/\s+/);
  const nameMain = parts.slice(0, Math.max(1, parts.length - 1)).join(' ');
  const nameTail = parts.length > 1 ? parts[parts.length - 1] : '';

  return (
    <>
      {/* Breadcrumb editorial */}
      <nav className="eds-crumb" aria-label="Migas de pan">
        <div className="eds-crumb-inner">
          <Link href="/">Inicio</Link>
          <span className="sep">/</span>
          <Link href="/search">Tiendas</Link>
          <span className="sep">/</span>
          <span className="here">{tienda.name}</span>
        </div>
      </nav>

      {/* Hero oscuro editorial */}
      <header className="eds-hero">
        {theme.banner && (
          <div className="eds-hero-banner" aria-hidden>
            <img src={theme.banner} alt="" />
          </div>
        )}

        <div className="eds-hero-inner">
          {/* Cuerpo del hero */}
          <div className="eds-hero-body">
            <div className="eds-logo">
              {tienda.logo_url
                ? <img src={tienda.logo_url} alt={tienda.name} />
                : <span className="fallback">{tienda.name[0]?.toUpperCase()}</span>}
            </div>

            <div className="eds-id">
              {theme.tagline && (
                <span className="eds-id-tag">{theme.tagline}</span>
              )}

              <h1 className="eds-name">
                {nameMain}{nameTail && <> <span className="it">{nameTail}</span></>}
              </h1>

              <div className="eds-badges">
                <span className="eds-badge verified">
                  <ShieldCheck className="w-3 h-3" /> Verificada
                </span>
                <span className="eds-badge col">
                  Hecho en Colombia
                </span>
              </div>

              {tienda.description && <p className="eds-desc">{tienda.description}</p>}

              <div className="eds-stats">
                <div className="eds-stat">
                  <div className="v">{productos.length}</div>
                  <div className="l">Productos</div>
                </div>
                {reputacion && reputacion.total > 0 ? (
                  <>
                    <div className="eds-stat">
                      <div className="v">
                        <Star className="w-4 h-4 star" fill="currentColor" strokeWidth={0} />
                        {reputacion.promedio.toFixed(1)}
                      </div>
                      <div className="l">Calificación</div>
                    </div>
                    <div className="eds-stat">
                      <div className="v">{reputacion.total}</div>
                      <div className="l">Reseña{reputacion.total !== 1 ? 's' : ''}</div>
                    </div>
                  </>
                ) : (
                  <div className="eds-stat">
                    <div className="v">
                      <Star className="w-4 h-4 star" fill="currentColor" strokeWidth={0} />
                      —
                    </div>
                    <div className="l">Tienda activa</div>
                  </div>
                )}
              </div>
            </div>

            <div className="eds-actions">
              <button type="button" onClick={compartir} className="eds-act" aria-label="Compartir tienda">
                {compartido ? (
                  <><CheckCircle className="w-4 h-4" /> ¡Copiado!</>
                ) : (
                  <><Share2 className="w-4 h-4" /> Compartir</>
                )}
              </button>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="eds-act wa">
                  <MessageCircle className="w-4 h-4" /> Contactar
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs (solo modo legacy) */}
        {useTabs && (
          <div className="eds-tabs" role="tablist" aria-label="Secciones de la tienda">
            {[
              { id: 'productos' as const, label: `Productos · ${productos.length}` },
              { id: 'info'      as const, label: 'Información' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
