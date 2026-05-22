// src/orders/dto/update-order-status.dto.ts
import { IsEnum } from 'class-validator';

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
}
