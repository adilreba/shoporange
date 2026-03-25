import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InvoiceType = 'EFATURA' | 'EARSIV';
export type InvoiceStatus = 'pending' | 'processing' | 'sent' | 'error' | 'cancelled';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  kdvRate: number; // 0, 1, 8, 18, 20
  kdvAmount: number;
}

export interface InvoiceAddress {
  title: string;
  fullName: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  country: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  customerId?: string;
  
  // Fatura Bilgileri
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Fatura Tipi
  type: InvoiceType;
  status: InvoiceStatus;
  
  // Gönderici (Satıcı)
  sender: {
    companyName: string;
    taxNumber: string;
    taxOffice: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
    website?: string;
  };
  
  // Alıcı (Müşteri)
  recipient: {
    type: 'individual' | 'company';
    name: string;
    taxNumber?: string;
    taxOffice?: string;
    tcNumber?: string; // Bireysel için
    address: InvoiceAddress;
    email: string;
    phone: string;
  };
  
  // Ürünler
  items: InvoiceItem[];
  
  // Özet
  subtotal: number; // Ara toplam (KDV hariç)
  totalKDV: number; // Toplam KDV
  totalDiscount: number; // Toplam indirim
  total: number; // Genel toplam
  
  // Paraşüt/Logo entegrasyonu için
  externalId?: string; // Paraşüt/Logo fatura ID
  externalStatus?: string;
  
  // Notlar
  notes?: string;
  paymentMethod?: string;
  
  // Tarihler
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// e-Fatura entegrasyon ayarları
export interface InvoiceProvider {
  id: string;
  name: string; // 'parasut', 'logo', 'efatura-gib'
  isActive: boolean;
  isDefault: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    companyId?: string;
    testMode: boolean;
  };
  settings: {
    autoCreateInvoice: boolean;
    autoSendInvoice: boolean;
    defaultInvoiceType: InvoiceType;
    prefix: string; // Fatura numarası öneki (örn: INV-2024-)
    startingNumber: number;
  };
}

interface InvoiceState {
  invoices: Invoice[];
  providers: InvoiceProvider[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  cancelInvoice: (id: string, reason: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByOrderId: (orderId: string) => Invoice[];
  getInvoicesByCustomer: (customerEmail: string) => Invoice[];
  
  // Provider Actions
  addProvider: (provider: Omit<InvoiceProvider, 'id'>) => void;
  updateProvider: (id: string, updates: Partial<InvoiceProvider>) => void;
  deleteProvider: (id: string) => void;
  getActiveProvider: () => InvoiceProvider | undefined;
  
  // Fatura oluşturma
  generateInvoiceNumber: (prefix?: string) => string;
  createInvoiceFromOrder: (order: any) => Invoice | null;
  
  // PDF/Print
  downloadPDF: (invoiceId: string) => Promise<boolean>;
  sendEmail: (invoiceId: string, email?: string) => Promise<boolean>;
  
  // İstatistikler
  getInvoiceStats: () => {
    total: number;
    pending: number;
    sent: number;
    error: number;
    totalAmount: number;
    monthlyStats: Record<string, number>;
  };
}

// Mock fatura numarası oluşturucu
const generateInvoiceNumber = (prefix: string = 'INV', existingInvoices: Invoice[]): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Aynı prefix ile kaç fatura var
  const samePrefixCount = existingInvoices.filter(inv => 
    inv.invoiceNumber.startsWith(`${prefix}-${year}${month}`)
  ).length;
  
  const sequence = String(samePrefixCount + 1).padStart(4, '0');
  return `${prefix}-${year}${month}-${sequence}`;
};

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      providers: [],
      isLoading: false,
      error: null,

