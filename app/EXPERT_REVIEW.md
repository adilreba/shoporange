# AtusHome - Uzman Teknik Dokümantasyonu

> Bu doküman, projenin mimarisi, güvenlik yapısı, deployment süreçleri ve bilinen teknik borçlarını kapsayan kapsamlı bir teknik referanstır.

---

## 1. Proje Özeti

**AtusHome**, turuncu temalı, tam donanımlı bir e-ticaret platformudur. Frontend React + Vite ile, backend AWS Serverless (SAM + Lambda + DynamoDB) ile geliştirilmiştir.

| Özellik | Detay |
|---------|-------|
| **Tür** | B2C E-Ticaret (Mobilya / Ev & Yaşam odaklı) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | AWS Lambda (Node.js 20), API Gateway, DynamoDB |
| **Auth** | Cognito + Custom JWT + Google OAuth 2.0 |
| **Ödeme** | Stripe (placeholder), İyzico (3D Secure entegre) |
| **Deploy** | Vercel (frontend), AWS SAM (backend) |
| **Region** | `eu-west-1` (Ireland) |

---

## 2. Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                        │
│  React 19 + Vite + Tailwind + Zustand + React Router           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   AuthStore  │  │  CartStore   │  │   Product Stores     │  │
│  │  (Cognito)   │  │  (Server)    │  │  (Mock / API)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (AWS)                          │
│                    REST API + WebSocket                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│   Lambda     │    │   Lambda     │    │       Lambda         │
│   Auth       │    │   Products   │    │       Orders         │
└──────────────┘    └──────────────┘    └──────────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DYNAMODB (Multi-Table)                       │
│  Products | Orders | Users | Cart | Chat | Stock | Audit | ... │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS SERVICES                                 │
│  Cognito (Auth) | SES (Email) | SNS (SMS) | KMS (Encryption)   │
│  S3 (Images) | CloudWatch (Logs) | Stripe/İyzico (Payment)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Teknoloji Stack'i

