import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { RefreshCw, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function ReturnPolicyPage() {
  const steps = [
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "Cayma Hakkı Talebi",
      description: "14 gün içinde iade talebinizi web sitemizden veya çağrı merkezimizden iletin."
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Ürünü Hazırlayın",
      description: "Ürünü orijinal ambalajında, faturası ve tüm aksesuarlarıyla birlikte hazırlayın."
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Kargoya Verin",
      description: "Ücretsiz iade kodunuzla en yakın kargo şubesinden bize gönderin."
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Para İadesi",
      description: "Ürün kontrol edildikten sonra 14 iş günü içinde paranız iade edilir."
    }
  ];

  const acceptedReturns = [
    "Kıyafet ve ayakkabılar (kullanılmamış, etiketli)",
    "Elektronik ürünler (ambalaj açılmamış)",
    "Ev & Yaşam ürünleri (kullanılmamış)",
    "Kitaplar (hasarsız)",
    "Oyuncaklar (ambalaj açılmamış)"
  ];

  const nonAcceptedReturns = [
    "Hijyenik ürünler (iç çamaşırı, kozmetik vb. - ambalaj açılmışsa)",
    "Kişiye özel üretilmiş ürünler",
    "Hızlı bozulan gıda ürünleri",
    "Yazılım ve dijital içerikler",
    "Mühürü bozulmuş ses/video kayıtları"
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="İade ve Değişim Politikası | AtusHome"
        description="AtusHome iade ve değişim koşulları, 14 gün cayma hakkı"
      />
      <Header />
      
      <main className="container-custom pt-[100px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">İade ve Değişim Politikası</h1>
            <p className="text-muted-foreground">
              14 gün içinde koşulsuz iade garantisi
            </p>
          </div>

          {/* 14 Day Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">14 Gün</h2>
                  <p>Cayma hakkı süreniz</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-white/90 mb-2">Ücretsiz iade kargo</p>
                <p className="text-sm text-white/70">Türkiye'nin her yerinden</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {steps.map((step, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Two Columns */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Accepted */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-900">İade Alınan Ürünler</h3>
              </div>
              <ul className="space-y-3">
                {acceptedReturns.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Accepted */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-900">İade Alınmayan Ürünler</h3>
              </div>
              <ul className="space-y-3">
                {nonAcceptedReturns.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-800">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-muted rounded-xl p-6 mb-12">
            <h3 className="font-semibold mb-4">Önemli Notlar</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">1.</span>
                İade edilecek ürünün kullanılmamış, ambalajının açılmamış veya bozulmamış olması gerekir.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">2.</span>
                Ürünün faturası veya irsaliyesi mutlaka gönderilmelidir.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">3.</span>
                Kampanya ve indirimli ürünlerde iade, ödenen tutar üzerinden yapılır.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">4.</span>
                Hediye olarak gönderilen ürünlerde iade, hediye çeki olarak yapılır.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">5.</span>
                Ayıplı ürünlerde kargo ücreti tarafımızdan karşılanır.
              </li>
            </ul>
          </div>

          {/* Refund Timeline */}
          <div className="bg-card rounded-xl p-6 border mb-12">
            <h3 className="font-semibold mb-6">İade Süreci</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-orange-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium">İade Talebi</h4>
                  <p className="text-sm text-muted-foreground">
                    Hesabınızdan veya destek hattımızdan iade talebinde bulunun.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-orange-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Onay ve Kargo Kodu</h4>
                  <p className="text-sm text-muted-foreground">
                    Talebiniz onaylandığında ücretsiz iade kargo kodu gönderilir.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-orange-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Ürün İncelemesi</h4>
                  <p className="text-sm text-muted-foreground">
                    Ürün depomuza ulaştığında 3 iş günü içinde kontrol edilir.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-orange-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Para İadesi</h4>
                  <p className="text-sm text-muted-foreground">
                    Onay sonrası 14 iş günü içinde ödeme kanalınıza iade yapılır.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="font-semibold mb-4">İade talebiniz mi var?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gradient-orange">
                <Link to="/orders">Siparişlerimden İade Yap</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:destek@atushome.com">E-posta Gönder</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Çağrı merkezi: <strong>0850 123 45 67</strong> (Hafta içi 09:00-18:00)
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
