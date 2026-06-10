// src/ai/ai.controller.ts
import {
  Controller, Post, Body, UseGuards,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as https from 'https';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

interface GenerateProductDto {
  prompt: string;          // descripción breve del vendedor
  imageUrl?: string;       // (opcional) URL de imagen de referencia
}

// Categorías válidas del marketplace
const CATEGORIES = ['moda', 'hogar', 'tecnologia', 'artesanias', 'alimentos', 'deportes', 'belleza', 'ninos'];

const PRODUCT_SCHEMA = {
  type: 'object',
  properties: {
    title:       { type: 'string' },
    description: { type: 'string' },
    category:    { type: 'string', enum: CATEGORIES },
    price:       { type: 'number' },
    tags:        { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'description', 'category', 'price'],
};

const INSIGHTS_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:  { type: 'string' },
          detail: { type: 'string' },
          impact: { type: 'string', enum: ['alto', 'medio', 'bajo'] },
        },
        required: ['title', 'detail'],
      },
    },
  },
  required: ['headline', 'recommendations'],
};

function buildPrompt(prompt: string): string {
  return `Eres un experto en e-commerce colombiano. Un vendedor te da una idea breve de su producto y debes generar una ficha de producto optimizada para VENDER en Colombia.

Idea del vendedor: "${prompt}"

Genera:
- title: un nombre atractivo y claro (máx 60 caracteres), en español.
- description: descripción persuasiva de 2 a 4 frases, resaltando beneficios y para quién es. Tono cercano y colombiano. Sin inventar materiales o garantías que no se mencionan.
- category: UNA de estas exactamente: ${CATEGORIES.join(', ')}.
- price: precio sugerido REALISTA en pesos colombianos (COP), solo el número entero, acorde al mercado colombiano.
- tags: 3 a 5 palabras clave para búsqueda.

Responde SOLO el JSON.`;
}

function callGemini(apiKey: string, prompt: string, schema: any, temperature = 0.8): Promise<any> {
  return new Promise((resolve, reject) => {
    const model = 'gemini-2.5-flash';
    const path = `/v1beta/models/${model}:generateContent`;

    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 }, // sin "thinking": deja tokens para el JSON
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-goog-api-key': apiKey,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
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

@Controller('ai')
export class AiController {
  // ── Generar ficha de producto con IA (solo vendedores/admin) ──
  // Rate-limit estricto: protege la cuota/costo de Gemini ante abuso.
  @Throttle({ global: { ttl: 60_000, limit: 10 }, hour: { ttl: 3_600_000, limit: 60 } })
  @Post('product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  async generateProduct(@Body() dto: GenerateProductDto) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException('IA no disponible: falta GEMINI_API_KEY.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const prompt = (dto?.prompt ?? '').trim();
    if (prompt.length < 3) {
      throw new HttpException('Describe tu producto en al menos unas palabras.', HttpStatus.BAD_REQUEST);
    }
    if (prompt.length > 2000) {
      throw new HttpException('La descripción es demasiado larga.', HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await callGemini(apiKey, buildPrompt(prompt), PRODUCT_SCHEMA);
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '{}';
      const out = JSON.parse(text);

      // Saneamiento: garantizamos campos válidos
      const category = CATEGORIES.includes(out.category) ? out.category : 'artesanias';
      const price = Math.max(0, Math.round(Number(out.price) || 0));
      return {
        title:       String(out.title ?? '').slice(0, 80),
        description: String(out.description ?? ''),
        category,
        price,
        tags: Array.isArray(out.tags) ? out.tags.slice(0, 5).map(String) : [],
      };
    } catch (err: any) {
      console.error('[AI] generateProduct error:', err.message);
      throw new HttpException('No se pudo generar la ficha con IA. Intenta de nuevo.', HttpStatus.BAD_GATEWAY);
    }
  }

  // ── IA de negocio: insights y recomendaciones (solo vendedores/admin) ──
  // Análisis pesado y poco frecuente → límite más bajo.
  @Throttle({ global: { ttl: 60_000, limit: 6 }, hour: { ttl: 3_600_000, limit: 40 } })
  @Post('insights')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  async insights(@Body() dto: { metrics?: Record<string, any> }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException('IA no disponible: falta GEMINI_API_KEY.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const m = dto?.metrics ?? {};

    const prompt = `Eres un asesor de negocios experto para vendedores de un marketplace colombiano (Shopper). Analiza estas MÉTRICAS REALES de la tienda del vendedor y genera asesoría accionable.

Métricas (JSON):
${JSON.stringify(m, null, 2)}

Genera:
- headline: una frase corta (máx 120 caracteres) que resuma el estado del negocio, motivadora y honesta, en español colombiano.
- recommendations: 3 a 5 recomendaciones CONCRETAS y accionables basadas en los datos (ej. reponer un producto con stock bajo, ajustar un precio, impulsar el más vendido, activar WhatsApp, publicar más productos). Cada una con:
   - title: acción clara y breve.
   - detail: 1-2 frases explicando por qué y cómo, usando los datos reales (nombres de productos, números) cuando aplique.
   - impact: 'alto' | 'medio' | 'bajo'.

Sé específico y práctico. No inventes datos que no estén en las métricas. Responde SOLO el JSON.`;

    try {
      const data = await callGemini(apiKey, prompt, INSIGHTS_SCHEMA, 0.6);
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '{}';
      const out = JSON.parse(text);
      return {
        headline: String(out.headline ?? 'Tu negocio en Shopper'),
        recommendations: Array.isArray(out.recommendations)
          ? out.recommendations.slice(0, 5).map((r: any) => ({
              title:  String(r.title ?? ''),
              detail: String(r.detail ?? ''),
              impact: ['alto', 'medio', 'bajo'].includes(r.impact) ? r.impact : 'medio',
            }))
          : [],
      };
    } catch (err: any) {
      console.error('[AI] insights error:', err.message);
      throw new HttpException('No se pudo generar el análisis. Intenta de nuevo.', HttpStatus.BAD_GATEWAY);
    }
  }
}
