import { useState } from 'react';
import { Search, Package, CheckCircle, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { toast } from 'sonner';

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  completed: boolean;
}

interface TrackingInfo {
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  estimatedDelivery: string;
  events: TrackingEvent[];
}

const mockTrackingData: Record<string, TrackingInfo> = {
  'ORD-2024-001': {
    orderNumber: 'ORD-2024-001',
    trackingNumber: 'TRK123456789',
    carrier: 'Aras Kargo',
    status: 'shipped',
    estimatedDelivery: '15 Mart 2024',
    events: [
      { date: '12 Mart 2024', time: '14:30', status: 'Sipariş Hazırlanıyor', location: 'İstanbul Depo', completed: true },
      { date: '12 Mart 2024', time: '18:45', status: 'Kargoya Verildi', location: 'İstanbul Depo', completed: true },
      { date: '13 Mart 2024', time: '09:15', status: 'Transfer Merkezinde', location: 'Ankara Transfer', completed: true },
      { date: '14 Mart 2024', time: '08:00', status: 'Dağıtımda', location: 'İzmir Şube', completed: false },
      { date: '15 Mart 2024', time: '--:--', status: 'Teslim Edilecek', location: 'Teslimat Adresi', completed: false },
    ]
  }
};

export function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast.error('Sipariş numarası girin');
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const data = mockTrackingData[orderNumber.toUpperCase()];
    
    if (data) {
      setTrackingInfo(data);
      toast.success('Sipariş bulundu!');
    } else {
      setTrackingInfo(null);
      toast.error('Sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.');
    }
    
    setIsSearching(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'out_for_delivery':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-orange-500';
      default:
        return 'bg-muted0';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Teslim Edildi';
      case 'out_for_delivery':
        return 'Dağıtımda';
      case 'shipped':
        return 'Kargoya Verildi';
      default:
        return 'Hazırlanıyor';
    }
  };

  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900">
      <Header />
      
      <main className="container-custom py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
            Sipariş Takibi
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Sipariş numaranızı girerek kargonuzun durumunu takip edin
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Sipariş numarası (örn: ORD-2024-001)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
            <Button 
              type="submit" 
              className="gradient-orange px-8 py-6"
              disabled={isSearching}
            >
              {isSearching ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Sorgula
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Sipariş numaranızı e-posta veya SMS ile aldığınız bildirimde bulabilirsiniz.
          </p>
        </form>

        {/* Tracking Results */}
        {trackingInfo && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sipariş Numarası</p>
                    <p className="text-xl font-bold">{trackingInfo.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kargo Takip No</p>
                    <p className="font-medium">{trackingInfo.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kargo Firması</p>
                    <p className="font-medium">{trackingInfo.carrier}</p>
                  </div>
                  <Badge className={`${getStatusColor(trackingInfo.status)} text-white px-4 py-2`}>
                    {getStatusText(trackingInfo.status)}
                  </Badge>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">
                      Tahmini Teslimat: {trackingInfo.estimatedDelivery}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-6">Kargo Hareketleri</h3>
                <div className="space-y-0">
                  {trackingInfo.events.map((event, index) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0">
                      {/* Timeline Line */}
                      {index < trackingInfo.events.length - 1 && (
                        <div className={`absolute left-3 top-6 w-0.5 h-full ${
                          event.completed ? 'bg-orange-500' : 'bg-muted'
                        }`} />
                      )}
                      
                      {/* Timeline Dot */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                        event.completed 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {event.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      
                      {/* Event Content */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className={`font-medium ${
                            event.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {event.status}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          <p>{event.date}</p>
                          <p>{event.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Siparişinizle ilgili bir sorun mu var?
              </p>
              <Button variant="outline" onClick={() => toast.info('Canlı destek başlatılıyor...')}>
                Canlı Destek ile Görüş
              </Button>
            </div>
          </div>
        )}

        {/* Sample Order Numbers */}
        {!trackingInfo && (
          <div className="max-w-xl mx-auto mt-8">
            <p className="text-sm text-muted-foreground text-center mb-4">Test için kullanabileceğiniz sipariş numaraları:</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setOrderNumber('ORD-2024-001')}
                className="px-4 py-2 bg-muted hover:bg-muted rounded-lg text-sm transition-colors"
              >
                ORD-2024-001
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
