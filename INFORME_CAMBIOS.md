# Informe de cambios — SHOPPER (Bloques 1–6)

Fecha: 2026-05-24

---

## Bloque 1–2: Checkout unificado + endpoint correcto

**Qué cambió:**
Antes el checkout intentaba leer el carrito desde Redis (una implementación a medias que nunca
funcionó del todo). Ahora el frontend envía los productos directamente en el body del POST, y el
backend los procesa de forma autónoma sin depender de ningún estado externo.

**Archivos modificados:**
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/dto/create-order.dto.ts`
- `backend/src/orders/order.interface.ts`

**Cómo probarlo:**
1. Inicia sesión como comprador.
2. Agrega 2–3 productos al carrito desde cualquier página.
3. Ve a `/checkout` y completa el formulario de envío.
4. Haz clic en "Confirmar pedido" → deberías ver la pantalla de éxito con número de orden.
5. Verificación en BD: `SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;`

---

## Bloque 3–4: Propiedad de órdenes + cambio de estado

**Qué cambió:**
Solo el dueño autenticado de una tienda puede ver sus propias órdenes. Cualquier otro usuario
recibe `403 Forbidden`. Desde el panel de owner ahora se puede cambiar el estado de un pedido
(pendiente → en proceso → enviado → entregado) directamente en la tabla, sin recargar la página.

**Archivos modificados:**
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `frontend/src/app/owner/orders/page.tsx`

**Cómo probarlo:**
1. Inicia sesión como **owner** de una tienda.
2. Ve a `/owner/orders` → deberías ver solo los pedidos de tu tienda.
3. Intenta acceder con un usuario diferente → debe responder `403 Forbidden`.
4. En la tabla de pedidos, cambia el estado con el selector inline → el cambio persiste sin recargar.

---

## Bloque 5: Seguridad en cupones

**Qué cambió:**
El endpoint `POST /coupons/validate` ahora exige sesión activa (JWT). Antes era público y cualquiera
podía consultar o abusar cupones sin autenticarse. Además, si un cupón vence en la ventana de tiempo
entre que se aplica en el carrito y se confirma el pago, el sistema lo detecta y muestra un aviso
claro sin cancelar el pedido.

**Archivos modificados:**
- `backend/src/coupons/coupons.controller.ts` — añadido `@UseGuards(JwtAuthGuard)`
- `frontend/src/store/cart.store.ts` — manejo de error 401 con mensaje específico
- `frontend/src/app/checkout/page.tsx` — toast si `coupon_applied === false`

**Cómo probarlo:**

*Escenario A — sin sesión activa:*
1. Cierra sesión en la app.
2. Ve al carrito e intenta aplicar un cupón.
3. Resultado esperado: mensaje *"Debes iniciar sesión para aplicar cupones"*.

*Escenario B — cupón que vence entre carrito y checkout:*
1. Aplica un cupón válido en el carrito (con sesión activa).
2. Antes de confirmar, en la BD invalida el cupón:
   ```sql
   UPDATE coupons SET expires_at = NOW() - interval '1 second' WHERE code = 'TU_CUPON';
   ```
3. Confirma el pedido → aparece un toast amarillo explicando que el cupón ya no es válido.
4. El pedido sí se crea, pero sin descuento aplicado.

---

## Bloque 6: Campo category + filtros de búsqueda

**Qué cambió:**
Los productos ahora tienen un campo `category` en MongoDB con slugs predefinidos. La API de búsqueda
acepta `?category=slug` y filtra exacto por ese campo. La página de búsqueda muestra chips de
categorías seleccionables. Los links de categorías del homepage apuntan a `?category=slug` en lugar
del antiguo `?q=texto` que hacía búsqueda libre (imprecisa).

**Categorías disponibles:**
`tecnologia` | `moda` | `hogar` | `artesanias` | `alimentos` | `deportes` | `belleza` | `ninos`

**Archivos modificados:**
- `backend/src/products/product.interface.ts` — campo `category?`
- `backend/src/products/dto/create-product.dto.ts` — validación opcional `@IsString()`
- `backend/src/search/search.controller.ts` — parámetro `?category` + filtro MongoDB
- `backend/seed.js` — patch automático de productos existentes por prefijo de SKU
- `frontend/src/app/search/page.tsx` — chips de categorías + URL reactiva
- `frontend/src/app/page.tsx` — hrefs del hero actualizados

**Cómo probarlo:**
1. En el homepage, haz clic en la tarjeta "Moda" del hero.
2. Llegas a `/search?category=moda` con el chip "Moda y Ropa" resaltado.
3. Los resultados son solo productos con `category: "moda"` en MongoDB.
4. Haz clic en el chip activo → se desactiva y muestra todos los productos.
5. Combina filtros: `/search?q=camiseta&category=moda`.
6. Para poblar categorías en productos existentes: `node backend/seed.js`

---

## Bonus: Homepage redesign + popup de vendedor

**Qué cambió:**
Carruseles horizontales con animaciones de entrada. Cada tarjeta muestra precio tachado y badge de
porcentaje de descuento cuando `compare_at_price > price`. Un badge con el logo de la tienda aparece
en la parte inferior de la imagen del producto. Al hacer hover muestra un popup flotante con
descripción de la tienda y link directo. El popup se renderiza con `createPortal` fuera del DOM del
scroll, así nunca queda cortado por `overflow: hidden`.

**Archivos modificados:**
- `frontend/src/app/page.tsx` — carruseles, badge, estados del popup, portal

**Cómo probarlo:**
1. En el homepage, pasa el mouse sobre el badge de tienda (pie de la imagen del producto).
2. Aparece popup con nombre, descripción y botón "Ver tienda completa".
3. Mueve el mouse del badge al popup sin cerrar → sigue abierto (130ms de gracia).
4. Cerca del borde superior del viewport el popup sale hacia abajo; más abajo sale hacia arriba.
5. Tarjetas con descuento muestran precio original tachado y badge rojo con "−XX%".

---

## Estado del plan de desarrollo

| # | Feature                              | Estado |
|---|--------------------------------------|--------|
| 1 | Checkout unificado (items en body)   | ✅     |
| 2 | Fix endpoint /orders/checkout        | ✅     |
| 3 | Ownership en GET /orders/store/:id   | ✅     |
| 4 | Owner cambia estado de orden         | ✅     |
| 5 | Cupones seguros (JWT + feedback)     | ✅     |
| 6 | Campo category + filtros búsqueda    | ✅     |
| 7 | Reseñas reales en tarjetas           | ⬜     |
| 8 | Guardar shipping_phone y dept en BD  | ⬜     |
| 9 | Fix webhook Wompi                    | ⬜     |
| 10| Soft delete en tiendas               | ⬜     |
