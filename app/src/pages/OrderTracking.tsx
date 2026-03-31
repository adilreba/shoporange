import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Home,
  Clock,
  AlertCircle,
  ArrowLeft,
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useOrderStore, type StoreOrder } from '@/stores/orderStore';
import { toast } from 'sonner';

const orderSteps = [
  { 
    status: 'pending', 
    label: 'Sipariş Alındı', 
    description: 'Siparişiniz başarıyla oluşturuldu',
    icon: Package 
  },
  { 
    status: 'processing', 
    label: 'Hazırlanıyor', 
    description: 'Siparişiniz hazırlanıyor',
    icon: Clock 
  },
  { 
    status: 'shipped', 
    label: 'Kargoda', 
    description: 'Siparişiniz kargoya verildi',
    icon: Truck 
  },
  { 
    status: 'completed', 
    label: 'Teslim Edildi', 
    description: 'Siparişiniz teslim edildi',
    icon: Home 
  }
];

const statusConfig = {
  pending: { 
    label: 'Beklemede', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  processing: { 
    label: 'Hazırlanıyor', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  shipped: { 
    label: 'Kargoda', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  completed: { 
    label: 'Tamamlandı', 
    color: 'bg-green-500', 
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: { 
    label: 'İptal Edildi', 
    color: 'bg-red-500', 
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  refunded: { 
    label: 'İade Edildi', 
    color: 'bg-gray-500', 
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrderStore();
  
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [searchInput, setSearchInput] = useState('');
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = (id: string) => {
    setLoading(true);
    setNotFound(false);
    
    // Tüm siparişleri kontrol et (admin ve müşteri siparişleri)
    const foundOrder = getOrderById(id);
    
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      setNotFound(true);
      setOrder(null);
    }
    
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.error('Lütfen sipariş numarası girin');
      return;
    }
    setOrderId(searchInput.trim());
    navigate(`/track-order?order=${searchInput.trim()}`, { replace: true });
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    return orderSteps.findIndex(step => step.status === order.status);
  };

  const getProgressPercentage = () => {
    const currentStep = getCurrentStep();
    if (currentStep === -1) return 0;
    return ((currentStep + 1) / orderSteps.length) * 100;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Örnek kargo hareketleri (gerçek entegrasyonda kargo firması API'sinden gelecek)
  const getTrackingHistory = () => {
    if (!order) return [];
    
    const history = [
      {
        date: order.createdAt,
        status: 'Sipariş Alındı',
        description: 'Siparişiniz başarıyla oluşturuldu',
        location: 'AtusHome Depo'
      }
    ];

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      history.push({
        date: new Date(new Date(order.createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'Sipariş Hazırlanıyor',
        description: 'Siparişiniz hazırlanıyor',
        location: 'AtusHome Depo'
      });
    }

    if (order.status === 'shipped' || order.status === 'completed') {
      history.push({
        date: new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'Kargoya Verildi',
        description: `Siparişiniz ${order.notes?.includes('Kargo') ? order.notes.split(': ')[1] : 'standart'} kargoya verildi`,
        location: 'İstanbul Dağıtım Merkezi'
      });
    }

    if (order.status === 'completed') {
      history.push({
        date: new Date(new Date(order.createdAt).getTime() + 72 * 60 * 60 * 1000).toISOString(),
        status: 'Teslim Edildi',
        description: 'Siparişiniz teslim edildi',
        location: order.address?.city || 'Teslimat Adresi'
      });
    }

    return history.reverse();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container-custom pt-[42px] pb-12 px-4">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">Sipariş Takibi</h1>
            <p className="text-gray-500 mb-6">Sipariş numaranızı girerek siparişinizin durumunu takip edebilirsiniz</p>
            
            <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Sipariş numarası (örn: ORD-123456)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Sorgula
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Sipariş sorgulanıyor...</p>
          </div>
        )}

        {/* Not Found */}
        {notFound && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sipariş Bulunamadı</h2>
              <p className="text-gray-500 mb-6">Girdiğiniz sipariş numarası ile eşleşen bir sipariş bulunamadı.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setSearchInput('')}>
                  Tekrar Dene
                </Button>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                  <Link to="/products">Alışverişe Devam Et</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold">{order.id}</h2>
                      <Badge className={statusConfig[order.status].color}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <p className="text-gray-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">₺{order.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{order.items.length} ürün</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Steps */}
            {order.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Durumu</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Progress Bar */}
                  <div className="mb-8">
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-4 gap-4">
                    {orderSteps.map((step, index) => {
                      const currentStep = getCurrentStep();
                      const isActive = index <= currentStep;
                      const isCurrent = index === currentStep;
                      
                      return (
                        <div 
                          key={step.status} 
                          className={`text-center p-4 rounded-lg transition-all ${
                            isActive 
                              ? isCurrent 
                                ? `${statusConfig[order.status].bgColor} ${statusConfig[order.status].borderColor} border-2` 
                                : 'bg-green-50 border-green-200 border'
                              : 'bg-gray-50 opacity-50'
                          }`}
                        >
                          <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                            isActive 
                              ? isCurrent 
                                ? statusConfig[order.status].color 
                                : 'bg-green-500' 
                              : 'bg-gray-300'
                          }`}>
                            <step.icon className="w-6 h-6 text-white" />
                          </div>
                          <p className={`font-semibold text-sm ${
                            isCurrent ? statusConfig[order.status].textColor : ''
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancelled Warning */}
            {order.status === 'cancelled' && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-700">Sipariş İptal Edildi</h3>
                      <p className="text-red-600">Bu sipariş iptal edilmiştir. Daha fazla bilgi için müşteri hizmetleri ile iletişime geçebilirsiniz.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tracking History */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Kargo Hareketleri</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {getTrackingHistory().map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-orange-600" />
                          </div>
                          {index !== getTrackingHistory().length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-semibold">{event.status}</p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{formatDate(event.date)}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Müşteri Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <p className="font-medium">{order.customer}</p>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {order.email}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {order.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Teslimat Adresi</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <p className="text-gray-600">
                        {order.address.street}<br />
                        {order.address.postalCode} {order.address.city}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ödeme Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ödeme Yöntemi</span>
                        <span className="font-medium flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {order.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 
                           order.paymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kapıda Ödeme'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ödeme Durumu</span>
                        <Badge className={order.paymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {order.paymentStatus === 'completed' ? 'Ödendi' : 'Bekliyor'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sipariş Özeti</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">Adet: {item.quantity}</p>
                          </div>
                          <p className="font-medium">₺{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Toplam</span>
                          <span className="text-xl font-bold text-orange-600">₺{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Help */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-3">Sorun mu var?</p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/support">Yardım Al</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
