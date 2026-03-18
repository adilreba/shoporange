import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  ArrowLeft, 
  Save, 
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { getProductById, categories, subcategories } from '@/data/mockData';
import type { Category } from '@/types';

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isEditMode = !!id;
  
  const existingProduct = isEditMode ? getProductById(id) : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: '' as Category | '',
    subcategory: '',
    brand: '',
    sku: '',
    images: [''],
    tags: '',
    isNew: false,
    isFeatured: false,
    isBestseller: false
  });

  const [features, setFeatures] = useState<{key: string, value: string}[]>([]);

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name,
        description: existingProduct.description,
        price: existingProduct.price.toString(),
        originalPrice: existingProduct.originalPrice?.toString() || '',
        stock: existingProduct.stock.toString(),
        category: existingProduct.category,
        subcategory: existingProduct.subcategory || '',
        brand: existingProduct.brand,
        sku: existingProduct.sku,
        images: existingProduct.images,
        tags: existingProduct.tags?.join(', ') || '',
        isNew: existingProduct.isNew || false,
        isFeatured: existingProduct.isFeatured || false,
        isBestseller: existingProduct.isBestseller || false
      });
      if (existingProduct.features) {
        setFeatures(Object.entries(existingProduct.features).map(([key, value]) => ({ key, value })));
      }
    }
  }, [existingProduct]);

  if (user?.role !== 'admin') {
    toast.error('Bu sayfaya erişim yetkiniz yok!');
    navigate('/');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (isEditMode) {
      toast.success('Ürün başarıyla güncellendi!');
    } else {
      toast.success('Ürün başarıyla eklendi!');
    }
    
    navigate('/admin/products');
  };

  const addFeature = () => {
    setFeatures([...features, { key: '', value: '' }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: 'key' | 'value', value: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImage = (index: number) => {
    setFormData({ 
      ...formData, 
      images: formData.images.filter((_, i) => i !== index) 
    });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const availableSubcategories = formData.category ? subcategories[formData.category] : [];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold">
                {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <aside className="lg:col-span-1">
            <nav className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate('/admin')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="default" 
                className="w-full justify-start gradient-orange"
              >
                <Package className="h-4 w-4 mr-2" />
                Ürünler
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate('/admin/orders')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Siparişler
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate('/admin/users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Kullanıcılar
              </Button>
            </nav>
          </aside>

          <main className="lg:col-span-4">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Temel Bilgiler</h3>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ürün adını girin"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ürün açıklaması"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2999"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="originalPrice">İndirimli Fiyat (₺)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="3499"
                  />
                </div>

                <div>
                  <Label htmlFor="stock">Stok Adedi *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sku">SKU Kodu</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-001"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Kategori</h3>
                </div>

                <div>
                  <Label htmlFor="category">Kategori *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category, subcategory: '' })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Alt Kategori</Label>
                  <select
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    disabled={!formData.category}
                  >
                    <option value="">Alt Kategori Seçin</option>
                    {availableSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="brand">Marka</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Apple, Samsung, vb."
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Etiketler (virgulle ayirin)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="telefon, apple, yeni"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Gorseller</h3>
                </div>

                <div className="md:col-span-2 space-y-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="Gorsel URL"
                      />
                      {formData.images.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gorsel Ekle
                  </Button>
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Ozellikler</h3>
                </div>

                <div className="md:col-span-2 space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature.key}
                        onChange={(e) => updateFeature(index, 'key', e.target.value)}
                        placeholder="Ozellik adi"
                        className="flex-1"
                      />
                      <Input
                        value={feature.value}
                        onChange={(e) => updateFeature(index, 'value', e.target.value)}
                        placeholder="Deger"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ozellik Ekle
                  </Button>
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Durum</h3>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Yeni Urun</span>
                    {formData.isNew && <Badge className="bg-green-500">YENI</Badge>}
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>One Cikan</span>
                    {formData.isFeatured && <Badge className="bg-orange-500">ONE CIKAN</Badge>}
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Cok Satan</span>
                    {formData.isBestseller && <Badge className="bg-amber-500">COK SATAN</Badge>}
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => navigate('/admin/products')}
                >
                  Iptal
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 gradient-orange h-12"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isEditMode ? 'Guncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
