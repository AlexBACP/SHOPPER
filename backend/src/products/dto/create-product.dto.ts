// src/products/dto/create-product.dto.ts
import {
  IsString, IsNumber, IsOptional, IsArray,
  IsBoolean, Min, ValidateNested, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsString() name: string;
  @IsString() sku: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(0) stock: number;
  @IsObject() attributes: Record<string, string>;
}

export class CreateProductDto {
  @IsString() title: string;
  @IsString() sku: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(0) stock: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsOptional() @IsObject()
  attributes?: Record<string, any>;
}