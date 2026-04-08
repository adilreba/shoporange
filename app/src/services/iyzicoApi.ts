/**
 * İyzico Payment API Service (Frontend)
 * 3D Secure ödeme entegrasyonu
 */

import { fetchApi } from './api';

export interface IyzicoPaymentRequest {
  amount: number;
  currency?: string;
  installment?: number;
  orderId: string;
  customer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    identityNumber: string;
    address: string;
    city: string;
    country?: string;
    zipCode?: string;
    ip?: string;
  };
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country?: string;
    zipCode?: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    country?: string;
    zipCode?: string;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    subCategory?: string;
    price: number;
    quantity: number;
  }>;
}

export interface IyzicoPaymentResponse {
  success: boolean;
  paymentPageUrl?: string; // 3D Secure HTML formu
  conversationId?: string;
  paymentId?: string;
  error?: string;
  errorCode?: string;
}

export interface IyzicoInstallmentOption {
  installmentNumber: number;
  totalPrice: number;
  installmentPrice: number;
}

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  isTestMode: boolean;
  enabledInstallments: number[];
}

export const iyzicoApi = {
  /**
   * 3D Secure ödeme başlat
   */
  createPayment: async (data: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> => {
    return fetchApi('/payments/iyzico/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 3D Secure sonucu doğrula
   */
  verifyPayment: async (params: {
    paymentId: string;
    conversationData?: string;
    conversationId: string;
  }): Promise<{
    success: boolean;
    paymentId?: string;
    status?: string;
    cardFirstSix?: string;
    cardLastFour?: string;
    installment?: number;
    paidPrice?: number;
    error?: string;
  }> => {
    return fetchApi('/payments/iyzico/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Taksit seçeneklerini getir (BIN numarasına göre)
   */
  getInstallments: async (binNumber: string, price: number): Promise<{
    success: boolean;
    installments?: IyzicoInstallmentOption[];
    error?: string;
  }> => {
    return fetchApi(`/payments/iyzico/installments?bin=${binNumber}&price=${price}`);
  },

  /**
   * Ödemeyi iade et
   */
  refund: async (params: {
    paymentTransactionId: string;
    price: number;
    reason?: string;
  }): Promise<{
    success: boolean;
    refundId?: string;
    status?: string;
    error?: string;
  }> => {
    return fetchApi('/payments/iyzico/refund', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Ödemeyi iptal et
   */
  cancel: async (paymentId: string): Promise<{
    success: boolean;
    cancelId?: string;
    status?: string;
    error?: string;
  }> => {
    return fetchApi('/payments/iyzico/cancel', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  },

  /**
   * Ödeme detayını getir
   */
  getPaymentDetail: async (paymentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string;
  }> => {
    return fetchApi(`/payments/iyzico/detail/${paymentId}`);
  },
};

export default iyzicoApi;
