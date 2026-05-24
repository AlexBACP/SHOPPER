// src/products/product.interface.ts
import { ObjectId } from 'mongodb';

export interface Variant {
  name: string;        // ej: "Talla M / Rojo"
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // { talla: 'M', color: 'Rojo' }
}

export interface Product {
  _id?: ObjectId;
  store_id: string;          // UUID de la tienda en PostgreSQL
  title: string;
  description?: string;
  sku: string;               // SKU base del producto
  category?:        string;  // Slug de categoría: moda | hogar | tecnologia | artesanias | alimentos | deportes | belleza | ninos
  price:            number;  // Precio base (actual)
  compare_at_price?: number; // Precio original antes de descuento (si existe, hay oferta)
  stock: number;             // Stock total (suma de variantes o independiente)
  images: string[];          // Array de URLs
  variants: Variant[];
  attributes: Record<string, any>; // peso, dimensiones, material, etc.
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}