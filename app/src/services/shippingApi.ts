/**
 * Shipping/Kargo API Service
 * Kargo oluşturma, takip, barkod alma
 */

import { fetchApi } from './api';

export interface CreateShipmentRequest {
  orderId: string;
  provider?: 'yurtici' | 'aras' | 'mng' | 'ptt';
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverDistrict: string;
  receiverPhone: string;
  receiverEmail?: string;
  weight?: number;
  description?: string;
  cargoType?: 'STANDARD' | 'VALUABLE';
  paymentType?: 'PREPAID' | 'COLLECT';
  collectionPrice?: number;
}

export interface Shipment {
  shippingId: string;
  orderId: string;
  provider: string;
  trackingNumber: string;
  status: string;
  receiver: {
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email?: string;
  };
  weight: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingInfo {
  status: string;
  location?: string;
  date?: string;
  details?: Array<{
    operation: string;
    location: string;
    date: string;
  }>;
}

export const shippingApi = {
  /**
   * Yeni kargo oluştur
   */
  create: async (data: CreateShipmentRequest): Promise<{
    success: boolean;
    shipment?: Shipment;
    error?: string;
  }> => {
    return fetchApi('/shipping', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Kargo takip sorgula
   */
  track: async (trackingNumber: string, provider?: string): Promise<{
    success: boolean;
    tracking?: TrackingInfo;
    error?: string;
  }> => {
    return fetchApi(`/shipping/track/${trackingNumber}?provider=${provider || 'yurtici'}`);
  },

  /**
   * Siparişe ait kargoları getir
   */
  getByOrder: async (orderId: string): Promise<{
    shipments: Shipment[];
  }> => {
    return fetchApi(`/shipping/order/${orderId}`);
  },

  /**
   * Kargo iptal et
   */
  cancel: async (shippingId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    return fetchApi(`/shipping/${shippingId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Barkod/PDF oluştur
   */
  createBarcode: async (trackingNumbers: string[], provider?: string): Promise<{
    success: boolean;
    pdfBase64?: string;
    error?: string;
  }> => {
    return fetchApi('/shipping/barcode', {
      method: 'POST',
      body: JSON.stringify({ trackingNumbers, provider: provider || 'yurtici' }),
    });
  },

  /**
   * Bağlantı testi
   */
  testConnection: async (provider: string): Promise<{
    success: boolean;
    message: string;
    mode?: string;
  }> => {
    return fetchApi(`/shipping/test/${provider}`);
  },
};

export default shippingApi;
