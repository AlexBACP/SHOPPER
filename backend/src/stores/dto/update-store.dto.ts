// src/stores/dto/update-store.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;

  @IsOptional()
  theme?: Record<string, any>;
}