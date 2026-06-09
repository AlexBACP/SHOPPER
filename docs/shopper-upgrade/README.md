# Shopper UI/UX Upgrade Pack

**Mejoras de diseño senior para Shopper** — respeta 100% la paleta "Mercado Editorial"
(terracota + hueso + verde selva + tinta cálida). Todo usa CSS variables existentes —
no se hardcodean colores.

Hecho por: Marlon David Aguirre Olivero — Ficha SENA 3066612 — ADSO 2026
Instructor: Andrés Mauricio González Castañeda

---

## 📦 Qué incluye

```
shopper-upgrade/
├── components/
│   ├── animated/
│   │   ├── ParallaxHero.tsx          → Hero editorial con parallax scroll
│   │   ├── ParallaxSection.tsx       → Wrapper parallax para cualquier sección
│   │   ├── AnimatedProductCard.tsx   → Tarjeta producto con micro-interacciones
│   │   ├── MagneticButton.tsx        → Botón magnético (sigue cursor)
│   │   ├── ScrollProgress.tsx        → Barra de progreso de scroll
│   │   ├── AnimatedNumber.tsx        → Contador animado para stats
│   │   ├── MarqueeCategorias.tsx     → Marquee infinito de categorías
│   │   ├── TiltCard.tsx              → Efecto 3D tilt en hover
│   │   └── ShimmerSkeleton.tsx       → Loaders cálidos (no grises genéricos)
│   ├── uploaders/
│   │   └── ExcelProductUploader.tsx  → Carga masiva de productos vía Excel
│   └── invoice/
│       ├── InvoiceDIAN.ts            → Generador PDF factura DIAN
│       └── BotonFacturaDIAN.tsx      → Botón listo para usar
├── data/
│   └── productImages.ts              → Catálogo de imágenes reales por categoría
└── hooks/
    └── useParallax.ts                → Hook genérico de parallax
```

---

## 🚀 Instalación (en tu proyecto Shopper)

### 1) Dependencias

```bash
# Framer Motion ya lo tienes. Solo estos nuevos:
npm install xlsx jspdf jspdf-autotable qrcode

# Tipos
npm install -D @types/qrcode
```

### 2) Copiar archivos

Pega cada carpeta dentro de tu `src/`:

```
src/components/animated/   ← componentes animados
src/components/uploaders/  ← Excel uploader
src/components/invoice/    ← factura DIAN
src/data/                  ← imágenes reales
src/hooks/                 ← hooks nuevos (junto a useScrollAnimations.ts)
```

---

## 🎨 Integración paso a paso

### A. Hero con parallax (reemplaza el actual)

En `src/app/HomeClient.tsx`, arriba del componente, reemplaza tu hero por:

```tsx
import ParallaxHero from '@/components/animated/ParallaxHero';
import ScrollProgress from '@/components/animated/ScrollProgress';
import MarqueeCategorias from '@/components/animated/MarqueeCategorias';

export default function HomeClient(...) {
  return (
    <>
      <ScrollProgress />
      <ParallaxHero
        title={'Descubre Colombia\nhecha a mano'}
        subtitle="Cientos de tiendas pequeñas, miles de historias..."
      />
      <MarqueeCategorias speed={28} />
      {/* ...resto del home */}
    </>
  );
}
```

### B. Reemplazar las tarjetas de producto

Donde tengas el grid actual:

```tsx
import AnimatedProductCard from '@/components/animated/AnimatedProductCard';
import { useCartStore } from '@/store/cart.store';

{productos.map((p) => (
  <AnimatedProductCard
    key={p._id}
    id={p._id}
    title={p.title}
    price={p.price}
    compareAtPrice={p.compare_at_price}
    image={p.images?.[0] ?? getProductImage(p.category)}
    storeName={p.nombreTienda}
    storeSlug={p.slugTienda}
    storeId={p.idTienda}
    sku={p.sku}
    stock={p.stock}
    onAddToCart={() => addItem({ ... })}
  />
))}
```

### C. Imágenes reales para productos sin foto

En cualquier producto sin imagen, usa el dataset curado:

```tsx
import { getProductImage, FALLBACK_PRODUCT_IMAGE } from '@/data/productImages';

const imagen = producto.images?.[0]
  ?? getProductImage(producto.category)
  ?? FALLBACK_PRODUCT_IMAGE;
```

