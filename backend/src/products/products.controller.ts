// src/products/products.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { StoresService } from '../stores/stores.service';

@Controller('stores/:storeId/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: any,
  ) {
    // Verifica que la tienda existe y pertenece al owner
    const store = await this.storesService.findById(storeId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (store.owner_id !== user.id && !isAdmin)
      throw new Error('No tienes permiso sobre esta tienda');

    return this.productsService.create(storeId, dto);
  }

  // Público — cualquiera puede ver productos de una tienda
  @Get()
  findAll(@Param('storeId') storeId: string) {
    return this.productsService.findByStore(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    const store = await this.storesService.findById(storeId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (store.owner_id !== user.id && !isAdmin)
      throw new Error('No tienes permiso sobre esta tienda');

    return this.productsService.update(id, storeId, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(204)
  async remove(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const store = await this.storesService.findById(storeId);
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (store.owner_id !== user.id && !isAdmin)
      throw new Error('No tienes permiso sobre esta tienda');

    return this.productsService.delete(id, storeId);
  }
}