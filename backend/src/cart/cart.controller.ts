// src/cart/cart.controller.ts
import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, Req, Res, UseGuards, HttpCode,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const CART_COOKIE = 'cartId';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días en segundos

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Obtiene el cartId — si está autenticado usa userId, si no usa/crea cookie persistente
  private getOrCreateCartId(user: any, req: Request, res: Response): string {
    if (user) return user.id;

    const existing = req.cookies?.[CART_COOKIE];
    if (existing) return existing;

    const newId = uuidv4();
    res.cookie(CART_COOKIE, newId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE * 1000, // ms
      secure: process.env.NODE_ENV === 'production',
    });
    return newId;
  }

  @Get()
  async getCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getOrCreateCartId(user, req, res);
    const cart   = await this.cartService.getCart(cartId);
    const total  = this.cartService.getTotal(cart);
    const byStore = this.cartService.groupByStore(cart);
    return { cartId, cart, total, byStore };
  }

  @Post('items')
  async addItem(
    @Body() dto: AddItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getOrCreateCartId(user, req, res);
    const cart   = await this.cartService.addItem(cartId, dto);
    return { cartId, cart, total: this.cartService.getTotal(cart) };
  }

  @Delete('items/:productId')
  @HttpCode(200)
  async removeItem(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getOrCreateCartId(user, req, res);
    const cart   = await this.cartService.removeItem(cartId, productId);
    return { cart, total: this.cartService.getTotal(cart) };
  }

  @Patch('items/:productId')
  async updateQuantity(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getOrCreateCartId(user, req, res);
    const cart   = await this.cartService.updateQuantity(cartId, productId, quantity);
    return { cart, total: this.cartService.getTotal(cart) };
  }

  @Delete()
  @HttpCode(200)
  async clearCart(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: any,
  ) {
    const cartId = this.getOrCreateCartId(user, req, res);
    await this.cartService.clearCart(cartId);
    return { message: 'Carrito vaciado' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge/:guestCartId')
  @HttpCode(200)
  async mergeCart(
    @Param('guestCartId') guestCartId: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
  ) {
    const cart = await this.cartService.mergeGuestCart(guestCartId, user.id);
    // Limpiar cookie de carrito anónimo tras el merge
    res.clearCookie(CART_COOKIE);
    return { cart, total: this.cartService.getTotal(cart) };
  }
}
