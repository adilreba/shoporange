import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Image as ImageIcon,
  Package,
  ArrowUpDown,
  Filter,
  Download,
  Percent,
  Tag,
  XCircle,
  Copy,
  Eye,
  Star,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminProductsApi, type AdminProduct } from '@/services/adminProductsApi';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface ProductDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  campaignName?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  images: string[];
  rating?: number;
  reviews?: number;
  salesCount: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  variants?: ProductVariant[];
  discount?: ProductDiscount;
  featured: boolean;
  tags: string[];
  brand?: string;
  sku?: string;
}

const categories = [
  { id: 'all', name: 'Tümü' },
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

function mapAdminProductToProduct(p: AdminProduct): Product {
  return {
    id: p.id || '',
    name: p.name || '',
    description: p.description || '',
    price: p.price || 0,
    originalPrice: p.originalPrice,
    category: p.category || '',
    stock: typeof p.stock === 'number' ? p.stock : 0,
    images: p.images || [],
    rating: p.rating || 0,
    reviews: p.reviewCount || 0,
    salesCount: 0,
    status: p.status || (p.active === false ? 'inactive' : p.stock === 0 ? 'out_of_stock' : 'active'),
    createdAt: p.createdAt || new Date().toISOString(),
    variants: (p as any).variants || (p as any).variations?.map((v: any) => ({
      id: v.variationId || v.id,
      name: Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(', '),
      sku: v.sku,
      price: v.price,
      stock: v.stock,
    })),
    discount: p.discount
      ? {
          type: 'percentage',
          value: p.discount,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
        }
      : undefined,
    featured: p.isFeatured || false,
    tags: p.tags || [],
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'sales' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [discountForm, setDiscountForm] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    startDate: '',
    endDate: '',
    campaignName: '',
  });
  const [activeTab, setActiveTab] = useState('all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminProductsApi.getAll();
      const items = Array.isArray(res) ? res : res.data || [];
      setProducts(items.map(mapAdminProductToProduct));
    } catch (error: any) {
      toast.error('Ürünler yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && product.status === 'active') ||
        (activeTab === 'inactive' && product.status === 'inactive') ||
        (activeTab === 'out_of_stock' && product.status === 'out_of_stock') ||
        (activeTab === 'on_sale' && product.discount) ||
        (activeTab === 'featured' && product.featured);
      return matchesSearch && matchesCategory && matchesTab;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'sales':
          comparison = (a.salesCount || 0) - (b.salesCount || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleDelete = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await adminProductsApi.delete(productId);
      setProducts(products.filter((p) => p.id !== productId));
      toast.success('Ürün silindi');
    } catch (error: any) {
      toast.error(error.message || 'Ürün silinirken hata oluştu');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedProducts.length} ürünü silmek istediğinize emin misiniz?`)) return;
    try {
      await Promise.all(selectedProducts.map((id) => adminProductsApi.delete(id)));
      setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      toast.success('Seçili ürünler silindi');
    } catch (error: any) {
      toast.error(error.message || 'Toplu silme işleminde hata oluştu');
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const newProductData: AdminProduct = {
        name: `${product.name} (Kopya)`,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: 0,
        images: product.images,
        brand: product.brand,
        originalPrice: product.originalPrice,
        discount: product.discount?.value,
        tags: product.tags,
        isFeatured: false,
        active: false,
      };
      const result = await adminProductsApi.create(newProductData);
      const created = mapAdminProductToProduct(result.product || result);
      setProducts([created, ...products]);
      toast.success('Ürün kopyalandı');
    } catch (error: any) {
      toast.error(error.message || 'Ürün kopyalanırken hata oluştu');
    }
  };

  const openDiscountModal = (product: Product) => {
    setSelectedProductForDiscount(product);
    if (product.discount) {
      setDiscountForm({
        type: product.discount.type,
        value: product.discount.value.toString(),
        startDate: product.discount.startDate,
        endDate: product.discount.endDate,
        campaignName: product.discount.campaignName || '',
      });
    } else {
      setDiscountForm({
        type: 'percentage',
        value: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        campaignName: '',
      });
    }
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!selectedProductForDiscount || !discountForm.value) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    const value = parseFloat(discountForm.value);
    const newPrice =
      discountForm.type === 'percentage'
        ? selectedProductForDiscount.price * (1 - value / 100)
        : selectedProductForDiscount.price - value;

    try {
      await adminProductsApi.update(selectedProductForDiscount.id, {
        originalPrice: selectedProductForDiscount.discount
          ? selectedProductForDiscount.originalPrice
          : selectedProductForDiscount.price,
        price: Math.max(0, newPrice),
        discount: value,
      });

      setProducts(
        products.map((p) => {
          if (p.id === selectedProductForDiscount.id) {
            return {
              ...p,
              originalPrice: p.discount ? p.originalPrice : p.price,
              price: Math.max(0, newPrice),
              discount: {
                type: discountForm.type,
                value,
                startDate: discountForm.startDate,
                endDate: discountForm.endDate,
                campaignName: discountForm.campaignName,
              },
            };
          }
          return p;
        })
      );
      setIsDiscountModalOpen(false);
      toast.success('İndirim uygulandı');
    } catch (error: any) {
      toast.error(error.message || 'İndirim uygulanırken hata oluştu');
    }
  };

  const handleRemoveDiscount = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    try {
      await adminProductsApi.update(productId, {
        price: product.originalPrice || product.price,
        originalPrice: undefined,
        discount: undefined,
      });
      setProducts(
        products.map((p) => {
          if (p.id === productId) {
            const newProduct = { ...p };
            if (newProduct.originalPrice) {
              newProduct.price = newProduct.originalPrice;
            }
            delete (newProduct as any).discount;
            delete (newProduct as any).originalPrice;
            return newProduct;
          }
          return p;
        })
      );
      toast.success('İndirim kaldırıldı');
    } catch (error: any) {
      toast.error(error.message || 'İndirim kaldırılırken hata oluştu');
    }
  };

  const handlePriceChange = async (productId: string, newPrice: number) => {
    try {
      await adminProductsApi.update(productId, { price: newPrice });
      setProducts(products.map((p) => (p.id === productId ? { ...p, price: newPrice } : p)));
      toast.success('Fiyat güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Fiyat güncellenirken hata oluştu');
    }
  };

  const handleStockChange = async (productId: string, newStock: number) => {
    try {
      const newStatus = newStock === 0 ? 'out_of_stock' : 'active';
      await adminProductsApi.update(productId, { stock: newStock, status: newStatus as any });
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, stock: newStock, status: newStatus as Product['status'] } : p
        )
      );
      toast.success('Stok güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Stok güncellenirken hata oluştu');
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newFeatured = !product.featured;
    try {
      await adminProductsApi.update(productId, { isFeatured: newFeatured });
      setProducts(products.map((p) => (p.id === productId ? { ...p, featured: newFeatured } : p)));
      toast.success(newFeatured ? 'Ürün öne çıkarıldı' : 'Ürün öne çıkarma kaldırıldı');
    } catch (error: any) {
      toast.error(error.message || 'İşlem sırasında hata oluştu');
    }
  };

  const handleExport = () => {
    const data = filteredProducts.map((p) => ({
      ID: p.id,
      Ad: p.name,
      Kategori: p.category,
      Fiyat: p.price,
      Stok: p.stock,
      Durum: p.status,
      SKU: p.sku || '',
    }));
    const headers = Object.keys(data[0] || {});
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => `"${(row as any)[h]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urunler-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV dışa aktarıldı');
  };

  const getStockBadge = (stock: number, status: string) => {
    if (status === 'out_of_stock') return <Badge className="bg-red-500">Tükendi</Badge>;
    if (stock < 5) return <Badge className="bg-red-500">Kritik ({stock})</Badge>;
    if (stock < 10) return <Badge className="bg-yellow-500">Az ({stock})</Badge>;
    return <Badge className="bg-green-500">Stokta ({stock})</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      out_of_stock: 'bg-red-100 text-red-700',
    };
    const labels = { active: 'Aktif', inactive: 'Pasif', out_of_stock: 'Stok Yok' };
    return <Badge variant="secondary" className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    outOfStock: products.filter((p) => p.status === 'out_of_stock').length,
    onSale: products.filter((p) => p.discount).length,
    totalStock: products.reduce((acc, p) => acc + p.stock, 0),
    totalValue: products.reduce((acc, p) => acc + p.price * p.stock, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürün Yönetimi</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Yükleniyor...' : `${filteredProducts.length} ürün • Toplam stok değeri: ₺${stats.totalValue.toLocaleString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </Button>
          <Link to="/admin/products/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Toplam Ürün</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-sm text-gray-500">Stok Yok</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.onSale}</p>
            <p className="text-sm text-gray-500">İndirimde</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.totalStock}</p>
            <p className="text-sm text-gray-500">Toplam Stok</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tümü ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Aktif ({stats.active})</TabsTrigger>
          <TabsTrigger value="on_sale">İndirimde ({stats.onSale})</TabsTrigger>
          <TabsTrigger value="out_of_stock">Stok Yok ({stats.outOfStock})</TabsTrigger>
          <TabsTrigger value="featured">Öne Çıkan</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Ürün adı, ID veya açıklama ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-full md:w-40">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tarih</SelectItem>
                  <SelectItem value="name">İsim</SelectItem>
                  <SelectItem value="price">Fiyat</SelectItem>
                  <SelectItem value="stock">Stok</SelectItem>
                  <SelectItem value="sales">Satış</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? '↑ Artan' : '↓ Azalan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium">{selectedProducts.length} ürün seçildi</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
                  Seçimi Kaldır
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts.map((p) => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Varyasyonlar</TableHead>
                  <TableHead>Satış</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                      <p className="text-gray-500 mt-2">Ürünler yükleniyor...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Ürün bulunamadı</p>
                      {products.length === 0 && (
                        <p className="text-sm mt-1">
                          <Link to="/admin/products/new" className="text-orange-600 hover:underline">
                            Yeni ürün ekleyin
                          </Link>
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className={selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{product.name}</p>
                              {product.featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                            </div>
                            <p className="text-xs text-gray-500">{product.id}</p>
                            <div className="flex gap-1 mt-1">
                              {product.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {product.discount && product.originalPrice && (
                            <p className="text-sm text-gray-400 line-through">₺{product.originalPrice.toLocaleString()}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) => handlePriceChange(product.id, parseFloat(e.target.value))}
                              className="w-24 h-8 text-sm"
                            />
                            {product.discount && (
                              <Badge className="bg-red-500 text-white">%{product.discount.value}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={product.stock}
                            onChange={(e) => handleStockChange(product.id, parseInt(e.target.value))}
                            className="w-16 h-8 text-sm"
                          />
                          {getStockBadge(product.stock, product.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.variants && product.variants.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="w-fit">
                              {product.variants.length} varyasyon
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Toplam: {product.variants.reduce((sum, v) => sum + v.stock, 0)} stok
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{product.salesCount}</p>
                          <p className="text-gray-500 text-xs">
                            ⭐ {product.rating} ({product.reviews})
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        {product.discount ? (
                          <div className="text-xs">
                            <Badge className="bg-orange-100 text-orange-700 mb-1">
                              {product.discount.campaignName || 'İndirim'}
                            </Badge>
                            <p className="text-gray-500">
                              {product.discount.startDate} - {product.discount.endDate}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/products/${product.id}/edit`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDiscountModal(product)}>
                              <Percent className="w-4 h-4 mr-2" />
                              İndirim Uygula
                            </DropdownMenuItem>
                            {product.discount && (
                              <DropdownMenuItem onClick={() => handleRemoveDiscount(product.id)}>
                                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                İndirimi Kaldır
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleFeatured(product.id)}>
                              <Star className="w-4 h-4 mr-2" />
                              {product.featured ? 'Öne Çıkarma' : 'Öne Çıkar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Kopyala
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info('Önizleme açıldı')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Önizle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Discount Modal */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>İndirim Uygula</DialogTitle>
            <DialogDescription>{selectedProductForDiscount?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <Button
                type="button"
                variant={discountForm.type === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDiscountForm({ ...discountForm, type: 'percentage' })}
                className="flex-1"
              >
                <Percent className="w-4 h-4 mr-2" />
                Yüzde (%)
              </Button>
              <Button
                type="button"
                variant={discountForm.type === 'fixed' ? 'default' : 'outline'}
                onClick={() => setDiscountForm({ ...discountForm, type: 'fixed' })}
                className="flex-1"
              >
                <Tag className="w-4 h-4 mr-2" />
                Sabit Tutar (₺)
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                İndirim {discountForm.type === 'percentage' ? 'Oranı (%)' : 'Tutarı (₺)'}
              </label>
              <Input
                type="number"
                value={discountForm.value}
                onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                placeholder={discountForm.type === 'percentage' ? 'Örn: 20' : 'Örn: 500'}
              />
              {discountForm.value && selectedProductForDiscount && (
                <p className="text-sm text-gray-500 mt-1">
                  Yeni fiyat: ₺
                  {Math.max(
                    0,
                    discountForm.type === 'percentage'
                      ? selectedProductForDiscount.price * (1 - parseFloat(discountForm.value) / 100)
                      : selectedProductForDiscount.price - parseFloat(discountForm.value)
                  ).toLocaleString()}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Kampanya Adı (Opsiyonel)</label>
              <Input
                value={discountForm.campaignName}
                onChange={(e) => setDiscountForm({ ...discountForm, campaignName: e.target.value })}
                placeholder="Örn: Mart İndirimi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Başlangıç</label>
                <Input
                  type="date"
                  value={discountForm.startDate}
                  onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bitiş</label>
                <Input
                  type="date"
                  value={discountForm.endDate}
                  onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleApplyDiscount} className="bg-orange-500 hover:bg-orange-600">
              İndirim Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
