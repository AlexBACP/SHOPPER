export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id:         string;
  order_id:   string;
  store_id:   string;
  product_id: string;
  title:      string;
  sku:        string;
  price:      number;
  quantity:   number;
  image?:     string;
  created_at: Date;
}

export interface Order {
  id:               string;
  buyer_id:         string;   // FK → users.id (columna en BD)
  status:           OrderStatus;
  total:            number;
  shipping_name?:   string;
  shipping_address?: string;
  shipping_city?:   string;
  shipping_notes?:  string;
  created_at:       Date;
  updated_at:       Date;
  items?:           OrderItem[];
}
