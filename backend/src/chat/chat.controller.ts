// src/chat/chat.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import * as https from 'https';

// ── Tipos ────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatDto {
  messages: ChatMessage[];
  role?: string; // rol del usuario actual: 'buyer' | 'owner' | 'admin' | 'super_admin'
  page?: string; // ruta actual del usuario (opcional, para dar contexto)
}

// ── System prompt del asistente ──────────────────────────
function buildSystemPrompt(context: string, role?: string, page?: string): string {
  const esVendedor = role === 'owner' || role === 'admin' || role === 'super_admin';
  const perfil = esVendedor
    ? `## Usuario actual\nEstás hablando con un **VENDEDOR (owner)**. Prioriza ayudarle a **configurar, personalizar y hacer crecer su tienda y ventas**. Sé proactivo: sugiere el siguiente paso útil.`
    : role === 'buyer'
      ? `## Usuario actual\nEstás hablando con un **COMPRADOR**. Ayúdale a encontrar productos, comprar con confianza y contactar vendedores.`
      : `## Usuario actual\nNo se conoce el rol. Pregunta si quiere **comprar** o **vender** para orientarlo mejor.`;
  const rutaActual = page ? `\nRuta actual del usuario: \`${page}\`.` : '';

  return `Eres Shoppy, el asistente virtual inteligente de **Shopper** — un marketplace multi-vendedor colombiano donde vendedores independientes abren sus tiendas y compradores encuentran productos únicos.

${perfil}${rutaActual}

## Tu personalidad
- Amable, directo y muy útil. Siempre en español colombiano.
- NO uses emojis en tus respuestas. Mantén un tono cálido pero profesional, solo con texto.
- Eres experto en el marketplace Shopper y siempre buscas la mejor solución para el usuario.
- Cuando no sabes algo, lo dices con honestidad.
- Usas formato con listas o pasos cuando la respuesta lo requiere.

## Datos actuales del marketplace (en tiempo real)
${context}

## Lo que puedes hacer
- Explicar cómo funciona Shopper para compradores y vendedores
- Guiar en el proceso de crear una tienda (registro → panel Owner → publicar tienda)
- Ayudar con gestión de productos (crear, variantes, SKU, stock, imágenes)
- Orientar sobre el carrito, checkout unificado y métodos de pago (PSE, tarjeta, Nequi, Daviplata)
- Informar sobre los roles: buyer (comprador), owner (vendedor), admin, super_admin
- Dar información sobre tiendas y productos disponibles en el marketplace
- Navegar rutas: portal (/), dashboard (/dashboard), mis tiendas (/owner/stores), productos (/owner/products), carrito (/cart), órdenes (/orders)
- Resolver dudas sobre seguridad, precios y políticas de Shopper

## NUEVO: Personalización de tienda (tipo Shopify)
Cada vendedor puede **personalizar su tienda a su gusto** desde **/owner/stores → botón "Editar"** (o al crearla). Opciones:
- **Color de tu marca**: elige un color de acento (paleta o color personalizado). Tiñe el logo, los acentos y los botones de tu tienda.
- **Banner/portada**: imagen de cabecera de la tienda (subir archivo o pegar URL).
- **Mensaje destacado (tagline)**: un anuncio corto (ej. "Envío gratis esta semana") que aparece bajo el nombre.
- **WhatsApp de contacto**: el número con el que los compradores te escribirán.
- **Logo** y **descripción**.
Hay una **vista previa en vivo** que muestra cómo quedará la tienda antes de guardar. Los cambios se aplican al guardar y se ven en \`/store/{slug}\`.

## NUEVO: Contacto comprador ↔ vendedor por WhatsApp
- Si el vendedor configuró su **WhatsApp** en el editor de tienda, en cada **producto** y en la **página de la tienda** aparece el botón verde **"Contactar al vendedor"** que abre WhatsApp con un mensaje pre-llenado sobre el producto.
- Consejo a vendedores: configura tu WhatsApp para cerrar más ventas; responde rápido y con amabilidad.

## Consejos para vender mejor (cuando ayudes a un vendedor)
- Sube **fotos claras** y un **logo**; elige un **color de marca** que te represente.
- Escribe **descripciones concretas** y mantén el **stock al día**.
- Usa el **mensaje destacado** para promos puntuales.
- Activa tu **WhatsApp** y responde rápido.
- Publica la tienda (botón "Activar") para que aparezca en el marketplace.

## Lo que NO puedes hacer
- Procesar pagos, reembolsos ni transacciones reales
- Dar datos privados de usuarios específicos
- Modificar datos de la base de datos directamente

## Formato de respuestas
- Respuestas concisas: máximo 4-5 oraciones o una lista corta de 5 ítems.
- Usa **negritas** para destacar términos clave.
- Usa listas con "- " cuando haya 3+ pasos o ítems.
- Si la pregunta es sobre una tienda o producto específico que existe en los datos del marketplace, menciónalo por nombre.
- Si el contexto menciona tiendas o productos relevantes, úsalos en tu respuesta.`;
}

