import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Cookie, Eye, Server } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Gizlilik Politikası | AtusHome"
        description="AtusHome gizlilik politikası ve veri kullanımı"
      />
      <Header />
      
      <main className="container-custom pt-[100px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Gizlilik Politikası</h1>
            <p className="text-muted-foreground">
              Verilerinizin güvenliği ve gizliliği bizim için önemli
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[600px] rounded-xl border bg-card p-8">
            <div className="space-y-8 pr-4">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">Giriş</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AtusHome E-Ticaret A.Ş. ("AtusHome" veya "biz") olarak, kullanıcılarımızın 
                  gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ve 
                  hizmetlerimizi kullandığınızda hangi bilgileri topladığımızı, bu bilgileri 
                  nasıl kullandığımızı ve koruduğumuzu açıklar.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">1. Topladığımız Bilgiler</h2>
                
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-orange-500" />
                      Doğrudan Sağladığınız Bilgiler
                    </h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>Hesap bilgileri (ad, soyad, e-posta, telefon)</li>
                      <li>Teslimat adresleri</li>
                      <li>Ödeme bilgileri (kredi kartı bilgileri şifrelenerek saklanır)</li>
                      <li>Sipariş ve tercih geçmişi</li>
                      <li>Müşteri hizmetleri iletişimleri</li>
                    </ul>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Server className="h-4 w-4 text-orange-500" />
                      Otomatik Olarak Toplanan Bilgiler
                    </h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>IP adresi ve cihaz bilgileri</li>
                      <li>Tarayıcı türü ve sürümü</li>
                      <li>İşletim sistemi</li>
                      <li>Ziyaret ettiğiniz sayfalar ve tıklamalar</li>
                      <li>Tarih ve saat bilgileri</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. Bilgilerin Kullanımı</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Siparişlerinizi işlemek ve teslim etmek</li>
                  <li>Hesabınızı yönetmek ve güvence altına almak</li>
                  <li>Müşteri hizmetleri sağlamak</li>
                  <li>Yasal yükümlülükleri yerine getirmek</li>
                  <li>Site performansını analiz etmek ve iyileştirmek</li>
                  <li>Kişiselleştirilmiş içerik ve öneriler sunmak</li>
                  <li>Kampanya ve promosyonları bildirmek (onayınızla)</li>
                  <li>Dolandırıcılığı önlemek ve güvenliği sağlamak</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Çerezler (Cookies)</h2>
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Çerez Kullanımı</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Web sitemizde çerezler kullanıyoruz. Çerezler, tarayıcınıza yerleştirilen 
                    küçük metin dosyalarıdır ve site deneyiminizi iyileştirmemize yardımcı olur.
                  </p>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-2">Kullandığımız çerez türleri:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Zorunlu Çerezler:</strong> Sitenin çalışması için gerekli</li>
                  <li><strong>Performans Çerezleri:</strong> Site kullanımını analiz etmek için</li>
                  <li><strong>İşlevsellik Çerezleri:</strong> Tercihlerinizi hatırlamak için</li>
                  <li><strong>Hedefleme Çerezleri:</strong> Size özel reklamlar göstermek için</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz. 
                  Ancak, bazı çerezlerin devre dışı bırakılması site işlevselliğini etkileyebilir.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">4. Bilgi Güvenliği</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                  <li>SSL/TLS şifreleme ile güvenli veri iletimi</li>
                  <li>Güvenlik duvarları ve izinsiz giriş algılama sistemleri</li>
                  <li>Düzenli güvenlik denetimleri ve testleri</li>
                  <li>Veri erişiminin sınırlandırılması ve yetkilendirme</li>
                  <li>Düzenli yedekleme ve felaket kurtarma planları</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Üçüncü Taraf Hizmetler</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Aşağıdaki üçüncü taraf hizmetlerini kullanıyoruz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                  <li><strong>Ödeme İşlemcileri:</strong> Stripe, PayPal (ödeme bilgileriniz doğrudan onlara iletilir)</li>
                  <li><strong>Kargo Şirketleri:</strong> Yurtiçi Kargo, Aras Kargo (teslimat için gerekli bilgiler)</li>
                  <li><strong>Analitik:</strong> Google Analytics (site kullanım analizi)</li>
                  <li><strong>Pazarlama:</strong> Facebook Pixel, Google Ads (hedefli reklamlar)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Bu üçüncü tarafların kendi gizlilik politikaları bulunmaktadır.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Veri Saklama Süresi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kişisel verilerinizi, yasal yükümlülüklerimizi yerine getirmek ve hizmetlerimizi 
                  sağlamak için gerekli olduğu sürece saklarız. Genel olarak:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                  <li>Hesap bilgileri: Hesabınız aktif olduğu sürece</li>
                  <li>Sipariş kayıtları: 10 yıl (vergi ve muhasebe yasalarına uygun olarak)</li>
                  <li>Çerez verileri: 13 ay (veya siz silene kadar)</li>
                  <li>İletişim kayıtları: 5 yıl</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. Haklarınız</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Verilerinizle ilgili aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Verilerinize erişim talep etme</li>
                  <li>Yanlış verilerin düzeltilmesini isteme</li>
                  <li>Verilerinizin silinmesini talep etme</li>
                  <li>İşleme faaliyetlerine itiraz etme</li>
                  <li>Veri taşınabilirliği talep etme</li>
                  <li>Rızanızı geri çekme</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Bu haklarınızı kullanmak için <strong>kvkk@atushome.com</strong> adresine 
                  başvurabilirsiniz.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Değişiklikler</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler 
                  olması durumunda size e-posta ile bildirimde bulunacağız veya sitede belirgin 
                  bir şekilde duyuracağız.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Son Güncelleme:</strong> 24 Mart 2026
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">9. İletişim</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gizlilik politikamız hakkında sorularınız için bize ulaşabilirsiniz:
                </p>
                <div className="bg-muted rounded-lg p-4 mt-4">
                  <p className="text-sm"><strong>E-posta:</strong> kvkk@atushome.com</p>
                  <p className="text-sm"><strong>Telefon:</strong> 0850 123 45 67</p>
                  <p className="text-sm"><strong>Adres:</strong> AtusHome E-Ticaret A.Ş., Ataşehir Bulvarı No:123, 34758 Ataşehir/İstanbul</p>
                </div>
              </section>

            </div>
          </ScrollArea>
        </div>
      </main>

      <Footer />
    </div>
  );
}
