import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Truck, CreditCard, Shield, Building2 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export function PreInformationPage() {
  const settings = useSettingsStore((state) => state.settings);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Ön Bilgilendirme Formu | AtusHome"
        description="Mesafeli satış sözleşmesi ön bilgilendirme formu"
      />
      <Header />
      
      <main className="container-custom pt-[100px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Ön Bilgilendirme Formu</h1>
            <p className="text-muted-foreground">
              6502 sayılı Tüketicinin Korunması Hakkında Kanun gereğince ön bilgilendirme
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[600px] rounded-xl border bg-card p-8">
            <div className="space-y-8 pr-4">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">1. Satıcı Bilgileri</h2>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Satıcı</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground w-44">Ticari Ünvan:</td>
                        <td className="py-3 font-medium">{settings.companyTitle || 'Henüz tanımlanmamış'}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Merkez Adres:</td>
                        <td className="py-3">{settings.address || '-'}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Telefon:</td>
                        <td className="py-3">{settings.phone || '-'}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">E-posta:</td>
                        <td className="py-3">{settings.storeEmail || '-'}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">MERSİS No:</td>
                        <td className="py-3">{settings.mersisNo || '-'}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Vergi Dairesi / No:</td>
                        <td className="py-3">{settings.taxOffice || '-'} / {settings.taxNo || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-muted-foreground">Ticaret Sicil No:</td>
                        <td className="py-3">{settings.tradeRegistryNo || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. Sözleşme Konusu Ürün/Hizmet Bilgileri</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Satışa konu mal/hizmetlerin temel özellikleri, internet sitemizde her ürünün 
                  detay sayfasında ayrıntılı olarak belirtilmektedir. Sipariş anında ürün adı, 
                  markası, modeli, adedi, birim fiyatı, toplam fiyatı, ödeme şekli ve teslimat 
                  bilgileri sipariş özeti ekranında gösterilir.
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Sipariş Özeti Tablosu (Örnek)</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left text-muted-foreground">Ürün</th>
                        <th className="py-2 text-right text-muted-foreground">Birim Fiyat</th>
                        <th className="py-2 text-right text-muted-foreground">Adet</th>
                        <th className="py-2 text-right text-muted-foreground">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3">[Ürün adı, markası, modeli]</td>
                        <td className="py-3 text-right">[Fiyat] TL</td>
                        <td className="py-3 text-right">[Adet]</td>
                        <td className="py-3 text-right">[Toplam] TL</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 font-medium" colSpan={3}>Ara Toplam</td>
                        <td className="py-3 text-right font-medium">[Ara Toplam] TL</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3" colSpan={3}>Kargo Ücreti</td>
                        <td className="py-3 text-right">[Kargo] TL</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-orange-600" colSpan={3}>Genel Toplam (KDV Dahil)</td>
                        <td className="py-3 text-right font-bold text-orange-600">[Genel Toplam] TL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Fiyatlandırma ve Ek Maliyetler</h2>
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Satış Fiyatı</h3>
                    <p className="text-sm text-muted-foreground">
                      Satış fiyatları, internet sitemizde belirtilen fiyatlar olup Türk Lirası (TL) 
                      cinsindendir. Fiyatlara <strong>KDV (Katma Değer Vergisi) dahildir</strong>. 
                      Gösterilen fiyatlar, teslimat bedeli hariç satış fiyatlarıdır.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Ek Maliyetler</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Kargo ücreti: {settings.freeShippingThreshold ? `${settings.freeShippingThreshold} TL altı siparişlerde ${settings.defaultShippingCost || 49} TL, üzerinde ücretsiz` : 'Sipariş tutarına göre değişir'}</li>
                    <li>Kapıda ödeme: Ek 19 TL</li>
                    <li>Taksitli ödeme: Banka vade farkı uygulanabilir</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">4. Ödeme Bilgileri</h2>
                <div className="bg-muted rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Kabul Edilen Ödeme Yöntemleri:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>Banka/Kredi Kartı (Visa, Mastercard, American Express)</li>
                      <li>Banka Havalesi/EFT</li>
                      <li>Kapıda Ödeme (Nakit veya Kart)</li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Kredi kartı ile ödeme yaparken 3D Secure / OTP doğrulaması zorunludur. 
                    Kredi kartı bilgileriniz bizim sunucularımızda saklanmaz; ödeme işlemleri 
                    BDDK lisanslı ödeme kuruluşları (iyzico vb.) aracılığıyla güvenle gerçekleştirilir.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Teslimat Bilgileri</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Truck className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Teslimat Süresi ve Şekli</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sözleşme konusu ürün, yasal <strong>30 günlük</strong> süreyi aşmamak koşulu ile 
                      ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir. Stokta olan ürünler 
                      genellikle <strong>1-3 iş günü</strong> içinde kargoya verilir.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Önemli:</strong> ALICI'dan başka bir kişi/kuruluşa teslim edilecek ise, 
                    teslim edilecek kişinin teslimatı kabul etmemesinden SATICI sorumlu tutulamaz. 
                    Kargo firmasının teslimat sırasında karşılaşacağı sorunlardan SATICI sorumlu değildir.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Cayma Hakkı</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">14 Günlük Cayma Hakkı</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ALICI, mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine teslim 
                      tarihinden itibaren <strong>14 (ondört) gün</strong> içinde hiçbir gerekçe 
                      göstermeksizin cayma hakkını kullanabilir. Cayma hakkı kullanımına ilişkin 
                      detaylı bilgi için <a href="/legal/return-policy" className="text-orange-600 hover:underline">İade Politikası</a> sayfasını inceleyebilirsiniz.
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Cayma hakkı bulunmayan ürünler:</strong> Kişiye özel hazırlanan ürünler, 
                    ambalajı açılmış hijyen ürünleri, çabuk bozulabilen ürünler ve dijital içerikler.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. İletişim ve Şikayet</h2>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Müşteri Hizmetleri:</strong> {settings.phone || '0850 123 45 67'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>E-posta:</strong> {settings.storeEmail || 'destek@atushome.com'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Adres:</strong> {settings.address || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Uyuşmazlık durumunda Tüketici Hakem Heyeti'ne başvurabilirsiniz. 
                    Gümrük ve Ticaret Bakanlığı her yıl Aralık ayında parasal sınırları belirler.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Onay</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ALICI, işbu Ön Bilgilendirme Formu'nu okuduğunu, anladığını ve sipariş verme işlemi 
                  ile ödeme yükümlülüğü altına girdiğini kabul, beyan ve taahhüt eder. Ön bilgilendirme 
                  formunun ardından gelen <a href="/legal/distance-sales-contract" className="text-orange-600 hover:underline">Mesafeli Satış Sözleşmesi</a>'ni 
                  de okuyup kabul etmiş sayılır.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Son güncelleme:</strong> {new Date().toLocaleDateString('tr-TR')}
                </p>
              </section>

            </div>
          </ScrollArea>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