### Frontend Dependencies
| Kategori | Paket | Versiyon |
|----------|-------|----------|
| Core | `react`, `react-dom`, `react-router-dom` | ^19.2.0 |
| Build | `vite`, `@vitejs/plugin-react` | ^7.3.2 |
| Styling | `tailwindcss`, `tailwind-merge`, `clsx` | ^3.4.0 |
| UI Kit | `@radix-ui/*` (25+ component) | ^1.x |
| Icons | `lucide-react` | ^0.562 |
| State | `zustand` + `persist` middleware | ^5.0.11 |
| Data | `@tanstack/react-query` | ^5.90.21 |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` | ^7.70 / ^4.3 |
| Charts | `recharts` | ^2.15.4 |
| Toast | `sonner` | ^2.0.7 |
| Carousel | `embla-carousel-react` | ^8.6.0 |
| AWS SDK (FE) | `amazon-cognito-identity-js` | ^6.3.16 |
| Payment | `@stripe/react-stripe-js`, `iyzipay` | ^5.6 / ^2.0 |

### Backend Dependencies
| Kategori | Paket | Versiyon |
|----------|-------|----------|
| Runtime | Node.js | 20.x |
| AWS SDK | `@aws-sdk/client-*`, `@aws-sdk/lib-dynamodb` | ^3.1019 |
| Framework | AWS SAM | CloudFormation |

---

## 4. Frontend Mimarisi

### 4.1 Dizin Yapısı
```
src/
├── App.tsx              # Root router + Suspense lazy loading
├── main.tsx             # Entry point
├── types/               # TypeScript type definitions (RBAC, Cart, Order, ...)
├── stores/              # Zustand stores (auth, cart, orders, wishlist, ...)
│   ├── authStore.ts     # Cognito + Mock auth, persist middleware
│   ├── cartStore.ts     # Server sync + localStorage backup
│   └── ...
├── services/            # API clients
│   ├── api.ts           # fetch wrapper, token refresh, mock mode
│   └── googleAuth.ts    # Google OAuth helper
├── components/
│   ├── ui/              # shadcn/ui components (40+)
│   ├── product/         # ProductCard, ProductGrid, filters
│   ├── admin/           # AdminLayout, dashboards, tables
│   └── common/          # Header, Footer, LazyImage, CookieBanner
├── sections/            # Page sections (Hero, FeaturedProducts, ...)
├── pages/               # Route pages
│   ├── Home.tsx
│   ├── ProductDetail.tsx
│   ├── Admin/           # 15+ admin pages
│   └── legal/           # KVKK, Privacy, Terms
├── hooks/               # Custom hooks
├── data/                # Mock data, mock users
└── utils/               # Security helpers, validators
```

### 4.2 State Management (Zustand)
| Store | localStorage Persist | Server Sync | Açıklama |
|-------|---------------------|-------------|----------|
| `authStore` | ✅ Evet | Cognito API | JWT token + refresh + Google OAuth |
| `cartStore` | ✅ Evet | ✅ POST /cart | Stok kontrollü sepet yönetimi |
| `wishlistStore` | ✅ Evet | - | Favoriler |
| `compareStore` | ✅ Evet | - | Karşılaştırma (max 4) |
| `orderStore` | 🔄 Hayır (sunucu kaynağı) | ✅ GET /orders | Sipariş geçmişi (her açılışta API'den çekilir) |
| `stockStore` | 🔄 Hayır (gerçek zamanlı) | ✅ WebSocket | Stok verisi anlık değişir, localStorage'a yazılmaz |
| `themeStore` | ✅ Evet | - | Dark/light mode |

> **Not:** `orderStore` ve `stockStore` localStorage'a **bilerek** kaydedilmiyor. Sipariş verisi sunucu kaynağıdır, stok ise anlık değişir. Bu bir hata değil, bilinçli tasarım kararıdır.

### 4.3 Code Splitting (Vite)
Ana chunk **1,723 KB'den 539 KB'ye** düşürüldü:
- `manualChunks` ile 8 vendor chunk'ı (React, Radix, UI, Charts, Forms, State, Payment, Utils)
- **Lazy loading**: Admin paneli (15+ sayfa) + kullanıcı sayfaları (Cart, Checkout, Profile, Orders, ...)
- `Suspense` ile loading spinner fallback

---

## 5. Backend Mimarisi

### 5.1 Lambda Handler'ları
```
backend/src/handlers/
├── auth/              # Cognito integration, register, login, verify
├── products/          # CRUD + pagination + cursor-based
├── orders/            # Atomic transactions + price validation
├── stock/             # Reservation + return with ConditionExpression
├── cart/              # Cart CRUD
├── users/             # User management (admin)
├── categories/        # Category tree + attributes
├── payments/          # Stripe webhook + İyzico 3D Secure
├── shipping/          # Yurtiçi Kargo integration
├── chat/              # WebSocket live chat
├── invoicing/         # Paraşüt e-fatura integration
├── admin/             # Admin dashboard stats
├── verification/      # Email/SMS verification codes
├── legal-pages/       # CMS legal pages
└── notifications/     # SES email + SNS SMS
```

### 5.2 API Gateway Yapılandırması
- **REST API**: `/prod/{resource}`
- **Throttling**: BurstLimit 100, RateLimit 50
- **CORS**: `CORS_ORIGIN` env var'dan okunur (wildcard yok)
- **WebSocket**: `/prod/ws` (live chat)

---

## 6. Veritabanı Şeması (DynamoDB)

| Tablo | PK | GSI | Kullanım |
|-------|-----|-----|----------|
| `Products` | `id` (S) | `category` (CategoryIndex) | Ürünler |
| `Categories` | `id` (S) | - | Kategori ağacı |
| `CategoryAttributes` | `categoryId` + `attributeId` | `attributeId` | Dinamik özellikler |
| `ProductVariations` | `productId` + `variationId` | `sku` | SKU varyasyonları |
| `Orders` | `id` (S) | `userId` (UserIndex) | Siparişler |
| `Users` | `id` (S) | `email` (EmailIndex) | Kullanıcılar |
| `Cart` | `userId` (S) | - | Sepetler |
| `StockReservations` | `reservationId` (S) | `status` + `expiresAt` | Stok rezervasyonu |
| `Verification` | `id` (S) | `email` + `type` | Doğrulama kodları |
| `ChatConnections` | `connectionId` (S) | - | WebSocket bağlantıları |
| `ChatSessions` | `sessionId` (S) | `userId` | Chat oturumları |
| `ChatMessages` | `sessionId` + `timestamp` | - | Chat mesajları |
| `AuditLogs` | `id` (S) | `userId` + `timestamp` | Denetim kayıtları |
| `Shipping` | `id` (S) | `orderId` | Kargo entegrasyonu |

### 6.1 Önemli Dizayn Kararları
- **PAY_PER_REQUEST** billing (maliyet optimizasyonu)
- **KMS PII Encryption**: Kişisel veriler şifrelenmiş saklanır
- **Soft Delete**: `isActive`, `deletedAt`, `deletedBy` alanları

---

## 7. API Endpoint'leri

### 7.1 Public Endpoints
| Method | Endpoint | Handler | Açıklama |
|--------|----------|---------|----------|
| GET | `/products` | `getProducts` | Cursor-based pagination |
| GET | `/products/{id}` | `getProduct` | Tek ürün |
| GET | `/categories` | `getCategories` | Tüm kategoriler |
| POST | `/auth/login` | `login` | JWT + refresh token |
| POST | `/auth/register` | `register` | Email verification |
| POST | `/auth/verify` | `verifyEmail` | 6 haneli kod |
| POST | `/auth/google` | `googleAuth` | Google OAuth callback |
| POST | `/auth/resend-code` | `resendCode` | Kod tekrar gönder |
| GET | `/legal-pages` | `getLegalPages` | CMS sayfaları |

### 7.2 Protected Endpoints (JWT required)
| Method | Endpoint | Yetki |
|--------|----------|-------|
| POST | `/orders` | `user` |
| GET | `/orders` | `user` |
| GET | `/cart` | `user` |
| PUT | `/cart` | `user` |
| GET | `/users/me` | `user` |

### 7.3 Admin Endpoints (RBAC)
| Method | Endpoint | Gerekli Yetki |
|--------|----------|---------------|
| POST | `/products` | `products:create` |
| PUT | `/products/{id}` | `products:edit` |
| DELETE | `/products/{id}` | `products:delete` |
| GET | `/users` | `users:view` |
| PUT | `/orders/{id}/status` | `orders:edit` |
| GET | `/audit-logs` | `audit:view` (SADECE super_admin) |

---

## 8. Auth & Güvenlik Mimarisi

### 8.1 Authentication Flow
```
1. Kullanıcı Login/Register
   ↓
