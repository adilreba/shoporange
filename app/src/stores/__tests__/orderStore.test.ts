import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOrderStore } from '../orderStore';
import * as api from '@/services/api';

// Mock API
vi.mock('@/services/api', () => ({
  ordersApi: {
    create: vi.fn(),
  },
}));

// Mock cartStore and stockStore
vi.mock('../cartStore', () => ({
  useCartStore: {
    getState: () => ({
      clearCart: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('../stockStore', () => ({
  useStockStore: {
    getState: () => ({
      clearReservation: vi.fn(),
    }),
  },
}));

describe('OrderStore', () => {
  beforeEach(() => {
    useOrderStore.setState({
      orders: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('addOrder', () => {
    it('should add order locally and call API', async () => {
      const orderData = {
        customer: 'Test User',
        email: 'test@example.com',
        phone: '5551234567',
        address: { street: 'Test St', city: 'Istanbul', postalCode: '34000' },
        items: [{ productId: '1', name: 'Test Product', price: 100, quantity: 2 }],
        total: 200,
        paymentMethod: 'credit_card' as const,
      };

      const order = await useOrderStore.getState().addOrder(orderData);

      expect(order.customer).toBe('Test User');
      expect(order.total).toBe(200);
      expect(order.status).toBe('pending');
      expect(useOrderStore.getState().orders).toHaveLength(1);
    });

    it('should handle API failure gracefully', async () => {
      vi.mocked(api.ordersApi.create).mockRejectedValue(new Error('API Error'));

      const orderData = {
        customer: 'Test User',
        email: 'test@example.com',
        phone: '5551234567',
        address: { street: 'Test St', city: 'Istanbul', postalCode: '34000' },
        items: [{ productId: '1', name: 'Test Product', price: 100, quantity: 1 }],
        total: 100,
        paymentMethod: 'credit_card' as const,
      };

      const order = await useOrderStore.getState().addOrder(orderData);

      expect(order).toBeDefined();
      expect(useOrderStore.getState().orders).toHaveLength(1);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', () => {
      useOrderStore.setState({
        orders: [
          {
            id: 'ORD-123',
            customer: 'Test',
            email: 'test@test.com',
            phone: '555',
            address: { street: '', city: '', postalCode: '' },
            items: [],
            total: 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      useOrderStore.getState().updateOrderStatus('ORD-123', 'processing');

      expect(useOrderStore.getState().orders[0].status).toBe('processing');
    });
  });

  describe('getOrderById', () => {
    it('should find order by ID', () => {
      useOrderStore.setState({
        orders: [
          {
            id: 'ORD-123',
            customer: 'Test',
            email: 'test@test.com',
            phone: '555',
            address: { street: '', city: '', postalCode: '' },
            items: [],
            total: 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const order = useOrderStore.getState().getOrderById('ORD-123');
      expect(order?.id).toBe('ORD-123');
    });

    it('should return undefined for non-existent order', () => {
      const order = useOrderStore.getState().getOrderById('NON-EXISTENT');
      expect(order).toBeUndefined();
    });
  });

  describe('getOrdersByEmail', () => {
    it('should filter orders by email', () => {
      useOrderStore.setState({
        orders: [
          {
            id: 'ORD-1',
            customer: 'A',
            email: 'a@test.com',
            phone: '555',
            address: { street: '', city: '', postalCode: '' },
            items: [],
            total: 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ORD-2',
            customer: 'B',
            email: 'b@test.com',
            phone: '555',
            address: { street: '', city: '', postalCode: '' },
            items: [],
            total: 200,
            status: 'completed',
            paymentStatus: 'completed',
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const orders = useOrderStore.getState().getOrdersByEmail('a@test.com');
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('ORD-1');
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders', () => {
      useOrderStore.setState({
        orders: [
          {
            id: 'ORD-1',
            customer: 'A',
            email: 'a@test.com',
            phone: '555',
            address: { street: '', city: '', postalCode: '' },
            items: [],
            total: 100,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'credit_card',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      expect(useOrderStore.getState().getAllOrders()).toHaveLength(1);
    });
  });
});
