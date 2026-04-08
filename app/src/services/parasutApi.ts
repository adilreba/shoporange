/**
 * Paraşüt API Frontend Service
 * e-Fatura / e-Arşiv yönetimi
 */

import { fetchApi } from './api';

// Mock mode kontrolü
const isMockMode = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '' || envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

export interface ParasutConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
  isTestMode: boolean;
}

export interface ParasutStatus {
  connected: boolean;
  companyName?: string;
  lastSync?: string;
  error?: string;
}

export interface EInvoiceRequest {
  invoiceId: string;
  invoiceType: 'EFATURA' | 'EARSIV';
}

export interface EInvoiceResponse {
  success: boolean;
  parasutInvoiceId?: string;
  pdfUrl?: string;
  error?: string;
}

// Mock mode için simülasyon
const mockParasutConfig: ParasutConfig = {
  clientId: 'mock_client_id',
  clientSecret: 'mock_client_secret',
  username: 'test@example.com',
  password: '********',
  companyId: '12345',
  isTestMode: true,
};

export const parasutApi = {
  /**
   * Paraşüt yapılandırmasını getir
   */
  getConfig: async (): Promise<ParasutConfig> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockParasutConfig;
    }
    return fetchApi('/admin/parasut/config');
  },

  /**
   * Paraşüt yapılandırmasını kaydet
   */
  saveConfig: async (config: ParasutConfig): Promise<{ success: boolean; message: string }> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Yapılandırma kaydedildi (Mock)' };
    }
    return fetchApi('/admin/parasut/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  /**
   * Paraşüt bağlantı testi
   */
  testConnection: async (): Promise<{ success: boolean; message: string; companyName?: string }> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Mock mode: Bağlantı başarılı',
        companyName: 'Test Şirketi Ltd. Şti.',
      };
    }
    return fetchApi('/admin/parasut/test');
  },

  /**
   * Bağlantı durumunu kontrol et
   */
  getStatus: async (): Promise<ParasutStatus> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        connected: true,
        companyName: 'Test Şirketi Ltd. Şti.',
        lastSync: new Date().toISOString(),
      };
    }
    return fetchApi('/admin/parasut/status');
  },

  /**
   * Faturayı Paraşüt üzerinden GİB'e gönder
   */
  sendInvoice: async (data: EInvoiceRequest): Promise<EInvoiceResponse> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        parasutInvoiceId: `PAR_${Date.now()}`,
        pdfUrl: `https://example.com/invoice/${data.invoiceId}.pdf`,
      };
    }
    return fetchApi(`/invoices/${data.invoiceId}/send-to-gib`, {
      method: 'POST',
      body: JSON.stringify({ invoiceType: data.invoiceType }),
    });
  },

  /**
   * Paraşüt'ten fatura durumunu senkronize et
   */
  syncInvoiceStatus: async (invoiceId: string): Promise<{
    success: boolean;
    status?: string;
    gibStatus?: string;
    pdfUrl?: string;
    error?: string;
  }> => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        status: 'sent',
        gibStatus: 'ACCEPTED',
        pdfUrl: `https://example.com/invoice/${invoiceId}.pdf`,
      };
    }
    return fetchApi(`/admin/parasut/invoices/${invoiceId}/sync`, {
      method: 'POST',
    });
  },
};

export default parasutApi;
