import { fetchApi } from './api';

export interface AdminProduct {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  brand?: string;
  sku?: string;
  barcode?: string;
  stockCode?: string;
  supplierCode?: string;
  tags?: string[];
  isFeatured?: boolean;
  active?: boolean;
  status?: 'active' | 'inactive' | 'out_of_stock';
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  canonicalUrl?: string;
  // Pricing fields
  originalPrice?: number;
  discount?: number;
  // Shipping & specs
  weight?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  materials?: string[];
  specifications?: Record<string, string>;
  warranty?: number;
  countryOfOrigin?: string;
  taxRate?: number;
  [key: string]: any;
}

export const adminProductsApi = {
  getAll: () => fetchApi('/admin/products'),

  getById: (id: string) => fetchApi(`/admin/products/${id}`),

  create: (product: AdminProduct) =>
    fetchApi('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  update: (id: string, product: Partial<AdminProduct>) =>
    fetchApi(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  delete: (id: string) =>
    fetchApi(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

  seedData: () =>
    fetchApi('/admin/seed', {
      method: 'POST',
    }),

  getUploadUrl: (contentType: string, extension?: string) =>
    fetchApi('/admin/images/upload-url', {
      method: 'POST',
      body: JSON.stringify({ contentType, extension }),
    }),

  uploadImage: async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop();
    const { uploadUrl, imageUrl } = await adminProductsApi.getUploadUrl(file.type, extension);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Resim yüklenirken hata oluştu');
    }

    return imageUrl;
  },
};
