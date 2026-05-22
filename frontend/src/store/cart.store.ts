import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const IVA_RATE = 0.19; // 19% IVA Colombia

export interface CartItem {
  productId: string;
  storeId:   string;
  title:     string;
  price:     number;      // precio sin IVA
  image?:    string;
  quantity:  number;
  stock:     number;
  sku:       string;
}

interface CartStore {
  items:          CartItem[];
  isOpen:         boolean;
  coupon:         string | null;
  discount:       number;           // porcentaje 0-100
  addItem:        (item: Omit<CartItem, 'quantity'>) => void;
  removeItem:     (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart:      () => void;
  openCart:       () => void;
  closeCart:      () => void;
  applyCoupon:    (code: string) => boolean;
  removeCoupon:   () => void;
  subtotal:       () => number;     // sin IVA
  ivaAmount:      () => number;     // valor IVA
  discountAmount: () => number;     // valor descuento
  total:          () => number;     // total con IVA y descuento
  count:          () => number;
}

// Cupones de demo — en producción vienen del backend
const DEMO_COUPONS: Record<string, number> = {
  'SHOPPER10': 10,
  'BIENVENIDO': 15,
  'COLOMBIA20': 20,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items:    [],
      isOpen:   false,
      coupon:   null,
      discount: 0,

      addItem: (newItem) => {
        const items    = get().items;
        const existing = items.find(i => i.productId === newItem.productId);
        if (existing) {
          set({
            items: items.map(i =>
              i.productId === newItem.productId
                ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter(i => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set({
          items: get().items.map(i =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        });
      },

      clearCart:    () => set({ items: [], coupon: null, discount: 0 }),
      openCart:     () => set({ isOpen: true }),
      closeCart:    () => set({ isOpen: false }),

      applyCoupon: (code) => {
        const pct = DEMO_COUPONS[code.toUpperCase().trim()];
        if (pct) { set({ coupon: code.toUpperCase().trim(), discount: pct }); return true; }
        return false;
      },

      removeCoupon: () => set({ coupon: null, discount: 0 }),

      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

      ivaAmount: () => {
        const sub  = get().subtotal();
        const disc = get().discountAmount();
        return (sub - disc) * IVA_RATE;
      },

      discountAmount: () => {
        const sub = get().subtotal();
        return sub * (get().discount / 100);
      },

      total: () => {
        const sub  = get().subtotal();
        const disc = get().discountAmount();
        const iva  = (sub - disc) * IVA_RATE;
        return sub - disc + iva;
      },

      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name:       'shopper-cart',
      partialize: (state) => ({ items: state.items, coupon: state.coupon, discount: state.discount }),
    }
  )
);
