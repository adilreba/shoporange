import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Plus, 
  Minus, 
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { stockApi } from '@/services/stockApi';
import { products as mockProducts } from '@/data/mockData';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reservedStock: number;
  actualAvailable: number;
  category: string;
  brand: string;
  price: number;
  reorderPoint: number;
  lastUpdated: string;
}

interface StockReservation {
  reservationId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  status: 'reserved' | 'released' | 'confirmed';
  createdAt: string;
  expiresAt: number;
}

export default function StockManagement() {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [reservations] = useState<StockReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'reserved'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load products
  useEffect(() => {
    // In production, this would fetch from the API
    // For now, we'll use mock data enhanced with stock info
    const enhancedProducts: StockItem[] = mockProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || `SKU-${p.id}`,
      stock: p.stock,
      reservedStock: 0, // Would come from API
      actualAvailable: p.stock,
      category: p.category,
      brand: p.brand,
      price: p.price,
      reorderPoint: 10,
      lastUpdated: p.updatedAt || new Date().toISOString(),
    }));

    setProducts(enhancedProducts);
    setLoading(false);
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stock':
          comparison = a.actualAvailable - b.actualAvailable;
          break;
        case 'reserved':
          comparison = a.reservedStock - b.reservedStock;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Stats
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalReserved: products.reduce((sum, p) => sum + p.reservedStock, 0),
    lowStock: products.filter(p => p.actualAvailable <= p.reorderPoint).length,
    outOfStock: products.filter(p => p.actualAvailable === 0).length,
    stockValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || stockAdjustment === 0) return;

    try {
      const newStock = selectedProduct.stock + stockAdjustment;
      
      if (newStock < 0) {
        toast.error('Stok negatif olamaz');
        return;
      }

      // Update via API
      await stockApi.updateStock(selectedProduct.id, newStock, adjustmentReason);

      // Update local state
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, stock: newStock, actualAvailable: newStock - p.reservedStock, lastUpdated: new Date().toISOString() }
          : p
      ));

      toast.success('Stok güncellendi');
      setIsUpdateDialogOpen(false);
      setStockAdjustment(0);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Stok güncellenirken hata oluştu');
    }
  };

  const getStockStatusBadge = (item: StockItem) => {
    if (item.actualAvailable === 0) {
      return <Badge className="bg-red-500">Tükendi</Badge>;
    }
    if (item.actualAvailable <= item.reorderPoint) {
      return <Badge className="bg-red-100 text-red-700">Kritik ({item.actualAvailable})</Badge>;
    }
    if (item.actualAvailable <= item.reorderPoint * 2) {
      return <Badge className="bg-yellow-100 text-yellow-700">Düşük ({item.actualAvailable})</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Normal ({item.actualAvailable})</Badge>;
  };

  const exportStockReport = () => {
    const csv = [
      ['Ürün ID', 'Ürün Adı', 'SKU', 'Kategori', 'Toplam Stok', 'Rezerve', 'Kullanılabilir', 'Son Güncelleme'].join(','),
      ...filteredProducts.map(p => [
        p.id,
        `"${p.name}"`,
        p.sku,
        p.category,
        p.stock,
        p.reservedStock,
        p.actualAvailable,
        new Date(p.lastUpdated).toLocaleDateString('tr-TR'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stok-raporu-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Stok raporu indirildi');
  };

  const lowStockProducts = products.filter(p => p.actualAvailable <= p.reorderPoint);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok Yönetimi</h1>
          <p className="text-sm text-gray-500">Gerçek zamanlı stok takibi ve yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportStockReport}>
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-sm text-gray-500">Toplam Ürün</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.totalStock}</p>
            <p className="text-sm text-gray-500">Toplam Stok</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.totalReserved}</p>
            <p className="text-sm text-gray-500">Rezerve</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            <p className="text-sm text-gray-500">Kritik Stok</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-sm text-gray-500">Tükendi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">₺{stats.stockValue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Stok Değeri</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="reservations">Rezervasyonlar</TabsTrigger>
          <TabsTrigger value="lowstock">Kritik Stok ({lowStockProducts.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Kritik Stok Uyarıları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Tüm ürünlerde yeterli stok var</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <Badge className="bg-red-500">{product.actualAvailable} adet</Badge>
                      </div>
                    ))}
                    {lowStockProducts.length > 5 && (
                      <p className="text-center text-sm text-gray-500">
                        +{lowStockProducts.length - 5} ürün daha...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Stok Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm">Yeterli Stok</span>
                  <span className="font-bold text-green-700">
                    {products.filter(p => p.actualAvailable > p.reorderPoint * 2).length} ürün
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm">Düşük Stok</span>
                  <span className="font-bold text-yellow-700">
                    {products.filter(p => p.actualAvailable > p.reorderPoint && p.actualAvailable <= p.reorderPoint * 2).length} ürün
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm">Kritik Stok</span>
                  <span className="font-bold text-red-700">{stats.lowStock} ürün</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Tükenen</span>
                  <span className="font-bold text-gray-700">{stats.outOfStock} ürün</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <Card>
            <CardContent className="p-0">
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Ürün adı, SKU veya marka ara..."
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
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      <SelectItem value="elektronik">Elektronik</SelectItem>
                      <SelectItem value="moda">Moda</SelectItem>
                      <SelectItem value="ev-yasam">Ev & Yaşam</SelectItem>
                      <SelectItem value="kozmetik">Kozmetik</SelectItem>
                      <SelectItem value="spor">Spor</SelectItem>
                      <SelectItem value="kitap">Kitap</SelectItem>
                      <SelectItem value="oyuncak">Oyuncak</SelectItem>
                      <SelectItem value="supermarket">Süpermarket</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-full md:w-40">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sırala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">İsim</SelectItem>
                      <SelectItem value="stock">Stok</SelectItem>
                      <SelectItem value="reserved">Rezerve</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>

              {/* Products Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Toplam Stok</TableHead>
                    <TableHead>Rezerve</TableHead>
                    <TableHead>Kullanılabilir</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-500" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Ürün bulunamadı</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{product.sku}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          {product.reservedStock > 0 ? (
                            <span className="text-amber-600">{product.reservedStock}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.actualAvailable}</TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setStockAdjustment(0);
                              setIsUpdateDialogOpen(true);
                            }}
                          >
                            Güncelle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <Card>
            <CardHeader>
              <CardTitle>Aktif Stok Rezervasyonları</CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aktif rezervasyon bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map(res => (
                    <div key={res.reservationId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Rezervasyon: {res.reservationId}</span>
                        <Badge>{res.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">Kullanıcı: {res.userId}</p>
                      <p className="text-sm text-gray-500">
                        Oluşturulma: {new Date(res.createdAt).toLocaleString('tr-TR')}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Ürünler:</p>
                        <ul className="text-sm text-gray-600">
                          {res.items.map((item, idx) => (
                            <li key={idx}>• {item.productId}: {item.quantity} adet</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Low Stock Tab */}
        {activeTab === 'lowstock' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Kritik Stok Listesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>Kritik stokta ürün bulunmuyor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Mevcut Stok</TableHead>
                      <TableHead>Kritik Seviye</TableHead>
                      <TableHead>Eksik</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{product.sku}</TableCell>
                        <TableCell className="text-red-600 font-bold">{product.actualAvailable}</TableCell>
                        <TableCell>{product.reorderPoint}</TableCell>
                        <TableCell className="text-red-600">
                          +{product.reorderPoint - product.actualAvailable}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setStockAdjustment(product.reorderPoint * 2 - product.stock);
                              setIsUpdateDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Stok Ekle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </Tabs>

      {/* Update Stock Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok Güncelle</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Mevcut Stok:</span>
              <span className="font-bold">{selectedProduct?.stock}</span>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Stok Değişimi</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStockAdjustment(prev => prev - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                  className="text-center font-bold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStockAdjustment(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Yeni stok: <span className="font-bold">{(selectedProduct?.stock || 0) + stockAdjustment}</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Değişiklik Nedeni</label>
              <Input
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Örn: Yeni sipariş, iade, sayım düzeltmesi..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              <XCircle className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button 
              onClick={handleUpdateStock}
              disabled={stockAdjustment === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
