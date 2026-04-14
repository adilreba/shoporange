import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { adminProductsApi } from '@/services/adminProductsApi';
import { categoriesApi } from '@/services/api';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
}

interface Category {
  id: string;
  name: string;
}

export function AdminProducts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        adminProductsApi.getAll(),
        categoriesApi.getAll().catch(() => []),
      ]);
      setProducts(Array.isArray(productsRes) ? productsRes : productsRes.data || []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || []);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    toast.error('Bu sayfaya erişim yetkiniz yok!');
    navigate('/');
    return null;
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await adminProductsApi.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Ürün başarıyla silindi');
    } catch (error) {
      toast.error('Ürün silinirken hata oluştu');
      console.error(error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Admin Header */}
      <header className="bg-card border-b">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              Siteye Dön
            </Button>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
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

          {/* Main Content */}
          <main className="lg:col-span-4 space-y-6">
            {/* Toolbar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ürün ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="all">Tüm Kategoriler</option>
                      {categories.map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    className="gradient-orange"
                    onClick={() => navigate('/admin/products/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ürün
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Ürün</th>
                        <th className="text-left p-4 font-medium">SKU/Barkod</th>
                        <th className="text-left p-4 font-medium">Kategori</th>
                        <th className="text-left p-4 font-medium">Fiyat</th>
                        <th className="text-left p-4 font-medium">Stok</th>
                        <th className="text-left p-4 font-medium">Durum</th>
                        <th className="text-right p-4 font-medium">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            Yükleniyor...
                          </td>
                        </tr>
                      ) : paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            Ürün bulunamadı
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-muted">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.images?.[0] || '/placeholder-product.jpg'}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
                                />
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {product.sku && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">SKU:</span>
                                    <span className="font-mono font-medium ml-1">{product.sku}</span>
                                  </p>
                                )}
                                {product.barcode && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">Barkod:</span>
                                    <span className="font-mono ml-1">{product.barcode}</span>
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {categories.find(c => c.id === product.category)?.name || product.category}
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{formatPrice(product.price)}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={product.stock < 10 ? 'text-red-600' : ''}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                {product.isNew && (
                                  <Badge className="bg-green-500">Yeni</Badge>
                                )}
                                {product.isFeatured && (
                                  <Badge className="bg-orange-500">Öne Çıkan</Badge>
                                )}
                                {product.discount && product.discount > 0 && (
                                  <Badge className="bg-red-500">%{product.discount}</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filteredProducts.length} üründen {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} arası gösteriliyor
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="flex items-center px-4">
                        Sayfa {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
