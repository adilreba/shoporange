import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

export function KVKKPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="KVKK Aydınlatma Metni | AtusHome"
        description="Kişisel verilerinizin korunması hakkında bilgilendirme"
      />
      <Header />
      
      <main className="container-custom pt-[100px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">KVKK Aydınlatma Metni</h1>
            <p className="text-muted-foreground">
              Kişisel Verilerin Korunması Kanunu kapsamında haklarınız ve veri işleme süreçlerimiz
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[600px] rounded-xl border bg-card p-8">
            <div className="space-y-8 pr-4">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">1. Veri Sorumlusu</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; 
                  veri sorumlusu olarak AtusHome E-Ticaret A.Ş. ("Şirket") tarafından aşağıda açıklanan 
                  kapsamda işlenebilecektir.
                </p>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Ataşehir Bulvarı No:123, Ataşehir/İstanbul</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">0850 123 45 67</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">kvkk@atushome.com</span>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. İşlenen Kişisel Veriler</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Şirketimiz tarafından işlenen kişisel verileriniz şunlardır:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)</li>
                  <li>İletişim bilgileri (e-posta adresi, telefon numarası, adres)</li>
                  <li>Finansal bilgiler (banka hesap bilgileri, fatura bilgileri)</li>
                  <li>İşlem bilgileri (sipariş geçmişi, ödeme bilgileri)</li>
                  <li>Çevrimiçi tanımlayıcılar (IP adresi, çerezler)</li>
                  <li>Müşteri ilişkileri bilgileri (talep ve şikayetler)</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Kişisel Verilerin İşlenme Amaçları</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Siparişlerinizi işleme almak ve teslim etmek</li>
                  <li>Üyelik hesabınızı yönetmek</li>
                  <li>Ödemelerinizi gerçekleştirmek</li>
                  <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                  <li>Kampanya ve promosyonlardan haberdar etmek</li>
                  <li>Müşteri memnuniyetini artırmak ve destek sağlamak</li>
                  <li>Dolandırıcılığı önlemek ve güvenliği sağlamak</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">4. Kişisel Verilerin Aktarılması</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda; 
                  yasal düzenlemelerin izin verdiği ölçüde ve gerekli güvenlik önlemleri alınarak, 
                  kargo şirketleri, ödeme kuruluşları, hukuken yetkili kamu kurum ve kuruluşları ile 
                  iş ortaklarımıza aktarılabilecektir.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebep</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Kişisel verileriniz; web sitemiz, mobil uygulamamız, çağrı merkezimiz ve fiziki kanallar 
                  aracılığıyla, açık rızanız veya kanunda öngörülen hallerde (sözleşmenin kurulması veya 
                  ifası, hukuki yükümlülüğün yerine getirilmesi, meşru menfaat vb.) işlenmektedir.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Haklarınız</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  KVKK'nın 11. maddesi uyarınca sahip olduğunuz haklar:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                  <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                  <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                  <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                  <li>Yukarıda sayılan düzeltme, silinme veya yok edilme işlemlerinin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                  <li>İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                  <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. Başvuru Yöntemi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Yukarıda sayılan haklarınızı kullanmak için; kimliğinizi tespit edici bilgiler ile 
                  talep konunuzu yazılı olarak <strong>kvkk@atushome.com</strong> e-posta adresine 
                  gönderebilir veya web sitemizdeki başvuru formunu doldurabilirsiniz. Başvurularınız 
                  en geç 30 gün içinde ücretsiz olarak yanıtlanacaktır.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Güncellemeler</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bu aydınlatma metni, yasal düzenlemeler ve şirket politikalarımızda meydana gelen 
                  değişiklikler doğrultusunda güncellenebilir. Güncel metne web sitemizden her zaman 
                  ulaşabilirsiniz.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Son Güncelleme:</strong> 24 Mart 2026
                </p>
              </section>

            </div>
          </ScrollArea>

          {/* Contact Box */}
          <div className="mt-8 bg-orange-50 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Veri Gizliliği Ekibimiz</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kişisel verileriniz hakkında sorularınız mı var? Bize ulaşın.
            </p>
            <a 
              href="mailto:kvkk@atushome.com" 
              className="inline-flex items-center gap-2 text-orange-600 hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              kvkk@atushome.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
