import {
  IsString, IsOptional, MinLength, IsIn,
  IsArray, ValidateNested, IsNumber, IsPositive, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Item individual del carrito ───────────────────────────
export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  storeId: string;

  @IsString()
  title: string;

  @IsString()
  sku: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @Min(1)
  @Max(1000)
  quantity: number;

  @IsOptional()
  @IsString()
  image?: string;
}

// ── Payload principal del checkout ────────────────────────
export class CreateOrderDto {
  @IsString()
  @MinLength(3)
  shipping_name: string;

  @IsOptional()
  @IsString()
  shipping_phone?: string;

  @IsString()
  @MinLength(5)
  shipping_address: string;

  @IsString()
  @MinLength(2)
  shipping_city: string;

  @IsOptional()
  @IsString()
  shipping_dept?: string;

  @IsOptional()
  @IsString()
  shipping_notes?: string;

  @IsOptional()
  @IsIn(['card', 'pse', 'nequi', 'daviplata', 'cod'])
  payment_method?: 'card' | 'pse' | 'nequi' | 'daviplata' | 'cod';

  @IsOptional()
  @IsString()
  coupon_code?: string;

  // Items enviados desde el frontend (carrito Zustand)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
