import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.provider';
import { AddItemDto } from './dto/add-item.dto';

export interface CartItem {
  productId: string;
  storeId: string;
  title: string;
  price: number;
  quantity: number;
  sku: string;
  image?: string;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

@Injectable()
export class CartService {
  private readonly TTL = 60 * 60 * 24 * 7; // 7 días

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private getKey(id: string): string {
    return `cart:${id}`;
  }

  async getCart(cartId: string): Promise<Cart> {
    const raw = await this.redis.get(this.getKey(cartId));
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw);
  }

  async addItem(cartId: string, dto: AddItemDto): Promise<Cart> {
    const cart = await this.getCart(cartId);

    const existingIndex = cart.items.findIndex(
      (i) => i.productId === dto.productId,
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += dto.quantity;
    } else {
      cart.items.push({ ...dto, addedAt: new Date().toISOString() });
    }

    cart.updatedAt = new Date().toISOString();
    await this.redis.setex(this.getKey(cartId), this.TTL, JSON.stringify(cart));
    return cart;
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    await this.redis.setex(this.getKey(cartId), this.TTL, JSON.stringify(cart));
    return cart;
  }

  async updateQuantity(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const item = cart.items.find((i) => i.productId === productId);
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter((i) => i.productId !== productId);
      } else {
        item.quantity = quantity;
      }
    }
    cart.updatedAt = new Date().toISOString();
    await this.redis.setex(this.getKey(cartId), this.TTL, JSON.stringify(cart));
    return cart;
  }

  async clearCart(cartId: string): Promise<void> {
    await this.redis.del(this.getKey(cartId));
  }

  async mergeGuestCart(guestCartId: string, userId: string): Promise<Cart> {
    const guestCart = await this.getCart(guestCartId);
    if (guestCart.items.length === 0) return this.getCart(userId);

    const userCart = await this.getCart(userId);

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.findIndex(
        (i) => i.productId === guestItem.productId,
      );
      if (existing >= 0) {
        userCart.items[existing].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    userCart.updatedAt = new Date().toISOString();
    await this.redis.setex(this.getKey(userId), this.TTL, JSON.stringify(userCart));
    await this.redis.del(this.getKey(guestCartId));
    return userCart;
  }

  getTotal(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  groupByStore(cart: Cart): Record<string, CartItem[]> {
    return cart.items.reduce((acc, item) => {
      if (!acc[item.storeId]) acc[item.storeId] = [];
      acc[item.storeId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
  }
}