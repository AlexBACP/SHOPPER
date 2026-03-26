export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'owner' | 'buyer';
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  is_published: boolean;
}

export interface Variant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface Product {
  _id: string;
  store_id: string;
  title: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  variants: Variant[];
  attributes: Record<string, any>;
  is_active: boolean;
}