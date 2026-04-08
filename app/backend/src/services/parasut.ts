/**
 * Paraşüt API Entegrasyon Servisi
 * e-Fatura / e-Arşiv gönderimi için
 * 
 * Paraşüt API Docs: https://apidocs.parasut.com/
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

// Paraşüt API yapılandırması
interface ParasutConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  companyId: string;
  baseUrl: string;
}

// Paraşüt API token yönetimi
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Paraşüt API yapılandırmasını Secrets Manager'dan al
 */
async function getParasutConfig(): Promise<ParasutConfig> {
  try {
    const secret = await secretsManager.send(new GetSecretValueCommand({
      SecretId: process.env.PARASUT_SECRET_NAME || 'atushome/parasut',
    }));
    
    if (!secret.SecretString) {
      throw new Error('Paraşüt yapılandırması bulunamadı');
    }
    
    return JSON.parse(secret.SecretString);
  } catch (error) {
    console.error('Paraşüt yapılandırması alınamadı:', error);
    
    // Mock mode için fallback
    if (process.env.PARASUT_MOCK_MODE === 'true') {
      return {
        clientId: 'mock',
        clientSecret: 'mock',
        username: 'mock',
        password: 'mock',
        companyId: 'mock',
        baseUrl: 'https://api.parasut.com/v4',
      };
    }
    
    throw new Error('Paraşüt yapılandırması eksik');
  }
}

/**
 * Paraşüt API'den access token al
 */
async function getAccessToken(): Promise<string> {
  // Token hala geçerli mi?
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }
  
  const config = await getParasutConfig();
  
  // Mock mode
  if (config.clientId === 'mock') {
    accessToken = 'mock_token';
    tokenExpiry = Date.now() + 3600000; // 1 saat
    return accessToken;
  }
  
  try {
    const response = await fetch(`${config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        username: config.username,
        password: config.password,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token alınamadı: ${response.status}`);
    }
    
    const data = await response.json() as { access_token: string; expires_in: number };
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 dakika buffer
    
    return accessToken;
  } catch (error) {
    console.error('Paraşüt token hatası:', error);
    throw new Error('Paraşüt API bağlantısı kurulamadı');
  }
}

/**
 * Paraşüt API çağrısı yap
 */
async function parasutApiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const config = await getParasutConfig();
  const token = await getAccessToken();
  
  // Mock mode
  if (config.clientId === 'mock') {
    console.log('[MOCK] Paraşüt API çağrısı:', { endpoint, method, body });
    return { data: { id: `mock_${Date.now()}`, attributes: {} } };
  }
  
  const url = `${config.baseUrl}/${config.companyId}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Paraşüt API hatası:', error);
    throw new Error(`Paraşüt API hatası: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Müşteri kontrolü / oluşturma
 */
async function findOrCreateCustomer(customerData: {
  name: string;
  email: string;
  phone?: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  city?: string;
  district?: string;
}): Promise<string> {
  try {
    // Tax number varsa ona göre ara
    if (customerData.taxNumber) {
      const searchResult = await parasutApiCall(`/contacts?filter[tax_number]=${customerData.taxNumber}`);
      if (searchResult.data && searchResult.data.length > 0) {
        return searchResult.data[0].id;
      }
    }
    
    // Email ile ara
    const searchByEmail = await parasutApiCall(`/contacts?filter[email]=${customerData.email}`);
    if (searchByEmail.data && searchByEmail.data.length > 0) {
      return searchByEmail.data[0].id;
    }
    
    // Yeni müşteri oluştur
    const newCustomer = await parasutApiCall('/contacts', 'POST', {
      data: {
        type: 'contacts',
        attributes: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          tax_number: customerData.taxNumber,
          tax_office: customerData.taxOffice,
          address: customerData.address,
          city: customerData.city,
          district: customerData.district,
          account_type: customerData.taxNumber ? 'company' : 'person',
        },
      },
    });
    
    return newCustomer.data.id;
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    throw error;
  }
}

/**
 * Paraşüt'te fatura oluştur ve GİB'e gönder
 */
