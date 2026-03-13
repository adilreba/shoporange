import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface RecentlyViewedState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  getRecentItems: (limit?: number) => Product[];
}

const MAX_ITEMS = 12; // Maximum number of items to store

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        set((state) => {
          // Remove if already exists (to move to front)
          const filtered = state.items.filter((item) => item.id !== product.id);
          
          // Add to beginning of array
          const newItems = [product, ...filtered].slice(0, MAX_ITEMS);
          
          return { items: newItems };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      getRecentItems: (limit: number = 8) => {
        return get().items.slice(0, limit);
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);
