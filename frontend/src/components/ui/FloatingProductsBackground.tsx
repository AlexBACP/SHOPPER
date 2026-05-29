'use client';

import { motion } from 'framer-motion';
import { Headphones, Watch, Camera, Shirt, Smartphone, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Product = {
  icon: LucideIcon;
  name: string;
  price: string;
  store: string;
  rating: string;
  gradient: string;
};

/* Tarjeta de producto realista (miniatura + nombre + precio + tienda + rating) */
function ProductCard({ icon: Icon, name, price, store, rating, gradient }: Product) {
  return (
    <div className="w-44 rounded-2xl bg-white/95 p-2.5 shadow-2xl shadow-black/40 ring-1 ring-black/5 backdrop-blur-sm">
      <div className={`mb-2 flex h-20 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon className="h-7 w-7 text-white/90" strokeWidth={1.75} />
      </div>
      <p className="truncate text-[13px] font-semibold leading-tight text-gray-900">{name}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[13px] font-bold text-gray-900">{price}</span>
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {rating}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[10px] text-gray-400">{store}</p>
    </div>
  );
}

/* Cada tarjeta con su posición, profundidad y ritmo de flotación propios */
const CARDS: Array<{
  product: Product;
  className: string;
  depth: { scale: number; opacity: number; blur?: string };
  float: { y: number[]; rotate: number[]; duration: number; delay: number };
}> = [
  {
    product: { icon: Headphones, name: 'Audífonos Pro', price: '$189.000', store: 'TecnoStore', rating: '4.8', gradient: 'from-orange-400 to-rose-500' },
    className: 'right-[5%] top-[9%]',
    depth: { scale: 1, opacity: 1 },
    float: { y: [0, -16, 0], rotate: [-3, 1, -3], duration: 6.5, delay: 0 },
  },
  {
    product: { icon: Watch, name: 'Smartwatch X', price: '$320.000', store: 'RelojesCO', rating: '4.9', gradient: 'from-indigo-400 to-violet-500' },
    className: 'right-[30%] top-[30%]',
    depth: { scale: 0.9, opacity: 0.9, blur: 'blur-[0.5px]' },
    float: { y: [0, 14, 0], rotate: [2, -2, 2], duration: 8, delay: 0.6 },
  },
  {
    product: { icon: Camera, name: 'Cámara 4K', price: '$890.000', store: 'FotoPro', rating: '5.0', gradient: 'from-sky-400 to-cyan-500' },
    className: 'right-[3%] top-[50%]',
    depth: { scale: 1, opacity: 1 },
    float: { y: [0, -13, 0], rotate: [3, -1, 3], duration: 7.2, delay: 1.1 },
  },
  {
    product: { icon: Shirt, name: 'Camiseta Premium', price: '$79.000', store: 'ModaUrbana', rating: '4.7', gradient: 'from-emerald-400 to-teal-500' },
    className: 'right-[26%] top-[70%]',
    depth: { scale: 0.82, opacity: 0.7, blur: 'blur-[1px]' },
    float: { y: [0, 18, 0], rotate: [-2, 2, -2], duration: 9, delay: 0.3 },
  },
  {
    product: { icon: Smartphone, name: 'Smartphone 5G', price: '$1.450.000', store: 'CelularesCol', rating: '4.9', gradient: 'from-fuchsia-400 to-pink-500' },
    className: 'right-[42%] top-[55%]',
    depth: { scale: 0.74, opacity: 0.55, blur: 'blur-[1.5px]' },
    float: { y: [0, -12, 0], rotate: [1, -3, 1], duration: 10, delay: 1.4 },
  },
];

/**
 * Fondo decorativo: tarjetas de productos reales que flotan con profundidad
 * (parallax) en el panel de auth. Un degradado lateral mantiene el texto legible.
 */
export default function FloatingProductsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Resplandor ambiental tenue para dar profundidad */}
      <div
        className="absolute right-0 top-0 h-2/3 w-2/3"
        style={{ background: 'radial-gradient(circle at 70% 30%, rgba(249,115,22,0.18), transparent 60%)' }}
      />

      {/* Tarjetas flotantes */}
      {CARDS.map(({ product, className, depth, float }, i) => (
        <motion.div
          key={i}
          className={`absolute ${className} ${depth.blur ?? ''}`}
          style={{ opacity: depth.opacity }}
          initial={{ opacity: 0, scale: depth.scale * 0.92, y: 24 }}
          animate={{
            opacity: depth.opacity,
            scale: depth.scale,
            y: float.y,
            rotate: float.rotate,
          }}
          transition={{
            opacity: { duration: 0.6, delay: 0.2 + i * 0.12 },
            scale: { duration: 0.6, delay: 0.2 + i * 0.12 },
            y: { duration: float.duration, repeat: Infinity, ease: 'easeInOut', delay: float.delay },
            rotate: { duration: float.duration, repeat: Infinity, ease: 'easeInOut', delay: float.delay },
          }}
        >
          <ProductCard {...product} />
        </motion.div>
      ))}

      {/* Degradado lateral: oscurece la izquierda para que el texto resalte */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--nav-bg)] via-[var(--nav-bg)]/85 to-transparent" />
    </div>
  );
}
