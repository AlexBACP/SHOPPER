import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@Body('code') code: string) {
    if (!code?.trim()) {
      return { valid: false, message: 'Código requerido' };
    }
    return this.couponsService.validate(code);
  }
}
