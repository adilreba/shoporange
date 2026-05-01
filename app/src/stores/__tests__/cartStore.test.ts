import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';
import * as api from '@/services/api';

// Mock API
vi.mock('@/services/api', () => ({
  cartApi: {
    addItem: vi.fn().mockResolvedValue({}),
    removeItem: vi.fn().mockResolvedValue({}),
    updateItem: vi.fn().mockResolvedValue({}),
    clear: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

// Mock authStore
vi.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({
      isAuthenticated: false,
    }),
  },
  onLogout: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  price: 100,
  stock: 10,
  images: ['image1.jpg'],
  description: 'Test',
  brand: 'Test Brand',
  sku: 'SKU-1',
  rating: 4.5,
  reviewCount: 10,
  category: 'electronics' as any,
};

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      couponCode: null,
      discountAmount: 0,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should add product to cart', async () => {
      await useCartStore.getState().addToCart(mockProduct, 2);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(useCartStore.getState().items[0].product.id).toBe('prod-1');
    });

    it('should increase quantity if product already in cart', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      await useCartStore.getState().addToCart(mockProduct, 2);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it('should not add if stock is insufficient', async () => {
      const lowStockProduct = { ...mockProduct, stock: 1 };
      await useCartStore.getState().addToCart(lowStockProduct, 2);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('removeFromCart', () => {
    it('should remove product from cart', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      await useCartStore.getState().removeFromCart('prod-1');

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update product quantity', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      await useCartStore.getState().updateQuantity('prod-1', 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      await useCartStore.getState().updateQuantity('prod-1', 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('totalItems', () => {
    it('should calculate total items', async () => {
      await useCartStore.getState().addToCart(mockProduct, 2);
      await useCartStore.getState().addToCart({ ...mockProduct, id: 'prod-2' }, 3);

      expect(useCartStore.getState().totalItems()).toBe(5);
    });
  });

  describe('totalPrice', () => {
    it('should calculate total price', async () => {
      await useCartStore.getState().addToCart(mockProduct, 2);

      expect(useCartStore.getState().totalPrice()).toBe(200);
    });
  });

  describe('finalPrice', () => {
    it('should apply shipping and discount', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      useCartStore.setState({ discountAmount: 10 });

      const finalPrice = useCartStore.getState().finalPrice();
      // total: 100, shipping: 49 (çünkü < 500), discount: %10 = 10
      // final: 100 + 49 - 10 = 139
      expect(finalPrice).toBe(139);
    });

    it('should have free shipping over 500', async () => {
      const expensiveProduct = { ...mockProduct, price: 600 };
      await useCartStore.getState().addToCart(expensiveProduct, 1);

      expect(useCartStore.getState().shippingCost()).toBe(0);
    });
  });

  describe('applyCoupon', () => {
    it('should apply valid coupon', () => {
      const result = useCartStore.getState().applyCoupon('INDIRIM10');

      expect(result).toBe(true);
      expect(useCartStore.getState().discountAmount).toBe(10);
    });

    it('should reject invalid coupon', () => {
      const result = useCartStore.getState().applyCoupon('INVALID');

      expect(result).toBe(false);
      expect(useCartStore.getState().discountAmount).toBe(0);
    });
  });

  describe('removeCoupon', () => {
    it('should remove coupon', () => {
      useCartStore.setState({ couponCode: 'INDIRIM10', discountAmount: 10 });
      useCartStore.getState().removeCoupon();

      expect(useCartStore.getState().couponCode).toBeNull();
      expect(useCartStore.getState().discountAmount).toBe(0);
    });
  });

  describe('isInCart', () => {
    it('should check if product is in cart', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);

      expect(useCartStore.getState().isInCart('prod-1')).toBe(true);
      expect(useCartStore.getState().isInCart('prod-2')).toBe(false);
    });
  });

  describe('clearCart', () => {
    it('should clear all items', async () => {
      await useCartStore.getState().addToCart(mockProduct, 1);
      await useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });
});
