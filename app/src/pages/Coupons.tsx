import { useState } from 'react';
import { 
  Ticket, 
  Copy, 
  Clock, 
  CheckCircle,
  Percent,
  Tag,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  status: 'active' | 'expired' | 'used';
  category?: string;
}

const mockCoupons: Coupon[] = [
  {
    id: 'CPN-001',
    code: 'WELCOME20',
    description: 'Hoş geldiniz indirimi',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 500,
    maxDiscount: 200,
    validFrom: '2024-03-01',
    validUntil: '2024-12-31',
    usageLimit: 1,
    usageCount: 0,
    status: 'active'
  },
  {
    id: 'CPN-002',
    code: 'SUMMER100',
    description: 'Yaz indirimi',
    discountType: 'fixed',
    discountValue: 100,
    minPurchase: 1000,
    validFrom: '2024-03-01',
    validUntil: '2024-08-31',
    usageLimit: 3,
    usageCount: 1,
    status: 'active',
    category: 'Yaz Koleksiyonu'
  },
  {
    id: 'CPN-003',
    code: 'BLACK50',
    description: 'Black Friday özel',
    discountType: 'percentage',
    discountValue: 50,
    minPurchase: 2000,
    maxDiscount: 500,
    validFrom: '2023-11-01',
    validUntil: '2023-11-30',
    usageLimit: 1,
    usageCount: 1,
    status: 'expired'
  },
  {
    id: 'CPN-004',
    code: 'LOYALTY15',
    description: 'Sadakat indirimi',
    discountType: 'percentage',
    discountValue: 15,
    minPurchase: 0,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    usageLimit: 10,
    usageCount: 10,
    status: 'used'
  },
  {
    id: 'CPN-005',
    code: 'FREESHIP',
    description: 'Ücretsiz kargo',
    discountType: 'fixed',
    discountValue: 50,
    minPurchase: 300,
    validFrom: '2024-03-15',
    validUntil: '2024-04-15',
    usageLimit: 5,
    usageCount: 2,
    status: 'active'
  }
];

const getStatusBadge = (status: Coupon['status']) => {
  const styles = {
    active: 'bg-green-500 hover:bg-green-600',
    expired: 'bg-gray-500 hover:bg-gray-600',
    used: 'bg-red-500 hover:bg-red-600'
  };
  const labels = {
    active: 'Aktif',
    expired: 'Süresi Doldu',
    used: 'Tükendi'
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
};



export function Coupons() {
  const [coupons] = useState<Coupon[]>(mockCoupons);
  const [activeTab, setActiveTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCoupons = coupons.filter(coupon => {
    if (activeTab === 'all') return true;
    return coupon.status === activeTab;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Kupon kodu kopyalandı');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.status === 'active').length,
    expired: coupons.filter(c => c.status === 'expired').length,
    used: coupons.filter(c => c.status === 'used').length,
    saved: coupons.reduce((acc, c) => {
      if (c.status === 'used') {
        return acc + (c.discountType === 'percentage' ? c.maxDiscount || c.discountValue : c.discountValue);
      }
      return acc;
    }, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Kuponlarım</h1>
          <p className="text-gray-600 dark:text-gray-400">İndirim kuponlarınızı yönetin ve kullanın</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-gray-500">Aktif Kupon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-500">Toplam Kupon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.used}</p>
                  <p className="text-sm text-gray-500">Kullanılan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₺{stats.saved}</p>
                  <p className="text-sm text-gray-500">Toplam Tasarruf</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupon Code Input */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Kupon Kodu</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kupon kodunu girin"
                    className="flex-1 px-4 py-2 border rounded-md uppercase"
                  />
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Kullan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupons List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Tümü ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Aktif ({stats.active})</TabsTrigger>
            <TabsTrigger value="expired">Süresi Dolan ({stats.expired})</TabsTrigger>
            <TabsTrigger value="used">Kullanılan ({stats.used})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredCoupons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Henüz kuponunuz bulunmuyor</p>
                  <Button onClick={() => window.location.href = '/campaigns'} variant="outline" className="mt-4">
                    Kampanyaları Keşfet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCoupons.map((coupon) => (
                  <Card 
                    key={coupon.id} 
                    className={`overflow-hidden ${coupon.status !== 'active' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex">
                      {/* Left side - Discount */}
                      <div className="w-32 bg-orange-500 flex flex-col items-center justify-center text-white p-4">
                        <span className="text-3xl font-bold">
                          {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `₺${coupon.discountValue}`}
                        </span>
                        <span className="text-sm opacity-90">
                          {coupon.discountType === 'percentage' ? 'İndirim' : 'Tutar'}
                        </span>
                      </div>
                      
                      {/* Right side - Details */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{coupon.description}</h3>
                            <p className="text-xs text-gray-500">{coupon.category || 'Tüm Kategoriler'}</p>
                          </div>
                          {getStatusBadge(coupon.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          {coupon.minPurchase && coupon.minPurchase > 0 && (
                            <p>Min. alışveriş: ₺{coupon.minPurchase}</p>
                          )}
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <p>Max. indirim: ₺{coupon.maxDiscount}</p>
                          )}
                          <p>Kullanım: {coupon.usageCount}/{coupon.usageLimit}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Son: {coupon.validUntil}</span>
                          </div>
                          
                          {coupon.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(coupon.code)}
                              className="gap-1"
                            >
                              {copiedCode === coupon.code ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  Kopyalandı
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  {coupon.code}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Dashed line effect */}
                    <div className="relative h-4 bg-gray-50 dark:bg-gray-800">
                      <div className="absolute left-0 top-0 w-4 h-4 bg-gray-50 dark:bg-gray-900 rounded-full -translate-x-1/2"></div>
                      <div className="absolute right-0 top-0 w-4 h-4 bg-gray-50 dark:bg-gray-900 rounded-full translate-x-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
      <Footer />
    </div>
  );
}
