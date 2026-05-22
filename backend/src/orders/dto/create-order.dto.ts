// src/orders/dto/create-order.dto.ts
import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(3)
  shipping_name: string;

  @IsString()
  @MinLength(5)
  shipping_address: string;

  @IsString()
  @MinLength(2)
  shipping_city: string;

  @IsOptional()
  @IsString()
  shipping_notes?: string;

  // Método de pago seleccionado en el checkout
  @IsOptional()
  @IsIn(['card', 'pse', 'nequi', 'daviplata'])
  payment_method?: 'card' | 'pse' | 'nequi' | 'daviplata';

  // Estado del pago (en producción lo setea la pasarela, no el cliente)
  @IsOptional()
  @IsIn(['pending', 'paid', 'failed'])
  payment_status?: 'pending' | 'paid' | 'failed';
}
