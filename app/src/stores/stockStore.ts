import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockApi } from '@/services/stockApi';
import { useAuthStore } from './authStore';

interface StockState {
  // State
  reservationId: string | null;
  reservedItems: Array<{
    productId: string;
    quantity: number;
    reservedAt: string;
    expiresAt: string;
  }>;
  isReserving: boolean;
  lastReservationTime: number | null;
  
  // Stock cache for quick lookups
  stockCache: Record<string, {
    available: number;
    reserved: number;
    actualAvailable: number;
    lastUpdated: number;
  }>;

  // Actions
  checkProductStock: (productId: string, quantity?: number) => Promise<{
    inStock: boolean;
    available: number;
    canAddToCart: boolean;
  }>;
  
  reserveCartStock: (items: Array<{ productId: string; quantity: number }>) => Promise<{
    success: boolean;
    reservationId?: string;
    error?: string;
    insufficientItems?: Array<{
      productId: string;
      productName: string;
      requested: number;
      available: number;
    }>;
  }>;
  
  releaseReservation: () => Promise<void>;
  confirmReservation: (items: Array<{ productId: string; quantity: number }>) => Promise<boolean>;
  refreshReservation: () => Promise<boolean>;
  clearReservation: () => void;
  clearStockCache: () => void;
  
  // Helpers
  isReservationValid: () => boolean;
  getReservationExpiry: () => Date | null;
  getCachedStock: (productId: string) => { available: number; actualAvailable: number } | null;
}

const RESERVATION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      reservationId: null,
      reservedItems: [],
      isReserving: false,
      lastReservationTime: null,
      stockCache: {},

      checkProductStock: async (productId: string, quantity = 1) => {
        const { stockCache } = get();
        
        // Check cache first (valid for 30 seconds)
        const cached = stockCache[productId];
        const now = Date.now();
        if (cached && (now - cached.lastUpdated) < 30000) {
          return {
            inStock: cached.actualAvailable >= quantity,
            available: cached.actualAvailable,
            canAddToCart: cached.actualAvailable > 0,
          };
        }

        try {
          const result = await stockApi.checkStock(productId, quantity);
          
          // Update cache
          set({
            stockCache: {
              ...stockCache,
              [productId]: {
                available: result.availableStock,
                reserved: result.reservedStock,
                actualAvailable: result.actualAvailable,
                lastUpdated: now,
              },
            },
          });

          return {
            inStock: result.inStock,
            available: result.actualAvailable,
            canAddToCart: result.canAddToCart,
          };
        } catch (error) {
          console.error('Error checking stock:', error);
          // Fallback to cached data if available
          if (cached) {
            return {
              inStock: cached.actualAvailable >= quantity,
              available: cached.actualAvailable,
              canAddToCart: cached.actualAvailable > 0,
            };
          }
          // If no cache, assume out of stock to be safe
          return {
            inStock: false,
            available: 0,
            canAddToCart: false,
          };
        }
      },

      reserveCartStock: async (items) => {
        const { reservationId: existingReservationId } = get();
        const user = useAuthStore.getState().user;
        
        if (!user) {
          return { success: false, error: 'Kullanıcı girişi gerekli' };
        }

        // Filter out items with 0 quantity
        const validItems = items.filter(item => item.quantity > 0);
        
        if (validItems.length === 0) {
          return { success: false, error: 'Sepet boş' };
        }

        set({ isReserving: true });

        try {
          const result = await stockApi.reserveStock(
            user.id,
            validItems,
            existingReservationId || undefined
          );

          if (result.success) {
            set({
              reservationId: result.reservationId,
              reservedItems: validItems.map(item => ({
                ...item,
                reservedAt: new Date().toISOString(),
                expiresAt: result.expiresAt,
              })),
              lastReservationTime: Date.now(),
              isReserving: false,
            });

            return {
              success: true,
              reservationId: result.reservationId,
            };
          }

          return {
            success: false,
            error: result.message || 'Stok rezervasyonu başarısız',
          };
        } catch (error: any) {
          console.error('Error reserving stock:', error);
          
          // Check if it's an insufficient stock error
          if (error.message?.includes('Insufficient stock')) {
            const insufficientItems = error.insufficientItems || [];
            return {
              success: false,
              error: 'Yetersiz stok',
              insufficientItems,
            };
          }

          set({ isReserving: false });
          return {
            success: false,
            error: error.message || 'Stok rezervasyonu başarısız oldu',
          };
        }
      },

      releaseReservation: async () => {
        const { reservationId } = get();
        const user = useAuthStore.getState().user;
        
        if (!reservationId || !user) return;

        try {
          await stockApi.releaseStock(reservationId, user.id);
          
          set({
            reservationId: null,
            reservedItems: [],
            lastReservationTime: null,
          });
        } catch (error) {
          console.error('Error releasing reservation:', error);
        }
      },

      confirmReservation: async (items) => {
        const { reservationId } = get();
        const user = useAuthStore.getState().user;
        
        if (!reservationId || !user) {
          console.error('No reservation to confirm');
          return false;
        }

        try {
          await stockApi.confirmStock(reservationId, user.id, items);
          
          // Clear reservation after successful confirmation
          set({
            reservationId: null,
            reservedItems: [],
            lastReservationTime: null,
          });

          return true;
        } catch (error) {
          console.error('Error confirming reservation:', error);
          return false;
        }
      },

      refreshReservation: async () => {
        const { reservedItems } = get();
        
        if (reservedItems.length === 0) {
          return true;
        }

        // Re-reserve to extend the expiration time
        const result = await get().reserveCartStock(reservedItems);
        return result.success;
      },

      clearReservation: () => {
        set({
          reservationId: null,
          reservedItems: [],
          lastReservationTime: null,
        });
      },

      clearStockCache: () => {
        set({ stockCache: {} });
      },

      isReservationValid: () => {
        const { lastReservationTime, reservationId } = get();
        
        if (!reservationId || !lastReservationTime) {
          return false;
        }

        const now = Date.now();
        return (now - lastReservationTime) < RESERVATION_DURATION;
      },

      getReservationExpiry: () => {
        const { lastReservationTime } = get();
        
        if (!lastReservationTime) {
          return null;
        }

        return new Date(lastReservationTime + RESERVATION_DURATION);
      },

      getCachedStock: (productId: string) => {
        const { stockCache } = get();
        const cached = stockCache[productId];
        
        if (!cached) return null;
        
        return {
          available: cached.available,
          actualAvailable: cached.actualAvailable,
        };
      },
    }),
    {
      name: 'stock-storage',
      partialize: (state) => ({
        reservationId: state.reservationId,
        reservedItems: state.reservedItems,
        lastReservationTime: state.lastReservationTime,
      }),
    }
  )
);

// Auto-refresh reservation every 20 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useStockStore.getState();
    if (store.reservationId && store.isReservationValid()) {
      // Only refresh if we have items and reservation is still valid
      if (store.reservedItems.length > 0) {
        store.refreshReservation();
      }
    }
  }, 20 * 60 * 1000); // 20 minutes
}
