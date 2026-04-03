import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Settings,
  ChevronRight,
  GripVertical,
  Save,
  X,
  Check,
  Palette,
  List,
  Type,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Types
interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  attributes?: CategoryAttribute[];
}

interface CategoryAttribute {
  attributeId: string;
  name: string;
  type: 'select' | 'color' | 'text' | 'number';
  options: string[];
  required: boolean;
  order: number;
}

// Icons map
const ICONS: Record<string, React.ReactNode> = {
  'Shirt': <Palette className="w-5 h-5" />,
  'Footprints': <GripVertical className="w-5 h-5" />,
  'UtensilsCrossed': <Settings className="w-5 h-5" />,
  'Smartphone': <Type className="w-5 h-5" />,
  'Sofa': <Settings className="w-5 h-5" />,
  'Gamepad2': <Hash className="w-5 h-5" />,
  'Sparkles': <Palette className="w-5 h-5" />,
  'Dumbbell': <GripVertical className="w-5 h-5" />,
  'BedDouble': <Settings className="w-5 h-5" />,
  'List': <List className="w-5 h-5" />,
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // New category form
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'List',
  });
  
  // New attribute form
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    type: 'select' as const,
    options: [] as string[],
    required: false,
    optionInput: '',
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockCategories: Category[] = [
        {
          categoryId: 'giyim',
          name: 'Giyim',
          slug: 'giyim',
          description: 'Kadın, erkek ve çocuk giyim ürünleri',
          icon: 'Shirt',
          order: 1,
          isActive: true,
          attributes: [
            { attributeId: 'beden', name: 'Beden', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL'], required: true, order: 1 },
            { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kırmızı', 'Mavi'], required: true, order: 2 },
          ],
        },
        {
          categoryId: 'ayakkabi',
          name: 'Ayakkabı',
          slug: 'ayakkabi',
          description: 'Spor, klasik ve günlük ayakkabılar',
          icon: 'Footprints',
          order: 2,
          isActive: true,
          attributes: [
            { attributeId: 'numara', name: 'Numara', type: 'select', options: ['36', '37', '38', '39', '40'], required: true, order: 1 },
            { attributeId: 'renk', name: 'Renk', type: 'color', options: ['Siyah', 'Beyaz', 'Kahverengi'], required: true, order: 2 },
          ],
        },
      ];
      setCategories(mockCategories);
    } catch (error) {
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

// Check if category name already exists
  const isCategoryNameExists = (name: string): boolean => {
    return categories.some(
      cat => cat.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };

  // Check for similar slugs
  const generateUniqueSlug = (name: string): string => {
    const baseSlug = name.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (categories.some(cat => cat.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) {
      toast.error('Kategori adı gereklidir');
      return;
    }

    // Check if category name already exists
    if (isCategoryNameExists(newCategory.name)) {
      toast.error(`"${newCategory.name}" kategorisi zaten mevcut!`);
      return;
    }

    try {
      const category: Category = {
        categoryId: `cat_${Date.now()}`,
        name: newCategory.name,
        slug: generateUniqueSlug(newCategory.name),
        description: newCategory.description,
        icon: newCategory.icon,
        order: categories.length + 1,
        isActive: true,
        attributes: [],
      };

      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '', icon: 'List' });
      toast.success('Kategori oluşturuldu');
    } catch (error) {
      toast.error('Kategori oluşturulamadı');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    
    try {
      setCategories(categories.filter(c => c.categoryId !== categoryId));
      toast.success('Kategori silindi');
    } catch (error) {
      toast.error('Kategori silinemedi');
    }
  };

  const handleAddAttribute = async () => {
    if (!selectedCategory) return;
    if (!newAttribute.name) {
      toast.error('Özellik adı gereklidir');
      return;
    }
    if (newAttribute.options.length === 0 && newAttribute.type === 'select') {
      toast.error('En az bir seçenek eklemelisiniz');
      return;
    }

    try {
      const attribute: CategoryAttribute = {
        attributeId: `attr_${Date.now()}`,
        name: newAttribute.name,
        type: newAttribute.type,
        options: newAttribute.options,
        required: newAttribute.required,
        order: (selectedCategory.attributes?.length || 0) + 1,
      };

      const updatedCategory = {
        ...selectedCategory,
        attributes: [...(selectedCategory.attributes || []), attribute],
      };

      setCategories(categories.map(c => 
        c.categoryId === selectedCategory.categoryId ? updatedCategory : c
      ));
      setSelectedCategory(updatedCategory);
      setNewAttribute({ name: '', type: 'select', options: [], required: false, optionInput: '' });
      toast.success('Özellik eklendi');
    } catch (error) {
      toast.error('Özellik eklenemedi');
    }
  };

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!selectedCategory) return;
    if (!confirm('Bu özelliği silmek istediğinize emin misiniz?')) return;

    try {
      const updatedCategory = {
        ...selectedCategory,
        attributes: selectedCategory.attributes?.filter(a => a.attributeId !== attributeId) || [],
      };

      setCategories(categories.map(c => 
        c.categoryId === selectedCategory.categoryId ? updatedCategory : c
      ));
      setSelectedCategory(updatedCategory);
      toast.success('Özellik silindi');
    } catch (error) {
      toast.error('Özellik silinemedi');
    }
  };

  const addOption = () => {
    if (!newAttribute.optionInput.trim()) return;
    if (newAttribute.options.includes(newAttribute.optionInput.trim())) {
      toast.error('Bu seçenek zaten ekli');
      return;
    }
    setNewAttribute({
      ...newAttribute,
      options: [...newAttribute.options, newAttribute.optionInput.trim()],
      optionInput: '',
    });
  };

  const removeOption = (option: string) => {
    setNewAttribute({
      ...newAttribute,
      options: newAttribute.options.filter(o => o !== option),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kategori Yönetimi
            </h1>
            <p className="text-sm text-gray-500">
              Kategorileri ve özelliklerini yönetin
            </p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Existing Categories Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Mevcut Kategoriler ({categories.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {categories.map(cat => (
                    <Badge key={cat.categoryId} variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori Adı *</label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="örn: Aksesuar"
                  className={isCategoryNameExists(newCategory.name) ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {/* Real-time validation message */}
                {newCategory.name && (
                  <div className="text-xs">
                    {isCategoryNameExists(newCategory.name) ? (
                      <span className="text-red-500 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        "{newCategory.name}" kategorisi zaten mevcut! Lütfen farklı bir ad girin.
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Bu kategori adı kullanılabilir.
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Açıklama</label>
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Kategori açıklaması"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">İkon</label>
                <select
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="List">Liste</option>
                  <option value="Shirt">Giyim</option>
                  <option value="Footprints">Ayakkabı</option>
                  <option value="UtensilsCrossed">Mutfak</option>
                  <option value="Smartphone">Elektronik</option>
                  <option value="Sofa">Mobilya</option>
                  <option value="Gamepad2">Oyuncak</option>
                  <option value="Sparkles">Kozmetik</option>
                  <option value="Dumbbell">Spor</option>
                  <option value="BedDouble">Ev Tekstili</option>
                </select>
              </div>
              <Button 
                onClick={handleCreateCategory}
                disabled={!newCategory.name || isCategoryNameExists(newCategory.name)}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Kategori Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Kategoriler ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.categoryId}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedCategory?.categoryId === category.categoryId
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      {ICONS[category.icon || 'List'] || <List className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-gray-500">
                        {category.attributes?.length || 0} özellik
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {ICONS[selectedCategory.icon || 'List']}
                    {selectedCategory.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCategory.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(selectedCategory.categoryId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="attributes">
                  <TabsList>
                    <TabsTrigger value="attributes">
                      <Settings className="w-4 h-4 mr-2" />
                      Özellikler ({selectedCategory.attributes?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="add">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Özlik Ekle
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attributes" className="space-y-4">
                    {selectedCategory.attributes?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Henüz özellik eklenmemiş</p>
                      </div>
                    ) : (
                      selectedCategory.attributes?.map((attr) => (
                        <div
                          key={attr.attributeId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{attr.name}</p>
                              {attr.required && (
                                <Badge variant="secondary" className="text-xs">Zorunlu</Badge>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">
                                {attr.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {attr.options.join(', ')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttribute(attr.attributeId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="add" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Özellik Adı *</label>
                        <Input
                          value={newAttribute.name}
                          onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                          placeholder="örn: Malzeme"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tip</label>
                        <select
                          value={newAttribute.type}
                          onChange={(e) => setNewAttribute({ ...newAttribute, type: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="select">Seçim Listesi</option>
                          <option value="color">Renk Seçimi</option>
                          <option value="text">Metin</option>
                          <option value="number">Sayı</option>
                        </select>
                      </div>

                      {newAttribute.type === 'select' || newAttribute.type === 'color' ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Seçenekler</label>
                          <div className="flex gap-2">
                            <Input
                              value={newAttribute.optionInput}
                              onChange={(e) => setNewAttribute({ ...newAttribute, optionInput: e.target.value })}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                              placeholder="Seçenek ekle ve Enter'a bas"
                            />
                            <Button type="button" onClick={addOption} variant="outline">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newAttribute.options.map((option) => (
                              <Badge key={option} variant="secondary" className="gap-1">
                                {option}
                                <button
                                  type="button"
                                  onClick={() => removeOption(option)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required"
                          checked={newAttribute.required}
                          onChange={(e) => setNewAttribute({ ...newAttribute, required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="required" className="text-sm">Zorunlu alan</label>
                      </div>

                      <Button
                        onClick={handleAddAttribute}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Özellik Ekle
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-8">
              <div className="text-center text-gray-500">
                <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Kategori detaylarını görmek için listeden seçim yapın</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
