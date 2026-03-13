import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  RotateCcw, 
  CheckCircle,
  Clock,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Returns() {
  const steps = [
    {
      icon: Package,
      title: '1. İade Talebi Oluştur',
      description: 'Hesabınızdan siparişlerim bölümüne gidin ve iade etmek istediğiniz ürünü seçin.'
    },
    {
      icon: Truck,
      title: '2. Kargoya Verin',
      description: 'Ürünü orijinal ambalajında, tüm aksesuarlarıyla birlikte kargoya verin.'
    },
    {
      icon: CheckCircle,
      title: '3. Kontrol ve Onay',
      description: 'Ürünümüz elimize ulaştığında kontrol edilir ve onaylanır.'
    },
    {
      icon: CreditCard,
      title: '4. Para İadesi',
      description: 'Onaylanan iadeniz 3-5 iş günü içinde hesabınıza iade edilir.'
    }
  ];

  const conditions = [
    'İade süresi ürün teslim tarihinden itibaren 14 gündür.',
    'Ürün orijinal ambalajında ve kullanılmamış olmalıdır.',
    'Tüm aksesuarlar, etiketler ve hediyeler ürünle birlikte gönderilmelidir.',
    'Hijyenik ürünler (iç giyim, kozmetik vb.) ambalajı açılmamış olmalıdır.',
    'Özel üretim/kişiselleştirilmiş ürünlerde iade kabul edilmez.',
    'Kampanya ürünlerinde iade, kampanya koşullarına tabidir.'
  ];

  const faqs = [
    {
      q: 'İade kargo ücreti ne kadar?',
      a: 'İade kargo ücreti tarafımızdan karşılanmaktadır. Ücretsiz iade kodu için müşteri hizmetlerimizle iletişime geçebilirsiniz.'
    },
    {
      q: 'Para iadem ne zaman yapılır?',
      a: 'Ürünümüz depomuza ulaştığında ve kontrol edildikten sonra, para iadeniz 3-5 iş günü içinde ödeme yaptığınız karta/hesaba yapılır.'
    },
    {
      q: 'Değişim yapabilir miyim?',
      a: 'Evet, aynı ürünün farklı beden/renk değişimi yapabilirsiniz. Değişim için yeni sipariş vermeniz ve eski ürünü iade etmeniz gerekir.'
    },
    {
      q: 'Hasarlı ürünü nasıl iade ederim?',
      a: 'Hasarlı ürünleri kargo görevlisine tutanak tutturarak teslim almayı reddedin ve hemen müşteri hizmetlerimize bildirin.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-500 to-emerald-600 text-white py-16">
        <div className="container-custom text-center">
          <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">İade Politikası</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            14 gün koşulsuz iade garantisi ile güvenle alışveriş yapın.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-green-600">Anasayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/help" className="hover:text-green-600">Yardım</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">İade Politikası</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12">
        <div className="container-custom">
          {/* Steps */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">İade Süreci</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                İade Koşulları
              </h2>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {conditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                İade Süreleri
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-gray-500" />
                      <span>İade Talebi</span>
                    </div>
                    <span className="font-bold text-green-600">14 Gün</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-6 h-6 text-gray-500" />
                      <span>Kargo Süresi</span>
                    </div>
                    <span className="font-bold text-blue-600">2-5 Gün</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-gray-500" />
                      <span>Kontrol</span>
                    </div>
                    <span className="font-bold text-purple-600">1-2 Gün</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-gray-500" />
                      <span>Para İadesi</span>
                    </div>
                    <span className="font-bold text-orange-600">3-5 Gün</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Sık Sorulan Sorular</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-green-500" />
                      {faq.q}
                    </h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">İade Talebiniz mi Var?</h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Hesabınızdan kolayca iade talebi oluşturabilir veya müşteri hizmetlerimizden yardım alabilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-white text-green-600 hover:bg-gray-100"
                onClick={() => toast.info('İade talebi özelliği yakında!')}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                İade Talebi Oluştur
              </Button>
              <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/contact">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Destek Al
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