// ── Obtener contexto real de la BD ───────────────────────
async function getRealContext(pool: Pool, mongoClient: MongoClient): Promise<string> {
  const db = mongoClient.db();
  const lines: string[] = [];

  try {
    // Tiendas publicadas
    const storesRes = await pool.query(
      `SELECT id, name, slug, description, owner_id
       FROM stores
       WHERE is_published = true
       ORDER BY created_at DESC
       LIMIT 10`
    );
    const stores = storesRes.rows;

    lines.push(`### Tiendas publicadas en Shopper (${stores.length} activas)`);
    for (const s of stores) {
      lines.push(`- **${s.name}** (/${s.slug})${s.description ? ': ' + s.description.slice(0, 80) : ''}`);
    }

    // Total de usuarios
    const usersRes = await pool.query(`SELECT COUNT(*) as total FROM users`);
    const totalUsers = usersRes.rows[0]?.total ?? 0;

    // Total de tiendas
    const totalStoresRes = await pool.query(`SELECT COUNT(*) as total FROM stores`);
    const totalStores = totalStoresRes.rows[0]?.total ?? 0;

    lines.push(`\n### Estadísticas generales`);
    lines.push(`- Usuarios registrados: ${totalUsers}`);
    lines.push(`- Tiendas totales: ${totalStores} (${stores.length} publicadas)`);

    // Productos destacados desde MongoDB
    try {
      const productsCol = db.collection('products');
      const products = await productsCol
        .find({ is_active: { $ne: false } })
        .sort({ price: -1 })
        .limit(8)
        .toArray();

      if (products.length > 0) {
        const totalProds = await productsCol.countDocuments({ is_active: { $ne: false } });
        lines.push(`- Productos activos: ${totalProds}`);
        lines.push(`\n### Productos disponibles (muestra)`);
        for (const p of products) {
          const price = new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0,
          }).format(p.price ?? 0);
          lines.push(`- **${p.title}** — ${price}${p.stock !== undefined ? ` (stock: ${p.stock})` : ''}`);
        }
      }
    } catch {
      // MongoDB no disponible: se omite
    }

  } catch (err) {
    lines.push('### Contexto del marketplace no disponible en este momento.');
  }

  return lines.join('\n');
}

// ── Llamada a Gemini ─────────────────────────────────────
function buildContents(messages: ChatMessage[]) {
  return messages.slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function callGemini(apiKey: string, systemPrompt: string, contents: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const model   = 'gemini-2.5-flash';
    const path    = `/v1beta/models/${model}:generateContent`;

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.65,
        topP: 0.92,
      },
    });

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-goog-api-key': apiKey,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Gemini ${res.statusCode}: ${parsed?.error?.message ?? data}`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error('Respuesta inválida de Gemini'));
          }
        });
      },
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Controller ───────────────────────────────────────────
@Controller('chat')
export class ChatController {

  constructor(
    @Inject('POSTGRES_POOL')  private readonly pool: Pool,
    @Inject('MONGO_CLIENT')   private readonly mongoClient: MongoClient,
  ) {}

  // Endpoint público → rate-limit firme por IP para proteger la cuota de Gemini.
  @Throttle({ global: { ttl: 60_000, limit: 15 }, hour: { ttl: 3_600_000, limit: 120 } })
  @Post()
  async chat(@Body() dto: ChatDto) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('[Chat] GEMINI_API_KEY no está definida en .env');
      throw new HttpException(
        'Chat no disponible: falta GEMINI_API_KEY en el servidor.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!dto.messages || dto.messages.length === 0) {
      throw new HttpException('Se requieren mensajes.', HttpStatus.BAD_REQUEST);
    }

    try {
      // 1. Obtener contexto real
      const context      = await getRealContext(this.pool, this.mongoClient);
      const systemPrompt = buildSystemPrompt(context, dto.role, dto.page);

      // 2. Construir contenidos
      const contents = buildContents(dto.messages);

      // 3. Llamar a Gemini
      const data = await callGemini(apiKey, systemPrompt, contents);

      const reply =
        data?.candidates?.[0]?.content?.parts
          ?.filter((p: any) => p.text)
          ?.map((p: any) => p.text)
          ?.join('') ?? 'Lo siento, no pude procesar tu mensaje.';

      return { reply };

    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      console.error('[Chat] Error:', err.message);
      throw new HttpException('No se pudo conectar con la IA.', HttpStatus.BAD_GATEWAY);
    }
  }
}
