import { Link } from 'react-router-dom';
import { 
  Percent, 
  Clock, 
  Tag,
  ShoppingBag,
  ArrowRight,
  Flame,
  Gift,
  Zap
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/mockData';
import { toast } from 'sonner';

export function Campaigns() {
  // Filter products with discounts
  const discountedProducts = products.filter(p => p.discount && p.discount > 0);
  const newProducts = products.filter(p => p.isNew);
  const bestsellers = products.filter(p => p.isBestseller);

  const campaigns = [
    {
      id: 1,
      title: 'Elektronikte Büyük İndirim',
      subtitle: 'Seçili ürünlerde %40\'a varan indirim',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      endDate: '31 Mart 2024',
      products: discountedProducts.filter(p => p.category === 'elektronik').slice(0, 4)
    },
    {
      id: 2,
      title: 'Yeni Sezon Moda',
      subtitle: '2024 ilkbahar/yaz koleksiyonu',
      icon: ShoppingBag,
      color: 'from-pink-500 to-pink-600',
      endDate: '15 Nisan 2024',
      products: newProducts.filter(p => p.category === 'moda').slice(0, 4)
    },
    {
      id: 3,
      title: 'Süper Fırsatlar',
      subtitle: 'Çok satan ürünlerde özel fiyatlar',
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      endDate: 'Sınırlı süre',
      products: bestsellers.slice(0, 4)
    },
    {
      id: 4,
      title: 'Hediye Kampanyası',
      subtitle: '500₺ üzeri alışverişe hediye',
      icon: Gift,
      color: 'from-green-500 to-green-600',
      endDate: '30 Nisan 2024',
      products: products.slice(0, 4)
    }
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kupon kodu kopyalandı: ${code}`);
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="pt-[42px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container-custom text-center">
          <Badge className="bg-card/20 text-white mb-4 px-4 py-1">
            <Percent className="w-4 h-4 mr-1 inline" />
            Özel Fırsatlar
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kampanyalar</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Kaçırılmayacak fırsatlar, büyük indirimler ve özel kampanyalar burada!
          </p>
        </div>
      </section>

      {/* Coupon Codes */}
      <section className="py-8 bg-card border-b">
        <div className="container-custom">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-500" />
            Kupon Kodları
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { code: 'ILKBahar25', discount: '%25', min: '500₺', desc: 'İndirim' },
              { code: 'HOSGELDIN50', discount: '50₺', min: '250₺', desc: 'İndirim' },
              { code: 'KARGOBEDAVA', discount: 'Ücretsiz', min: '500₺', desc: 'Kargo' },
              { code: 'VIP10', discount: '%10', min: 'Tüm ürünler', desc: 'Ek İndirim' },
            ].map((coupon, index) => (
              <div 
                key={index}
                className="border-2 border-dashed border-orange-200 rounded-lg p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
                onClick={() => handleCopyCode(coupon.code)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-orange-600">{coupon.code}</span>
                  <Badge className="bg-orange-500">{coupon.discount}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{coupon.min} üzeri {coupon.desc}</p>
                <p className="text-xs text-orange-500 mt-2">Kopyalamak için tıklayın</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campaigns List */}
      <section className="py-12">
        <div className="container-custom space-y-12">
          {campaigns.map((campaign) => (
            <div key={campaign.id}>
              {/* Campaign Header */}
              <div className={`bg-gradient-to-r ${campaign.color} rounded-2xl p-6 md:p-8 text-white mb-6`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-card/20 rounded-xl flex items-center justify-center">
                      <campaign.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{campaign.title}</h2>
                      <p className="text-white/80">{campaign.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-card/20 px-4 py-2 rounded-lg">
                      <Clock className="w-5 h-5" />
                      <span>Son: {campaign.endDate}</span>
                    </div>
                    <Button asChild className="bg-card text-foreground hover:bg-muted">
                      <Link to="/products">
                        Tümünü Gör
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Campaign Products */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {campaign.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Kampanyalardan Haberdar Olun</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Bültenimize abone olun, yeni kampanya ve indirimlerden ilk siz haberdar olun.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-3 rounded-lg text-foreground"
            />
            <Button className="gradient-orange px-6">
              Abone Ol
            </Button>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
