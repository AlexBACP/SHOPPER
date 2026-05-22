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
  items:      WishlistItem[];
  add:        (item: Omit<WishlistItem, 'addedAt'>) => void;
  remove:     (productId: string) => void;
  toggle:     (item: Omit<WishlistItem, 'addedAt'>) => boolean; // returns true if added
  has:        (productId: string) => boolean;
  clear:      () => void;
  count:      () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add:    (item) => set({ items: [...get().items, { ...item, addedAt: Date.now() }] }),
      remove: (id)   => set({ items: get().items.filter(i => i.productId !== id) }),
      toggle: (item) => {
        const exists = get().has(item.productId);
        if (exists) get().remove(item.productId);
        else get().add(item);
        return !exists;
      },
      has:   (id)    => get().items.some(i => i.productId === id),
      clear: ()      => set({ items: [] }),
      count: ()      => get().items.length,
    }),
    { name: 'shopper-wishlist', partialize: (s) => ({ items: s.items }) }
  )
);
