import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Truck, CreditCard, RotateCcw, Scale, Building2 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export function DistanceSalesContractPage() {
  const settings = useSettingsStore((state) => state.settings);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mesafeli Satış Sözleşmesi | AtusHome"
        description="6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında mesafeli satış sözleşmesi"
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
              6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında
            </p>
          </div>

          {/* Content */}
          <ScrollArea className="h-[600px] rounded-xl border bg-card p-8">
            <div className="space-y-8 pr-4">
              
              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">1. Taraflar</h2>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Satıcı Bilgileri</h3>
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
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Ticaret Sicil No:</td>
                        <td className="py-3">{settings.tradeRegistryNo || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-muted-foreground">ETBİS No:</td>
                        <td className="py-3">{settings.etbisNo || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. Sözleşme Konusu ve Kapsam</h2>
                <p className="text-muted-foreground leading-relaxed">
                  İşbu sözleşme, ALICI'nın SATICI'ya ait <strong>AtusHome</strong> internet sitesi üzerinden 
                  elektronik ortamda siparişini verdiği, sözleşmede belirtilen niteliklere sahip mal/hizmetin 
                  satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 
                  Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerini 
                  düzenler.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Ürün Bilgileri</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Sözleşme konusu mal/hizmetin türü, miktarı, markası, modeli, rengi, adedi, satış bedeli, 
                  teslimat/fatura adresi, teslim edilecek kişi ve ödeme şekli sipariş anında sisteme girilen 
                  bilgilerden oluşur. Bu bilgiler sipariş özeti ekranında ve sipariş onay e-postasında yer alır.
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Fiyat taahhütlerinin geçerlilik süresi:</strong> Siparişin verildiği andan itibaren 
                    <strong> 30 dakika</strong> ile sınırlıdır. Bu süre içinde ödeme tamamlanmazsa sipariş 
                    otomatik olarak iptal edilir.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">4. Ödeme Koşulları</h2>
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Kabul Edilen Ödeme Yöntemleri</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                      <li>Banka/Kredi Kartı (Visa, Mastercard)</li>
                      <li>Banka Havalesi/EFT</li>
                      <li>Kapıda Ödeme (Nakit/Kart)</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kredi kartı ile taksitli ödeme seçenekleri, ödeme sayfasında ilgili bankaların kampanyaları 
                  doğrultusunda sunulmaktadır. Taksit sayısı ve vade farkı bankadan bankaya değişiklik gösterebilir. 
                  Peşin fiyatına taksit uygulamalarında vade farkı SATICI tarafından karşılanmaz.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Teslimat Koşulları</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Truck className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Teslimat Süresi ve Şekli</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Sözleşme konusu ürün, yasal <strong>30 günlük</strong> süreyi aşmamak koşulu ile 
                      ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir. Stokta olan ürünler 
                      aynı gün kargoya verilir, özel üretim/stoksuz ürünler için teslimat süresi ürün 
                      detay sayfasında belirtilir.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Kargo ücreti:</strong> {settings.freeShippingThreshold ? `${settings.freeShippingThreshold} TL üzeri ücretsiz, altı ${settings.defaultShippingCost || 49} TL` : 'Sipariş tutarına göre değişir'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Teslimat yapılamaması:</strong> ALICI'nın yerinde olmaması, adres yanlışlığı 
                    veya teslimatı kabul etmemesi durumunda oluşacak ekstra kargo bedelleri ALICI'ya aittir.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Cayma Hakkı</h2>
                <div className="flex items-start gap-3 mb-4">
                  <RotateCcw className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">14 Günlük Cayma Hakkı</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ALICI, mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine veya gösterdiği 
                      adresteki kişi/kuruluşa teslim tarihinden itibaren <strong>14 (ondört) gün</strong> içinde 
                      hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin 
                      malı reddederek sözleşmeden cayma hakkını kullanabilir.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">Cayma Hakkı Kullanımı:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground ml-2 space-y-1">
                    <li>Hesabım → Siparişlerim → İade Talebi Oluştur</li>
                    <li>Veya destek@atushome.com adresine e-posta gönderin</li>
                    <li>Ürünün faturası, kutusu ve ambalajı ile birlikte eksiksiz iadesi gerekir</li>
                    <li>Kargo ücreti ALICI'ya aittir (istisna: ayıplı mal)</li>
                  </ol>
                </div>
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm text-amber-800">Cayma Hakkı Bulunmayan Ürünler:</h4>
                  <ul className="list-disc list-inside text-sm text-amber-700 ml-2 space-y-1">
                    <li>Kişiye özel hazırlanan ürünler</li>
                    <li>Ambalajı açılmış kozmetik, iç giyim, kulaklık gibi hijyen ürünleri</li>
                    <li>Çabuk bozulabilen gıda ürünleri</li>
                    <li>Dijital içerik ve yazılımlar (CD/DVD ile birlikte ise ambalaj açılmamalı)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. Garanti ve Ayıp</h2>
                <p className="text-muted-foreground leading-relaxed">
                  SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun 
                  ve varsa garanti belgeleri ile teslim edilmesinden sorumludur. Teslimat anında zarar 
                  görmüş paketler <strong>tutanak tutturularak</strong> teslim alınmamalıdır.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Gizlilik ve Veri Güvenliği</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ALICI'ya ait kişisel veriler, KVKK kapsamında işlenir. Ayrıntılı bilgi için 
                  <a href="/legal/kvkk" className="text-orange-600 hover:underline"> KVKK Aydınlatma Metni</a>'ni 
                  inceleyebilirsiniz. Kart bilgileri 3D Secure protokolü ile korunur, SATICI kart bilgilerini 
                  saklamaz.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">9. Uyuşmazlık Çözümü</h2>
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Taraflar arasındaki sözleşmenin uygulanmasından doğan uyuşmazlıklarda, Gümrük ve Ticaret 
                      Bakanlığı tarafından her yıl Aralık ayında belirlenen parasal sınırlar dâhilinde 
                      <strong> Tüketici Hakem Heyetleri</strong> veya <strong>Tüketici Mahkemeleri</strong> yetkilidir.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Şikayet ve talepleriniz için: <strong>{settings.storeEmail || 'destek@atushome.com'}</strong> / 
                      <strong>{settings.phone || '0850 123 45 67'}</strong>
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">10. Yürürlük</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ALICI, siparişini verdikten sonra ön bilgilendirme formunu ve işbu mesafeli satış sözleşmesini 
                  okuduğunu, içeriğini bildiğini ve tüm hükümlerini kabul ettiğini beyan eder. ALICI'nın 
                  sipariş vermesi ve ödeme yapması, işbu sözleşmenin kurulduğunu gösterir.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Son güncelleme tarihi:</strong> {new Date().toLocaleDateString('tr-TR')}
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
