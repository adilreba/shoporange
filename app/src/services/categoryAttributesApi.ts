import { fetchApi } from './api';

export interface CategoryAttribute {
  attributeId: string;
  name: string;
  type: 'select' | 'color' | 'text' | 'number';
  options: string[];
  required: boolean;
  order: number;
}

export interface CategorySchema {
  categoryId: string;
  attributes: CategoryAttribute[];
  hasPredefined: boolean;
  customCount: number;
}

// Tüm önceden tanımlanmış kategori şemalarını getir
export const getCategorySchemas = async (): Promise<Record<string, CategoryAttribute[]>> => {
  try {
    const response = await fetchApi('/category-schemas');
    return response.data || {};
  } catch (error) {
    console.error('Kategori şemaları alınamadı:', error);
    // Fallback: local schemas
    return DEFAULT_CATEGORY_SCHEMAS;
  }
};

// Belirli bir kategorinin özelliklerini getir
export const getCategoryAttributes = async (categoryId: string): Promise<CategorySchema> => {
  try {
    const response = await fetchApi(`/category-attributes/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Kategori özellikleri alınamadı:', error);
    // Fallback: local schema
    return {
      categoryId,
      attributes: DEFAULT_CATEGORY_SCHEMAS[categoryId] || [],
      hasPredefined: !!DEFAULT_CATEGORY_SCHEMAS[categoryId],
      customCount: 0,
    };
  }
};

// Önceden tanımlanmış kategori şemaları
export const DEFAULT_CATEGORY_SCHEMAS: Record<string, CategoryAttribute[]> = {
  'giyim': [
    { attributeId: 'beden', name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi', 'Yeşil', 'Sarı', 'Pembe', 'Mor', 'Gri', 'Kahverengi'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Pamuk', 'Polyester', 'Keten', 'Yün', 'İpek', 'Deri', 'Kadife', 'Denim'], required: false, order: 3 },
    { attributeId: 'desen', name: 'Desen', type: 'select', options: ['Düz', 'Çizgili', 'Kareli', 'Çiçekli', 'Geometrik', 'Hayvan Deseni'], required: false, order: 4 },
  ],
  'ayakkabi': [
    { attributeId: 'numara', name: 'Numara', type: 'select', options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kahverengi', 'Bej', 'Kırmızı', 'Mavi', 'Gri'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Deri', 'Suni Deri', 'Kumaş', 'Nubuk', 'Süet', 'Kauçuk'], required: false, order: 3 },
  ],
  'mutfak': [
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Plastik', 'Paslanmaz Çelik', 'Cam', 'Seramik', 'Ahşap', 'Silikon', 'Döküm Demir'], required: true, order: 1 },
    { attributeId: 'hacim', name: 'Hacim/Kapasite', type: 'select', options: ['250ml', '500ml', '1L', '1.5L', '2L', '3L', '5L', '10L'], required: false, order: 2 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi', 'Yeşil', 'Pembe', 'Gri', 'Şeffaf'], required: false, order: 3 },
  ],
  'elektronik': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Gümüş', 'Altın', 'Uzay Grisi', 'Mavi', 'Kırmızı'], required: false, order: 1 },
    { attributeId: 'depolama', name: 'Depolama', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'], required: false, order: 2 },
    { attributeId: 'ram', name: 'RAM', type: 'select', options: ['2GB', '4GB', '8GB', '16GB', '32GB', '64GB'], required: false, order: 3 },
  ],
  'mobilya': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Beyaz', 'Siyah', 'Kahverengi', 'Meşe', 'Ceviz', 'Gri', 'Bej', 'Krem'], required: true, order: 1 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Ahşap', 'Metal', 'Cam', 'Plastik', 'Deri', 'Kumaş', 'Mermer'], required: true, order: 2 },
    { attributeId: 'boyut', name: 'Boyut', type: 'select', options: ['Tek Kişilik', 'Çift Kişilik', 'Queen', 'King'], required: false, order: 3 },
  ],
  'oyuncak': [
    { attributeId: 'yas-grubu', name: 'Yaş Grubu', type: 'select', options: ['0-12 ay', '1-3 yaş', '3-6 yaş', '6-9 yaş', '9-12 yaş', '12+ yaş'], required: true, order: 1 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Plastik', 'Ahşap', 'Kumaş', 'Silikon', 'Kauçuk', 'Metal'], required: false, order: 2 },
    { attributeId: 'cinsiyet', name: 'Cinsiyet', type: 'select', options: ['Kız', 'Erkek', 'Unisex'], required: false, order: 3 },
  ],
  'kozmetik': [
    { attributeId: 'cilt-tipi', name: 'Cilt Tipi', type: 'select', options: ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas', 'Tüm Cilt Tipleri'], required: true, order: 1 },
    { attributeId: 'hacim', name: 'Hacim', type: 'select', options: ['30ml', '50ml', '100ml', '150ml', '200ml', '250ml', '500ml'], required: false, order: 2 },
    { attributeId: 'renk-tonu', name: 'Renk Tonu', type: 'select', options: ['Açık', 'Orta', 'Koyu', 'Sıcak', 'Soğuk', 'Nötr'], required: false, order: 3 },
  ],
  'spor': [
    { attributeId: 'beden', name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true, order: 1 },
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Gri', 'Mavi', 'Kırmızı', 'Yeşil', 'Turuncu', 'Mor'], required: true, order: 2 },
    { attributeId: 'malzeme', name: 'Malzeme', type: 'select', options: ['Polyester', 'Naylon', 'Elastan', 'Pamuk', 'Kuru Fit'], required: false, order: 3 },
  ],
  'ev-tekstili': [
    { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Beyaz', 'Krem', 'Bej', 'Gri', 'Mavi', 'Yeşil', 'Pembe', 'Sarı', 'Turuncu'], required: true, order: 1 },
    { attributeId: 'boyut', name: 'Boyut', type: 'select', options: ['Tek Kişilik', 'Çift Kişilik', 'King Size', 'Bebek'], required: true, order: 2 },
    { attributeId: 'materyal', name: 'Materyal', type: 'select', options: ['Pamuk', 'Saten', 'Flanel', 'Kadife', 'Bambu', 'Mikrofiber'], required: true, order: 3 },
    { attributeId: 'desen', name: 'Desen', type: 'select', options: ['Düz', 'Çizgili', 'Çiçekli', 'Geometrik', 'Etnik'], required: false, order: 4 },
  ],
};

// Kategori listesi
export const PRODUCT_CATEGORIES = [
  { id: 'giyim', name: 'Giyim', icon: 'Shirt' },
  { id: 'ayakkabi', name: 'Ayakkabı', icon: 'Footprints' },
  { id: 'mutfak', name: 'Mutfak', icon: 'UtensilsCrossed' },
  { id: 'elektronik', name: 'Elektronik', icon: 'Smartphone' },
  { id: 'mobilya', name: 'Mobilya', icon: 'Sofa' },
  { id: 'oyuncak', name: 'Oyuncak', icon: 'Gamepad2' },
  { id: 'kozmetik', name: 'Kozmetik', icon: 'Sparkles' },
  { id: 'spor', name: 'Spor', icon: 'Dumbbell' },
  { id: 'ev-tekstili', name: 'Ev Tekstili', icon: 'BedDouble' },
];

// Kategori adını getir
export const getCategoryName = (categoryId: string): string => {
  const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
  return category?.name || categoryId;
};
