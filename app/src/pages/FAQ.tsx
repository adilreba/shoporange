import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  HelpCircle, 
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CreditCard,
  RotateCcw,
  User
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tümü', icon: HelpCircle },
    { id: 'orders', name: 'Siparişler', icon: Package },
    { id: 'shipping', name: 'Kargo', icon: Truck },
    { id: 'payment', name: 'Ödeme', icon: CreditCard },
    { id: 'returns', name: 'İade', icon: RotateCcw },
    { id: 'account', name: 'Hesap', icon: User },
  ];

  const faqs = [
    // Orders
    { category: 'orders', q: 'Sipariş nasıl veririm?', a: 'Ürün sayfasından "Sepete Ekle" butonuna tıklayarak ürünü sepetinize ekleyin. Sepetinize giderek ödeme adımlarını tamamlayın.' },
    { category: 'orders', q: 'Siparişimi nasıl takip ederim?', a: 'Hesabınızdan "Siparişlerim" bölümüne giderek siparişlerinizi takip edebilirsiniz. Ayrıca "Sipariş Takip" sayfasından da takip edebilirsiniz.' },
    { category: 'orders', q: 'Siparişimi iptal edebilir miyim?', a: 'Siparişiniz kargoya verilmeden önce iptal edebilirsiniz. "Siparişlerim" sayfasından iptal talebinde bulunabilirsiniz.' },
    { category: 'orders', q: 'Siparişime ürün ekleyebilir miyim?', a: 'Maalesef verilen siparişlere ürün eklenemez. Yeni bir sipariş vermeniz gerekir.' },
    
    // Shipping
    { category: 'shipping', q: 'Kargo ne kadar sürer?', a: 'Siparişleriniz 1-3 iş günü içinde kargoya verilir. Teslimat süresi adresinize göre 2-5 iş günü sürebilir.' },
    { category: 'shipping', q: 'Kargom nerede?', a: '"Sipariş Takip" sayfasından veya hesabınızdaki "Siparişlerim" bölümünden kargonuzu takip edebilirsiniz.' },
    { category: 'shipping', q: 'Ücretsiz kargo var mı?', a: 'Evet! 500₺ ve üzeri siparişlerinizde kargo tamamen ücretsizdir.' },
    { category: 'shipping', q: 'Teslimat adresimi değiştirebilir miyim?', a: 'Siparişiniz kargoya verilmeden önce adres değişikliği yapabilirsiniz. Müşteri hizmetlerimizle iletişime geçin.' },
    
    // Payment
    { category: 'payment', q: 'Hangi ödeme yöntemlerini kullanabilirim?', a: 'Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçeneklerini kullanabilirsiniz.' },
    { category: 'payment', q: 'Taksit seçenekleri nelerdir?', a: 'Tüm kredi kartlarına 9 aya varan taksit imkanı sunuyoruz. Anlaşmalı bankalara özel avantajlı taksit oranları mevcuttur.' },
    { category: 'payment', q: 'Ödemem güvenli mi?', a: 'Evet, tüm ödemeleriniz 256-bit SSL şifreleme ile güvence altındadır. Kredi kartı bilgileriniz hiçbir şekilde saklanmaz.' },
    { category: 'payment', q: 'Fatura adresi farklı olabilir mi?', a: 'Evet, teslimat adresinden farklı bir fatura adresi belirleyebilirsiniz.' },
    
    // Returns
    { category: 'returns', q: 'Nasıl iade yaparım?', a: 'Hesabınızdan "Siparişlerim" bölümüne gidin, iade etmek istediğiniz ürünü seçin ve iade talebi oluşturun.' },
    { category: 'returns', q: 'İade süresi ne kadar?', a: 'Ürünlerimizi 14 gün içinde koşulsuz iade edebilirsiniz.' },
    { category: 'returns', q: 'İade kargo ücreti ne kadar?', a: 'İade kargo ücreti tarafımızdan karşılanmaktadır.' },
    { category: 'returns', q: 'Para iadem ne zaman yapılır?', a: 'Ürünümüz depomuza ulaştığında ve kontrol edildikten sonra, para iadeniz 3-5 iş günü içinde yapılır.' },
    
    // Account
    { category: 'account', q: 'Nasıl üye olurum?', a: 'Sağ üst köşedeki "Giriş Yap" butonuna tıklayarak kayıt olabilirsiniz. E-posta veya sosyal medya hesaplarınızla hızlıca üye olabilirsiniz.' },
    { category: 'account', q: 'Şifremi unuttum ne yapmalıyım?', a: 'Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayarak şifre sıfırlama e-postası alabilirsiniz.' },
    { category: 'account', q: 'Hesabımı nasıl silerim?', a: 'Hesap silme talebiniz için müşteri hizmetlerimizle iletişime geçmeniz gerekmektedir.' },
    { category: 'account', q: 'E-posta adresimi değiştirebilir miyim?', a: 'Hesap ayarlarından e-posta adresinizi güncelleyebilirsiniz.' },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="pt-[42px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-500 to-purple-600 text-white py-16">
        <div className="container-custom text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sıkça Sorulan Sorular</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            En çok merak edilen soruların cevaplarını burada bulabilirsiniz.
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Soru ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-purple-600">Anasayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/help" className="hover:text-purple-600">Yardım</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">SSS</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12">
        <div className="container-custom">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">Sonuç bulunamadı. Farklı bir arama terimi deneyin.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted transition-colors"
                  >
                    <span className="font-medium pr-4">{faq.q}</span>
                    {openItems[index] ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {openItems[index] && (
                    <div className="px-5 pb-5">
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground pt-3">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Still Need Help */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Cevabınızı bulamadınız mı?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gradient-orange">
                <Link to="/contact">
                  Bize Ulaşın
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/help">
                  Yardım Merkezi
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