### D. Carga masiva por Excel (owner)

En `src/app/owner/products/page.tsx`, añade una pestaña / botón "Carga masiva":

```tsx
import ExcelProductUploader from '@/components/uploaders/ExcelProductUploader';

<ExcelProductUploader
  storeId={tiendaSeleccionada.id}
  onSuccess={() => recargarProductos()}
/>
```

El usuario podrá:
1. Descargar una plantilla pre-llenada
2. Arrastrar su Excel
3. Ver preview con validación de errores
4. Crear todo el lote en un clic

**Formato del Excel** (encabezados en español, en cualquier orden):
`titulo | descripcion | categoria | precio | stock | sku | imagen`

### E. Factura DIAN en página de pedido

En `src/app/orders/[id]/page.tsx`:

```tsx
import BotonFacturaDIAN from '@/components/invoice/BotonFacturaDIAN';

<BotonFacturaDIAN
  pedido={order}
  override={{
    seller: {
      name:    order.store.name,
      nit:     '900.123.456-7',
      address: order.store.address,
      city:    order.store.city,
      regime:  'Común',
    },
  }}
/>
```

El PDF se genera **100% en el cliente** — no requiere conexión al backend ni servicios externos.
Incluye: numeración consecutiva, IVA 19% por item, QR DIAN, CUFE simulado, totales.

> ⚠️ Académico — el PDF no está firmado digitalmente. Para uso real con DIAN
> necesitas un Proveedor Tecnológico autorizado (Carvajal, Facture, Olimpia, etc.)

---

## 🌟 Highlights de animaciones

| Componente              | Tipo de animación |
|-------------------------|-------------------|
| `ParallaxHero`          | 3 capas a distinta velocidad + scroll, fade-out al salir |
| `ParallaxSection`       | Wrapper genérico, configurable |
| `AnimatedProductCard`   | Lift + zoom + reveal acciones + spring del CTA |
| `MagneticButton`        | Sigue el cursor con spring physics |
| `ScrollProgress`        | Barra terracota en el tope |
| `AnimatedNumber`        | Counter spring desde 0 al entrar al viewport |
| `MarqueeCategorias`     | Loop infinito linear, pausa en hover |
| `TiltCard`              | Inclinación 3D con perspective |
| `ShimmerSkeleton`       | Loader cálido (no gris) |

**Todas respetan `prefers-reduced-motion`** — accesibilidad por defecto.

---

## 🧪 Smoke test (formato SENA)

Para tu próxima entrega académica, los puntos a verificar:

- [ ] Hero carga con parallax visible al hacer scroll
- [ ] Las tarjetas de producto hacen "lift" al pasar el mouse
- [ ] El marquee de categorías se mueve continuamente
- [ ] El botón de carrito tiene spring al hacer clic
- [ ] La carga de Excel acepta drag & drop
- [ ] La preview del Excel marca filas inválidas en rojo
- [ ] La factura PDF se descarga con QR y CUFE
- [ ] Todo es responsive a 375px (móvil) y 1440px (desktop)
- [ ] `prefers-reduced-motion` desactiva animaciones de parallax

---

## 🔗 Componentes 21st.dev recomendados (opcional)

Si conectas el MCP Magic, estos son los componentes que mejor encajan con
la estética Mercado Editorial:

1. **Aurora Background** — para landing alterna (oscuro premium)
2. **Bento Grid** — para "Categorías" en home
3. **Sparkles** — para badges "Nuevo" o "Trending"
4. **Animated Testimonials** — para reseñas en la página de tienda
5. **Number Ticker** — alternativa a `AnimatedNumber`
6. **Hover Card** — para mini-preview de productos al pasar el mouse

Una vez tengas Magic conectado en Claude Code, simplemente di:
> *"Añade un Bento Grid de 21st.dev en la sección de categorías del home"*

Y Claude Code lo integrará respetando tu paleta.

---

## 📝 Notas finales

- Todos los componentes son **`'use client'`** porque usan hooks de Framer Motion
- Las animaciones nunca bloquean la interactividad (`pointer-events-none` en overlays)
- Las imágenes de Unsplash son libres para uso comercial
- El bundle suma ~45KB gz (jsPDF + qrcode + xlsx) — solo se cargan donde se usan

¿Dudas? Pregunta en Claude Code con:
> *"Cómo integro el ParallaxHero en mi HomeClient.tsx actual"*
