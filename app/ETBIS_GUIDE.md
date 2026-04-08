# ETBİS Kayıt Rehberi
## E-Ticaret Bilgi Sistemi - Adım Adım Başvuru Kılavuzu

**Önemli:** Bu kayıt yasal zorunludur. E-ticaret sitesi açmadan önce tamamlanmalıdır.

---

## 📋 GEREKLİ BELGELER (Başlamadan Hazırlayın)

| Belge | Nereden Alınır | Süre |
|-------|---------------|------|
| **Vergi Levhası** | Mükellefiyetinizin bulunduğu vergi dairesi | Mevcutsa hazır |
| **İmza Sirküleri** | Ticaret sicil müdürlüğü | 1-2 gün |
| **Ticaret Sicil Gazetesi** | Ticaret sicil müdürlüğü | Mevcutsa hazır |
| **Kimlik Fotokopisi** | - | Hazır |
| **İkametgah Belgesi** | e-Devlet | Anında |
| **Domain Sahipliği Belgesi** | Domain firması | Anında (WHOIS) |

---

## 🚀 ADIM 1: Ön Başvuru (e-Devlet Üzerinden)

### 1.1 e-Devlet Girişi
```
🔗 https://www.turkiye.gov.tr
```
- TCKN ve şifrenizle giriş yapın
- "Ticaret Bakanlığı" hizmetlerine gidin

### 1.2 İlk Kayıt Formu
```
Menü: Ticaret Bakanlığı → E-Ticaret → ETBİS Kayıt Başvurusu
```

**Doldurulacak Bilgiler:**
- [ ] Firma unvanı (Vergi levhasındaki gibi)
- [ ] Vergi numarası
- [ ] Ticaret sicil numarası
- [ ] Domain adı (örn: atushome.com)
- [ ] Web sitesi URL'si
- [ ] Faaliyet konusu (Örn: "Ev eşyası perakende ticareti")

**Önemli Not:**
- Domain sahipliği sizde olmalı (WHOIS kontrolü yapılacak)
- Web sitesi açık ve erişilebilir olmalı
- SSL sertifikası (https) zorunlu

---

## 📄 ADIM 2: Evrak Yükleme

### 2.1 Gerekli Dosyalar (PDF/JPG formatında)

**A. Firma Belgeleri**
```
📁 FirmaKlasörü/
├── 1_vergi_levhasi.pdf
├── 2_imza_sirkuleri.pdf
├── 3_ticaret_sicil_gazetesi.pdf
└── 4_faaliyet_belgesi.pdf (varsa)
```

**B. Alan Adı (Domain) Belgeleri**
```
📁 Domain/
├── 1_domain_sahiplik_belgesi.pdf
│   (WHOIS sorgusu sonucu veya domain firmasından alınan belge)
└── 2_ssl_sertifikasi.pdf (varsa)
```

**C. Sistem Bilgileri**
```
📁 Sistem/
└── 1_altyapi_dokumani.pdf
    (Hosting firmanızdan alınan belge - AWS/Vercel vb.)
```

### 2.2 Yükleme Ekranı
```
ETBİS Portalı → Belgelerim → Yeni Belge Ekle
```

**Her belge için:**
- Dosya adı Türkçe karakter içermemeli
- Maksimum 5MB
- PDF veya JPG formatı

---

## 🌐 ADIM 3: Web Sitesi Kontrolü

### 3.1 Zorunlu Sayfalar (Kontrol Listesi)

Sitenizde şu sayfaların olduğundan emin olun:

```
✅ Ana sayfa erişilebilir
✅ İletişim sayfası (şirket bilgileri)
✅ Mesafeli satış sözleşmesi
✅ Ön bilgilendirme formu
✅ Gizlilik politikası
✅ İade politikası
```

### 3.2 Footer'da Bulunması Gerekenler
```html
Şirket Unvanı: [Firma Adı Ltd. Şti.]
Ticaret Sicil No: [123456]
Vergi No: [1234567890]
Mersis No: [0123456789012345]
E-posta: info@firma.com
Telefon: 0212 123 45 67
Adres: [Tam adres]
```

### 3.3 ETBİS Kontrol Botu
```
Başvurudan sonra Ticaret Bakanlığı botu sitenizi tarar:
- Erişilebilirlik kontrolü
- Yasal sayfaların varlığı
- İletişim bilgileri doğruluğu
```

---

## 📊 ADIM 4: Başvuru Takibi

### 4.1 Başvuru Durumları

| Durum | Açıklama | Tahmini Süre |
|-------|----------|--------------|
| **Beklemede** | Belgeler inceleniyor | 3-5 gün |
| **Eksik Evrak** | Belge tamamlaması gerekli | - |
| **İncelemede** | Uzman incelemesi | 5-7 gün |
| **Onaylandı** | Kayıt tamamlandı | - |
| **Reddedildi** | İtiraz/düzeltme gerekli | - |

