// src/stores/dto/create-store.dto.ts
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MinLength(3)
  name: string;

  // El slug es opcional: si no se envía, se genera a partir del nombre.
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede tener letras minúsculas, números y guiones',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  // Personalización de la tienda (color, banner, tagline, whatsapp, layout…).
  @IsOptional()
  theme?: Record<string, any>;
}
