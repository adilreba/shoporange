import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  
  // Getters
  totalItems: () => number;
  totalPrice: () => number;
  finalPrice: () => number;
  shippingCost: () => number;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
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

      addToCart: (product: Product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= product.stock) {
            set({
              items: items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: newQuantity }
                  : item
              )
            });
          }
        } else {
          set({
            items: [...items, { product, quantity }]
          });
        }
      },

      removeFromCart: (productId: string) => {
        set({
          items: get().items.filter(item => item.product.id !== productId)
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        const item = get().items.find(i => i.product.id === productId);
        if (item && quantity <= item.product.stock) {
          set({
            items: get().items.map(i =>
              i.product.id === productId
                ? { ...i, quantity }
                : i
            )
          });
        }
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discountAmount: 0 });
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
