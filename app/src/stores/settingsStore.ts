import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompanySettings {
  // Temel Bilgiler
  storeName: string;
  storeEmail: string;
  phone: string;
  mobilePhone?: string;
  
  // Şirket Bilgileri (ETBİS Gereklilikleri)
  companyTitle: string;        // Şirket unvanı
  tradeRegistryNo: string;     // Ticaret sicil no
  mersisNo: string;           // MERSİS numarası
  taxNo: string;              // Vergi numarası
  taxOffice: string;          // Vergi dairesi
  etbisNo: string;            // ETBİS kayıt numarası
  
  // Adres Bilgileri (Detaylı)
  address: string;            // Açık adres
  district: string;           // İlçe
  city: string;              // Şehir
  postalCode: string;        // Posta kodu
  country: string;           // Ülke (varsayılan: Türkiye)
  
  // Kargo Ayarları
  freeShippingThreshold: number;
  defaultShippingCost: number;
  expressShippingCost: number;
  estimatedDeliveryDays: number;
  
  // Sosyal Medya
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  
  // Banka Hesapları (Havale/EFT için)
  bankAccounts?: BankAccount[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  iban: string;
  accountNo?: string;
  branchCode?: string;
  isActive: boolean;
}

interface SettingsState {
  settings: CompanySettings;
  updateSettings: (settings: Partial<CompanySettings>) => void;
  updateBankAccounts: (accounts: BankAccount[]) => void;
  getFullAddress: () => string;
  getFormattedCompanyInfo: () => {
    title: string;
    taxInfo: string;
    registrationInfo: string;
    contactInfo: string;
  };
}

const defaultSettings: CompanySettings = {
  // Temel Bilgiler
  storeName: 'AtusHome',
  storeEmail: 'info@atushome.com',
  phone: '0850 123 45 67',
  mobilePhone: '',
  
  // Şirket Bilgileri
  companyTitle: 'AtusHome E-Ticaret Ltd. Şti.',
  tradeRegistryNo: '123456',
  mersisNo: '0123456789012345',
  taxNo: '1234567890',
  taxOffice: 'Kadıköy V.D.',
  etbisNo: 'ETB-2024-XXXXXXX',
  
  // Adres
  address: 'Caferağa Mah. Moda Cad. No:123 D:5',
  district: 'Kadıköy',
  city: 'İstanbul',
  postalCode: '34710',
  country: 'Türkiye',
  
  // Kargo
  freeShippingThreshold: 500,
  defaultShippingCost: 50,
  expressShippingCost: 100,
  estimatedDeliveryDays: 3,
  
  // Sosyal Medya
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  
  // Banka Hesapları
  bankAccounts: [],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      updateBankAccounts: (accounts) => {
        set((state) => ({
          settings: { ...state.settings, bankAccounts: accounts }
        }));
      },
      
      getFullAddress: () => {
        const { address, district, city, postalCode, country } = get().settings;
        return `${address}, ${district}, ${city} ${postalCode}, ${country}`;
      },
      
      getFormattedCompanyInfo: () => {
        const s = get().settings;
        return {
          title: s.companyTitle,
          taxInfo: `Vergi No: ${s.taxNo} - ${s.taxOffice}`,
          registrationInfo: `Ticaret Sicil: ${s.tradeRegistryNo} | MERSİS: ${s.mersisNo} | ETBİS: ${s.etbisNo}`,
          contactInfo: `Tel: ${s.phone} | E-posta: ${s.storeEmail}`
        };
      }
    }),
    {
      name: 'company-settings-storage',
    }
  )
);
