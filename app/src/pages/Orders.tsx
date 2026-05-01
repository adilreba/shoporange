import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  MapPin,
  Eye,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { ordersApi } from '@/services/api';
import { toast } from 'sonner';

export function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { getOrdersByEmail } = useOrderStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Get orders from store for current user
  const userOrders = user?.email ? getOrdersByEmail(user.email) : [];
  const displayOrders = userOrders;

  const filteredOrders = displayOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'shipped': 'bg-purple-100 text-purple-700 border-purple-200',
      'pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    const labels: Record<string, string> = {
      'completed': 'Tamamlandı',
      'processing': 'Hazırlanıyor',
      'shipped': 'Kargoda',
      'pending': 'Beklemede',
      'cancelled': 'İptal Edildi'
    };
    const icons: Record<string, React.ReactNode> = {
      'completed': <CheckCircle className="w-4 h-4" />,
      'processing': <Clock className="w-4 h-4" />,
      'shipped': <Truck className="w-4 h-4" />,
      'pending': <Clock className="w-4 h-4" />,
      'cancelled': <XCircle className="w-4 h-4" />
    };
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  const handleTrackOrder = (orderId: string) => {
    navigate(`/track-order?order=${orderId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <div className="container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Giriş Yapın</h1>
            <p className="text-muted-foreground mb-6">Siparişlerinizi görüntülemek için giriş yapmanız gerekiyor.</p>
            <Button className="gradient-orange" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-medium">{user?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </Link>
                  <hr className="my-2" />
                  <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <Package className="w-5 h-5" />
                    Profilim
                  </Link>
                  <Link to="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium">
                    <Package className="w-5 h-5" />
                    Siparişlerim
                  </Link>
                  <Link to="/wishlist" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <Package className="w-5 h-5" />
                    Favorilerim
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    <Package className="w-5 h-5" />
                    Ayarlar
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Siparişlerim</CardTitle>
                    <p className="text-muted-foreground mt-1">Tüm siparişlerinizi buradan takip edebilirsiniz</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Sipariş no ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-5 mb-6">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="pending">Beklemede</TabsTrigger>
                    <TabsTrigger value="processing">Hazırlanıyor</TabsTrigger>
                    <TabsTrigger value="shipped">Kargoda</TabsTrigger>
                    <TabsTrigger value="completed">Tamamlandı</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Sipariş bulunamadı</h3>
                        <p className="text-muted-foreground">Henüz bir siparişiniz bulunmuyor.</p>
                        <Button className="mt-4 gradient-orange" onClick={() => navigate('/products')}>
                          Alışverişe Başla
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">{order.id}</p>
                                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {getStatusBadge(order.status)}
                                <p className="font-bold text-lg">₺{order.total.toLocaleString()}</p>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-muted rounded-lg p-3 mb-4">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    <span className="text-sm">{item.name}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {order.address?.city}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleTrackOrder(order.id)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Takip Et
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toast.info('Sipariş detayları yakında!')}
                                >
                                  Detaylar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await ordersApi.downloadInvoice(order.id);
                                      toast.success('Fatura indiriliyor...');
                                    } catch (error) {
                                      toast.error('Fatura indirilemedi');
                                    }
                                  }}
                                >
                                  <FileDown className="w-4 h-4 mr-1" />
                                  Fatura
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
