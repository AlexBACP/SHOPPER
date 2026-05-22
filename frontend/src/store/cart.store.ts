import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IVA_RATE } from '@/config/constants';

export { IVA_RATE };

export interface CartItem {
  productId: string;
  storeId:   string;
  title:     string;
  price:     number;
  image?:    string;
  quantity:  number;
  stock:     number;
  sku:       string;
}

interface CartStore {
  items:    CartItem[];
  isOpen:   boolean;
  coupon:   string | null;
  discount: number;
  addItem:        (item: Omit<CartItem, 'quantity'>) => void;
  removeItem:     (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart:      () => void;
  openCart:       () => void;
  closeCart:      () => void;
  applyCoupon:    (code: string) => boolean;
  removeCoupon:   () => void;
  subtotal:       () => number;
  ivaAmount:      () => number;
  discountAmount: () => number;
  total:          () => number;
  count:          () => number;
}

// Cupones de demo — en producción vienen del backend
const DEMO_COUPONS: Record<string, number> = {
  SHOPPER10:   10,
  BIENVENIDO:  15,
  COLOMBIA20:  20,
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
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
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
        if (!pct) return false;
        set({ coupon: code.toUpperCase().trim(), discount: pct });
        return true;
      },

      removeCoupon: () => set({ coupon: null, discount: 0 }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      discountAmount: () =>
        get().subtotal() * (get().discount / 100),

      ivaAmount: () =>
        (get().subtotal() - get().discountAmount()) * IVA_RATE,

      total: () => {
        const sub  = get().subtotal();
        const disc = get().discountAmount();
        return sub - disc + (sub - disc) * IVA_RATE;
      },

      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name:       'shopper-cart',
      partialize: (state) => ({
        items:    state.items,
        coupon:   state.coupon,
        discount: state.discount,
        // isOpen no se persiste — UI state efímero
      }),
    },
  ),
);
