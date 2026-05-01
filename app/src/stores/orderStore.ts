import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ordersApi } from '@/services/api';
import { toast } from 'sonner';
import { useCartStore } from './cartStore';
import { useStockStore } from './stockStore';
import { analytics } from '@/lib/analytics';

export interface StoreOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StoreOrder {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  items: StoreOrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash_on_delivery';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  trackingNumber?: string;
  shippingCompany?: string;
  legalConsents?: {
    preInfoAccepted: boolean;
    distanceSalesAccepted: boolean;
    marketingConsent: boolean;
    acceptedAt: string;
  };
}

interface OrderState {
  orders: StoreOrder[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addOrder: (order: Omit<StoreOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'>) => Promise<StoreOrder>;
  updateOrderStatus: (orderId: string, status: StoreOrder['status']) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: StoreOrder['paymentStatus']) => Promise<void>;
  updateTrackingInfo: (orderId: string, trackingNumber: string, shippingCompany: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  getOrderById: (orderId: string) => StoreOrder | undefined;
  getOrdersByEmail: (email: string) => StoreOrder[];
  getAllOrders: () => StoreOrder[];
  fetchOrdersFromServer: () => Promise<void>;
  refundOrder: (orderId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,
      error: null,

      addOrder: async (orderData) => {
        const newOrder: StoreOrder = {
          ...orderData,
          id: `ORD-${Date.now()}`,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // API'ye göndermeyi dene
        try {
          const savedOrder = await ordersApi.create({
            customer: newOrder.customer,
            email: newOrder.email,
            phone: newOrder.phone,
            shippingAddress: newOrder.address,
            items: newOrder.items,
            total: newOrder.total,
            paymentMethod: newOrder.paymentMethod,
            notes: newOrder.notes,
            legalConsents: newOrder.legalConsents,
          });
          
          // API'den dönen order ID'yi kullan
          if (savedOrder && savedOrder.id) {
            newOrder.id = savedOrder.id;
          }
        } catch (error) {
          console.error('Failed to save order to server:', error);
          // Local olarak devam et
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));

        // Analytics: Purchase event
        analytics.purchase({
          transaction_id: newOrder.id,
          value: newOrder.total,
          currency: 'TRY',
          coupon: (newOrder as any).couponCode,
          items: newOrder.items.map(item => ({
            item_id: item.productId,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        });

        // Sipariş sonrası sepeti ve rezervasyonu temizle
        try {
          await useCartStore.getState().clearCart();
          useStockStore.getState().clearReservation();
        } catch (e) {
          console.error('Post-order cleanup error:', e);
        }

        return newOrder;
      },

      updateOrderStatus: async (orderId, status) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) {
          toast.error('Sipariş bulunamadı');
          return;
        }

        // API'ye göndermeyi dene
        try {
          await ordersApi.updateStatus(orderId, status);
        } catch (error) {
          console.error('Failed to update order status on server:', error);
        }

        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order
          ),
        }));
        
        // Bildirim göster
        const statusLabels: Record<string, string> = {
          pending: 'Beklemede',
          processing: 'İşleniyor',
          shipped: 'Kargoda',
          completed: 'Tamamlandı',
          cancelled: 'İptal Edildi',
          refunded: 'İade Edildi'
        };
        toast.success(`Sipariş durumu güncellendi: ${statusLabels[status]}`);
      },

      updatePaymentStatus: async (orderId, paymentStatus) => {
        // API'ye göndermeyi dene
        try {
          const order = get().orders.find(o => o.id === orderId);
          if (order) {
            await ordersApi.update(orderId, { ...order, paymentStatus });
          }
        } catch (error) {
          console.error('Failed to update payment status on server:', error);
        }

        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus, updatedAt: new Date().toISOString() }
              : order
          ),
        }));
      },

      updateTrackingInfo: async (orderId, trackingNumber, shippingCompany) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) {
          toast.error('Sipariş bulunamadı');
          return;
        }

        // API'ye göndermeyi dene
        try {
          await ordersApi.update(orderId, { 
            ...order, 
            trackingNumber, 
            shippingCompany,
            status: 'shipped' 
          });
        } catch (error) {
          console.error('Failed to update tracking info on server:', error);
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { 
                  ...o, 
                  trackingNumber, 
                  shippingCompany, 
                  status: 'shipped',
                  updatedAt: new Date().toISOString() 
                }
              : o
          ),
        }));
        
        toast.success('Kargo bilgileri güncellendi');
      },

      cancelOrder: async (orderId, reason) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) {
          toast.error('Sipariş bulunamadı');
          return;
        }

        if (order.status === 'completed') {
          toast.error('Tamamlanmış sipariş iptal edilemez. İade işlemi yapın.');
          return;
        }

        if (order.status === 'cancelled') {
          toast.error('Sipariş zaten iptal edilmiş.');
          return;
        }

        // API'ye göndermeyi dene
        try {
          await ordersApi.updateStatus(orderId, 'cancelled');
        } catch (error) {
          console.error('Failed to cancel order on server:', error);
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { 
                  ...o, 
                  status: 'cancelled', 
                  notes: reason ? `${o.notes || ''} | İptal Nedeni: ${reason}` : o.notes,
                  updatedAt: new Date().toISOString() 
                }
              : o
          ),
        }));
        
        toast.success('Sipariş iptal edildi. Stok otomatik olarak güncellendi.');
      },
      
      refundOrder: async (orderId) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) {
          toast.error('Sipariş bulunamadı');
          return;
        }

        if (order.status !== 'completed') {
          toast.error('Sadece tamamlanmış siparişler iade edilebilir.');
          return;
        }

        // API'ye göndermeyi dene
        try {
          await ordersApi.updateStatus(orderId, 'refunded');
        } catch (error) {
          console.error('Failed to refund order on server:', error);
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { 
                  ...o, 
                  status: 'refunded',
                  paymentStatus: 'refunded',
                  updatedAt: new Date().toISOString() 
                }
              : o
          ),
        }));
        
        toast.success('Sipariş iade edildi. Stok otomatik olarak güncellendi.');
      },

      getOrderById: (orderId) => {
        return get().orders.find((order) => order.id === orderId);
      },

      getOrdersByEmail: (email) => {
        return get().orders.filter((order) => order.email === email);
      },

      getAllOrders: () => {
        return get().orders;
      },
      
      fetchOrdersFromServer: async () => {
        set({ isLoading: true, error: null });
        try {
          const orders = await ordersApi.getAll();
          if (Array.isArray(orders)) {
            set({ orders, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to fetch orders:', error);
          set({ error: 'Siparişler yüklenirken hata oluştu', isLoading: false });
        }
      },
    }),
    {
      name: 'atushome-orders',
      partialize: (state) => ({
        orders: state.orders,
      }),
    }
  )
);
