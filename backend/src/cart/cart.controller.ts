import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Obtiene el cartId — si está autenticado usa userId, si no usa cookie
  private getCartId(user: any, req: Request): string {
    if (user) return user.id;
    const cookie = req.cookies?.cartId;
    if (cookie) return cookie;
    return uuidv4();
  }

  @Get()
  async getCart(@Req() req: Request, @CurrentUser() user?: any) {
    const cartId = this.getCartId(user, req);
    const cart = await this.cartService.getCart(cartId);
    const total = this.cartService.getTotal(cart);
    const byStore = this.cartService.groupByStore(cart);
    return { cartId, cart, total, byStore };
  }

  @Post('items')
  async addItem(
    @Body() dto: AddItemDto,
    @Req() req: Request,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getCartId(user, req);
    const cart = await this.cartService.addItem(cartId, dto);
    return { cartId, cart, total: this.cartService.getTotal(cart) };
  }

  @Delete('items/:productId')
  @HttpCode(200)
  async removeItem(
    @Param('productId') productId: string,
    @Req() req: Request,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getCartId(user, req);
    const cart = await this.cartService.removeItem(cartId, productId);
    return { cart, total: this.cartService.getTotal(cart) };
  }

  @Patch('items/:productId')
  async updateQuantity(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Req() req: Request,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getCartId(user, req);
    const cart = await this.cartService.updateQuantity(cartId, productId, quantity);
    return { cart, total: this.cartService.getTotal(cart) };
  }

  @Delete()
  @HttpCode(200)
  async clearCart(@Req() req: Request, @CurrentUser() user?: any) {
    const cartId = this.getCartId(user, req);
    await this.cartService.clearCart(cartId);
    return { message: 'Carrito vaciado' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge/:guestCartId')
  @HttpCode(200)
  async mergeCart(
    @Param('guestCartId') guestCartId: string,
    @CurrentUser() user: any,
  ) {
    const cart = await this.cartService.mergeGuestCart(guestCartId, user.id);
    return { cart, total: this.cartService.getTotal(cart) };
  }
}