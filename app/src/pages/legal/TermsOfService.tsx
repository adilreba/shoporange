import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Scale, Truck, RefreshCw } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mesafeli Satış Sözleşmesi | AtusHome"
        description="AtusHome mesafeli satış sözleşmesi ve kullanım koşulları"
      />
      <Header />
      
      <main className="container-custom pt-[100px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Mesafeli Satış Sözleşmesi</h1>
            <p className="text-muted-foreground">
              6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında mesafeli satış sözleşmesi
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[600px] rounded-xl border bg-card p-8">
            <div className="space-y-8 pr-4">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">1. Taraflar</h2>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold mb-2">1.1. Satıcı</h3>
                    <table className="w-full text-sm">
                      <tbody className="space-y-2">
                        <tr>
                          <td className="py-1 text-muted-foreground w-32">Ünvan:</td>
                          <td className="py-1 font-medium">AtusHome E-Ticaret Anonim Şirketi</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-muted-foreground">Adres:</td>
                          <td className="py-1">Ataşehir Bulvarı No:123, 34758 Ataşehir/İstanbul</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-muted-foreground">Telefon:</td>
                          <td className="py-1">0850 123 45 67</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-muted-foreground">E-posta:</td>
                          <td className="py-1">destek@atushome.com</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-muted-foreground">MERSİS:</td>
                          <td className="py-1">0123 4567 8901 2345</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-muted-foreground">Vergi No:</td>
                          <td className="py-1">123 456 7890</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-semibold mb-2">1.2. Alıcı (Tüketici)</h3>
                    <p className="text-sm text-muted-foreground">
                      Üyelik hesabı oluşturarak veya üyeliksiz alışveriş yaparak siteyi kullanan 
                      gerçek kişi. Alıcı bilgileri, sipariş sırasında verilen bilgilerden oluşur.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. Sözleşmenin Konusu</h2>
                <p className="text-muted-foreground leading-relaxed">
                  İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait{' '}
                  <strong>www.atushome.com</strong> internet sitesinden elektronik ortamda 
                  sipariş verdiği, sözleşmede belirtilen niteliklere sahip mal/hizmetin satışı 
                  ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun 
                  ve 27.11.2014 tarihli Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince 
                  tarafların hak ve yükümlülüklerinin belirlenmesidir.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Sözleşme Tarihi ve Süresi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  İşbu sözleşme, Alıcı tarafından siparişin verildiği tarihte kurulur. 
                  Sözleşme, sipariş edilen ürünün Alıcı'ya teslim edilmesi ve bedelinin 
                  tahsil edilmesiyle sona erer.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">4. Ürün Bilgileri</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Satıcı tarafından internet sitesinde yayınlanan ürünlerin;
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Türü, cinsi, miktarı, markası, modeli, rengi</li>
                  <li>Satış bedeli (KDV dahil)</li>
                  <li>Ödeme şekli</li>
                  <li>Teslimat adresi ve koşulları</li>
                  <li>Kargo ücreti</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  bilgileri site üzerinde ilan edilmektedir. Ürün özellikleri, sipariş 
                  onayı e-postası ile de Alıcı'ya bildirilir.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Ödeme Koşulları</h2>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2">5.1. Fiyat</h3>
                    <p className="text-sm text-muted-foreground">
                      Ürünlerin satış fiyatları, internet sitesinde belirtilen fiyatlar olup 
                      KDV dahildir. Fiyatlar Türk Lirası (TL) olarak gösterilir.
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2">5.2. Ödeme Yöntemleri</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>Kredi kartı (Visa, Mastercard, American Express)</li>
                      <li>Banka kartı</li>
                      <li>Havale/EFT</li>
                      <li>Kapıda ödeme (nakit veya kredi kartı)</li>
                    </ul>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2">5.3. Taksitli Satış</h3>
                    <p className="text-sm text-muted-foreground">
                      Taksitli satış işlemleri, Bankalararası Kart Merkezi (BKM) kurallarına 
                      uygun olarak gerçekleştirilir. Taksit sayısı ve komisyon oranları 
                      site üzerinde belirtilir.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Teslimat Koşulları</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Truck className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">6.1. Teslimat Süresi</h3>
                    <p className="text-sm text-muted-foreground">
                      Sipariş edilen ürünler, stokta bulunması halinde 2-5 iş günü içinde 
                      kargoya teslim edilir. Teslimat süresi, adresinize ve kargo şirketinin 
                      iş yoğunluğuna göre değişebilir.
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 mb-4">
                  <h3 className="font-medium mb-2">6.2. Kargo Şirketleri</h3>
                  <p className="text-sm text-muted-foreground">
                    Teslimat, Yurtiçi Kargo, Aras Kargo, MNG Kargo veya PTTL ile yapılır. 
                    Alıcı, sipariş sırasında tercih ettiği kargo şirketini değiştiremez.
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-2">6.3. Kargo Ücreti</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>500 TL ve üzeri siparişlerde: Ücretsiz kargo</li>
                    <li>500 TL altı siparişlerde: 49 TL kargo bedeli</li>
                    <li>Express kargo: 99 TL (1-2 iş günü)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. Cayma Hakkı</h2>
                <div className="flex items-start gap-3 mb-4">
                  <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">7.1. Cayma Hakkının Kapsamı</h3>
                    <p className="text-sm text-muted-foreground">
                      Alıcı, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir 
                      gerekçe göstermeksizin, malı teslim aldığı veya sözleşmenin imzalandığı 
                      tarihten itibaren <strong>14 (on dört) gün</strong> içinde cayma hakkını 
                      kullanabilir.
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 mb-4">
                  <h3 className="font-medium mb-2">7.2. Cayma Hakkı Kullanılamayacak Ürünler</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    6502 sayılı Kanun'un 15. maddesi uyarınca cayma hakkı kullanılamayacak ürünler:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Ambalajı açılmış, kullanılmış veya tahrip edilmiş hijyenik ürünler</li>
                    <li>Müşteri istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünler</li>
                    <li>Hızlı bozulan veya son kullanma tarihi geçebilecek ürünler</li>
                    <li>Sealed (mühürlü) ürünlerde mühür bozulmuşsa</li>
                    <li>Dijital içerik ve yazılımlar (CD, DVD, oyun kodları vb.)</li>
                  </ul>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-2">7.3. Cayma Hakkı Kullanımı</h3>
                  <p className="text-sm text-muted-foreground">
                    Cayma hakkı kullanımı için, 14 günlük süre içinde{' '}
                    <strong>destek@atushome.com</strong> adresine e-posta gönderilmesi veya 
                    0850 123 45 67 numaralı çağrı merkezimizi aranması gerekmektedir. 
                    Ürününüzü orijinal ambalajında, faturası ve tüm aksesuarları ile birlikte 
                    iade etmeniz gerekmektedir.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Garanti ve İade</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Elektronik ürünlerde 2 yıl garanti (yetkili servis)</li>
                  <li>Ayıplı mal durumunda ücretsiz değişim veya iade</li>
                  <li>İade kargo ücreti Satıcı tarafından karşılanır (ayplı mal durumunda)</li>
                  <li>İade tutarı, ürün Satıcı'ya ulaştıktan sonra 14 iş günü içinde iade edilir</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">9. Uyuşmazlık Çözümü</h2>
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      İşbu sözleşmeden doğan uyuşmazlıklarda:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>Öncelikle karşılıklı görüşme yoluyla çözüm aranır</li>
                      <li>6502 sayılı Kanun ve ilgili mevzuat hükümleri uygulanır</li>
                      <li>Tüketici Hakem Heyeti'ne başvurulabilir (değeri 30.000 TL'ye kadar olan uyuşmazlıklar için)</li>
                      <li>Tüketici Mahkemeleri yetkilidir</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">10. Yürürlük</h2>
                <p className="text-muted-foreground leading-relaxed">
                  İşbu sözleşme, elektronik ortamda onaylandığı tarihte yürürlüğe girer. 
                  Sipariş vermekle Alıcı, bu sözleşme hükümlerini kabul etmiş sayılır.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Son Güncelleme:</strong> 24 Mart 2026
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
