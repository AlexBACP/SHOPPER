import {
  Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

class CreateCouponDto {
  @IsString() code: string;
  @IsInt() @Min(1) @Max(100) discount_pct: number;
  @IsOptional() @IsInt() @Min(1) max_uses?: number;
  @IsOptional() @IsDateString() expires_at?: string;
}

class ToggleCouponDto {
  @IsBoolean() is_active: boolean;
}

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ── Público (autenticado): validar un cupón en el checkout ──
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@Body('code') code: string) {
    if (!code?.trim()) {
      return { valid: false, message: 'Código requerido' };
    }
    return this.couponsService.validate(code);
  }

  // ── Admin: gestión de cupones ──────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  listAll() {
    return this.couponsService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  toggle(@Param('id') id: string, @Body() dto: ToggleCouponDto) {
    return this.couponsService.toggleActive(id, dto.is_active);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
