import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CompareState {
  items: Product[];
  maxItems: number;
  
  // Actions
  addToCompare: (product: Product) => { success: boolean; message: string };
  removeFromCompare: (productId: string) => void;
  toggleCompare: (product: Product) => { success: boolean; message: string };
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  getCompareCount: () => number;
  canAddMore: () => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addToCompare: (product: Product) => {
        const { items, maxItems } = get();
        
        if (items.find(item => item.id === product.id)) {
          return { success: false, message: 'Bu ürün zaten karşılaştırma listesinde' };
        }
        
        if (items.length >= maxItems) {
          return { success: false, message: `En fazla ${maxItems} ürün karşılaştırabilirsiniz` };
        }
        
        set({ items: [...items, product] });
        return { success: true, message: 'Ürün karşılaştırma listesine eklendi' };
      },

      removeFromCompare: (productId: string) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },

      toggleCompare: (product: Product) => {
        const { items, maxItems } = get();
        const exists = items.find(item => item.id === product.id);
        
        if (exists) {
          set({
            items: items.filter(item => item.id !== product.id)
          });
          return { success: true, message: 'Ürün karşılaştırma listesinden çıkarıldı' };
        } else {
          if (items.length >= maxItems) {
            return { success: false, message: `En fazla ${maxItems} ürün karşılaştırabilirsiniz` };
          }
          set({ items: [...items, product] });
          return { success: true, message: 'Ürün karşılaştırma listesine eklendi' };
        }
      },

      clearCompare: () => {
        set({ items: [] });
      },

      isInCompare: (productId: string) => {
        return get().items.some(item => item.id === productId);
      },

      getCompareCount: () => {
        return get().items.length;
      },

      canAddMore: () => {
        return get().items.length < get().maxItems;
      }
    }),
    {
      name: 'compare-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);

// Clear compare list on logout
import { onLogout } from './authStore';
onLogout(() => {
  useCompareStore.getState().clearCompare();
});