2. Cognito (veya Mock mode'da local bcrypt)
   ↓
3. JWT (idToken + accessToken + refreshToken)
   ↓
4. localStorage persist (Zustand persist middleware)
   ↓
5. Her API çağrısında `Authorization: Bearer <idToken>`
   ↓
6. Backend: `requireAuth()` → JWT verify → `AuthUser`
```

### 8.2 RBAC (Role-Based Access Control)
```
super_admin: Tüm yetkiler (+ audit:view)
admin:       users, products, orders, payments, content, settings, chat, reports
editor:      products:view/edit, content:view/edit, orders:view
support:     users:view, orders:view/edit, chat:view/respond
user:        Hiçbir admin yetkisi
```

### 8.3 Güvenlik Katmanları
| Katman | Implementasyon | Dosya |
|--------|---------------|-------|
| CORS | `CORS_ORIGIN` env var, wildcard yok | `backend/src/utils/security.ts` |
| Rate Limiting | API Gateway throttling (100 burst / 50 rate) | `backend/template.yaml` |
| Input Validation | `zod` schema validation (frontend + backend) | `src/utils/security.ts` |
| PII Encryption | AWS KMS ile şifreleme | `backend/src/utils/encryption.ts` |
| Audit Logging | Tüm admin işlemleri loglanır | `backend/src/utils/auditLogger.ts` |
| Token Refresh | Otomatik refresh 5 dakika önce | `src/services/api.ts` |
| Client Rate Limit | Brute force koruması (login/register) | `src/utils/security.ts` |

---

## 9. Ödeme Sistemi

### 9.1 Mevcut Durum
| Sağlayıcı | Durum | Not |
|-----------|-------|-----|
| **Stripe** | Placeholder | `sk_test_placeholder`, frontend'te commented out |
| **İyzico** | Entegre | 3D Secure callback route var ama tax certificate bekleniyor |

### 9.2 Ödeme Akışı (İyzico)
```
1. Checkout sayfası → /payments/create
2. Backend: İyzico token oluştur
3. Frontend: 3D Secure iframe/popup
4. Callback: /payments/callback
5. Backend: Payment status kontrolü
6. Başarılı ise: Order oluştur + stok düş
```

### 9.3 Bilinen Sorun
- **Tax certificate** eksikliği nedeniyle İyzico canlıya alınamadı
- Stripe test modunda çalışabilir ama frontend'de disabled

---

## 10. Deployment & CI/CD

### 10.1 Frontend (Vercel)
```bash
# Build
npm run build  # tsc -b && vite build

# Deploy
vercel --prod
```
- **Output**: `dist/` (Vite default)
- **Framework**: Vite (Vercel auto-detect)
- **Node**: 24.x

### 10.2 Backend (AWS SAM)
```bash
cd backend
sam build
sam deploy --guided
```
- **Region**: `eu-west-1`
- **Stack**: CloudFormation stack
- **Dependencies**: Lambda Layer (`backend/layer/`)

### 10.3 Environment Variables
| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `VITE_API_URL` | Backend API URL | `https://xxx.execute-api.eu-west-1.amazonaws.com/prod` |
| `VITE_AWS_REGION` | AWS Region | `eu-west-1` |
| `VITE_FORCE_MOCK_MODE` | Mock mode zorla | `true` (SADECE dev) |
| `CORS_ORIGIN` | CORS origin | `https://atushome.vercel.app` |
| `NODE_ENV` | Ortam | `production` / `development` |

---

## 11. Son Yapılan Kritik Fix'ler (2025-04)

### 11.1 Güvenlik (6 Fix)
| Kod | Sorun | Fix | Dosya |
|-----|-------|-----|-------|
| K1 | Mock mode boş API URL'de otomatik aktif oluyordu | Artık `console.error` + `false` dönüyor | `src/services/api.ts` |
| K3 | `x-mock-user-id` header'ı production'da çalışıyordu | Sadece `NODE_ENV=development` veya `AWS_SAM_LOCAL=true` | `backend/src/utils/authorization.ts` |
| K4 | Rate limiting yoktu | API Gateway throttling eklendi | `backend/template.yaml` |
| K5 | Admin şifreleri plaintext'ti | bcrypt hash'e çevrildi | `src/data/mockUsers.ts` |
| K6 | CORS wildcard `*` | `CORS_ORIGIN` env var kullanılıyor | `backend/src/utils/security.ts` |
| D2 | Dev plugin production build'e giriyordu | Sadece `NODE_ENV=development` | `vite.config.ts` |

### 11.2 Stok & Sipariş (5 Fix)
| Kod | Sorun | Fix | Dosya |
|-----|-------|-----|-------|
| S1 | `getReservedStock()` her zaman `0` dönüyordu | DynamoDB `STOCK_RESERVATIONS_TABLE` sorgusu | `backend/src/handlers/stock/index.ts` |
| S2 | Order oluşturma atomik değildi | `TransactWriteCommand` (order + stock düş) | `backend/src/handlers/orders/index.ts` |
| B2 | Negatif stok mümkündü | `ConditionExpression: stock >= :quantity` | `backend/src/handlers/orders/index.ts` |
| S4 | Stok iadesi limitsizdi | `ConditionExpression: stock >= :zero` | `backend/src/handlers/stock/index.ts` |
| S5 | Fiyat değişiminde sipariş oluşuyordu | ±0.01 toleranslı fiyat validasyonu | `backend/src/handlers/orders/index.ts` |

### 11.3 Backend & DB (2 Fix)
| Kod | Sorun | Fix |
|-----|-------|-----|
| B1 | Pagination yoktu | Cursor-based `lastKey` + `hasMore` eklendi |
| D1 | Region tutarsızlığı | `.env.example` + `samconfig.toml` → `eu-west-1` |

### 11.4 Frontend (2 Fix)
| Kod | Sorun | Fix |
|-----|-------|-----|
| F1 | Cart sync hardcoded stock (100) | `item.stock ?? 0` kullanılıyor |
| F2 | Auth API hata verince mock'a düşüyordu | `mockVerifyToken` fallback kaldırıldı |

---

## 12. Bilinen Sorunlar & Teknik Borçlar

### 12.1 Kritik (Çözülmesi Gerekli)
| # | Sorun | Etki | Öneri |
|---|-------|------|-------|
| 1 | **Payment system inaktif** | Satış yapılamıyor | Tax certificate alındığında İyzico aktive edilmeli |
| 2 | **Chunk size** | 539 KB ana chunk hâlâ büyük | `recharts` admin dashboard'a lazy import edilmeli |
| 3 | **AWS SDK frontend'de** | `aws-sdk` ve `@aws-sdk/*` package.json'da ama FE'de kullanılmıyor | Dependencies temizliği yapılmalı |
| 4 | **authStore mock mode** | `authStore.ts`'teki `isMockMode()` `api.ts`'ten farklı davranıyor | Tek bir kaynakta birleştirilmeli |

### 12.2 Orta Öncelik
| # | Sorun | Açıklama |
|---|-------|----------|
| 5 | **No test coverage** | Sadece `authStore.test.ts` var, diğer store/handler test edilmiyor |
| 6 | **TypeScript `any` kullanımı** | Özellikle `backend/src/handlers/orders/index.ts`'te `any[]` kullanımı var |
| 7 | **WebSocket chat** | Production ölçeklenebilirliği test edilmedi (tek Lambda instance) |
| 8 | **SEO** | React SPA, SSR veya prerendering yok |

### 12.3 Düşük Öncelik
| # | Sorun | Açıklama |
|---|-------|----------|
| 9 | **Mock data production'da** | `src/data/mockUsers.ts` hâlâ bundle'da |
| 10 | **İyzico frontend route** | `/payments/callback` route'u frontend router'da yok |
| 11 | **Image optimization** | Unsplash dışındaki görseller için `srcset` çalışmıyor |

---

## 13. Önerilen İyileştirmeler

### 13.1 Performans
- [ ] `recharts`'ı admin dashboard sayfasına lazy import ederek ana chunk'ı ~300 KB düşür
- [ ] AWS SDK paketlerini `package.json`dan kaldır (`aws-sdk`, `@aws-sdk/*` frontend'te kullanılmıyor)
- [ ] Service Worker + Workbox ile offline caching
- [ ] Image CDN (CloudFront / Cloudinary) entegrasyonu

### 13.2 Güvenlik
- [ ] CSP (Content Security Policy) header'ları ekle
- [ ] `localStorage` yerine `httpOnly` cookie kullan (XSS koruması)
- [ ] `audit:view` yetkisi SADECE `super_admin`'de, doğru çalışıyor mu kontrol et
- [ ] WAF (Web Application Firewall) kuralları ekle

### 13.3 Ölçeklenebilirlik
- [ ] DynamoDB GSI'leri için `Provisioned` mode'a geçiş (maliyet optimizasyonu)
- [ ] Lambda reserved concurrency ayarla
- [ ] CloudFront CDN kur (S3 + SPA routing)
- [ ] RDS Aurora (PostgreSQL) geçişi düşün (complex queries için)

### 13.4 DX (Developer Experience)
- [ ] ESLint strict mode'a geç
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] API client için OpenAPI/Swagger dokümantasyonu
- [ ] Storybook kurulumu (UI component testleri)

---

## 14. Hızlı Başlangıç (Uzman İçin)

```bash
# 1. Clone & Install
git clone https://github.com/adilreba/shoporange.git
cd shoporange
npm install

# 2. Frontend geliştirme
npm run dev

# 3. Production build testi
npm run build

# 4. Backend build (SAM)
cd backend
sam build

# 5. Backend local test
sam local start-api
```

### Test Hesapları (Mock Mode)
| Rol | Email | Şifre |
|-----|-------|-------|
| Super Admin | `superadmin@atushome.com` | `AtusHome2024!` |
| Admin | `admin@atushome.com` | `Admin1234` |
| User | `user@atushome.com` | `User1234` |

> **NOT:** Şifreler `src/data/mockUsers.ts`'te bcrypt hash olarak saklanır.

---

## 15. İletişim & Kaynaklar

| Kaynak | URL |
|--------|-----|
| GitHub Repo | `https://github.com/adilreba/shoporange` |
| Vercel Project | `prj_7ienZ84WfX6T0UM8caH3qBdkAaVf` |
| AWS Region | `eu-west-1` |

---

*Doküman son güncellenme: 2025-04-20*
*Yazar: AI Assistant (Kimi Code CLI)*
*Hedef Kitle: Teknik Uzman / Senior Developer*
