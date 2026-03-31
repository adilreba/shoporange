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

// Admin API'leri
export const legalPagesAdminApi = {
  // Tüm sayfaları getir
  getAll: async (): Promise<LegalPage[]> => {
    return fetchApi('/legal-pages');
  },

  // ID ile sayfa getir
  getById: async (id: string): Promise<LegalPage> => {
    return fetchApi(`/legal-pages/${id}/admin`);
  },

  // Yeni sayfa oluştur
  create: async (data: Partial<LegalPage>): Promise<LegalPage> => {
    return fetchApi('/legal-pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sayfa güncelle
  update: async (id: string, data: Partial<LegalPage>): Promise<LegalPage> => {
    return fetchApi(`/legal-pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Sayfa sil
  delete: async (id: string): Promise<void> => {
    return fetchApi(`/legal-pages/${id}`, {
      method: 'DELETE',
    });
  },

  // Varsayılan sayfaları oluştur
  seed: async (): Promise<{ message: string }> => {
    return fetchApi('/legal-pages/seed', {
      method: 'POST',
    });
  },
};

// Public API'ler
export const legalPagesPublicApi = {
  // Yayınlanmış sayfaları getir
  getPublished: async (): Promise<Pick<LegalPage, 'id' | 'slug' | 'title' | 'summary'>[]> => {
    return fetchApi('/legal-pages/public');
  },

  // Slug ile sayfa getir
  getBySlug: async (slug: string): Promise<LegalPage> => {
    return fetchApi(`/legal-pages/${slug}`);
  },
};
