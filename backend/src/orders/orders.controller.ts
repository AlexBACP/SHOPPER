// src/orders/orders.controller.ts
import {
  Controller, Get, Post, Patch,
  Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders/checkout → buyer crea orden desde su carrito (flujo sin Wompi)
  @Post('checkout')
  @Roles(Role.BUYER, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  checkout(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.checkout(user.id, dto);
  }

  // POST /orders/checkout/prepare → crea orden y devuelve URL de pago Wompi
  @Post('checkout/prepare')
  @Roles(Role.BUYER, Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  prepararWompi(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return this.ordersService.prepararCheckoutWompi(user.id, dto, frontendUrl);
  }

  // GET /orders → admin ve todas las órdenes
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  // GET /orders/my → buyer ve sus propias órdenes
  @Get('my')
  findMine(@CurrentUser() user: any) {
    return this.ordersService.findByBuyer(user.id);
  }

  // GET /orders/store/:storeId → owner ve órdenes de su tienda
  @Get('store/:storeId')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  findByStore(@Param('storeId') storeId: string) {
    return this.ordersService.findByStore(storeId);
  }

  // GET /orders/:id → ver detalle de una orden
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findById(id, user.id, user.role);
  }

  // PATCH /orders/:id/status → admin cambia estado
  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id, user.role);
  }
}
