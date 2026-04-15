# AtusHome AWS Backend Entegrasyonu - Özet

## Tamamlanan İşlemler

### 1. API Servis Katmanı ✅
- **Dosya:** `src/services/api.ts`
- Tüm AWS Lambda fonksiyonları için API çağrıları
- Tip güvenliği ile TypeScript arayüzleri
- Hata yönetimi ve CORS desteği

### 2. Lambda Fonksiyonları ✅
- **Dizin:** `aws/lambda/`
- `products.js` - Ürün CRUD işlemleri
- `orders.js` - Sipariş yönetimi
- `users.js` - Kullanıcı yönetimi
- `auth.js` - Kimlik doğrulama (JWT)
- `reviews.js` - Yorum sistemi
- `categories.js` - Kategori yönetimi
- `seed.js` - Örnek veri yükleme

### 3. SAM Şablonu ✅
- **Dosya:** `aws/sam/template.yaml`
- 5 DynamoDB tablosu (Products, Orders, Users, Reviews, Categories)
- 25+ Lambda fonksiyonu
- API Gateway yapılandırması
- IAM rolleri ve politikaları
- CloudWatch Logs entegrasyonu

### 4. Frontend Entegrasyonu ✅
- **Dosya:** `src/stores/authStore.ts` (güncellendi)
- AWS API ve mock data arasında geçiş
- JWT token yönetimi
- Otomatik token doğrulama

### 5. Deployment Araçları ✅
- **Dosya:** `aws/deploy.sh` - Otomatik deployment scripti
- **Dosya:** `aws/README.md` - Backend dokümantasyonu
- **Dosya:** `AWS_DEPLOY_GUIDE.md` - Detaylı deployment rehberi

## API Endpoint Listesi

### Ürünler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/products` | Tüm ürünler |
| GET | `/products/{id}` | Tek ürün |
| POST | `/products` | Ürün ekle (Admin) |
| PUT | `/products/{id}` | Ürün güncelle (Admin) |
| DELETE | `/products/{id}` | Ürün sil (Admin) |

### Siparişler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/orders` | Siparişleri listele |
| GET | `/orders/{id}` | Sipariş detayı |
| POST | `/orders` | Sipariş oluştur |
| PUT | `/orders/{id}/status` | Durum güncelle (Admin) |

### Kullanıcılar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/users` | Tüm kullanıcılar (Admin) |
| GET | `/users/{id}` | Kullanıcı detayı |
| POST | `/users` | Kullanıcı oluştur |
| PUT | `/users/{id}` | Kullanıcı güncelle |

### Kimlik Doğrulama
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/login` | Giriş yap |
| POST | `/auth/register` | Kayıt ol |
| POST | `/auth/google` | Google ile giriş |
| POST | `/auth/facebook` | Facebook ile giriş |
| POST | `/auth/verify` | E-posta doğrulama kodunu onayla |
| POST | `/auth/resend-code` | Doğrulama kodunu tekrar gönder |
| GET | `/auth/me` | Mevcut kullanıcı bilgilerini getir |

### Kategoriler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/categories` | Tüm kategoriler |
| GET | `/categories/{slug}` | Kategori detayı |
| POST | `/categories` | Kategori ekle (Admin) |

### Yorumlar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/reviews?productId={id}` | Ürün yorumları |
| POST | `/reviews` | Yorum ekle |
| POST | `/reviews/{id}/helpful` | Faydalı işaretle |

## DynamoDB Tablo Yapısı

### Products Table
```javascript
{
  id: String (PK),
  name: String,
  description: String,
  price: Number,
  stock: Number,
  category: String (GSI),
  images: Array,
  rating: Number,
  reviewCount: Number,
  createdAt: String,
  updatedAt: String
}
```

### Orders Table
```javascript
{
  id: String (PK),
  userId: String (GSI),
  items: Array,
  total: Number,
  status: String,
  paymentStatus: String,
  shippingAddress: Object,
  createdAt: String,
  updatedAt: String
}
```

