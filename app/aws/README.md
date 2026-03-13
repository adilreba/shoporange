# ShopOrange AWS Backend

Bu dizin, ShopOrange e-ticaret platformunun AWS Serverless altyapısını içerir.

## Mimari

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend      │────▶│ API Gateway  │────▶│  Lambda         │
│  (React/Vite)   │     │   (REST)     │     │  Functions      │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                      │
                              ┌───────────────────────┼───────────┐
                              │                       │           │
                              ▼                       ▼           ▼
                        ┌──────────┐          ┌──────────┐  ┌──────────┐
                        │ Products │          │  Orders  │  │  Users   │
                        │  Table   │          │  Table   │  │  Table   │
                        └──────────┘          └──────────┘  └──────────┘
                              │
                              ▼
                        ┌──────────┐          ┌──────────┐
                        │ Reviews  │          │Categories│
                        │  Table   │          │  Table   │
                        └──────────┘          └──────────┘
```

## Bileşenler

### DynamoDB Tabloları

| Tablo | Amaç | İndeksler |
|-------|------|-----------|
| `ShopOrange-Products` | Ürün verileri | CategoryIndex |
| `ShopOrange-Orders` | Sipariş verileri | UserIndex |
| `ShopOrange-Users` | Kullanıcı verileri | EmailIndex |
| `ShopOrange-Reviews` | Yorum verileri | ProductIndex, UserIndex |
| `ShopOrange-Categories` | Kategori verileri | SlugIndex |

### Lambda Fonksiyonları

| Fonksiyon | HTTP | Açıklama |
|-----------|------|----------|
| `GetProducts` | GET /products | Tüm ürünleri listele |
| `GetProduct` | GET /products/{id} | Tek ürün getir |
| `CreateProduct` | POST /products | Ürün ekle (Admin) |
| `UpdateProduct` | PUT /products/{id} | Ürün güncelle (Admin) |
| `DeleteProduct` | DELETE /products/{id} | Ürün sil (Admin) |
| `GetOrders` | GET /orders | Siparişleri listele |
| `CreateOrder` | POST /orders | Sipariş oluştur |
| `GetOrder` | GET /orders/{id} | Sipariş detayı |
| `UpdateOrderStatus` | PUT /orders/{id}/status | Sipariş durumu güncelle |
| `Login` | POST /auth/login | Giriş yap |
| `Register` | POST /auth/register | Kayıt ol |
| `GoogleLogin` | POST /auth/google | Google ile giriş |
| `FacebookLogin` | POST /auth/facebook | Facebook ile giriş |
| `GetCategories` | GET /categories | Kategorileri listele |
| `GetReviewsByProduct` | GET /reviews | Ürün yorumları |
| `CreateReview` | POST /reviews | Yorum ekle |

## Gereksinimler

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- AWS hesabı ve yapılandırılmış kimlik bilgileri

## Kurulum

### 1. AWS CLI Yapılandırma

```bash
aws configure
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json
```

### 2. Otomatik Deployment

```bash
cd aws
chmod +x deploy.sh
./deploy.sh
```

### 3. Manuel Deployment

```bash
cd aws/sam

# Build
sam build

# Deploy
sam deploy --guided
```

## API Test

Deployment tamamlandıktan sonra API'yi test edin:

```bash
# API URL'nizi alın
API_URL=$(aws cloudformation describe-stacks \
    --stack-name shoporange-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

# Kategorileri listele
curl $API_URL/categories

# Ürünleri listele
curl $API_URL/products

# Yeni kullanıcı kaydı
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Giriş yap
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shoporange.com","password":"password"}'
```

## Frontend Entegrasyonu

Deployment tamamlandıktan sonra, API URL'nizi frontend `.env` dosyanıza ekleyin:

```bash
# .env
VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

## Maliyet Optimizasyonu

Bu mimari AWS Free Tier kapsamında büyük ölçüde ücretsizdir:

| Hizmet | Free Tier | Aylık Maliyet (Tahmini) |
|--------|-----------|------------------------|
| Lambda | 1M istek/ay | $0.20 (1M istek) |
| API Gateway | 1M istek/ay | $3.50 (1M istek) |
| DynamoDB | 25GB depolama | $0 (25GB'a kadar) |

## Güvenlik

- JWT token bazlı kimlik doğrulama
- CORS yapılandırması
- IAM rolleri ile minimum yetki prensibi
- Şifreler SHA-256 ile hash'lenir (production'da bcrypt önerilir)

## Monitoring

```bash
# CloudWatch Logs görüntüle
aws logs tail /aws/lambda/shoporange-backend-GetProductsFunction --follow

# API Gateway metrikleri
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApiGateway \
    --metric-name Count \
    --dimensions Name=ApiName,Value=shoporange-backend \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-31T23:59:59Z \
    --period 86400 \
    --statistics Sum
```

## Temizlik

Kaynakları silmek için:

```bash
aws cloudformation delete-stack --stack-name shoporange-backend
```

## Sorun Giderme

### S3 Bucket Zaten Var

```bash
# Mevcut bucket'ı kullanın veya silin
aws s3 rb s3://shoporange-deployment-[account-id] --force
```

### Lambda Deploy Hatası

```bash
# SAM build temizle
sam build --use-container --skip-pull-image
```

### CORS Hatası

API Gateway CORS ayarlarını kontrol edin:
```bash
aws apigateway get-rest-apis --query 'items[?name==`shoporange-backend`]'
```

## Destek

Sorularınız için: [GitHub Issues](https://github.com/your-repo/shoporange/issues)
