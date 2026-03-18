# AtusHome - Modern E-Ticaret Platformu

Turuncu temalı, modern, tam donanımlı bir e-ticaret web uygulaması. AWS Amplify üzerinde deploy edilebilir.

## Özellikler

### Kullanıcı Özellikleri
- 🔐 **Kimlik Doğrulama**: Email/Şifre, Google ve Facebook ile giriş
- 🛍️ **Ürün Yönetimi**: 8 kategori, filtreleme, sıralama, arama
- 🛒 **Sepet Sistemi**: Ekleme, çıkarma, miktar güncelleme, kupon kodu
- ❤️ **Favoriler**: Beğenme, favori listesi yönetimi
- ⚖️ **Karşılaştırma**: 4 ürüne kadar karşılaştırma
- 💳 **Ödeme**: Güvenli ödeme formu, kargo seçenekleri
- 📱 **Responsive**: Mobil, tablet ve masaüstü uyumlu

### Admin Özellikleri
- 📊 **Dashboard**: Satış istatistikleri, sipariş takibi
- 📦 **Ürün Yönetimi**: Ekleme, düzenleme, silme
- 👥 **Kullanıcı Yönetimi**: Kullanıcı listesi
- 📋 **Sipariş Yönetimi**: Sipariş durumu takibi

## Teknolojiler

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React
- **Notifications**: Sonner

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusu
npm run dev

# Production build
npm run build
```

## AWS Amplify Deployment

### 1. AWS Amplify Console'a Git
- [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)'a gidin
- "New app" > "Host web app" seçeneğini tıklayın

### 2. GitHub Bağlantısı
- GitHub hesabınızı bağlayın
- Bu repository'yi seçin
- Branch olarak `main` veya `master` seçin

### 3. Build Ayarları
`amplify.yml` dosyası otomatik olarak yapılandırılmıştır:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
```

### 4. Deploy
- "Save and deploy" butonuna tıklayın
- Build ve deployment otomatik olarak tamamlanacaktır

## Demo Giriş Bilgileri

### Admin Hesabı
- Email: `admin@atushome.com`
- Şifre: `admin123`

### Kullanıcı Hesabı
- Email: Herhangi bir email
- Şifre: En az 6 karakter

## Kategoriler

1. Elektronik
2. Moda
3. Ev & Yaşam
4. Kozmetik
5. Spor
6. Kitap
7. Oyuncak
8. Süpermarket

## Ödeme Yöntemleri

- Kredi Kartı (Visa, Mastercard, Amex)
- PayPal
- Google Pay
- Apple Pay

## Kupon Kodları

- `INDIRIM10`: %10 indirim
- `INDIRIM20`: %20 indirim
- `WELCOME`: %15 indirim (yeni üyeler)
- `SUMMER25`: %25 indirim
- `BLACK50`: %50 indirim

## Özelleştirme

### Tema Renkleri
`tailwind.config.js` ve `src/index.css` dosyalarında turuncu tema renklerini değiştirebilirsiniz.

### Ürün Ekleme
`src/data/mockData.ts` dosyasına yeni ürünler ekleyebilirsiniz.

### Kategori Ekleme
`src/types/index.ts` ve `src/data/mockData.ts` dosyalarını güncelleyin.

## Lisans

MIT License

## İletişim

Sorularınız için: info@atushome.com
