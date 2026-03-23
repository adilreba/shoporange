import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const categories = [
  { id: 'living-room', name: 'Oturma Odası' },
  { id: 'bedroom', name: 'Yatak Odası' },
  { id: 'dining-room', name: 'Yemek Odası' },
  { id: 'kitchen', name: 'Mutfak' },
  { id: 'office', name: 'Ofis' },
  { id: 'outdoor', name: 'Bahçe' },
  { id: 'lighting', name: 'Aydınlatma' },
  { id: 'decor', name: 'Dekorasyon' },
  { id: 'electronics', name: 'Elektronik' },
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    brand: '',
    sku: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    tags: [] as string[],
    featured: false,
    active: true
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEditMode) {
      // Mock data for edit mode
      setFormData({
        name: 'Modern Koltuk Takımı',
        description: 'Lüks ve konforlu modern koltuk takımı. Oturma odanıza şıklık katacak tasarım.',
        price: '15000',
        category: 'living-room',
        stock: '10',
        brand: 'AtusHome',
        sku: 'KTK-001',
        weight: '45',
        dimensions: { length: '200', width: '90', height: '85' },
        tags: ['koltuk', 'oturma odası', 'modern'],
        featured: true,
        active: true
      });
      setImages([
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300'
      ]);
    }
  }, [isEditMode]);

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
    // Mock image upload
    const newImage = `https://via.placeholder.com/400x300?text=Image+${images.length + 1}`;
    setImages([...images, newImage]);
    toast.success('Resim yüklendi');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fiyat (₺) *</label>
                  <Input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stok Miktarı *</label>
                  <Input 
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                    required
                  />
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

          {/* SKU & Barcode */}
          <Card>
            <CardHeader>
              <CardTitle>Stok Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ağırlık (kg)</label>
                <Input 
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Boyutlar (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    placeholder="Uzunluk"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, length: e.target.value}})}
                  />
                  <Input 
                    placeholder="Genişlik"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, width: e.target.value}})}
                  />
                  <Input 
                    placeholder="Yükseklik"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({...formData, dimensions: {...formData.dimensions, height: e.target.value}})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
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
