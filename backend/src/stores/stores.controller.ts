// src/stores/stores.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SaveThemeDto } from './dto/save-theme.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ── Owner crea su propia tienda  /  Admin crea tienda para cualquiera ──
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: any) {
    return this.storesService.create(user.id, dto);
  }

  // ── Cualquier usuario (incluso sin sesión) puede listar tiendas ──
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  // ── Owner ve sus propias tiendas ──
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  findMine(@CurrentUser() user: any) {
    return this.storesService.findByOwner(user.id);
  }

  // ── Ver tienda pública por slug (para SEO y página pública) ──
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  // ── Ver tienda pública por ID (sin auth) ──
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  // ── Editar tienda (owner de esa tienda o admin) ──
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.update(id, user.id, user.role, dto);
  }

  // ── Versiones del diseño (snapshots) ──
  @Post(':id/theme/snapshots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  createSnapshot(@Param('id') id: string, @Body() dto: SaveThemeDto, @CurrentUser() user: any) {
    return this.storesService.createSnapshot(id, user.id, user.role, dto.theme, dto.label);
  }

  @Get(':id/theme/snapshots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  listSnapshots(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.listSnapshots(id, user.id, user.role);
  }

  @Post(':id/theme/snapshots/:snapId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  restoreSnapshot(@Param('id') id: string, @Param('snapId') snapId: string, @CurrentUser() user: any) {
    return this.storesService.restoreSnapshot(id, snapId, user.id, user.role);
  }

  // ── Vista previa compartible (token de solo lectura) ──
  @Post(':id/theme/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  createPreview(@Param('id') id: string, @Body() dto: SaveThemeDto, @CurrentUser() user: any) {
    return this.storesService.createPreview(id, user.id, user.role, dto.theme);
  }

  // Público: resuelve el token → tienda + theme (para /store/[slug]?preview=…)
  @Get('theme/preview/:token')
  getPreview(@Param('token') token: string) {
    return this.storesService.getPreviewByToken(token);
  }

  // ── Eliminar tienda (solo admin / super_admin — el vendedor no puede) ──
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.delete(id, user.id, user.role);
  }
}
