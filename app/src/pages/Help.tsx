import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  HelpCircle, 
  Search,
  Package,
  Truck,
  CreditCard,
  RotateCcw,
  User,
  Shield,
  MessageCircle,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: Package,
      title: 'Siparişler',
      description: 'Sipariş verme, takip etme ve iptal etme',
      articles: ['Sipariş nasıl veririm?', 'Siparişimi nasıl takip ederim?', 'Siparişimi iptal edebilir miyim?']
    },
    {
      icon: Truck,
      title: 'Kargo & Teslimat',
      description: 'Kargo süreleri, takip ve teslimat bilgileri',
      articles: ['Kargo ne kadar sürer?', 'Kargom nerede?', 'Teslimat adresimi değiştirebilir miyim?']
    },
    {
      icon: CreditCard,
      title: 'Ödeme',
      description: 'Ödeme seçenekleri, taksit ve güvenlik',
      articles: ['Hangi ödeme yöntemlerini kullanabilirim?', 'Taksit seçenekleri nelerdir?', 'Ödemem güvenli mi?']
    },
    {
      icon: RotateCcw,
      title: 'İade & Değişim',
      description: 'İade politikası ve değişim süreci',
      articles: ['Nasıl iade yaparım?', 'İade süresi ne kadar?', 'Değişim yapabilir miyim?']
    },
    {
      icon: User,
      title: 'Hesap',
      description: 'Üyelik, giriş ve hesap yönetimi',
      articles: ['Nasıl üye olurum?', 'Şifremi unuttum ne yapmalıyım?', 'Hesabımı nasıl silerim?']
    },
    {
      icon: Shield,
      title: 'Güvenlik',
      description: 'Veri güvenliği ve gizlilik',
      articles: ['Kişisel verilerim güvende mi?', 'Gizlilik politikası nedir?', 'Çerezler nasıl kullanılır?']
    }
  ];

  const popularQuestions = [
    { q: 'Siparişim ne zaman gelir?', a: 'Siparişleriniz genellikle 1-3 iş günü içinde kargoya verilir. Teslimat süresi adresinize göre 2-5 iş günü sürebilir.' },
    { q: 'Ücretsiz kargo var mı?', a: 'Evet! 500₺ ve üzeri siparişlerinizde kargo tamamen ücretsizdir.' },
    { q: 'İade süresi ne kadar?', a: 'Ürünlerimizi 14 gün içinde koşulsuz iade edebilirsiniz.' },
    { q: 'Taksit seçeneği var mı?', a: 'Evet, tüm kredi kartlarına 9 aya varan taksit imkanı sunuyoruz.' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`"${searchQuery}" için arama sonuçları yakında!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-500 to-blue-600 text-white py-16">
        <div className="container-custom text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Yardım Merkezi</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Size nasıl yardımcı olabiliriz? Sorularınızın cevabını burada bulabilirsiniz.
          </p>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                type="text"
                placeholder="Soru veya konu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900"
              />
              <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 gradient-orange">
                Ara
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/track-order" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
              <Truck className="w-6 h-6 text-blue-500" />
              <span className="font-medium">Sipariş Takip</span>
            </Link>
            <Link to="/returns" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
              <RotateCcw className="w-6 h-6 text-blue-500" />
              <span className="font-medium">İade İşlemleri</span>
            </Link>
            <Link to="/contact" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <span className="font-medium">Canlı Destek</span>
            </Link>
            <Link to="/faq" className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
              <HelpCircle className="w-6 h-6 text-blue-500" />
              <span className="font-medium">SSS</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Konular</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <category.icon className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                  <p className="text-gray-500 mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx}>
                        <button 
                          onClick={() => toast.info('Makale detayları yakında!')}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                          {article}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Sık Sorulan Sorular</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {popularQuestions.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    {item.q}
                  </h3>
                  <p className="text-gray-600">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/faq">
                Tüm Soruları Gör
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Cevabını Bulamadınız mı?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Uzman müşteri hizmetleri ekibimiz size yardımcı olmaktan mutluluk duyar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-white text-blue-600 hover:bg-gray-100">
              <Link to="/contact">
                <MessageCircle className="w-4 h-4 mr-2" />
                Bize Ulaşın
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
              <a href="tel:08501234567">
                <Phone className="w-4 h-4 mr-2" />
                0850 123 45 67
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
