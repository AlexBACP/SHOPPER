import {
  Controller, Get, Patch, Delete, Query, Param, Body, UseGuards, HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

class ToggleActiveDto {
  @IsBoolean() is_active: boolean;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/stats → métricas globales de la plataforma (solo admin)
  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  // ── Moderación de productos ──────────────────────────
  @Get('products')
  listProducts(@Query('q') q?: string) {
    return this.adminService.listProducts(q);
  }

  @Patch('products/:id')
  setProductActive(@Param('id') id: string, @Body() dto: ToggleActiveDto) {
    return this.adminService.setProductActive(id, dto.is_active);
  }

  @Delete('products/:id')
  @HttpCode(204)
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ── Configuración de plataforma — SOLO super_admin ───────────
  @Get('settings')
  getSettings(@CurrentUser() user: any) {
    if (user.role !== 'super_admin') throw new ForbiddenException('Solo el super administrador puede ver la configuración');
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: any, @Body() patch: Record<string, string>) {
    if (user.role !== 'super_admin') throw new ForbiddenException('Solo el super administrador puede cambiar la configuración');
    return this.adminService.updateSettings(patch);
  }
}
