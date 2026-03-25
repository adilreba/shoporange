// Stock Management API Services
import { fetchApi } from './api';

export interface StockCheckResponse {
  productId: string;
  requestedQuantity: number;
  availableStock: number;
  reservedStock: number;
  actualAvailable: number;
  inStock: boolean;
  canAddToCart: boolean;
}

export interface StockReservationItem {
  productId: string;
  quantity: number;
}

export interface StockReservationResponse {
  success: boolean;
  reservationId: string;
  message: string;
  expiresAt: string;
  items: Array<{
    productId: string;
    productName: string;
    reserved: number;
  }>;
}

export interface Reservation {
  reservationId: string;
  userId: string;
  items: StockReservationItem[];
  status: 'reserved' | 'released' | 'confirmed';
  createdAt: string;
  expiresAt: number;
}

// Stock API object
export const stockApi = {
  // Check stock availability for a product
  checkStock: async (productId: string, quantity: number = 1): Promise<StockCheckResponse> => {
    return fetchApi(`/stock/check/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  },

  // Reserve stock for cart items
  reserveStock: async (
    userId: string, 
    items: StockReservationItem[],
    reservationId?: string
  ): Promise<StockReservationResponse> => {
    return fetchApi('/stock/reserve', {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        items,
        reservationId,
      }),
    });
  },

  // Release stock reservation (when cart is abandoned)
  releaseStock: async (reservationId: string, userId: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi(`/stock/release/${reservationId}`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // Confirm stock deduction (after successful payment)
  confirmStock: async (
    reservationId: string, 
    userId: string,
    items: StockReservationItem[]
  ): Promise<{ success: boolean; message: string }> => {
    return fetchApi(`/stock/confirm/${reservationId}`, {
      method: 'POST',
      body: JSON.stringify({ userId, items }),
    });
  },

  // Update stock (Admin only)
  updateStock: async (
    productId: string, 
    stock: number, 
    reason?: string
  ): Promise<{ success: boolean; message: string; productId: string; newStock: number }> => {
    return fetchApi(`/stock/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock, reason }),
    });
  },

  // Bulk update stock (Admin only)
  bulkUpdateStock: async (
    updates: Array<{ productId: string; stock: number }>
  ): Promise<{ success: boolean; message: string; results: any[] }> => {
    return fetchApi('/stock/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  },

  // Get user's active reservations
  getUserReservations: async (userId: string): Promise<{ reservations: Reservation[]; total: number }> => {
    return fetchApi(`/stock/reservations/${userId}`);
  },

  // Get low stock products (Admin only)
  getLowStockProducts: async (threshold: number = 10): Promise<{ products: any[]; threshold: number }> => {
    return fetchApi(`/stock/low-stock?threshold=${threshold}`);
  },

  // Check stock for multiple products
  checkMultipleStocks: async (
    items: Array<{ productId: string; quantity: number }>
  ): Promise<StockCheckResponse[]> => {
    return Promise.all(
      items.map(item => stockApi.checkStock(item.productId, item.quantity))
    );
  },

  // Validate cart stock before checkout
  validateCartStock: async (
    items: Array<{ productId: string; quantity: number }>
  ): Promise<{
    valid: boolean;
    insufficientItems: Array<{
      productId: string;
      requested: number;
      available: number;
    }>;
    checks: StockCheckResponse[];
  }> => {
    const checks = await stockApi.checkMultipleStocks(items);
    
    const insufficientItems = checks
      .filter(check => !check.inStock)
      .map(check => ({
        productId: check.productId,
        requested: check.requestedQuantity,
        available: check.actualAvailable,
      }));

    return {
      valid: insufficientItems.length === 0,
      insufficientItems,
      checks,
    };
  },
};