### Users Table
```javascript
{
  id: String (PK),
  email: String (GSI),
  name: String,
  password: String,
  role: String,
  addresses: Array,
  createdAt: String,
  updatedAt: String
}
```

## Deployment Adımları

### 1. Gereksinimleri Yükleyin
```bash
# AWS CLI
brew install awscli  # macOS

# SAM CLI
brew tap aws/tap
brew install aws-sam-cli
```

### 2. AWS CLI Yapılandırın
```bash
aws configure
# Access Key ID: [your-key]
# Secret Access Key: [your-secret]
# Region: eu-west-1
```

### 3. Backend Deploy Edin
```bash
cd /mnt/okcomputer/output/app/aws
chmod +x deploy.sh
./deploy.sh
```

### 4. API URL'yi Kaydedin
```bash
API_URL=$(aws cloudformation describe-stacks \
    --stack-name atushome-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

echo $API_URL
```

### 5. Frontend Environment Ayarlayın
```bash
cd /mnt/okcomputer/output/app
echo "VITE_API_URL=$API_URL" > .env
```

### 6. Frontend Build Alın
```bash
npm install
npm run build
```

### 7. Frontend Deploy Edin (S3)
```bash
aws s3 mb s3://atushome-frontend-$(aws sts get-caller-identity --query Account --output text)
aws s3 sync dist/ s3://atushome-frontend-$(aws sts get-caller-identity --query Account --output text)/ --delete
```

## Önemli Dosyalar

### Backend
- `aws/sam/template.yaml` - SAM şablonu
- `aws/lambda/*.js` - Lambda fonksiyonları
- `aws/deploy.sh` - Deployment scripti

### Frontend
- `src/services/api.ts` - API servis katmanı
- `src/stores/authStore.ts` - Auth store (AWS entegre)
- `src/hooks/useApi.ts` - API hooks

### Dokümantasyon
- `aws/README.md` - Backend dokümantasyonu
- `AWS_DEPLOY_GUIDE.md` - Detaylı deployment rehberi
- `.env.example` - Environment değişkenleri örneği

## Maliyet Tahmini (Aylık)

| Hizmet | Free Tier | Tahmini Kullanım | Maliyet |
|--------|-----------|------------------|---------|
| Lambda | 1M istek | 500K istek | $0 |
| API Gateway | 1M istek | 500K istek | $0 |
| DynamoDB | 25GB | 1GB | $0 |
| S3 | 5GB | 100MB | $0 |
| **Toplam** | - | - | **$0** |

> Not: Free Tier limitleri aşıldığında maliyetler oluşur.

## Test Kullanıcıları

### Admin
- Email: `admin@atushome.com`
- Şifre: `password`

### Test Kullanıcısı
- Email: `test@example.com`
- Şifre: `password123`

## Sonraki Adımlar

1. **SSL Sertifikası:** ACM ile SSL sertifikası oluşturun
2. **Özel Domain:** Route 53 ile özel domain yapılandırın
3. **CDN:** CloudFront ile CDN kurulumu yapın
4. **Monitoring:** CloudWatch ile detaylı monitoring
5. **Backup:** DynamoDB backup politikası oluşturun

## Sorun Giderme

### Deployment Hatası
```bash
# CloudFormation hatalarını görüntüle
aws cloudformation describe-stack-events \
    --stack-name atushome-backend
```

### Lambda Logları
```bash
# Lambda loglarını görüntüle
aws logs tail /aws/lambda/atushome-backend-GetProductsFunction --follow
```

### API Test
```bash
# API'yi test et
curl https://your-api-url.execute-api.region.amazonaws.com/prod/categories
```

## Destek

Daha fazla bilgi için:
- AWS Dokümantasyonu: https://docs.aws.amazon.com/
- SAM CLI: https://docs.aws.amazon.com/serverless-application-model/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/
