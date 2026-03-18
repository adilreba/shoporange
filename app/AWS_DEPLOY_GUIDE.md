# AtusHome AWS Deployment Rehberi

Bu rehber, AtusHome e-ticaret platformunun AWS üzerine nasıl deploy edileceğini adım adım açıklar.

## İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [AWS Hesap Kurulumu](#aws-hesap-kurulumu)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Veritabanı Seed](#veritabanı-seed)
6. [Domain ve SSL](#domain-ve-ssl)
7. [Sorun Giderme](#sorun-giderme)

---

## Ön Gereksinimler

### Gerekli Araçlar

```bash
# AWS CLI'yı yükleyin
# macOS
brew install awscli

# Windows
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# SAM CLI'yı yükleyin
# macOS
brew tap aws/tap
brew install aws-sam-cli

# Diğer işletim sistemleri
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
```

### Versiyon Kontrolü

```bash
aws --version
# aws-cli/2.x.x

sam --version
# SAM CLI, version 1.x.x
```

---

## AWS Hesap Kurulumu

### 1. AWS Hesabı Oluşturun

- [AWS Console](https://aws.amazon.com/console/)'a gidin
- "Create a new AWS account" seçeneğini tıklayın
- Email, şifre ve hesap adı belirleyin
- Ödeme bilgilerini ekleyin (Free Tier için ücret alınmaz)
- Telefon doğrulamasını tamamlayın
- Destek planını seçin (Basic ücretsizdir)

### 2. IAM Kullanıcısı Oluşturun

```bash
# AWS Console'dan IAM servisine gidin
# Users > Add user

# Kullanıcı adı: atushome-deploy
# Access type: Programmatic access
# Permissions: AdministratorAccess (veya daha kısıtlı bir policy)
```

### 3. AWS CLI Yapılandırma

```bash
aws configure

# AWS Access Key ID: [IAM kullanıcınızın Access Key ID]
# AWS Secret Access Key: [IAM kullanıcınızın Secret Access Key]
# Default region name: eu-west-1 (veya tercih ettiğiniz bölge)
# Default output format: json
```

### 4. Doğrulama

```bash
aws sts get-caller-identity

# Beklenen çıktı:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/atushome-deploy"
# }
```

---

## Backend Deployment

### 1. Proje Dizinine Git

```bash
ccd /mnt/okcomputer/output/app/aws
```

### 2. Deployment Script'ini Çalıştırın

```bash
# Script'e çalıştırma izni ver
chmod +x deploy.sh

# Deploy'u başlat
./deploy.sh
```

### 3. Manuel Deployment (Alternatif)

```bash
cd sam

# SAM build
sam build

# SAM deploy (ilk seferde guided mod)
sam deploy --guided

# Parametreler:
# Stack Name [sam-app]: atushome-backend
# AWS Region [us-east-1]: eu-west-1
# Confirm changes before deploy [y/N]: y
# Allow SAM CLI IAM role creation [Y/n]: Y
# Disable rollback [y/N]: N
# Save arguments to configuration file [Y/n]: Y
# SAM configuration file [samconfig.toml]: Enter
# SAM configuration environment [default]: Enter
```

### 4. Deployment Doğrulama

```bash
# Stack durumunu kontrol et
aws cloudformation describe-stacks \
    --stack-name atushome-backend \
    --query 'Stacks[0].StackStatus'

# Beklenen: CREATE_COMPLETE veya UPDATE_COMPLETE

# API URL'sini al
aws cloudformation describe-stacks \
    --stack-name atushome-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text
```

### 5. API Test

```bash
# API URL'nizi kaydedin
API_URL=$(aws cloudformation describe-stacks \
    --stack-name atushome-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

echo "API URL: $API_URL"

# Kategorileri test et
curl -s $API_URL/categories | head -100

# Ürünleri test et
curl -s $API_URL/products | head -100
```

---

## Veritabanı Seed

### 1. Seed Fonksiyonunu Çalıştır

```bash
# Seed fonksiyon adını al
SEED_FUNCTION=$(aws lambda list-functions \
    --query 'Functions[?contains(FunctionName, `SeedData`)].FunctionName' \
    --output text)

# Seed fonksiyonunu çalıştır
aws lambda invoke \
    --function-name "$SEED_FUNCTION" \
    --payload '{}' \
    seed_response.json

# Sonucu görüntüle
cat seed_response.json
```

### 2. Verileri Doğrula

```bash
# DynamoDB tablolarını kontrol et
aws dynamodb scan \
    --table-name AtusHome-Categories \
    --query 'Count'

aws dynamodb scan \
    --table-name AtusHome-Products \
    --query 'Count'

aws dynamodb scan \
    --table-name AtusHome-Users \
    --query 'Count'
```

---

## Frontend Deployment

### 1. Environment Değişkenlerini Ayarla

```bash
cd /mnt/okcomputer/output/app

# .env dosyasını oluştur
cat > .env << EOF
VITE_API_URL=$API_URL
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
EOF
```

### 2. Build Al

```bash
# Bağımlılıkları yükle
npm install

# Production build
npm run build
```

### 3. S3 Static Hosting (Önerilen)

```bash
# S3 bucket oluştur
aws s3 mb s3://atushome-frontend-$(aws sts get-caller-identity --query Account --output text)

# Static website hosting etkinleştir
aws s3 website s3://atushome-frontend-$(aws sts get-caller-identity --query Account --output text) \
    --index-document index.html \
    --error-document index.html

# Bucket policy ekle
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::atushome-frontend-$(aws sts get-caller-identity --query Account --output text)/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket atushome-frontend-$(aws sts get-caller-identity --query Account --output text) \
    --policy file://bucket-policy.json

# Build dosyalarını yükle
aws s3 sync dist/ s3://atushome-frontend-$(aws sts get-caller-identity --query Account --output text)/ \
    --delete

# Website URL
echo "Website URL: http://atushome-frontend-$(aws sts get-caller-identity --query Account --output text).s3-website-$(aws configure get region).amazonaws.com"
```

### 4. CloudFront CDN (İsteğe Bağlı)

Daha iyi performans için CloudFront CDN kurulumu önerilir:

```bash
# CloudFront dağıtımı oluştur
aws cloudfront create-distribution \
    --origin-domain-name atushome-frontend-$(aws sts get-caller-identity --query Account --output text).s3.amazonaws.com \
    --default-root-object index.html
```

---

## Domain ve SSL

### Route 53 ile Özel Domain

```bash
# Hosted zone oluştur
aws route53 create-hosted-zone \
    --name atushome.com \
    --caller-reference $(date +%s)

# ACM sertifikası oluştur
aws acm request-certificate \
    --domain-name atushome.com \
    --subject-alternative-names www.atushome.com \
    --validation-method DNS
```

### API Gateway Özel Domain

```bash
# Özel domain oluştur
aws apigateway create-domain-name \
    --domain-name api.atushome.com \
    --certificate-arn [ACM_CERTIFICATE_ARN]

# Base path mapping
aws apigateway create-base-path-mapping \
    --domain-name api.atushome.com \
    --rest-api-id [API_ID] \
    --stage prod
```

---

## Maliyet Optimizasyonu

### AWS Free Tier Kapsamı

| Hizmet | Free Tier Limit | Aylık Maliyet (Aşım) |
|--------|-----------------|---------------------|
| Lambda | 1M istek/ay | $0.20/milyon istek |
| API Gateway | 1M istek/ay | $3.50/milyon istek |
| DynamoDB | 25GB depolama | $1.25/GB/ay |
| S3 | 5GB depolama | $0.023/GB/ay |
| CloudFront | 50GB transfer | $0.085/GB |

### Maliyet Alarmı

```bash
# Bütçe alarmı oluştur
aws budgets create-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget file://budget.json \
    --notifications-with-subscribers file://notifications.json
```

---

## Sorun Giderme

### Deployment Hataları

```bash
# CloudFormation stack hatalarını görüntüle
aws cloudformation describe-stack-events \
    --stack-name atushome-backend \
    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]'

# Lambda loglarını görüntüle
aws logs tail /aws/lambda/atushome-backend --follow
```

### CORS Hataları

```bash
# API Gateway CORS ayarlarını kontrol et
aws apigateway get-rest-apis

# OPTIONS metodu ekle (manuel olarak veya SAM template güncelle)
```

### Lambda Timeout

```bash
# Lambda timeout değerini artır
aws lambda update-function-configuration \
    --function-name atushome-backend-GetProductsFunction \
    --timeout 30
```

### DynamoDB Throttling

```bash
# Tablo kapasitesini kontrol et
aws dynamodb describe-table \
    --table-name AtusHome-Products \
    --query 'Table.ProvisionedThroughput'

# On-demand moda geç (maliyetli olabilir)
aws dynamodb update-table \
    --table-name AtusHome-Products \
    --billing-mode PAY_PER_REQUEST
```

---

## Güvenlik Kontrol Listesi

- [ ] JWT secret'ı güçlü bir değerle değiştir
- [ ] CORS origin'leri kısıtla (production'da '* yerine domain)
- [ ] API Gateway throttling ayarla
- [ ] Lambda concurrency limit ayarla
- [ ] DynamoDB encryption at rest etkinleştir
- [ ] CloudWatch Logs retention period ayarla
- [ ] AWS WAF kur (DDoS koruması)

---

## Yararlı Komutlar

```bash
# Tüm Lambda fonksiyonlarını listele
aws lambda list-functions --query 'Functions[*].FunctionName'

# Tüm DynamoDB tablolarını listele
aws dynamodb list-tables

# API Gateway endpointlerini listele
aws apigateway get-rest-apis

# CloudWatch metriklerini görüntüle
aws cloudwatch list-metrics --namespace AWS/Lambda

# Maliyetleri görüntüle
aws ce get-cost-and-usage \
    --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost
```

---

## Destek

Sorularınız veya sorunlarınız için:

- AWS Dokümantasyonu: https://docs.aws.amazon.com/
- SAM CLI Dokümantasyonu: https://docs.aws.amazon.com/serverless-application-model/
- AWS Free Tier: https://aws.amazon.com/free/

---

**Not:** Bu rehber, AWS Free Tier kapsamında çalışacak şekilde hazırlanmıştır. Yüksek trafikli bir üretim ortamında ek yapılandırmalar gerekebilir.
