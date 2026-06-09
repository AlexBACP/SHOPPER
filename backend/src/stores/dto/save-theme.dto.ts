// src/stores/dto/save-theme.dto.ts
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

// Usado por snapshots (con label opcional) y por la vista previa compartible.
export class SaveThemeDto {
  @IsObject()
  theme: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}
