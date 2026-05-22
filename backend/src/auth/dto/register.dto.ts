// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // El rol es opcional — por defecto será 'buyer'.
  // Solo se acepta 'buyer' u 'owner' en el registro público.
  // 'admin' y 'super_admin' solo los puede asignar un admin existente.
  @IsOptional()
  @IsIn(['buyer', 'owner'])
  role?: 'buyer' | 'owner';
}
