// src/upload/upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

// Transformaciones por tipo de imagen
const TRANSFORMACIONES = {
  /** Logo de tienda: cuadrado 400×400, recorte inteligente */
  stores: [
    { width: 400, height: 400, crop: 'fill' as const, gravity: 'auto' as const },
    { quality: 'auto:good', fetch_format: 'auto' },
  ],
  /** Imagen de producto: máx 1000px de ancho, calidad alta */
  products: [
    { width: 1000, crop: 'limit' as const },
    { quality: 'auto:best', fetch_format: 'auto' },
  ],
} as const;

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    fileBuffer: Buffer,
    mimetype:   string,
    folder:     'stores' | 'products',
  ): Promise<string> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         `shopper/${folder}`,
          // Transformación en el almacenamiento: tamaño y formato optimizados
          transformation: TRANSFORMACIONES[folder],
          // Eager: pre-generar un thumbnail pequeño para placeholders
          eager: [
            { width: 20, quality: 1, effect: 'blur:400', fetch_format: 'auto' },
          ],
          // Guardar siempre como WebP en el almacenamiento
          format: 'webp',
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload fallido'));
          // Devolver la URL segura (https) de la imagen principal
          resolve(result.secure_url);
        },
      );
      stream.end(fileBuffer);
    });
  }

  async deleteImage(url: string): Promise<void> {
    try {
      // Extrae el public_id desde la URL de Cloudinary
      // Ejemplo: https://res.cloudinary.com/demo/image/upload/v123/shopper/products/abc.webp
      const parts   = url.split('/');
      const upload  = parts.indexOf('upload');
      if (upload === -1) return;
      const withExt = parts.slice(upload + 2).join('/'); // salta la versión vXXX
      const publicId = withExt.replace(/\.[^/.]+$/, ''); // quita extensión
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // No bloquear si falla el borrado
    }
  }
}
