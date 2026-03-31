import { fetchApi } from './api';

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isActive: boolean;
  isTestMode: boolean;
  sortOrder: number;
  config: Record<string, any>;
  supportedCurrencies: string[];
  requires3D: boolean;
  installmentEnabled: boolean;
  maxInstallment?: number;
  minAmount?: number;
  maxAmount?: number;
  lastUpdated: string;
  updatedBy?: string;
  // API key durumu (güvenli)
  apiKeyConfigured?: boolean;
  apiKeyStatus?: 'configured' | 'not_configured';
  apiKeyLast4?: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  provider: string;
  mode?: string;
  note?: string;
}

// Admin API'leri
export const paymentMethodsAdminApi = {
  // Tüm ödeme yöntemlerini getir
  getAll: async (): Promise<PaymentMethod[]> => {
    return fetchApi('/payment-methods/admin');
  },

  // ID ile getir
  getById: async (id: string): Promise<PaymentMethod> => {
    return fetchApi(`/payment-methods/${id}/admin`);
  },

  // Güncelle
  update: async (id: string, data: Partial<PaymentMethod>): Promise<void> => {
    return fetchApi(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Bağlantı testi
  testConnection: async (id: string): Promise<TestConnectionResult> => {
    return fetchApi(`/payment-methods/${id}/test`, {
      method: 'POST',
    });
  },

  // Varsayılanları oluştur
  seed: async (): Promise<{ message: string }> => {
    return fetchApi('/payment-methods/seed', {
      method: 'POST',
    });
  },
};

// Public API'ler
export const paymentMethodsPublicApi = {
  // Aktif ödeme yöntemlerini getir
  getActive: async (): Promise<PaymentMethod[]> => {
    return fetchApi('/payment-methods');
  },
};
