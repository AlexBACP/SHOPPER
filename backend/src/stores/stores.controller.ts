// src/stores/stores.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // Admin crea tienda para un owner específico
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: any) {
    return this.storesService.create(user.id, dto);
  }

  // Cualquier usuario autenticado puede ver tiendas publicadas
  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  // Owner ve sus propias tiendas
  @Get('my')
  @Roles(Role.OWNER)
  findMine(@CurrentUser() user: any) {
    return this.storesService.findByOwner(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.delete(id, user.id, user.role);
  }
}