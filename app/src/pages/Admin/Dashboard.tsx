import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Box,
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { products, adminMockOrders, mockUsers } from '@/data/mockData';
import { toast } from 'sonner';

// Stats data
const stats = [
  {
    title: 'Toplam Satış',
    value: '₺1,245,890',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    title: 'Toplam Sipariş',
    value: '3,456',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-blue-500'
  },
  {
    title: 'Toplam Ürün',
    value: '15,234',
    change: '+23',
    trend: 'up',
    icon: Package,
    color: 'bg-orange-500'
  },
  {
    title: 'Toplam Müşteri',
    value: '45,678',
    change: '+5.4%',
    trend: 'up',
    icon: Users,
    color: 'bg-purple-500'
  }
];

// Low stock products
const lowStockProducts = products.filter(p => p.stock < 10).slice(0, 5);

// Recent orders
const recentOrders = adminMockOrders.slice(0, 5);

// Top products
const topProducts = [...products]
  .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
  .slice(0, 5);

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  if (user?.role !== 'admin') {
    toast.error('Bu sayfaya erişim yetkiniz yok!');
    navigate('/');
    return null;
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success('Veriler güncellendi');
    }, 1000);
  };

  const handleExport = () => {
    toast.success('Rapor indiriliyor...');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700',
      'processing': 'bg-blue-100 text-blue-700',
      'shipped': 'bg-purple-100 text-purple-700',
      'pending': 'bg-amber-100 text-amber-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      'completed': 'Tamamlandı',
      'processing': 'İşleniyor',
      'shipped': 'Kargoda',
      'pending': 'Beklemede',
      'cancelled': 'İptal'
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-gray-500">Hoş geldin, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Rapor İndir
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Siteye Dön
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen sticky top-16">
          <nav className="p-4 space-y-1">
            <Button 
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart className="h-4 w-4 mr-3" />
              Siparişler
              <Badge className="ml-auto bg-red-500">{adminMockOrders.filter(o => o.status === 'pending').length}</Badge>
            </Button>
            <Button 
              variant={activeTab === 'products' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('products')}
            >
              <Package className="h-4 w-4 mr-3" />
              Ürünler
            </Button>
            <Button 
              variant={activeTab === 'stock' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('stock')}
            >
              <Box className="h-4 w-4 mr-3" />
              Stok Takibi
              {lowStockProducts.length > 0 && (
                <Badge className="ml-auto bg-amber-500">{lowStockProducts.length}</Badge>
              )}
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-4 w-4 mr-3" />
              Müşteriler
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{stat.title}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          <div className={`flex items-center gap-1 mt-2 text-sm ${
                            stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.trend === 'up' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            <span>{stat.change}</span>
                            <span className="text-gray-400">vs geçen ay</span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alerts Section */}
              {lowStockProducts.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-amber-800">Stok Uyarıları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.brand}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-bold ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                {product.stock} adet
                              </p>
                              <p className="text-xs text-gray-500">kaldı</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Charts & Tables */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Son Siparişler</CardTitle>
                      <CardDescription>Son 5 siparişin özeti</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('orders')}
                    >
                      Tümünü Gör
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(order.status)}
                            <div>
                              <p className="font-medium text-sm">{order.id}</p>
                              <p className="text-xs text-gray-500">{order.customer}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">₺{order.total.toLocaleString()}</p>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Çok Satan Ürünler</CardTitle>
                      <CardDescription>Bu ayın en çok satanları</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('products')}
                    >
                      Tümünü Gör
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div 
                          key={product.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-200 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <img src={product.images[0]} alt={product.name} className="w-8 h-8 object-cover rounded" />
                            <p className="font-medium text-sm truncate max-w-[150px]">{product.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">₺{(product.salesCount || 0) * product.price}</p>
                            <p className="text-xs text-gray-500">{product.salesCount || 0} satış</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <Button 
                      className="gradient-orange h-16"
                      onClick={() => navigate('/admin/products/new')}
                    >
                      <Package className="h-5 w-5 mr-2" />
                      Yeni Ürün Ekle
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16"
                      onClick={() => setActiveTab('orders')}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Siparişleri Yönet
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16"
                      onClick={() => setActiveTab('stock')}
                    >
                      <Box className="h-5 w-5 mr-2" />
                      Stok Kontrolü
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Müşteriler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <OrdersManagement />
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <ProductsManagement />
            </TabsContent>

            {/* Stock Tab */}
            <TabsContent value="stock">
              <StockManagement />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Orders Management Component
function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(adminMockOrders);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    toast.success(`Sipariş ${orderId} durumu güncellendi`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700',
      'processing': 'bg-blue-100 text-blue-700',
      'shipped': 'bg-purple-100 text-purple-700',
      'pending': 'bg-amber-100 text-amber-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      'completed': 'Tamamlandı',
      'processing': 'İşleniyor',
      'shipped': 'Kargoda',
      'pending': 'Beklemede',
      'cancelled': 'İptal'
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sipariş Yönetimi</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Sipariş veya müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="processing">İşleniyor</option>
            <option value="shipped">Kargoda</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sipariş No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Müşteri</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tarih</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tutar</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{order.date}</td>
                  <td className="px-4 py-3 font-medium">₺{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="processing">İşleniyor</option>
                        <option value="shipped">Kargoda</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                      </select>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Products Management Component
function ProductsManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (_productId: string) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      toast.success('Ürün silindi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ürün Yönetimi</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Moda">Moda</option>
            <option value="Ev & Yaşam">Ev & Yaşam</option>
            <option value="Kozmetik">Kozmetik</option>
          </select>
          <Button className="gradient-orange" onClick={() => navigate('/admin/products/new')}>
            <Package className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fiyat</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stok</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Satış</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.category}</td>
                  <td className="px-4 py-3 font-medium">₺{product.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.salesCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Stock Management Component
function StockManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const lowStock = products.filter(p => p.stock < 20);
  const outOfStock = products.filter(p => p.stock === 0);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Stok Yok', color: 'bg-red-100 text-red-700' };
    if (stock < 10) return { label: 'Kritik', color: 'bg-red-100 text-red-700' };
    if (stock < 20) return { label: 'Düşük', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Yeterli', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stok Takibi</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">Stok Yok</p>
            <p className="text-2xl font-bold text-red-700">{outOfStock.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600">Kritik Stok</p>
            <p className="text-2xl font-bold text-amber-700">{lowStock.filter(p => p.stock > 0 && p.stock < 10).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Düşük Stok</p>
            <p className="text-2xl font-bold text-blue-700">{lowStock.filter(p => p.stock >= 10).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-600">Yeterli Stok</p>
            <p className="text-2xl font-bold text-green-700">{products.filter(p => p.stock >= 20).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stok Durumu</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mevcut Stok</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.stock);
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{product.stock}</span>
                        <Progress 
                          value={Math.min((product.stock / 100) * 100, 100)} 
                          className="w-24 h-2"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={status.color}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      >
                        Stok Güncelle
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Users Management Component
function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Müşteri Yönetimi</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tüm Roller</option>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Toplam Müşteri</p>
            <p className="text-2xl font-bold">{mockUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Yeni Müşteri (Bu Ay)</p>
            <p className="text-2xl font-bold">+24</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Aktif Müşteri</p>
            <p className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'user').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Müşteri</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">E-posta</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Telefon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-orange-600">{user.name.charAt(0)}</span>
                      </div>
                      <p className="font-medium text-sm">{user.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt || '2024-01-15'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
