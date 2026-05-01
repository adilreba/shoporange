import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  
  // Actions
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: (product: Product) => {
        const { items } = get();
        if (!items.find(item => item.id === product.id)) {
          set({ items: [...items, product] });
        }
      },

      removeFromWishlist: (productId: string) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },

      toggleWishlist: (product: Product) => {
        const { items } = get();
        const exists = items.find(item => item.id === product.id);
        
        if (exists) {
          set({
            items: items.filter(item => item.id !== product.id)
          });
        } else {
          set({ items: [...items, product] });
        }
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId);
      },

      getWishlistCount: () => {
        return get().items.length;
      }
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);

// Clear wishlist on logout
import { onLogout } from './authStore';
onLogout(() => {
  useWishlistStore.getState().clearWishlist();
});
