// src/orders/dto/update-order-status.dto.ts
import { IsEnum, IsOptional, IsString, IsIn, MinLength } from 'class-validator';
import { CARRIER_IDS } from '../../shipping/shipping.constants';

export enum OrderStatus {
  PENDING    = 'pending',
  CONFIRMED  = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED    = 'shipped',
  DELIVERED  = 'delivered',
  CANCELLED  = 'cancelled',
  REFUNDED   = 'refunded',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  // ── Datos de envío (requeridos al pasar a 'shipped') ──────
  @IsOptional()
  @IsIn(CARRIER_IDS)
  carrier?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  tracking_number?: string;

  // Foto opcional del paquete recogido por la transportadora
  @IsOptional()
  @IsString()
  proof_image?: string;
}
