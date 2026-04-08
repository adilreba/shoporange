import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Trash2,
  Package,
  Settings2,
  Layers,
  AlertCircle,
  Check,
  Wand2
} from 'lucide-react';
import { products } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PRODUCT_CATEGORIES, 
  getCategoryAttributes, 
  type CategoryAttribute,
  getCategoryName 
} from '@/services/categoryAttributesApi';
import { 
  bulkCreateVariations,
  getProductVariations,
  type ProductVariation
} from '@/services/productVariationsApi';

// Renk eşleştirme
const COLOR_MAP: Record<string, string> = {
  'Siyah': '#000000',
  'Beyaz': '#FFFFFF',
  'Kırmızı': '#FF0000',
  'Mavi': '#0000FF',
  'Yeşil': '#008000',
  'Sarı': '#FFFF00',
  'Pembe': '#FFC0CB',
  'Mor': '#800080',
  'Gri': '#808080',
  'Kahverengi': '#8B4513',
  'Bej': '#F5F5DC',
  'Gümüş': '#C0C0C0',
  'Altın': '#FFD700',
  'Turuncu': '#FFA500',
  'Lacivert': '#000080',
  'Şeffaf': 'transparent',
};

type TabType = 'basic' | 'variations';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  // Basic form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    brand: '',
    sku: '',
    barcode: '',
    stockCode: '',
    supplierCode: '',
    tags: [] as string[],
    featured: false,
    active: true
  });
  
  // Category attributes
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  
  // Variations
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [generatingVariations, setGeneratingVariations] = useState(false);
  
  const [tagInput, setTagInput] = useState('');

  // Load category attributes when category changes
  useEffect(() => {
    if (formData.category) {
      loadCategoryAttributes(formData.category);
    }
  }, [formData.category]);

  // Load existing variations in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadExistingVariations(id);
    }
  }, [isEditMode, id]);

  const loadCategoryAttributes = async (categoryId: string) => {
    try {
      const schema = await getCategoryAttributes(categoryId);
      setCategoryAttributes(schema.attributes);
    } catch (error) {
      toast.error('Kategori özellikleri yüklenemedi');
    }
  };

  const loadExistingVariations = async (productId: string) => {
    try {
      const data = await getProductVariations(productId);
      setVariations(data.variations);
    } catch (error) {
      console.error('Varyasyonlar yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success(isEditMode ? 'Ürün güncellendi' : 'Ürün eklendi');
      navigate('/admin/products');
    }, 1000);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleImageUpload = () => {
    const newImage = `https://via.placeholder.com/400x300?text=Image+${images.length + 1}`;
    setImages([...images, newImage]);
    toast.success('Resim yüklendi');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // SKU için kategori kodu al
  const getCategoryCode = (categoryId: string): string => {
    const categoryMap: Record<string, string> = {
      'elektronik': 'ELK',
      'moda': 'MOD',
      'ev-yasam': 'EVY',
      'kozmetik': 'KOZ',
      'spor': 'SPO',
      'kitap': 'KIT',
      'oyuncak': 'OYN',
      'supermarket': 'SUP',
      'gida': 'GID',
      'temizlik': 'TMZ',
      'kisisel-bakim': 'KSB',
    };
    return categoryMap[categoryId] || 'GEN';
  };

  // Marka kodu al
  const getBrandCode = (brand: string): string => {
    if (!brand) return 'GEN';
    const normalized = brand.toUpperCase()
      .replace(/[Ç]/g, 'C')
      .replace(/[Ğ]/g, 'G')
      .replace(/[İ]/g, 'I')
      .replace(/[Ö]/g, 'O')
      .replace(/[Ş]/g, 'S')
      .replace(/[Ü]/g, 'U');
    return normalized.substring(0, 3);
  };

  // Benzersiz SKU üret
  const generateSKU = () => {
    const categoryCode = getCategoryCode(formData.category);
    const brandCode = getBrandCode(formData.brand);
    
    // Mevcut ürünleri kontrol et ve son numarayı bul
    const existingSKUs = products
      .filter(p => p.sku?.startsWith(`${categoryCode}-${brandCode}`))
      .map(p => {
        const match = p.sku?.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
    
    const maxNum = existingSKUs.length > 0 ? Math.max(...existingSKUs) : 0;
    const nextNum = String(maxNum + 1).padStart(3, '0');
    
    const sku = `${categoryCode}-${brandCode}-${nextNum}`;
    setFormData(prev => ({ ...prev, sku }));
    toast.success('SKU otomatik oluşturuldu');
  };

  // EAN-13 Barkod kontrol digit hesapla
  const calculateEANCheckDigit = (digits: string): string => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      const digit = parseInt(digits[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return String(checkDigit);
  };

  // Benzersiz EAN-13 barkod üret (868 ile başlayan Türkiye kodu)
  const generateBarcode = () => {
    // 868: Türkiye ülke kodu
    const countryCode = '868';
    
    // Mevcut barkodları kontrol et
    const existingBarcodes = products
      .filter(p => p.barcode?.startsWith(countryCode))
      .map(p => parseInt(p.barcode?.slice(3, 12) || '0'));
    
    const maxNum = existingBarcodes.length > 0 ? Math.max(...existingBarcodes) : 10000000;
    const nextNum = String(maxNum + 1).padStart(9, '0');
    
    // 12 haneli kod + kontrol rakamı
    const barcodeWithoutCheck = countryCode + nextNum;
    const checkDigit = calculateEANCheckDigit(barcodeWithoutCheck);
    const barcode = barcodeWithoutCheck + checkDigit;
    
    setFormData(prev => ({ ...prev, barcode }));
    toast.success('EAN-13 barkod otomatik oluşturuldu');
  };

  // Toggle attribute option selection
  const toggleAttributeOption = (attributeId: string, option: string) => {
    setSelectedAttributes(prev => {
      const current = prev[attributeId] || [];
      if (current.includes(option)) {
        return { ...prev, [attributeId]: current.filter(o => o !== option) };
      }
      return { ...prev, [attributeId]: [...current, option] };
    });
  };

  // Generate all variation combinations
  const generateVariations = async () => {
    if (!id) {
      toast.error('Önce ürünü kaydetmelisiniz');
      return;
    }

    const hasSelections = Object.values(selectedAttributes).some(arr => arr.length > 0);
    if (!hasSelections) {
      toast.error('En az bir özellik seçmelisiniz');
      return;
    }

    setGeneratingVariations(true);
    try {
      const basePrice = parseFloat(formData.basePrice) || 0;
      const result = await bulkCreateVariations(id, {
        attributes: selectedAttributes,
        basePrice,
        stock: 10,
      });
      
      setVariations(result.variations);
      toast.success(`${result.created} varyasyon oluşturuldu`);
    } catch (error) {
      toast.error('Varyasyonlar oluşturulamadı');
    } finally {
      setGeneratingVariations(false);
    }
  };

  // Update variation price/stock
  const updateVariation = (variationId: string, field: 'price' | 'stock', value: string) => {
    setVariations(prev => prev.map(v => {
      if (v.variationId === variationId) {
        return { ...v, [field]: parseFloat(value) || 0 };
      }
      return v;
    }));
  };

  // Delete variation
  const deleteVariation = async (variationId: string) => {
    if (!id) return;
    try {
      // API call would go here
      setVariations(prev => prev.filter(v => v.variationId !== variationId));
      toast.success('Varyasyon silindi');
    } catch (error) {
      toast.error('Varyasyon silinemedi');
    }
  };

  // Render color option
  const renderColorOption = (attribute: CategoryAttribute, option: string) => {
    const isSelected = (selectedAttributes[attribute.attributeId] || []).includes(option);
    const colorCode = COLOR_MAP[option] || '#ccc';
    
    return (
      <button
        key={option}
        type="button"
        onClick={() => toggleAttributeOption(attribute.attributeId, option)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
            : 'border-gray-200 hover:border-orange-300'
        }`}
      >
        <span 
          className="w-5 h-5 rounded-full border border-gray-200"
          style={{ 
            backgroundColor: colorCode,
            backgroundImage: colorCode === 'transparent' 
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' 
              : undefined,
            backgroundSize: colorCode === 'transparent' ? '10px 10px' : undefined,
          }}
        />
        <span className="text-sm">{option}</span>
        {isSelected && <Check className="w-4 h-4 text-orange-500" />}
      </button>
    );
  };

  // Render select option
  const renderSelectOption = (attribute: CategoryAttribute, option: string) => {
    const isSelected = (selectedAttributes[attribute.attributeId] || []).includes(option);
    
    return (
      <button
        key={option}
        type="button"
        onClick={() => toggleAttributeOption(attribute.attributeId, option)}
        className={`px-3 py-2 rounded-lg border text-sm transition-all ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200' 
            : 'border-gray-200 hover:border-orange-300'
        }`}
      >
        {option}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'Ürün bilgilerini güncelleyin' : 'Yeni bir ürün ekleyin'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')}>
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'basic'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Temel Bilgiler
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('variations')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'variations'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Varyasyonlar
          {variations.length > 0 && (
            <Badge variant="secondary" className="ml-1">{variations.length}</Badge>
          )}
        </button>
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ürün Adı *</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ürün adı girin"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Açıklama *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ürün açıklaması girin"
                    className="w-full px-3 py-2 border rounded-md min-h-[120px] resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kategori *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Kategori seçin</option>
                      {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {formData.category && (
                      <p className="text-xs text-orange-600">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {getCategoryName(formData.category)} için {categoryAttributes.length} özellik mevcut
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marka</label>
                    <Input 
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="Marka adı"
                    />
                  </div>
                </div>

                {/* SKU ve Barkod Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU (Stok Kodu) *</label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="ELK-APP-001"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateSKU}
                        title="Otomatik SKU Oluştur"
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Format: KATEGORI-MARKA-001 (otomatik veya manuel)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barkod (EAN-13)</label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.barcode}
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        placeholder="8680000000000"
                        maxLength={13}
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateBarcode}
                        title="Otomatik Barkod Oluştur"
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      868 ile başlayan EAN-13 (Türkiye kodu)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Depo Kodu</label>
                    <Input 
                      value={formData.stockCode}
                      onChange={(e) => setFormData({...formData, stockCode: e.target.value})}
                      placeholder="DEPO-A-123"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tedarikçi Kodu</label>
                    <Input 
                      value={formData.supplierCode}
                      onChange={(e) => setFormData({...formData, supplierCode: e.target.value})}
                      placeholder="TED-456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temel Fiyat (₺) *</label>
                    <Input 
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-gray-500">Varyasyonlar için temel fiyat</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Etiketler</label>
                  <div className="flex gap-2">
                    <Input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Etiket ekleyin ve Enter'a basın"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Ürün Görselleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                      <img 
                        src={image} 
                        alt={`Ürün ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Resim Yükle</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Durum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aktif</span>
                  <Switch 
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Öne Çıkan</span>
                  <Switch 
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}

      {/* Variations Tab */}
      {activeTab === 'variations' && (
        <div className="space-y-6">
          {!formData.category ? (
            <Card className="p-8 text-center">
              <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Varyasyon oluşturmak için önce "Temel Bilgiler" sekmesinden kategori seçin.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('basic')}
              >
                Temel Bilgiler'e Git
              </Button>
            </Card>
          ) : (
            <>
              {/* Attribute Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    {getCategoryName(formData.category)} Özellikleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categoryAttributes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Bu kategori için önceden tanımlanmış özellik bulunmuyor.
                    </p>
                  ) : (
                    categoryAttributes.map((attr) => (
                      <div key={attr.attributeId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-medium">
                            {attr.name}
                            {attr.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <span className="text-xs text-gray-500">
                            {(selectedAttributes[attr.attributeId] || []).length} seçili
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {attr.type === 'color' 
                            ? attr.options.map(option => renderColorOption(attr, option))
                            : attr.options.map(option => renderSelectOption(attr, option))
                          }
                        </div>
                      </div>
                    ))
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      onClick={generateVariations}
                      disabled={generatingVariations || !id}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      {generatingVariations ? (
                        'Oluşturuluyor...'
                      ) : (
                        <>
                          <Layers className="w-4 h-4 mr-2" />
                          Varyasyonları Oluştur
                        </>
                      )}
                    </Button>
                    {!id && (
                      <p className="text-xs text-orange-600 mt-2 text-center">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        Varyasyon oluşturmak için önce ürünü kaydetmelisiniz
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Variations List */}
              {variations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Varyasyonlar ({variations.length})</span>
                      <Badge variant="secondary">
                        Toplam Stok: {variations.reduce((sum, v) => sum + v.stock, 0)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {variations.map((variation) => (
                        <div 
                          key={variation.variationId}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          {/* Attributes */}
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(variation.attributes).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">SKU: {variation.sku}</p>
                          </div>

                          {/* Price */}
                          <div className="w-32">
                            <label className="text-xs text-gray-500">Fiyat</label>
                            <Input
                              type="number"
                              value={variation.price}
                              onChange={(e) => updateVariation(variation.variationId, 'price', e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          {/* Stock */}
                          <div className="w-32">
                            <label className="text-xs text-gray-500">Stok</label>
                            <Input
                              type="number"
                              value={variation.stock}
                              onChange={(e) => updateVariation(variation.variationId, 'stock', e.target.value)}
                              className={`mt-1 ${variation.stock < 5 ? 'border-red-300' : ''}`}
                            />
                            {variation.stock < 5 && (
                              <p className="text-xs text-red-500 mt-1">Düşük stok!</p>
                            )}
                          </div>

                          {/* Actions */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVariation(variation.variationId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Switch component
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
