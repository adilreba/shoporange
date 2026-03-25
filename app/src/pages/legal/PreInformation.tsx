import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Truck, CreditCard, Shield } from 'lucide-react';

export function PreInformationPage() {
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
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground w-40">Ticari Ünvan:</td>
                        <td className="py-3 font-medium">AtusHome E-Ticaret Anonim Şirketi</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Merkez Adres:</td>
                        <td className="py-3">Ataşehir Bulvarı No:123, 34758 Ataşehir/İstanbul</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Telefon:</td>
                        <td className="py-3">0850 123 45 67</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">E-posta:</td>
                        <td className="py-3">destek@atushome.com</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">MERSİS No:</td>
                        <td className="py-3">0123 4567 8901 2345</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Vergi Dairesi:</td>
                        <td className="py-3">Ataşehir Vergi Dairesi</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 text-muted-foreground">Vergi No:</td>
                        <td className="py-3">123 456 7890</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-muted-foreground">Ticaret Sicil No:</td>
                        <td className="py-3">123456</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">2. Temel Özellikler</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Satışa konu mal/hizmetlerin temel özellikleri, internet sitemizde her ürünün 
                  detay sayfasında ayrıntılı olarak belirtilmektedir. Ürün özellikleri şunları içerir:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Ürün adı ve markası</li>
                  <li>Model ve/veya seri numarası</li>
                  <li>Adet/miktar</li>
                  <li>Renk ve beden seçenekleri (varsa)</li>
                  <li>Teknik özellikler ve içerik bilgisi</li>
                  <li>Kullanım talimatları (varsa)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">3. Fiyatlandırma</h2>
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Satış Fiyatı</h3>
                    <p className="text-sm text-muted-foreground">
                      Satış fiyatları, internet sitemizde belirtilen fiyatlar olup Türk Lirası (TL) 
                      cinsindendir. Fiyatlara KDV (Katma Değer Vergisi) dahildir. 
                      Gösterilen fiyatlar, teslimat bedeli hariç satış fiyatlarıdır.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Ek Maliyetler</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Kargo ücreti: 500 TL altı siparişlerde 49 TL, üzerinde ücretsiz</li>
                    <li>Hızlı teslimat: Ek 50 TL</li>
                    <li>Kapıda ödeme: 19 TL ek ücret</li>
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
                      <li>Havale/EFT</li>
                      <li>Kapıda ödeme</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Taksit Seçenekleri:</h4>
                    <p className="text-sm text-muted-foreground">
                      100 TL ve üzeri alışverişlerde 2-12 taksit imkanı bulunmaktadır. 
                      Taksit sayısı ve vade farkları ürün detay sayfasında belirtilir.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">5. Teslimat Bilgileri</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Truck className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">Teslimat Süresi</h3>
                    <p className="text-sm text-muted-foreground">
                      Sipariş edilen ürünler, stokta bulunması halinde 2-5 iş günü içinde 
                      kargoya teslim edilir. Teslimat süresi, teslimat adresinin konumuna 
                      göre değişiklik gösterebilir.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Teslimat Koşulları:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Türkiye'nin tüm illerine teslimat yapılmaktadır</li>
                    <li>Teslimat adresi müşteri tarafından belirlenir</li>
                    <li>Ürünler, anlaşmalı kargo şirketleri ile gönderilir</li>
                    <li>Teslimat sırasında kimlik ibrazı istenebilir</li>
                    <li>Kargo hasarlı çıkarsa tutanak tutturulmalıdır</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">6. Cayma Hakkı</h2>
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-2">14 Günlük Cayma Hakkı</h3>
                    <p className="text-sm text-muted-foreground">
                      Malı teslim aldığınız veya sözleşmenin imzalandığı tarihten itibaren 
                      <strong> 14 (on dört) gün</strong> içinde herhangi bir gerekçe göstermeksizin 
                      ve cezai şart ödemeksizin sözleşmeden cayma hakkınız bulunmaktadır.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Cayma Hakkı Kullanımı:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Cayma hakkı süresi malın teslimine ilişkin sözleşmelerde tüketicinin malı teslim aldığı gün başlar</li>
                    <li>Cayma bildirimi yazılı olarak veya kalıcı veri saklayıcısı ile yapılabilir</li>
                    <li>Cayma hakkı kullanılamayacak ürünler site üzerinde ayrıca belirtilmiştir</li>
                    <li>Cayma durumunda iade kargo ücreti tarafımızca karşılanır</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">7. Garanti ve Servis</h2>
                <div className="bg-muted rounded-lg p-4">
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                    <li>Elektronik ürünlerde 2 yıl garanti (imalatçı veya ithalatçı garantisi)</li>
                    <li>Garanti kapsamında arızalanan ürünlerin tamiri veya değişimi ücretsizdir</li>
                    <li>Garanti dışı kalan durumlar: Kullanıcı hatası, yetkisiz müdahale, doğal afet</li>
                    <li>Yetkili servis bilgileri ürünle birlikte verilmektedir</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">8. Şikayet ve Başvuru</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Şikayet ve itirazlarınızı aşağıdaki kanallardan iletebilirsiniz:
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 text-muted-foreground w-32">E-posta:</td>
                        <td className="py-2">destek@atushome.com</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 text-muted-foreground">Telefon:</td>
                        <td className="py-2">0850 123 45 67</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted-foreground">Adres:</td>
                        <td className="py-2">Ataşehir Bulvarı No:123, 34758 Ataşehir/İstanbul</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground mt-4">
                  Tüketici Hakem Heyeti ve Tüketici Mahkemeleri'ne başvurma hakkınız saklıdır.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 text-orange-600">9. Onay</h2>
                <p className="text-muted-foreground leading-relaxed">
                  İşbu ön bilgilendirme formunu okuduğunuzu, anladığınızı ve Mesafeli Satış 
                  Sözleşmesi'ni kabul ettiğinizi beyan edersiniz. Sipariş vermekle bu formda 
                  belirtilen koşulları kabul etmiş sayılırsınız.
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