      addInvoice: (invoiceData) => {
        const now = new Date().toISOString();
        const activeProvider = get().getActiveProvider();
        
        const prefix = activeProvider?.settings.prefix || 'INV';
        const invoiceNumber = generateInvoiceNumber(prefix, get().invoices);
        
        const newInvoice: Invoice = {
          ...invoiceData,
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          invoiceNumber,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
        }));

        return newInvoice;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? { ...invoice, ...updates, updatedAt: new Date().toISOString() }
              : invoice
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        }));
      },

      cancelInvoice: (id, reason) => {
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? { 
                  ...invoice, 
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  cancelReason: reason,
                  updatedAt: new Date().toISOString()
                }
              : invoice
          ),
        }));
      },

      getInvoiceById: (id) => {
        return get().invoices.find((i) => i.id === id);
      },

      getInvoicesByOrderId: (orderId) => {
        return get().invoices.filter((i) => i.orderId === orderId);
      },

      getInvoicesByCustomer: (customerEmail) => {
        return get().invoices.filter((i) => i.recipient.email === customerEmail);
      },

      // Provider Actions
      addProvider: (providerData) => {
        const newProvider: InvoiceProvider = {
          ...providerData,
          id: `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => {
          if (state.providers.length === 0) {
            newProvider.isDefault = true;
          }
          return {
            providers: [...state.providers, newProvider],
          };
        });
      },

      updateProvider: (id, updates) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProvider: (id) => {
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
        }));
      },

      getActiveProvider: () => {
        return get().providers.find((p) => p.isActive && p.isDefault);
      },

      generateInvoiceNumber: (prefix = 'INV') => {
        return generateInvoiceNumber(prefix, get().invoices);
      },

      createInvoiceFromOrder: (order) => {
        if (!order) return null;

        const activeProvider = get().getActiveProvider();
        const defaultSender = {
          companyName: 'AtusHome E-Ticaret A.Ş.',
          taxNumber: '1234567890',
          taxOffice: 'Ataşehir Vergi Dairesi',
          address: 'Ataşehir Bulvarı No:123',
          city: 'İstanbul',
          district: 'Ataşehir',
          phone: '0850 123 45 67',
          email: 'info@atushome.com',
        };

        // KDV hesaplama
        const items: InvoiceItem[] = order.items?.map((item: any, index: number) => {
          const unitPrice = item.price || item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const totalPrice = unitPrice * quantity;
          const kdvRate = 20; // Varsayılan %20 KDV
          const kdvAmount = (totalPrice * kdvRate) / 100;

          return {
            id: `item_${index}`,
            name: item.name || item.productName || 'Ürün',
            quantity,
            unitPrice,
            totalPrice,
            kdvRate,
            kdvAmount,
          };
        }) || [];

        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalKDV = items.reduce((sum, item) => sum + item.kdvAmount, 0);
        const totalDiscount = order.discountAmount || 0;
        const total = order.total || (subtotal + totalKDV - totalDiscount);

        const invoiceData = {
          orderId: order.id,
          customerId: order.userId,
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün vade
          type: (activeProvider?.settings.defaultInvoiceType || 'EFATURA') as InvoiceType,
          status: 'pending' as InvoiceStatus,
          sender: defaultSender,
          recipient: {
            type: 'individual' as const,
            name: order.customer || order.shippingAddress?.fullName || 'Müşteri',
            address: {
              title: 'Teslimat Adresi',
              fullName: order.shippingAddress?.fullName || order.customer || '',
              address: order.shippingAddress?.addressLine || order.address?.street || '',
              city: order.shippingAddress?.city || order.address?.city || '',
              district: order.shippingAddress?.district || '',
              zipCode: order.shippingAddress?.zipCode || order.address?.postalCode || '',
              country: 'Türkiye',
            },
            email: order.email || '',
            phone: order.phone || order.shippingAddress?.phone || '',
          },
          items,
          subtotal,
          totalKDV,
          totalDiscount,
          total,
          paymentMethod: order.paymentMethod,
          notes: order.notes || '',
        };

        return get().addInvoice(invoiceData);
      },

      downloadPDF: async (_invoiceId) => {
        // Simüle edilmiş PDF indirme
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        });
      },

      sendEmail: async (_invoiceId, _email) => {
        // Simüle edilmiş e-posta gönderimi
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 1000);
        });
      },

      getInvoiceStats: () => {
        const invoices = get().invoices;
        
        const monthlyStats: Record<string, number> = {};
        invoices.forEach((inv) => {
          const month = inv.invoiceDate.substring(0, 7);
          monthlyStats[month] = (monthlyStats[month] || 0) + inv.total;
        });

        return {
          total: invoices.length,
          pending: invoices.filter((i) => i.status === 'pending').length,
          sent: invoices.filter((i) => i.status === 'sent').length,
          error: invoices.filter((i) => i.status === 'error').length,
          totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
          monthlyStats,
        };
      },
    }),
    {
      name: 'invoice-storage',
    }
  )
);
