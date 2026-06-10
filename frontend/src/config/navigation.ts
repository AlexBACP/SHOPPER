// ── Categorías ────────────────────────────────────────────────────────
// Fuente única de categorías (slug + etiqueta). El filtro de /search usa
// el parámetro `category=<slug>`.
export const CATEGORIES = [
  { slug: 'moda',       label: 'Moda y Ropa'  },
  { slug: 'hogar',      label: 'Hogar y Deco' },
  { slug: 'tecnologia', label: 'Tecnología'   },
  { slug: 'artesanias', label: 'Artesanías'   },
  { slug: 'alimentos',  label: 'Alimentos'    },
  { slug: 'deportes',   label: 'Deportes'     },
  { slug: 'belleza',    label: 'Belleza'      },
  { slug: 'ninos',      label: 'Niños'        },
] as const;

// ── Links footer ──────────────────────────────────────────────────────
export const FOOTER_LINKS = {
  comprar: [
    { href: '/#tiendas',       label: 'Todas las tiendas' },
    { href: '/#como-funciona', label: 'Cómo funciona'     },
    { href: '/cart',           label: 'Mi carrito'        },
    { href: '/orders',         label: 'Mis pedidos'       },
    { href: '/wishlist',       label: 'Lista de deseos'   },
    { href: '/dashboard',      label: 'Mi cuenta'         },
  ],
  vender: [
    { href: '/auth/register',   label: 'Abrir mi tienda gratis' },
    { href: '/planes',          label: 'Planes y precios'       },
    { href: '/auth/login',      label: 'Iniciar sesión'         },
    { href: '/owner',           label: 'Panel vendedor'         },
    { href: '/owner/products',  label: 'Mis productos'          },
    { href: '/owner/orders',    label: 'Mis pedidos'            },
    { href: '/owner/analytics', label: 'Analíticas'             },
  ],
  legal: [
    { href: '/terms',                    label: 'Términos y condiciones',    external: false },
    { href: '/privacy',                  label: 'Política de privacidad',    external: false },
    { href: '/terms#envios',             label: 'Política de envíos',        external: false },
    { href: '/terms#devoluciones',       label: 'Devoluciones',              external: false },
    { href: 'mailto:soporte@shopper.co', label: 'Contacto',                  external: false },
    { href: 'https://www.sic.gov.co',    label: 'SIC — Defensa consumidor',  external: true  },
  ],
} as const;

// ── Métodos de pago mostrados en el footer ────────────────────────────
export const PAYMENT_METHODS = ['PSE', 'Nequi', 'Daviplata', 'Visa', 'Mastercard'] as const;
