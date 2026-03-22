import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Mock Data
const salesData = [
  { name: 'Pzt', sales: 4000, orders: 24 },
  { name: 'Sal', sales: 3000, orders: 18 },
  { name: 'Çar', sales: 5000, orders: 32 },
  { name: 'Per', sales: 4500, orders: 28 },
  { name: 'Cum', sales: 6000, orders: 42 },
  { name: 'Cmt', sales: 7500, orders: 55 },
  { name: 'Paz', sales: 8000, orders: 62 },
];

const recentOrders = [
  { id: '#ORD-001', customer: 'Ahmet Yılmaz', product: 'Modern Koltuk', total: 12500, status: 'delivered', date: '2024-03-20' },
  { id: '#ORD-002', customer: 'Ayşe Kaya', product: 'Yemek Masası', total: 8500, status: 'processing', date: '2024-03-20' },
  { id: '#ORD-003', customer: 'Mehmet Demir', product: 'TV Ünitesi', total: 6200, status: 'pending', date: '2024-03-19' },
  { id: '#ORD-004', customer: 'Fatma Şahin', product: 'Kitaplık', total: 3400, status: 'delivered', date: '2024-03-19' },
  { id: '#ORD-005', customer: 'Ali Yıldız', product: 'Orta Sehpa', total: 2100, status: 'cancelled', date: '2024-03-18' },
];

const topProducts = [
  { name: 'Modern Koltuk Takımı', sales: 48, revenue: 720000, trend: 'up' },
  { name: 'Yemek Masası Seti', sales: 36, revenue: 306000, trend: 'up' },
  { name: 'Çift Kişilik Yatak', sales: 29, revenue: 348000, trend: 'down' },
  { name: 'TV Ünitesi', sales: 24, revenue: 144000, trend: 'up' },
  { name: 'Kitaplık', sales: 21, revenue: 73500, trend: 'down' },
];

const stats = [
  {
    title: 'Toplam Gelir',
    value: '₺1,592,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    title: 'Toplam Sipariş',
    value: '1,429',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-blue-500'
  },
  {
    title: 'Toplam Ürün',
    value: '386',
    change: '+24',
    trend: 'up',
    icon: Package,
    color: 'bg-purple-500'
  },
  {
    title: 'Aktif Kullanıcı',
    value: '2,847',
    change: '-2.1%',
    trend: 'down',
    icon: Users,
    color: 'bg-orange-500'
  },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  const labels: Record<string, string> = {
    delivered: 'Teslim Edildi',
    processing: 'İşleniyor',
    pending: 'Beklemede',
    cancelled: 'İptal',
  };
  return (
    <Badge className={`${styles[status]} border-0 font-medium`}>
      {labels[status]}
    </Badge>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Hoş geldiniz! İşte bugünkü özet.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Rapor İndir
          </Button>
          <Link to="/admin/products/new">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Package className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Satış Grafiği</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Haftalık</Button>
              <Button variant="ghost" size="sm">Aylık</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₺${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`₺${value.toLocaleString()}`, 'Satış']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">En Çok Satanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} satış</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₺{(product.revenue / 1000).toFixed(0)}k</p>
                    {product.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 inline ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Son Siparişler</CardTitle>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-orange-500">
              Tümünü Gör
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sipariş ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Müşteri</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ürün</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tutar</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Durum</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{order.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{order.customer}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{order.product}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">₺{order.total.toLocaleString()}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
