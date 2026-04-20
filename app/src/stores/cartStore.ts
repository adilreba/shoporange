import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { Product, CartItem } from '@/types';
import { cartApi } from '@/services/api';
import { useAuthStore } from './authStore';

// Helper function for stock check
const checkStock = (product: Product, quantity: number, currentQuantity: number = 0) => {
  const totalRequested = quantity + currentQuantity;
  if (totalRequested > product.stock) {
    return {
      success: false,
      message: `Stok yetersiz! Maksimum ${product.stock} adet eklenebilir.`,
    };
  }
  return { success: true };
};

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  isLoading: boolean;
  
  // Getters
  totalItems: () => number;
  totalPrice: () => number;
  finalPrice: () => number;
  shippingCost: () => number;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
  syncWithServer: () => Promise<void>;
}

const COUPONS: Record<string, number> = {
  'INDIRIM10': 10,
  'INDIRIM20': 20,
  'WELCOME': 15,
  'SUMMER25': 25,
  'BLACK50': 50
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,
      isLoading: false,

      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.product.price * item.quantity);
        }, 0);
      },

      finalPrice: () => {
        const total = get().totalPrice();
        const shipping = get().shippingCost();
        const discount = get().discountAmount;
        return total + shipping - (total * discount / 100);
      },

      shippingCost: () => {
        const total = get().totalPrice();
        if (total >= 500) return 0;
        return 49;
      },

      // Server ile senkronizasyon
      syncWithServer: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        try {
          set({ isLoading: true });
          const data = await cartApi.get();
          
          // API'den gelen veriyi CartItem formatına çevir
          // NOT: Server'dan stock bilgisi gelmelidir. Gelmiyorsa sepeti yenilemek yerine
          // kullaniciyi uyarip guncel stok bilgisiyle sepeti yeniden yuklemek daha guvenlidir.
          const serverItems: CartItem[] = data.items.map((item: any) => ({
            product: {
              id: item.productId,
              name: item.name,
              price: item.price,
              images: [item.image],
              stock: item.stock ?? 0, // Server'dan gercek stok bilgisi bekleniyor
            } as Product,
            quantity: item.quantity,
          }));

          set({ items: serverItems, isLoading: false });
        } catch (error) {
          console.error('Failed to sync cart:', error);
          set({ isLoading: false });
        }
      },

      addToCart: async (product: Product, quantity = 1) => {
        const { items } = get();
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        // Mevcut sepet miktarını bul
        const existingItem = items.find(item => item.product.id === product.id);
        const currentQuantity = existingItem?.quantity || 0;
        
        // Stok kontrolü yap
        const stockCheck = checkStock(product, quantity, currentQuantity);
        
        if (!stockCheck.success) {
          toast.error(stockCheck.message || 'Stok yetersiz');
          return;
        }

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item
            )
          });
          toast.success(`${product.name} sepete eklendi!`, {
            description: `Sepetteki toplam: ${newQuantity} adet`
          });
        } else {
          set({
            items: [...items, { product, quantity }]
          });
          toast.success(`${product.name} sepete eklendi!`, {
            description: `${quantity} adet ürün sepetinize eklendi.`
          });
        }

        // API'ye gönder (eğer giriş yapılmışsa)
        if (isAuthenticated) {
          try {
            await cartApi.addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
              quantity,
            });
          } catch (error) {
            console.error('Failed to add to cart on server:', error);
          }
        }
      },

      removeFromCart: async (productId: string) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        set({
          items: get().items.filter(item => item.product.id !== productId)
        });

        if (isAuthenticated) {
          try {
            await cartApi.removeItem(productId);
          } catch (error) {
            console.error('Failed to remove from cart on server:', error);
          }
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        if (quantity <= 0) {
          await get().removeFromCart(productId);
          return;
        }

        const item = get().items.find(i => i.product.id === productId);
        if (!item) return;
        
        // Stok kontrolü
        if (quantity > item.product.stock) {
          toast.error(`Stok yetersiz! Maksimum ${item.product.stock} adet eklenebilir.`);
          return;
        }
        
        set({
          items: get().items.map(i =>
            i.product.id === productId
              ? { ...i, quantity }
              : i
          )
        });

        if (isAuthenticated) {
          try {
            await cartApi.updateItem(productId, quantity);
          } catch (error) {
            console.error('Failed to update cart on server:', error);
          }
        }
      },

      clearCart: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        set({ items: [], couponCode: null, discountAmount: 0 });

        if (isAuthenticated) {
          try {
            await cartApi.clear();
          } catch (error) {
            console.error('Failed to clear cart on server:', error);
          }
        }
      },

      applyCoupon: (code: string) => {
        const upperCode = code.toUpperCase();
        if (COUPONS[upperCode]) {
          set({ 
            couponCode: upperCode, 
            discountAmount: COUPONS[upperCode] 
          });
          return true;
        }
        return false;
      },

      removeCoupon: () => {
        set({ couponCode: null, discountAmount: 0 });
      },

      isInCart: (productId: string) => {
        return get().items.some(item => item.product.id === productId);
      },

      getCartItem: (productId: string) => {
        return get().items.find(item => item.product.id === productId);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items, 
        couponCode: state.couponCode,
        discountAmount: state.discountAmount 
      })
    }
  )
);
