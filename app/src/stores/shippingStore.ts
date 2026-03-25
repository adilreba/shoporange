import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShippingCompanyType = 
  | 'yurtici' 
  | 'aras' 
  | 'mng' 
  | 'ptt' 
  | 'surat' 
  | 'trendyol'
  | 'hepsijet';

export interface ShippingCompany {
  id: string;
  type: ShippingCompanyType;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  // Şube bilgileri
  branchInfo: {
    branchName: string;      // Şube adı (örn: Kadıköy Şubesi)
    branchCity: string;      // Şehir (örn: İstanbul)
    branchDistrict?: string; // İlçe (örn: Kadıköy)
    branchCode: string;      // Şube kodu
    branchPhone?: string;    // Şube telefonu
    branchAddress?: string;  // Şube adresi
  };
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    customerId?: string;
    // Artık branchCode burada değil, branchInfo içinde
    testMode: boolean;
  };
  settings: {
    trackingUrl?: string;
    printFormat?: 'a4' | 'a5' | 'thermal';
    autoCreateShipment: boolean;
    autoSendSMS: boolean;
    // Hangi şehirlere/illere bu şube hizmet veriyor
    serviceCities: string[]; // ['İstanbul', 'Kocaeli', 'Sakarya']
    isRegionalHub: boolean;  // Bölge dağıtım merkezi mi?
  };
  createdAt: string;
  updatedAt: string;
}

interface ShippingState {
  companies: ShippingCompany[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addCompany: (company: Omit<ShippingCompany, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompany: (id: string, updates: Partial<ShippingCompany>) => void;
  deleteCompany: (id: string) => void;
  setDefaultCompany: (id: string) => void;
  toggleActive: (id: string) => void;
  getActiveCompanies: () => ShippingCompany[];
  getDefaultCompany: () => ShippingCompany | undefined;
  getCompanyById: (id: string) => ShippingCompany | undefined;
  // Şube bazlı sorgular
  getCompaniesByCity: (city: string) => ShippingCompany[];
  getCompaniesByType: (type: ShippingCompanyType) => ShippingCompany[];
  findBestCompanyForCity: (city: string, preferredType?: ShippingCompanyType) => ShippingCompany | undefined;
  // API Test
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>;
  // Toplu işlemler
  duplicateCompany: (id: string, newBranchInfo: Partial<ShippingCompany['branchInfo']>) => void;
}

const getDefaultCredentials = (type: ShippingCompanyType): ShippingCompany['credentials'] => {
  switch (type) {
    case 'yurtici':
      return {
        username: '',
        password: '',
        customerId: '',
        testMode: true,
      };
    case 'aras':
      return {
        username: '',
        password: '',
        customerId: '',
        testMode: true,
      };
    case 'mng':
      return {
        apiKey: '',
        apiSecret: '',
        username: '',
        password: '',
        testMode: true,
      };
    case 'ptt':
      return {
        username: '',
        password: '',
        customerId: '',
        testMode: true,
      };
    case 'surat':
      return {
        username: '',
        password: '',
        customerId: '',
        testMode: true,
      };
    case 'trendyol':
      return {
        apiKey: '',
        apiSecret: '',
        testMode: true,
      };
    case 'hepsijet':
      return {
        apiKey: '',
        apiSecret: '',
        testMode: true,
      };
    default:
      return {
        testMode: true,
      };
  }
};

export const shippingCompanyInfo: Record<ShippingCompanyType, { 
  name: string; 
  description: string;
  fields: { key: string; label: string; type: 'text' | 'password'; required: boolean; hint?: string }[];
  trackingUrl: string;
}> = {
  yurtici: {
    name: 'Yurtiçi Kargo',
    description: 'Türkiye\'nin en yaygın kargo şirketlerinden biri. Her şehirde birden fazla şube ile çalışabilirsiniz.',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customerId', label: 'Müşteri Numarası', type: 'text', required: true, hint: 'Yurtiçi Kargo müşteri numaranız' },
    ],
    trackingUrl: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={trackingNumber}',
  },
  aras: {
    name: 'Aras Kargo',
    description: 'Hızlı teslimat ve geniş şube ağı ile güvenilir kargo hizmeti.',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customerId', label: 'Müşteri Numarası', type: 'text', required: true },
    ],
    trackingUrl: 'https://www.araskargo.com.tr/tr/cargo-tracking?code={trackingNumber}',
  },
  mng: {
    name: 'MNG Kargo',
    description: 'Modern altyapısı ve dijital çözümleri ile kargo hizmeti.',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
    ],
    trackingUrl: 'https://www.mngkargo.com.tr/gonderitakip?code={trackingNumber}',
  },
  ptt: {
    name: 'PTT Kargo',
    description: 'Türkiye\'nin her köşesine ulaşan devlet garantili kargo hizmeti.',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customerId', label: 'Müşteri Numarası', type: 'text', required: true },
    ],
    trackingUrl: 'https://gonderitakip.ptt.gov.tr/Track/Verify?q={trackingNumber}',
  },
  surat: {
    name: 'Sürat Kargo',
    description: 'Ekonomik fiyatları ve hızlı teslimat seçenekleri.',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'customerId', label: 'Müşteri Numarası', type: 'text', required: true },
    ],
    trackingUrl: 'https://www.suratkargo.com.tr/kargotakip/?code={trackingNumber}',
  },
  trendyol: {
    name: 'Trendyol Express',
    description: 'Trendyol\'un hızlı ve güvenilir kargo hizmeti.',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    trackingUrl: 'https://www.trendyol.com/siparislerim',
  },
  hepsijet: {
    name: 'HepsiJet',
    description: 'Hepsiburada\'nın hızlı kargo çözümü.',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
    ],
    trackingUrl: 'https://www.hepsijet.com/gonderi-takip?code={trackingNumber}',
  },
};

