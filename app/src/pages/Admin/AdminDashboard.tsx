import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  productsChange: number;
  ordersChange: number;
  usersChange: number;
  revenueChange: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

const mockChartData = [
  { name: 'Pzt', sales: 4000, orders: 24 },
  { name: 'Sal', sales: 3000, orders: 18 },
  { name: 'Çar', sales: 5000, orders: 32 },
  { name: 'Per', sales: 4500, orders: 28 },
  { name: 'Cum', sales: 6000, orders: 42 },
  { name: 'Cmt', sales: 7500, orders: 55 },
  { name: 'Paz', sales: 8000, orders: 62 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    productsChange: 12,
    ordersChange: 23,
    usersChange: 8,
    revenueChange: 18
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.get('/admin/products').catch(() => ({ data: [] })),
        api.get('/admin/orders').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
      ]);

      const products = Array.isArray(productsRes) ? productsRes : productsRes.data || [];
      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [];
      const users = Array.isArray(usersRes) ? usersRes : usersRes.data || [];

      const revenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

      const recent = orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        customer: order.userId?.substring(0, 8) || order.customerName || 'Misafir',
        total: order.total,
        status: order.status,
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '-'
      }));

      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalRevenue: revenue
      }));
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color,
    link 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
    icon: any; 
    color: string;
    link: string;
  }) => (
    <Link to={link}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      pending: 'Beklemede',
      processing: 'İşleniyor',
      shipped: 'Kargoda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/products/new">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Package className="w-4 h-4 mr-2" />
                  Yeni Ürün
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Toplam Gelir"
            value={`₺${stats.totalRevenue.toLocaleString()}`}
            change={stats.revenueChange}
            icon={DollarSign}
            color="bg-green-500"
            link="/admin/orders"
          />
          <StatCard
            title="Toplam Sipariş"
            value={stats.totalOrders}
            change={stats.ordersChange}
            icon={ShoppingCart}
            color="bg-blue-500"
            link="/admin/orders"
          />
          <StatCard
            title="Toplam Ürün"
            value={stats.totalProducts}
            change={stats.productsChange}
            icon={Package}
            color="bg-purple-500"
            link="/admin/products"
          />
          <StatCard
            title="Toplam Kullanıcı"
            value={stats.totalUsers}
            change={stats.usersChange}
            icon={Users}
            color="bg-orange-500"
            link="/admin/users"
          />
        </div>

        {/* Charts & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Satış Grafiği</CardTitle>
              <select className="text-sm border rounded-lg px-3 py-1">
                <option>Bu Hafta</option>
                <option>Bu Ay</option>
                <option>Bu Yıl</option>
              </select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Satış (₺)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Sipariş"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Son Siparişler</CardTitle>
              <Link to="/admin/orders" className="text-sm text-orange-500 hover:text-orange-600">
                Tümünü Gör
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Henüz sipariş yok</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">#{order.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-500">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₺{order.total?.toLocaleString()}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/products">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Ürün Yönetimi</p>
                    <p className="text-sm text-gray-500">Ürün ekle, düzenle, sil</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/orders">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sipariş Yönetimi</p>
                    <p className="text-sm text-gray-500">Siparişleri görüntüle</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kullanıcı Yönetimi</p>
                    <p className="text-sm text-gray-500">Kullanıcıları görüntüle</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