### 4.2 Takip Ekranı
```
https://etbis.eticaret.gov.tr → Başvurularım → Durum Sorgula
```

---

## ✅ ADIM 5: Onay Sonrası Yapılacaklar

### 5.1 ETBİS Numarası Alma
```
Onay maili geldikten sonra:
ETBİS No: ETB-2024-1234567 (örnek)
```

### 5.2 Web Sitesine Ekleme (Zorunlu!)
```html
<!-- Footer'a eklenmeli -->
<div class="etbis-badge">
  <a href="https://etbis.eticaret.gov.tr/sitedogrulama/ETB-2024-XXXXXXX" 
     target="_blank">
    <img src="/images/etbis-badge.png" alt="ETBİS Kayıtlı">
  </a>
</div>
```

### 5.3 Günlük İşlem Bildirimi (Otomatik)
```
ETBİS paneline:
- Günlük satış adedi
- Satış tutarı
- İade/iptal bilgileri

Not: API entegrasyonu ile otomatik gönderilebilir.
```

---

## 🎯 HIZLI BAŞVURU ADIMLARI (Özet)

### Bugün Yapılacaklar:
1. [ ] e-Devlet şifresi al (şifreniz yoksa PTT'den)
2. [ ] Evrakları dijitalleştir (tarat/pdf yap)
3. [ ] etbis.eticaret.gov.tr'ye kayıt ol

### Bu Hafta:
4. [ ] Başvuru formunu doldur
5. [ ] Belgeleri yükle
6. [ ] Web sitesi kontrollerini tamamla

### Bekleme Süreci:
7. [ ] 7-10 gün içinde dönüş bekleyin
8. [ ] Eksik varsa tamamlayın
9. [ ] Onay mailini alın

### Onay Sonrası:
10. [ ] ETBİS numarasını web sitesine ekleyin
11. [ ] Sosyal medyada duyurun
12. [ ] Satışa başlayın! 🎉

---

## ⚠️ SIK KARŞILAŞILAN HATALAR

### Hata 1: "Domain sahibi bilgileri uyuşmuyor"
**Çözüm:** 
- WHOIS bilgilerini güncelleyin
- Domain şirket adınıza kayıtlı olmalı
- Gizlilik koruması varsa geçici olarak kapatın

### Hata 2: "Web sitesi erişilemez"
**Çözüm:**
- SSL sertifikası kontrolü (https)
- Hosting uptime kontrolü
- Firewall ayarlarını kontrol edin

### Hata 3: "Eksik yasal sayfa"
**Çözüm:**
- Mesafeli satış sözleşmesi ekle
- Ön bilgilendirme formu ekle
- İade politikası ekle

### Hata 4: "İletişim bilgileri eksik"
**Çözüm:**
- Footer'a tam adres ekle
- Çalışan telefon numarası
- Şirket e-posta adresi

---

## 📞 YARDIM VE DESTEK

### Resmi Kanallar:
```
📞 Çağrı Merkezi: 0850 333 55 77
📧 E-posta: etbis@ticaret.gov.tr
🌐 Portal: https://etbis.eticaret.gov.tr
```

### Sık Sorulan Sorular:
```
https://etbis.eticaret.gov.tr/SSS
```

---

## ⏱️ TOPLAM SÜRE TAHMİNİ

| Aşama | Süre |
|-------|------|
| Evrak hazırlık | 1-2 gün |
| Başvuru ve yükleme | 1 gün |
| İnceleme süreci | 7-10 gün |
| Düzeltme (varsa) | 3-5 gün |
| **TOPLAM** | **10-20 gün** |

---

## ✅ KONTROL LİSTESİ (Başvuru Öncesi)

```
□ Ltd. Şti. kuruluş tamamlandı
□ Vergi levhası alındı
□ Domain satın alındı
□ Web sitesi yayında (https)
□ Yasal sayfalar hazır
□ İletişim bilgileri doğru
□ Evraklar dijitalleştirildi
□ e-Devlet şifresi var
□ ETBİS portalına kayıt olundu
```

**Tüm maddeler tamamsa başvurmaya hazırsınız! 🚀**

---

## 📌 ÖNEMLİ HATIRLATMALAR

1. **Başvuru ücretsizdir** - Hiçbir ücret ödemeyin!
2. **Vekaletname ile başvuru** - Müdür veya yetkili başvurabilir
3. **Yıllık güncelleme** - Her yıl bilgilerinizi güncelleyin
4. **Değişiklik bildirimi** - Adres/domain değişikliğinde bildirin
5. **Cezai yaptırım** - Kayıtsız e-ticaret: 10.000₺ - 100.000₺ arası ceza

---

**Haziran 2024 itibariyle güncel bilgiler**

Son güncelleme: Rehber oluşturulma tarihi
