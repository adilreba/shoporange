import { fetchApi } from './api';

export interface ProductVariation {
  variationId: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // { beden: 'M', renk: 'Kırmızı' }
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariationsResponse {
  productId: string;
  variations: ProductVariation[];
  totalStock: number;
  totalVariations: number;
  activeVariations: number;
}

// Ürünün tüm varyasyonlarını getir
export const getProductVariations = async (productId: string): Promise<VariationsResponse> => {
  const response = await fetchApi(`/products/${productId}/variations`);
  return response.data;
};

// Tek bir varyasyon getir
export const getVariation = async (productId: string, variationId: string): Promise<ProductVariation> => {
  const response = await fetchApi(`/products/${productId}/variations/${variationId}`);
  return response.data;
};

// Yeni varyasyon oluştur
export const createVariation = async (
  productId: string,
  data: {
    attributes: Record<string, string>;
    price: number;
    compareAtPrice?: number;
    stock?: number;
    images?: string[];
    barcode?: string;
    sku?: string;
    isActive?: boolean;
  }
): Promise<ProductVariation> => {
  const response = await fetchApi(`/products/${productId}/variations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

// Varyasyonu güncelle
export const updateVariation = async (
  productId: string,
  variationId: string,
  data: Partial<ProductVariation>
): Promise<void> => {
  await fetchApi(`/products/${productId}/variations/${variationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Varyasyonu sil
export const deleteVariation = async (productId: string, variationId: string): Promise<void> => {
  await fetchApi(`/products/${productId}/variations/${variationId}`, {
    method: 'DELETE',
  });
};

// Toplu varyasyon oluştur (tüm kombinasyonlar)
export const bulkCreateVariations = async (
  productId: string,
  data: {
    attributes: Record<string, string[]>;
    basePrice: number;
    stock?: number;
  }
): Promise<{
  created: number;
  errors: number;
  variations: ProductVariation[];
}> => {
  const response = await fetchApi(`/products/${productId}/variations/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

// Ürünün özellik seçeneklerini getir (müşteri için)
export const getProductAttributeOptions = async (
  productId: string
): Promise<{
  productId: string;
  attributeOptions: Record<string, string[]>;
  totalVariations: number;
}> => {
  const response = await fetchApi(`/products/${productId}/variations/options`);
  return response.data;
};

// Özelliklere göre varyasyon bul
export const findVariationByAttributes = async (
  productId: string,
  attributes: Record<string, string>
): Promise<ProductVariation | null> => {
  try {
    const params = new URLSearchParams();
    Object.entries(attributes).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    const response = await fetchApi(`/products/${productId}/variations/find?${params.toString()}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

// Stok kontrolü
export const checkStock = (variation: ProductVariation | null, quantity: number = 1): {
  available: boolean;
  maxQuantity: number;
  message: string;
} => {
  if (!variation) {
    return {
      available: false,
      maxQuantity: 0,
      message: 'Varyasyon bulunamadı',
    };
  }

  if (!variation.isActive) {
    return {
      available: false,
      maxQuantity: 0,
      message: 'Bu varyasyon şu anda satışta değil',
    };
  }

  if (variation.stock <= 0) {
    return {
      available: false,
      maxQuantity: 0,
      message: 'Stokta yok',
    };
  }

  if (variation.stock < quantity) {
    return {
      available: false,
      maxQuantity: variation.stock,
      message: `Stokta sadece ${variation.stock} adet var`,
    };
  }

  return {
    available: true,
    maxQuantity: variation.stock,
    message: 'Stokta var',
  };
};

// Fiyat formatı
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
};

// İndirim yüzdesi hesapla
export const calculateDiscount = (price: number, compareAtPrice?: number): number => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

// Varyasyon özelliklerini string olarak formatla
export const formatVariationAttributes = (attributes: Record<string, string>): string => {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};