export async function createEInvoice(invoiceData: {
  invoiceNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    taxNumber?: string;
    taxOffice?: string;
    address?: string;
    city?: string;
    district?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  total: number;
  vatTotal: number;
  grandTotal: number;
  invoiceType: 'EFATURA' | 'EARSIV';
  orderId: string;
}): Promise<{
  success: boolean;
  parasutInvoiceId?: string;
  pdfUrl?: string;
  error?: string;
}> {
  try {
    // 1. Müşteriyi bul/oluştur
    const customerId = await findOrCreateCustomer(invoiceData.customer);
    
    // 2. Fatura kalemlerini hazırla
    const invoiceDetails = invoiceData.items.map(item => ({
      type: 'sales_invoice_details',
      attributes: {
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
        description: item.name,
      },
    }));
    
    // 3. Fatura oluştur
    const invoicePayload = {
      data: {
        type: 'sales_invoices',
        attributes: {
          invoice_no: invoiceData.invoiceNumber,
          invoice_series: 'A',
          invoice_id: invoiceData.invoiceNumber,
          currency: 'TRL',
          exchange_rate: 1,
          net_total: invoiceData.total,
          vat_total: invoiceData.vatTotal,
          total: invoiceData.grandTotal,
          payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Sipariş #${invoiceData.orderId}`,
          // e-Fatura/e-Arşiv özellikleri
          invoice_type: invoiceData.invoiceType === 'EFATURA' ? 'efatura' : 'earsiv',
          scenario: 'basic',
        },
        relationships: {
          contact: {
            data: {
              type: 'contacts',
              id: customerId,
            },
          },
          details: {
            data: invoiceDetails,
          },
        },
      },
    };
    
    const createdInvoice = await parasutApiCall('/sales_invoices', 'POST', invoicePayload);
    const invoiceId = createdInvoice.data.id;
    
    // 4. e-Fatura/e-Arşiv olarak gönder
    let pdfUrl: string | undefined;
    
    if (invoiceData.invoiceType === 'EFATURA') {
      // E-Fatura oluştur
      const eInvoice = await parasutApiCall(`/sales_invoices/${invoiceId}/e_invoice`, 'POST', {
        data: {
          type: 'e_invoices',
          attributes: {
            scenario: 'basic',
            to: 'gib',
          },
        },
      });
      
      // PDF URL'sini al
      pdfUrl = eInvoice.data.attributes?.pdf_url;
    } else {
      // E-Arşiv oluştur
      const eArchive = await parasutApiCall(`/sales_invoices/${invoiceId}/e_archives`, 'POST', {
        data: {
          type: 'e_archives',
          attributes: {
            scenario: 'basic',
          },
        },
      });
      
      // PDF URL'sini al
      pdfUrl = eArchive.data.attributes?.pdf_url;
    }
    
    return {
      success: true,
      parasutInvoiceId: invoiceId,
      pdfUrl,
    };
  } catch (error: any) {
    console.error('Paraşüt fatura oluşturma hatası:', error);
    return {
      success: false,
      error: error.message || 'Fatura oluşturulurken hata oluştu',
    };
  }
}

/**
 * Fatura durumunu kontrol et
 */
export async function getInvoiceStatus(parasutInvoiceId: string): Promise<{
  status: string;
  gibStatus?: string;
  pdfUrl?: string;
}> {
  try {
    const invoice = await parasutApiCall(`/sales_invoices/${parasutInvoiceId}`);
    
    // e-Fatura/e-Arşiv durumunu kontrol et
    let gibStatus = 'PENDING';
    let pdfUrl: string | undefined;
    
    try {
      const eInvoice = await parasutApiCall(`/sales_invoices/${parasutInvoiceId}/e_invoice`);
      gibStatus = eInvoice.data.attributes?.status || 'PENDING';
      pdfUrl = eInvoice.data.attributes?.pdf_url;
    } catch {
      // E-arşiv olabilir
      try {
        const eArchive = await parasutApiCall(`/sales_invoices/${parasutInvoiceId}/e_archive`);
        gibStatus = eArchive.data.attributes?.status || 'PENDING';
        pdfUrl = eArchive.data.attributes?.pdf_url;
      } catch {
        // Henüz e-fatura/e-arşiv oluşturulmamış
      }
    }
    
    return {
      status: invoice.data.attributes?.status || 'unknown',
      gibStatus,
      pdfUrl,
    };
  } catch (error) {
    console.error('Fatura durum kontrolü hatası:', error);
    throw error;
  }
}

/**
 * Fatura iptal et
 */
export async function cancelInvoice(parasutInvoiceId: string, reason: string): Promise<boolean> {
  try {
    await parasutApiCall(`/sales_invoices/${parasutInvoiceId}/cancel`, 'POST', {
      data: {
        type: 'sales_invoices',
        attributes: {
          cancellation_reason: reason,
        },
      },
    });
    return true;
  } catch (error) {
    console.error('Fatura iptal hatası:', error);
    return false;
  }
}

/**
 * Paraşüt bağlantı testi
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  companyName?: string;
}> {
  try {
    const config = await getParasutConfig();
    
    if (config.clientId === 'mock') {
      return {
        success: true,
        message: 'Mock mode aktif - Test başarılı',
        companyName: 'Test Şirketi',
      };
    }
    
    await getAccessToken();
    
    // Şirket bilgilerini al
    const company = await parasutApiCall('/company');
    
    return {
      success: true,
      message: 'Paraşüt bağlantısı başarılı',
      companyName: company.data.attributes?.name,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Bağlantı hatası',
    };
  }
}

export default {
  createEInvoice,
  getInvoiceStatus,
  cancelInvoice,
  testConnection,
};
