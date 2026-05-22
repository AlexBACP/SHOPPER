/**
 * Utilidades para optimizar URLs de Cloudinary.
 *
 * Cloudinary permite insertar transformaciones en la URL:
 *   https://res.cloudinary.com/.../upload/f_auto,q_auto,w_800/...imagen.jpg
 *
 * Esto sirve WebP/AVIF automáticamente, redimensiona y comprime sin
 * necesidad de procesar nada en el servidor de Shopper.
 */

const CLOUDINARY_HOST = 'res.cloudinary.com';

interface OpcionesImagen {
  /** Ancho máximo en píxeles (default: 800) */
  ancho?:   number;
  /** Calidad de compresión (default: 'auto') */
  calidad?: number | 'auto';
  /** Tipo de recorte de Cloudinary (default: 'limit') */
  crop?:    'limit' | 'fill' | 'thumb' | 'scale';
  /** Alto para recorte fill/thumb */
  alto?:    number;
}

/**
 * Transforma una URL de Cloudinary añadiendo parámetros de optimización.
 *
 * Insertar entre '/upload/' y el resto de la ruta.
 * Si la URL ya tiene transformaciones (el primer segmento empieza con letra)
 * las reemplaza. Si no es de Cloudinary la devuelve sin cambios.
 *
 * @example
 * imageOpt(url, { ancho: 400 })
 * // → https://res.cloudinary.com/.../upload/f_auto,q_auto,w_400,c_limit/...
 */
export function imageOpt(url: string | undefined | null, opciones: OpcionesImagen = {}): string {
  if (!url) return '';
  if (!url.includes(CLOUDINARY_HOST)) return url;

  const {
    ancho   = 800,
    calidad = 'auto',
    crop    = 'limit',
    alto,
  } = opciones;

  const partes: string[] = [
    'f_auto',                          // WebP/AVIF según el navegador
    `q_${calidad}`,                    // calidad automática o fija
    `w_${ancho}`,
    alto ? `h_${alto}` : null,
    `c_${crop}`,
  ].filter(Boolean) as string[];

  const transformacion = partes.join(',');

  // Reemplazar '/upload/' con '/upload/TRANSFORMACIONES/'
  // Si ya hay transformaciones previas (versión vXXX o parámetros), las conservamos
  return url.replace('/upload/', `/upload/${transformacion}/`);
}

/**
 * Genera una URL de placeholder borroso muy pequeño (≈20px) para usar
 * como `blurDataURL` en next/image. La carga es ~300 bytes.
 */
export function blurDataUrl(url: string | undefined | null): string {
  if (!url?.includes(CLOUDINARY_HOST)) return '';
  return url.replace('/upload/', '/upload/w_20,q_1,e_blur:400/');
}

/**
 * Genera una URL de thumbnail cuadrado para miniaturas en listados.
 */
export function thumbUrl(url: string | undefined | null, tam = 200): string {
  return imageOpt(url, { ancho: tam, alto: tam, crop: 'thumb', calidad: 'auto' });
}
