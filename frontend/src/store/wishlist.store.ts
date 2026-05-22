import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  storeId:   string;
  title:     string;
  price:     number;
  image?:    string;
  slug:      string;
  storeSlug: string;
  addedAt:   number;
}

interface WishlistStore {
  items:  WishlistItem[];
  add:    (item: Omit<WishlistItem, 'addedAt'>) => void;
  remove: (productId: string) => void;
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => boolean;
  has:    (productId: string) => boolean;
  clear:  () => void;
  count:  () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) =>
        set({ items: [...get().items, { ...item, addedAt: Date.now() }] }),

      remove: (productId) =>
        set({ items: get().items.filter(i => i.productId !== productId) }),

      // Un solo recorrido: evita llamar has() + remove()/add() por separado
      toggle: (item) => {
        const prev   = get().items;
        const exists = prev.some(i => i.productId === item.productId);
        set({
          items: exists
            ? prev.filter(i => i.productId !== item.productId)
            : [...prev, { ...item, addedAt: Date.now() }],
        });
        return !exists;
      },

      has:   (productId) => get().items.some(i => i.productId === productId),
      clear: ()          => set({ items: [] }),
      count: ()          => get().items.length,
    }),
    {
      name:       'shopper-wishlist',
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
