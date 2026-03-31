import { fetchApi } from './api';

export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary?: string;
  isPublished: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedBy?: string;
  metaTitle?: string;
  metaDescription?: string;
  order?: number;
}

// Mock mode kontrolü
const FORCE_MOCK_MODE = import.meta.env.VITE_FORCE_MOCK_MODE === 'true';
const isMockMode = () => {
  if (FORCE_MOCK_MODE) return true;
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '') return true;
  if (envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

// Mock veriler - localStorage'da sakla
const MOCK_PAGES: LegalPage[] = [
  {
    id: '1',
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    content: '<h2>KİŞİSEL VERİLERİN KORUNMASI KANUNU</h2><p>Bu metin 6698 sayılı KVKK kapsamında hazırlanmıştır...</p>',
    summary: 'Kişisel verilerin işlenmesine ilişkin aydınlatma metni',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 1,
  },
  {
    id: '2',
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    content: '<h2>GİZLİLİK POLİTİKASI</h2><p>Web sitemizi kullanırken gizliliğiniz bizim için önemlidir...</p>',
    summary: 'Web sitesi gizlilik politikası',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 2,
  },
  {
    id: '3',
    slug: 'mesafeli-satis-sozlesmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    content: '<h2>MESAFELİ SATIŞ SÖZLEŞMESİ</h2><p>6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında...</p>',
    summary: 'Mesafeli satış sözleşmesi şartları',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 3,
  },
  {
    id: '4',
    slug: 'iade-degisim',
    title: 'İade ve Değişim Politikası',
    content: '<h2>İADE VE DEĞİŞİM</h2><p>14 gün içinde koşulsuz iade hakkı...</p>',
    summary: 'Ürün iade ve değişim koşulları',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 4,
  },
  {
    id: '5',
    slug: 'kargo-teslimat',
    title: 'Kargo ve Teslimat',
    content: '<h2>KARGO VE TESLİMAT</h2><p>Teslimat süreleri ve kargo ücretleri...</p>',
    summary: 'Kargo süreçleri',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 5,
  },
  {
    id: '6',
    slug: 'kullanim-kosullari',
    title: 'Kullanım Koşulları',
    content: '<h2>KULLANIM KOŞULLARI</h2><p>Bu siteyi kullanarak şartları kabul etmiş olursunuz...</p>',
    summary: 'Web sitesi kullanım şartları',
    isPublished: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 6,
  },
];

// localStorage key
const STORAGE_KEY = 'legal-pages-mock';

// Mock verileri al
const getMockPages = (): LegalPage[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PAGES));
  return MOCK_PAGES;
};

// Mock verileri kaydet
const saveMockPages = (pages: LegalPage[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
};

// Admin API'leri
export const legalPagesAdminApi = {
  // Tüm sayfaları getir
  getAll: async (): Promise<LegalPage[]> => {
    if (isMockMode()) {
      return getMockPages();
    }
    return fetchApi('/legal-pages');
  },

  // ID ile sayfa getir
  getById: async (id: string): Promise<LegalPage> => {
    if (isMockMode()) {
      const pages = getMockPages();
      const page = pages.find(p => p.id === id);
      if (!page) throw new Error('Sayfa bulunamadı');
      return page;
    }
    return fetchApi(`/legal-pages/${id}/admin`);
  },

  // Yeni sayfa oluştur
  create: async (data: Partial<LegalPage>): Promise<LegalPage> => {
    if (isMockMode()) {
      const pages = getMockPages();
      const newPage: LegalPage = {
        id: Date.now().toString(),
        slug: data.slug || '',
        title: data.title || '',
        content: data.content || '',
        summary: data.summary,
        isPublished: data.isPublished || false,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        order: data.order || pages.length + 1,
      };
      pages.push(newPage);
      saveMockPages(pages);
      return newPage;
    }
    return fetchApi('/legal-pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sayfa güncelle
  update: async (id: string, data: Partial<LegalPage>): Promise<LegalPage> => {
    if (isMockMode()) {
      const pages = getMockPages();
      const index = pages.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Sayfa bulunamadı');
      
      pages[index] = {
        ...pages[index],
        ...data,
        lastUpdated: new Date().toISOString(),
      };
      saveMockPages(pages);
      return pages[index];
    }
    return fetchApi(`/legal-pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Sayfa sil
  delete: async (id: string): Promise<void> => {
    if (isMockMode()) {
      const pages = getMockPages().filter(p => p.id !== id);
      saveMockPages(pages);
      return;
    }
    return fetchApi(`/legal-pages/${id}`, {
      method: 'DELETE',
    });
  },

  // Varsayılan sayfaları oluştur
  seed: async (): Promise<{ message: string }> => {
    if (isMockMode()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PAGES));
      return { message: 'Varsayılan sayfalar oluşturuldu' };
    }
    return fetchApi('/legal-pages/seed', {
      method: 'POST',
    });
  },
};

// Public API'ler
export const legalPagesPublicApi = {
  // Yayınlanmış sayfaları getir
  getPublished: async (): Promise<Pick<LegalPage, 'id' | 'slug' | 'title' | 'summary'>[]> => {
    if (isMockMode()) {
      const pages = getMockPages()
        .filter(p => p.isPublished)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      return pages.map(p => ({ id: p.id, slug: p.slug, title: p.title, summary: p.summary }));
    }
    return fetchApi('/legal-pages/public');
  },

  // Slug ile sayfa getir
  getBySlug: async (slug: string): Promise<LegalPage> => {
    if (isMockMode()) {
      const pages = getMockPages();
      const page = pages.find(p => p.slug === slug && p.isPublished);
      if (!page) throw new Error('Sayfa bulunamadı');
      return page;
    }
    return fetchApi(`/legal-pages/${slug}`);
  },
};
