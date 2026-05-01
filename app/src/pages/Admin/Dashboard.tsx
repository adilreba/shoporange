import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/services/api';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Activity,
  CreditCard,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';

// Mock data - API hatası durumunda fallback
const mockSalesData = [
  { name: 'Pzt', revenue: 12500, orders: 45, visitors: 320 },
  { name: 'Sal', revenue: 18200, orders: 62, visitors: 450 },
  { name: 'Çar', revenue: 15800, orders: 55, visitors: 380 },
  { name: 'Per', revenue: 24100, orders: 78, visitors: 520 },
  { name: 'Cum', revenue: 28900, orders: 95, visitors: 680 },
  { name: 'Cmt', revenue: 35200, orders: 112, visitors: 750 },
  { name: 'Paz', revenue: 29800, orders: 98, visitors: 620 },
];

const categoryData = [
  { name: 'Oturma Odası', value: 35, color: '#f97316' },
  { name: 'Yatak Odası', value: 25, color: '#3b82f6' },
  { name: 'Mutfak', value: 20, color: '#10b981' },
  { name: 'Ofis', value: 15, color: '#8b5cf6' },
  { name: 'Diğer', value: 5, color: '#6b7280' },
];

const topProducts = [
  { id: 1, name: 'Modern Koltuk Takımı', sales: 145, revenue: 2175000, stock: 12, trend: '+15%' },
  { id: 2, name: 'Yemek Masası Seti', sales: 98, revenue: 833000, stock: 8, trend: '+8%' },
  { id: 3, name: 'Çalışma Sandalyesi', sales: 87, revenue: 304500, stock: 25, trend: '-3%' },
  { id: 4, name: 'Kitaplık', sales: 76, revenue: 342000, stock: 5, trend: '+12%' },
  { id: 5, name: 'Avize', sales: 65, revenue: 182000, stock: 18, trend: '+5%' },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'Ahmet Yılmaz', total: 15750, status: 'completed', date: '2024-03-23 14:30', items: 3 },
  { id: 'ORD-002', customer: 'Ayşe Demir', total: 8900, status: 'processing', date: '2024-03-23 12:15', items: 2 },
  { id: 'ORD-003', customer: 'Mehmet Kaya', total: 23400, status: 'shipped', date: '2024-03-23 10:45', items: 5 },
  { id: 'ORD-004', customer: 'Fatma Şahin', total: 5600, status: 'pending', date: '2024-03-23 09:20', items: 1 },
  { id: 'ORD-005', customer: 'Ali Yıldız', total: 18900, status: 'completed', date: '2024-03-22 16:50', items: 4 },
];

const lowStockProducts = [
  { id: 1, name: 'Modern Koltuk Takımı', stock: 3, minStock: 10 },
  { id: 2, name: 'Yemek Masası', stock: 2, minStock: 8 },
  { id: 3, name: 'Kitaplık', stock: 5, minStock: 15 },
];

const StatCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  trend?: 'up' | 'down';
  icon: any;
  color: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change}</span>
              <span className="text-gray-400">vs geçen hafta</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState('7days');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const daysMap: Record<string, number> = { today: 1, '7days': 7, '30days': 30, '90days': 90 };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const days = daysMap[dateRange] || 7;
      const data = await fetchApi(`/admin/dashboard/stats?days=${days}`);
      setStats(data);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      toast.error('Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const salesData = stats?.dailySales?.map((d: any) => ({
    name: d.date.slice(5), // MM-DD
    revenue: d.revenue,
    orders: d.orders,
    visitors: 0,
  })) || mockSalesData;

  const totalRevenue = stats?.orders?.revenue || salesData.reduce((acc: number, day: any) => acc + day.revenue, 0);
  const totalOrders = stats?.orders?.total || salesData.reduce((acc: number, day: any) => acc + day.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">İşletmenizin performansına genel bakış</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
          >
            <option value="today">Bugün</option>
            <option value="7days">Son 7 Gün</option>
            <option value="30days">Son 30 Gün</option>
            <option value="90days">Son 3 Ay</option>
          </select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Toplam Gelir" 
          value={`₺${totalRevenue.toLocaleString()}`} 
          change="+12.5%" 
          trend="up" 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Toplam Sipariş" 
          value={totalOrders.toString()} 
          change="+8.2%" 
          trend="up" 
          icon={ShoppingCart} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Ortalama Sipariş" 
          value={`₺${Math.round(avgOrderValue).toLocaleString()}`} 
          change="-2.1%" 
          trend="down" 
          icon={CreditCard} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Toplam Kullanıcı" 
          value={(stats?.users?.total || 0).toLocaleString()} 
          change={`+${stats?.users?.new || 0} yeni`} 
          trend="up" 
          icon={Users} 
          color="bg-orange-500" 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Gelir Trendi</CardTitle>
              <CardDescription>Son 7 günlük gelir performansı</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                +₺45,200
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₺${value/1000}K`} />
                <Tooltip 
                  formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Gelir']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Dağılımı</CardTitle>
            <CardDescription>Satışlara göre kategori performansı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-medium">%{cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders & Visitors */}
        <Card>
          <CardHeader>
            <CardTitle>Sipariş ve Ziyaretçi</CardTitle>
            <CardDescription>Günlük sipariş ve ziyaretçi sayıları</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sipariş" />
                <Bar dataKey="visitors" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Ziyaretçi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Düşük Stok Uyarısı
              </CardTitle>
              <CardDescription>Stok seviyesi kritik olan ürünler</CardDescription>
            </div>
            <Badge variant="destructive">{lowStockProducts.length} Ürün</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={(product.stock / product.minStock) * 100} className="w-24 h-2" />
                      <span className="text-xs text-gray-500">{product.stock} adet</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/products">Stok Ekle</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>En Çok Satan Ürünler</CardTitle>
              <CardDescription>Satış performansına göre ilk 5 ürün</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/products">Tümünü Gör</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} satış • Stok: {product.stock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₺{product.revenue.toLocaleString()}</p>
                    <p className={`text-sm ${product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {product.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Siparişler</CardTitle>
              <CardDescription>En son gelen siparişler</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/orders">Tümü</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customer}</p>
                    <p className="text-xs text-gray-400">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₺{order.total.toLocaleString()}</p>
                    <Badge 
                      variant="secondary" 
                      className={
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }
                    >
                      {order.status === 'completed' ? 'Tamamlandı' :
                       order.status === 'processing' ? 'İşleniyor' :
                       order.status === 'shipped' ? 'Kargoda' : 'Beklemede'}
                    </Badge>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/admin/products/new">
                <Package className="w-6 h-6" />
                <span>Yeni Ürün</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/admin/coupons">
                <CreditCard className="w-6 h-6" />
                <span>Kupon Oluştur</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/admin/campaigns">
                <Target className="w-6 h-6" />
                <span>Kampanya</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/admin/reports">
                <Activity className="w-6 h-6" />
                <span>Raporlar</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