// Türkiye şehirleri (kargo şubesi ataması için)
export const turkishCities = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
  'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin',
  'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat',
  'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

export const useShippingStore = create<ShippingState>()(
  persist(
    (set, get) => ({
      companies: [],
      isLoading: false,
      error: null,

      addCompany: (companyData) => {
        const now = new Date().toISOString();
        const newCompany: ShippingCompany = {
          ...companyData,
          id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          // Eğer ilk şirket ekleniyorsa, varsayılan yap
          if (state.companies.length === 0) {
            newCompany.isDefault = true;
          }
          
          return {
            companies: [...state.companies, newCompany],
          };
        });
      },

      updateCompany: (id, updates) => {
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === id
              ? { ...company, ...updates, updatedAt: new Date().toISOString() }
              : company
          ),
        }));
      },

      deleteCompany: (id) => {
        set((state) => {
          const filtered = state.companies.filter((c) => c.id !== id);
          
          // Eğer silinen varsayılan şirketse ve başka şirket varsa, ilkini varsayılan yap
          const deletedWasDefault = state.companies.find(c => c.id === id)?.isDefault;
          if (deletedWasDefault && filtered.length > 0) {
            filtered[0].isDefault = true;
          }
          
          return { companies: filtered };
        });
      },

      setDefaultCompany: (id) => {
        set((state) => ({
          companies: state.companies.map((company) => ({
            ...company,
            isDefault: company.id === id,
            updatedAt: company.id === id ? new Date().toISOString() : company.updatedAt,
          })),
        }));
      },

      toggleActive: (id) => {
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === id
              ? { 
                  ...company, 
                  isActive: !company.isActive,
                  updatedAt: new Date().toISOString()
                }
              : company
          ),
        }));
      },

      getActiveCompanies: () => {
        return get().companies.filter((c) => c.isActive);
      },

      getDefaultCompany: () => {
        return get().companies.find((c) => c.isDefault && c.isActive);
      },

      getCompanyById: (id) => {
        return get().companies.find((c) => c.id === id);
      },

      // Şehire göre aktif şubeleri getir
      getCompaniesByCity: (city: string) => {
        const normalizedCity = city.trim().toLocaleLowerCase('tr-TR');
        return get().companies.filter((c) => 
          c.isActive && (
            // Şubenin bulunduğu şehir
            c.branchInfo.branchCity.toLocaleLowerCase('tr-TR') === normalizedCity ||
            // Veya hizmet verdiği şehirler arasında
            c.settings.serviceCities.some(sc => 
              sc.toLocaleLowerCase('tr-TR') === normalizedCity
            )
          )
        );
      },

      // Kargo tipine göre şubeleri getir
      getCompaniesByType: (type: ShippingCompanyType) => {
        return get().companies.filter((c) => c.type === type && c.isActive);
      },

      // Şehir için en uygun kargo şubesini bul
      findBestCompanyForCity: (city: string, preferredType?: ShippingCompanyType) => {
        const companies = get().companies.filter(c => c.isActive);
        const normalizedCity = city.trim().toLocaleLowerCase('tr-TR');

        // 1. Öncelik: Aynı şehirdeki şube (aynı il)
        let bestMatch = companies.find(c => 
          c.branchInfo.branchCity.toLocaleLowerCase('tr-TR') === normalizedCity &&
          (!preferredType || c.type === preferredType)
        );

        if (bestMatch) return bestMatch;

        // 2. Öncelik: Bölge dağıtım merkezi ve hizmet verdiği şehirler
        bestMatch = companies.find(c => 
          c.settings.isRegionalHub &&
          c.settings.serviceCities.some(sc => 
            sc.toLocaleLowerCase('tr-TR') === normalizedCity
          ) &&
          (!preferredType || c.type === preferredType)
        );

        if (bestMatch) return bestMatch;

        // 3. Öncelik: Varsayılan şirket
        const defaultCompany = get().getDefaultCompany();
        if (defaultCompany && (!preferredType || defaultCompany.type === preferredType)) {
          return defaultCompany;
        }

        // 4. Herhangi bir aktif şirket
        return companies.find(c => !preferredType || c.type === preferredType);
      },

      testConnection: async (id) => {
        const company = get().companies.find((c) => c.id === id);
        if (!company) {
          return { success: false, message: 'Kargo şirketi bulunamadı' };
        }

        // Simüle edilmiş API testi
        return new Promise((resolve) => {
          setTimeout(() => {
            // Test modunda her zaman başarılı
            if (company.credentials.testMode) {
              resolve({ 
                success: true, 
                message: `${company.branchInfo.branchName} (${company.branchInfo.branchCity}) - Bağlantı testi başarılı (Test Modu)` 
              });
              return;
            }

            // Gerçek modda basit validasyon
            const hasCredentials = Object.values(company.credentials).some(
              (v) => v && v !== '' && typeof v === 'string'
            );

            if (hasCredentials && company.branchInfo.branchCode) {
              resolve({ 
                success: true, 
                message: `${company.branchInfo.branchName} (${company.branchInfo.branchCity}) - API bağlantısı başarılı` 
              });
            } else {
              resolve({ 
                success: false, 
                message: 'API bilgileri eksik. Lütfen tüm alanları doldurun.' 
              });
            }
          }, 1500);
        });
      },

      // Mevcut şubeyi kopyala (yeni şube oluşturmak için)
      duplicateCompany: (id, newBranchInfo) => {
        const company = get().companies.find((c) => c.id === id);
        if (!company) {
          console.error('Kopyalanacak şirket bulunamadı');
          return;
        }

        const now = new Date().toISOString();
        const duplicated: ShippingCompany = {
          ...company,
          id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          branchInfo: {
            ...company.branchInfo,
            ...newBranchInfo,
          },
          isDefault: false, // Kopya varsayılan olamaz
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          companies: [...state.companies, duplicated],
        }));
      },
    }),
    {
      name: 'shipping-storage',
    }
  )
);

// Helper fonksiyonlar
export const createShippingCompany = (
  type: ShippingCompanyType,
  isActive: boolean = true
): Omit<ShippingCompany, 'id' | 'createdAt' | 'updatedAt'> => {
  const info = shippingCompanyInfo[type];
  
  return {
    type,
    name: info.name,
    isActive,
    isDefault: false,
    branchInfo: {
      branchName: '',
      branchCity: '',
      branchDistrict: '',
      branchCode: '',
      branchPhone: '',
      branchAddress: '',
    },
    credentials: getDefaultCredentials(type),
    settings: {
      trackingUrl: info.trackingUrl,
      printFormat: 'a4',
      autoCreateShipment: false,
      autoSendSMS: false,
      serviceCities: [], // Varsayılan boş, kullanıcı dolduracak
      isRegionalHub: false,
    },
  };
};
