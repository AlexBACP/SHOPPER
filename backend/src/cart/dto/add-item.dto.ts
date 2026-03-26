import { IsString, IsNumber, Min } from 'class-validator';

export class AddItemDto {
  @IsString() productId: string;
  @IsString() storeId: string;
  @IsString() title: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(1) quantity: number;
  @IsString() sku: string;
  @IsString() image?: string;
}