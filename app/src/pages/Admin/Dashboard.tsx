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
  XCircle,
  Menu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Badge className={`${styles[status] || 'bg-muted text-foreground'} text-xs`}>
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

  const SidebarContent = () => (
    <nav className="p-4 space-y-1">
      <Button 
        variant={activeTab === 'overview' ? 'default' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveTab('overview');
          setSidebarOpen(false);
        }}
      >
        <LayoutDashboard className="h-4 w-4 mr-3" />
        Dashboard
      </Button>
      <Button 
        variant={activeTab === 'orders' ? 'default' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveTab('orders');
          setSidebarOpen(false);
        }}
      >
        <ShoppingCart className="h-4 w-4 mr-3" />
        Siparişler
        <Badge className="ml-auto bg-red-500 text-xs">{adminMockOrders.filter(o => o.status === 'pending').length}</Badge>
      </Button>
      <Button 
        variant={activeTab === 'products' ? 'default' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveTab('products');
          setSidebarOpen(false);
        }}
      >
        <Package className="h-4 w-4 mr-3" />
        Ürünler
      </Button>
      <Button 
        variant={activeTab === 'stock' ? 'default' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveTab('stock');
          setSidebarOpen(false);
        }}
      >
        <Box className="h-4 w-4 mr-3" />
        Stok Takibi
        {lowStockProducts.length > 0 && (
          <Badge className="ml-auto bg-amber-500 text-xs">{lowStockProducts.length}</Badge>
        )}
      </Button>
      <Button 
        variant={activeTab === 'users' ? 'default' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          setActiveTab('users');
          setSidebarOpen(false);
        }}
      >
        <Users className="h-4 w-4 mr-3" />
        Müşteriler
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted">
      {/* Admin Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold">Admin Panel</h1>
                      </div>
                    </div>
                  </div>
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Hoş geldin, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden sm:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Rapor
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <span className="hidden sm:inline">Siteye Dön</span>
                <span className="sm:hidden">Site</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-card border-r min-h-[calc(100vh-73px)] sticky top-[73px]">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 m-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat) => (
                  <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                          <p className="text-lg sm:text-2xl font-bold mt-1">{stat.value}</p>
                          <div className={`flex items-center gap-1 mt-1 sm:mt-2 text-xs ${
                            stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>{stat.change}</span>
                            <span className="text-muted-foreground hidden sm:inline">vs geçen ay</span>
                          </div>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                          <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alerts Section */}
              {lowStockProducts.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-amber-800 text-base sm:text-lg">Stok Uyarıları</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="space-y-2">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-card rounded-lg">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <img src={product.images[0]} alt={product.name} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <div className="text-right">
                              <p className={`font-bold text-sm ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                {product.stock}
                              </p>
                              <p className="text-xs text-muted-foreground">adet</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="hidden sm:flex"
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
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Son Siparişler</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Son 5 sipariş</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs sm:text-sm"
                    >
                      Tümü
                    </Button>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {/* Mobile View */}
                    <div className="lg:hidden space-y-3">
                      {recentOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getStatusIcon(order.status)}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{order.id}</p>
                              <p className="text-xs text-muted-foreground truncate">{order.customer}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">₺{order.total.toLocaleString()}</p>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <tbody className="space-y-3">
                          {recentOrders.map((order) => (
                            <tr 
                              key={order.id} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <td className="flex items-center gap-3">
                                {getStatusIcon(order.status)}
                                <div>
                                  <p className="font-medium text-sm">{order.id}</p>
                                  <p className="text-xs text-muted-foreground">{order.customer}</p>
                                </div>
                              </td>
                              <td className="text-right">
                                <p className="font-medium text-sm">₺{order.total.toLocaleString()}</p>
                                {getStatusBadge(order.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Çok Satan Ürünler</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Bu ayın en çok satanları</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('products')}
                      className="text-xs sm:text-sm"
                    >
                      Tümü
                    </Button>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {/* Mobile View */}
                    <div className="lg:hidden space-y-3">
                      {topProducts.map((product, index) => (
                        <div 
                          key={product.id} 
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-muted text-foreground' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </span>
                            <img src={product.images[0]} alt={product.name} className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded flex-shrink-0" />
                            <p className="font-medium text-sm truncate">{product.name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">₺{(product.salesCount || 0) * product.price}</p>
                            <p className="text-xs text-muted-foreground">{product.salesCount || 0} satış</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <tbody className="space-y-3">
                          {topProducts.map((product, index) => (
                            <tr 
                              key={product.id} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <td className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-muted text-foreground' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {index + 1}
                                </span>
                                <img src={product.images[0]} alt={product.name} className="w-8 h-8 object-cover rounded" />
                                <p className="font-medium text-sm truncate max-w-[150px]">{product.name}</p>
                              </td>
                              <td className="text-right">
                                <p className="font-medium text-sm">₺{(product.salesCount || 0) * product.price}</p>
                                <p className="text-xs text-muted-foreground">{product.salesCount || 0} satış</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      className="gradient-orange h-12 sm:h-16 text-xs sm:text-sm"
                      onClick={() => navigate('/admin/products/new')}
                    >
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="truncate">Yeni Ürün</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-16 text-xs sm:text-sm"
                      onClick={() => setActiveTab('orders')}
                    >
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="truncate">Siparişler</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-16 text-xs sm:text-sm"
                      onClick={() => setActiveTab('stock')}
                    >
                      <Box className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="truncate">Stok</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 sm:h-16 text-xs sm:text-sm"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="truncate">Müşteriler</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="m-0">
              <OrdersManagement />
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="m-0">
              <ProductsManagement />
            </TabsContent>

            {/* Stock Tab */}
            <TabsContent value="stock" className="m-0">
              <StockManagement />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="m-0">
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
      <Badge className={`${styles[status] || 'bg-muted text-foreground'} text-xs`}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold">Sipariş Yönetimi</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="processing">İşleniyor</option>
            <option value="shipped">Kargoda</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-sm">{order.id}</p>
                <p className="text-xs text-muted-foreground">{order.customer}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground">{order.date}</span>
              <span className="font-bold">₺{order.total.toLocaleString()}</span>
            </div>
            <select 
              value={order.status}
              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2"
            >
              <option value="pending">Beklemede</option>
              <option value="processing">İşleniyor</option>
              <option value="shipped">Kargoda</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal</option>
            </select>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sipariş No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Müşteri</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tarih</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tutar</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted">
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{order.date}</td>
                  <td className="px-4 py-3 font-medium">₺{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold">Ürün Yönetimi</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Moda">Moda</option>
            <option value="Ev & Yaşam">Ev & Yaşam</option>
            <option value="Kozmetik">Kozmetik</option>
          </select>
          <Button className="gradient-orange" onClick={() => navigate('/admin/products/new')}>
            <Package className="h-4 w-4 mr-2" />
            Yeni
          </Button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredProducts.slice(0, 10).map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex gap-3">
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.brand}</p>
                <p className="text-sm text-orange-600 font-bold mt-1">₺{product.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    Stok: {product.stock}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Düzenle
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-red-500"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fiyat</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stok</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Satış</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-muted">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold">Stok Takibi</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-600">Stok Yok</p>
            <p className="text-xl sm:text-2xl font-bold text-red-700">{outOfStock.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-amber-600">Kritik Stok</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">{lowStock.filter(p => p.stock > 0 && p.stock < 10).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-600">Düşük Stok</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{lowStock.filter(p => p.stock >= 10).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-600">Yeterli Stok</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">{products.filter(p => p.stock >= 20).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredProducts.slice(0, 10).map((product) => {
          const status = getStockStatus(product.stock);
          return (
            <Card key={product.id} className="p-4">
              <div className="flex gap-3">
                <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <Badge className={`${status.color} mt-2 text-xs`}>{status.label}</Badge>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((product.stock / 100) * 100, 100)} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-12 text-right">{product.stock}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-3"
                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
              >
                Stok Güncelle
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="text-lg">Stok Durumu</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mevcut Stok</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.stock);
                return (
                  <tr key={product.id} className="border-b hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{product.stock}</span>
                        <Progress value={Math.min((product.stock / 100) * 100, 100)} className="w-24 h-2" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-bold">Müşteri Yönetimi</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Tüm Roller</option>
            <option value="user">Kullanıcı</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Toplam Müşteri</p>
            <p className="text-xl sm:text-2xl font-bold">{mockUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Yeni Müşteri (Bu Ay)</p>
            <p className="text-xl sm:text-2xl font-bold">+24</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Aktif Müşteri</p>
            <p className="text-xl sm:text-2xl font-bold">{mockUsers.filter(u => u.role === 'user').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-medium text-orange-600 text-lg">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge className={`mt-1 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Görüntüle
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Müşteri</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">E-posta</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Telefon</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted">
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
