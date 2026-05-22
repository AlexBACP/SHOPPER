// src/orders/order.interface.ts

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  created_at: Date;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_notes?: string;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}
