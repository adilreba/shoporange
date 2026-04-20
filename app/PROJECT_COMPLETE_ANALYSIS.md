# AtusHome — Proje Tam Analiz Raporu

> **Tarih:** 2025-04-20  
> **Kapsam:** Frontend (189 dosya) + Backend (31 dosya) = 220 dosya, 62,204 satır kod  
> **Metodoloji:** 4 paralel AI agent + manuel derinlemesine inceleme  
> **Hedef:** Projenin her satırına hakim olmak, Amazon/Trendyol seviyesine çıkarma

---

## İÇİNDEKİLER

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Frontend Yapısı](#2-frontend-yapısı)
3. [Backend Yapısı](#3-backend-yapısı)
4. [Veri Akışı ve Mimari](#4-veri-akışı-ve-mimari)
5. [Dosya-Dosya Analiz](#5-dosya-dosya-analiz)
6. [Tespit Edilen Tüm Sorunlar](#6-tespit-edilen-tüm-sorunlar)
7. [Kod Tekrarları ve Tutarsızlıklar](#7-kod-tekrarları-ve-tutarsızlıklar)
8. [Amazon/Trendyol Seviyesi Eksiklikler](#8-amazontrendyol-seviyesi-eksiklikler)
9. [Yol Haritası](#9-yol-haritası)
10. [Ek: Teknik Detaylar](#10-ek-teknik-detaylar)

---

## 1. PROJE GENEL BAKIŞ

### 1.1 Proje Özeti
AtusHome, turuncu temalı, tam donanımlı bir B2C e-ticaret platformudur. AWS Serverless altyapısı üzerine kuruludur.

| Özellik | Detay |
|---------|-------|
| **Tür** | B2C E-Ticaret (Ev & Yaşam / Mobilya odaklı) |
| **Frontend** | React 19, TypeScript, Vite 7.3, Tailwind CSS 3.4, shadcn/ui |
| **Backend** | AWS Lambda (Node.js 20), API Gateway, DynamoDB |
| **Auth** | Cognito + Custom JWT + Google OAuth 2.0 |
| **Ödeme** | Stripe (placeholder), İyzico (3D Secure — aktif değil) |
| **Deploy** | Vercel (frontend), AWS SAM (backend) |
| **Region** | `eu-west-1` (Ireland) |

### 1.2 Kullanıcı Sayıları ve Roller
| Rol | Email | Şifre |
|-----|-------|-------|
| Super Admin | `superadmin@atushome.com` | `AtusHome2024!` |
| Admin | `admin@atushome.com` | `Admin1234` |
| Test User | `test@example.com` | `User1234` |

### 1.3 Önemli Ortam Değişkenleri
```env
VITE_API_URL=https://xxx.execute-api.eu-west-1.amazonaws.com/prod
VITE_AWS_REGION=eu-west-1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=...
CORS_ORIGIN=https://atushome.vercel.app
```

---

## 2. FRONTEND YAPISI

### 2.1 Dizin Haritası
```
src/
├── App.tsx                     # Root router, lazy loading, Suspense
├── main.tsx                    # Entry point, React 19 createRoot
├── index.css                   # Global styles, Tailwind directives
├── types/index.ts              # TypeScript types (User, Product, Order, Cart, ...)
├── lib/utils.ts                # cn() helper (clsx + tailwind-merge)
│
├── pages/                      # 35+ route page component'i
│   ├── Home.tsx               # Ana sayfa
│   ├── Products.tsx           # Ürün listeleme + filtreleme
│   ├── ProductDetail.tsx      # Ürün detay
│   ├── Cart.tsx               # Sepet
│   ├── Checkout.tsx           # Ödeme
│   ├── Login.tsx              # Giriş
│   ├── Register.tsx           # Kayıt
│   ├── Profile.tsx            # Profil
│   ├── Orders.tsx             # Sipariş geçmişi
│   ├── Wishlist.tsx           # Favoriler
│   ├── Compare.tsx            # Karşılaştırma
│   └── Admin/                 # 17 admin sayfası
│
├── components/
│   ├── ui/                    # 55 shadcn/ui bileşeni
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── ... (50+ daha)
│   ├── product/
│   │   ├── ProductCard.tsx        # 3 varyant (default/compact/horizontal)
│   │   ├── ProductCardSkeleton.tsx
│   │   ├── ProductReviews.tsx
│   │   ├── ProductVariationSelector.tsx
│   │   ├── QuickView.tsx
│   │   ├── RecentlyViewed.tsx
│   │   └── StockAlert.tsx
│   ├── admin/
│   │   └── AdminLayout.tsx        # Admin paneli layout
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   ├── LiveChatWidget.tsx     # Ana chat bileşeni
│   │   ├── ModernChatWidget.tsx
│   │   └── SimpleChatWidget.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── SEO.tsx                # Schema.org JSON-LD, OG, Twitter Card
│   │   ├── LazyImage.tsx          # Intersection Observer + blur-up
│   │   ├── CookieBanner.tsx
│   │   └── ScrollToTop.tsx
│   ├── cart/
│   │   └── CartDrawer.tsx
│   ├── compare/
│   │   └── CompareTable.tsx
│   ├── auth/
│   │   ├── AuthModal.tsx
│   │   └── GoogleLoginButton.tsx
│   ├── payment/
│   │   └── StripePayment.tsx
│   └── search/
│       └── LiveSearch.tsx
│
├── sections/                  # Sayfa bölümleri (anatomik)
│   ├── HeroSection.tsx
│   ├── FeaturedProductsSection.tsx
│   ├── CategoriesSection.tsx
│   ├── TestimonialsSection.tsx
│   ├── NewsletterSection.tsx
│   └── PromoSection.tsx
│
├── stores/                    # 17 Zustand store
│   ├── authStore.ts           # Auth state (JWT, Cognito, Google)
│   ├── cartStore.ts           # Sepet (server sync)
│   ├── orderStore.ts          # Siparişler
│   ├── wishlistStore.ts       # Favoriler
│   ├── compareStore.ts        # Karşılaştırma
│   ├── stockStore.ts          # Stok rezervasyonu (WebSocket)
│   ├── chatStore.ts           # Chat (WebSocket) — 718 satır
│   ├── liveChatStore.ts       # Canlı destek — 772 satır
│   ├── simpleChatStore.ts     # Basit chat — 418 satır
│   ├── themeStore.ts          # Dark/light mode
│   ├── settingsStore.ts       # Uygulama ayarları
│   ├── shippingStore.ts       # Kargo entegrasyonu
│   ├── invoiceStore.ts        # E-fatura entegrasyonu
│   ├── loyaltyStore.ts        # Sadakat puanı
│   ├── verificationStore.ts   # Email/SMS doğrulama
│   ├── stockAlertStore.ts     # Stok alarmı
│   └── recentlyViewedStore.ts # Son görüntülenenler
│
├── services/                  # API client'lar
│   ├── api.ts                 # Ana API client (826 satır)
│   ├── googleAuth.ts          # Google OAuth
│   ├── liveChatApi.ts         # Chat API
│   ├── iyzicoApi.ts           # İyzico ödeme
│   ├── parasutApi.ts          # Paraşüt e-fatura
│   ├── stockApi.ts            # Stok API
│   ├── shippingApi.ts         # Kargo API
│   ├── cardApi.ts             # Kart API
│   ├── auditLogApi.ts         # Denetim logu API
│   ├── adminProductsApi.ts    # Admin ürün API
│   ├── categoriesApi.ts       # Kategori API
│   ├── categoryAttributesApi.ts
│   ├── productVariationsApi.ts
│   ├── legalPagesApi.ts       # Yasal sayfalar API
│   ├── paymentMethodsApi.ts   # Ödeme yöntemleri API
│   ├── cognito.ts             # Cognito yardımcıları
│   └── index.ts               # Export barrel
│
├── hooks/
│   ├── useApi.ts
│   ├── usePermissions.ts      # RBAC yetki kontrolü
│   └── use-mobile.ts          # Mobil breakpoint detection
│
├── data/
│   ├── mockData.ts            # Demo ürün verileri
│   └── mockUsers.ts           # Demo kullanıcılar (bcrypt hash)
│
├── utils/
│   └── security.ts            # Password hashing, validation, rate limiter
│
└── test/
    └── setup.ts               # Vitest setup
```

### 2.2 State Management (Zustand) Detaylı Analizi

| Store | Boyut | Persist | Server Sync | Açıklama |
|-------|-------|---------|-------------|----------|
| `authStore` | 759 satır | ✅ localStorage | Cognito API | JWT + refresh + Google OAuth |
| `cartStore` | 263 satır | ✅ localStorage | ✅ POST /cart | Stok kontrollü sepet |
| `orderStore` | ~300 satır | ❌ Yok | ✅ GET /orders | Sipariş geçmişi |
| `wishlistStore` | ~150 satır | ✅ localStorage | ❌ Yok | Favoriler |
| `compareStore` | ~150 satır | ✅ localStorage | ❌ Yok | Karşılaştırma (max 4) |
| `stockStore` | ~400 satır | ❌ Yok | ✅ WebSocket | Gerçek zamanlı stok |
| `chatStore` | 718 satır | ✅ localStorage | ✅ WebSocket | Chat (müşteri) |
| `liveChatStore` | 772 satır | ✅ localStorage | ✅ WebSocket | Canlı destek (agent) |
| `simpleChatStore` | 418 satır | ✅ localStorage | ✅ WebSocket | Basit chat |
| `themeStore` | ~100 satır | ✅ localStorage | ❌ Yok | Dark/light mode |
| `settingsStore` | ~200 satır | ✅ localStorage | ❌ Yok | Uygulama ayarları |
| `shippingStore` | ~200 satır | ✅ localStorage | ❌ Yok | Kargo API credentials |
| `invoiceStore` | ~200 satır | ✅ localStorage | ❌ Yok | E-fatura API credentials |
| `loyaltyStore` | ~150 satır | ✅ localStorage | ❌ Yok | Sadakat puanı |
| `verificationStore` | ~250 satır | ✅ localStorage | ❌ Yok | Email/SMS OTP |
| `stockAlertStore` | ~150 satır | ✅ localStorage | ❌ Yok | Stok alarmı |
| `recentlyViewedStore` | ~100 satır | ✅ localStorage | ❌ Yok | Son görüntülenenler |

**Önemli Not:** 10 store `localStorage`'a persist ediliyor. `orderStore`, `settingsStore`, `invoiceStore`, `loyaltyStore`, `shippingStore`'da `partialize` eksik — `isLoading`, `error`, API key'ler, IBAN'lar localStorage'a yazılıyor.

### 2.3 Routing Yapısı (App.tsx)

**Eager Loaded (14 sayfa):**
Home, Products, ProductDetail, Login, Register, About, Campaigns, NewArrivals, Bestsellers, Help, FAQ, Contact, NotFound, LegalPages (KVKK, Privacy, Terms, ReturnPolicy, PreInformation)

**Lazy Loaded (25+ sayfa):**
Cart, Checkout, VerifyEmail, ForgotPassword, ResetPassword, Wishlist, Compare, Profile, Orders, Settings, OrderTracking, Returns, Support, Reviews, Lists, Coupons, LegalPageView, ve 17 admin sayfası

**Admin Route Yetki Matrisi:**
| Route | Gerekli Yetki | Roller |
|-------|--------------|--------|
| `/admin/products` | `products:view` | super_admin, admin, editor |
| `/admin/products/new` | `products:create` | super_admin, admin |
| `/admin/orders` | `orders:view` | super_admin, admin, support |
| `/admin/users` | `users:view` | super_admin, admin |
| `/admin/audit-logs` | `audit:view` | **SADECE super_admin** |
| `/admin/parasut` | `settings:edit` | super_admin, admin |

---

## 3. BACKEND YAPISI

### 3.1 Dizin Haritası
```
backend/src/
├── handlers/                  # 20 Lambda handler grubu
│   ├── auth/
│   │   ├── index.ts           # Login, register, verify, refresh
│   │   ├── cognito.ts         # Cognito service wrapper
│   │   ├── cognito-inline.ts  # Inline Cognito (duplicate!)
│   │   └── postConfirmation.ts
│   ├── products/index.ts      # CRUD + pagination
│   ├── orders/index.ts        # Atomic transactions + notifications
│   ├── stock/index.ts         # Reservation + return
│   ├── cart/index.ts          # Cart CRUD
│   ├── users/index.ts         # User management
│   ├── categories/index.ts    # Category tree
│   ├── category-attributes/index.ts
│   ├── product-variations/index.ts
│   ├── payments/index.ts      # Stripe webhook + İyzico
│   ├── shipping/index.ts      # Yurtiçi Kargo integration
│   ├── chat/index.ts          # WebSocket live chat
│   ├── admin/index.ts         # Admin dashboard stats
│   ├── invoicing/index.ts     # Paraşüt e-fatura
│   ├── legal-pages/index.ts   # CMS legal pages
│   ├── verification/index.ts  # Email/SMS verification
│   ├── notifications/index.ts # SES email + SNS SMS
│   └── images/index.ts        # Image upload
│
├── services/                  # 3rd party integrations
│   ├── cognito.ts
│   ├── iyzico.ts
│   ├── parasut.ts             # E-fatura
│   └── yurticiKargo.ts        # Kargo
│
└── utils/                     # Yardımcı fonksiyonlar
    ├── security.ts            # Password, CORS, rate limit, headers
    ├── authorization.ts       # JWT/Cognito auth, RBAC
    ├── encryption.ts          # KMS PII encryption
    ├── auditLogger.ts         # Audit logging (GDPR/KVKK)
    └── auditLog.ts            # DUPLICATE! (280 satır)
```

### 3.2 DynamoDB Tabloları (14 adet)

| Tablo | PK | GSI | Kullanım |
|-------|-----|-----|----------|
| `Products` | `id` (S) | `category` (CategoryIndex) | Ürünler |
| `Categories` | `id` (S) | — | Kategori ağacı |
| `CategoryAttributes` | `categoryId` + `attributeId` | `attributeId` | Dinamik özellikler |
| `ProductVariations` | `productId` + `variationId` | `sku` | SKU varyasyonları |
| `Orders` | `id` (S) | `userId` (UserIndex) | Siparişler |
| `Users` | `id` (S) | `email` (EmailIndex) | Kullanıcılar |
| `Cart` | `userId` (S) | — | Sepetler |
| `StockReservations` | `reservationId` (S) | `status` + `expiresAt` | Stok rezervasyonu |
| `Verification` | `id` (S) | `email` + `type` | Doğrulama kodları |
| `ChatConnections` | `connectionId` (S) | — | WebSocket bağlantıları |
| `ChatSessions` | `sessionId` (S) | `userId` | Chat oturumları |
| `ChatMessages` | `sessionId` + `timestamp` | — | Chat mesajları |
| `AuditLogs` | `id` (S) | `userId` + `timestamp` | Denetim kayıtları |
| `Shipping` | `id` (S) | `orderId` | Kargo entegrasyonu |

### 3.3 API Endpoint'leri

**Public:**
```
GET    /products              → getProducts (cursor pagination)
GET    /products/:id          → getProduct
GET    /products/search       → searchProducts
GET    /categories            → getCategories
POST   /auth/login            → login
POST   /auth/register         → register
POST   /auth/verify           → verifyEmail
POST   /auth/resend-code      → resendCode
POST   /auth/google           → googleAuth
POST   /auth/forgot-password  → forgotPassword
POST   /auth/reset-password   → resetPassword
GET    /legal-pages           → getLegalPages
```

**Protected (JWT):**
```
GET    /cart                  → getCart
PUT    /cart                  → updateCart
POST   /orders                → createOrder
GET    /orders                → getOrders
GET    /orders/:id            → getOrder
PUT    /orders/:id/status     → updateOrderStatus
GET    /users/me              → getMe
PUT    /users/me              → updateMe
GET    /reviews?productId=    → getReviews (YOK! Backend'te implemente edilmemiş)
POST   /reviews               → createReview (YOK!)
```

**Admin (RBAC):**
```
POST   /products              → createProduct (products:create)
PUT    /products/:id          → updateProduct (products:edit)
DELETE /products/:id          → deleteProduct (products:delete)
GET    /users                 → getUsers (users:view)
PUT    /users/:id/role        → updateUserRole (users:edit)
GET    /audit-logs            → getAuditLogs (audit:view)
```

---

## 4. VERİ AKIŞI VE MİMARİ

### 4.1 Auth Flow
```
Kullanıcı Login/Register
    ↓
Frontend: authStore.login() / authStore.register()
    ↓
Mock Mode? → MOCK_USERS'tan doğrula (bcrypt)
    ↓
Real Mode? → API Gateway → Lambda (auth/index.ts)
    ↓
Cognito InitiateAuth (USER_PASSWORD_AUTH)
    ↓
JWT Tokens (accessToken + idToken + refreshToken)
    ↓
localStorage (Zustand persist)
    ↓
Her API çağrısında: Authorization: Bearer <idToken>
    ↓
Backend: requireAuth() → JWT verify → AuthUser
```

### 4.2 Order Flow
```
Kullanıcı Checkout
    ↓
Frontend: orderStore.addOrder()
    ↓
POST /orders
    ↓
Backend: createOrder()
    ↓
1. Fiyat validasyonu (±0.01 tolerans)
2. Stok kontrolü
3. TransactWriteCommand:
   - Put: Orders tablosuna kaydet (PII encrypted)
   - Update: Products tablosundan stok düş
4. Audit log yaz
5. Email/SMS bildirim gönder
    ↓
Frontend: Sepet temizlenmeli ama TEMİZLENMİYOR!
```

### 4.3 Stock Flow
```
Kullanıcı Sepete Ekle
    ↓
Frontend: cartStore.addToCart() → stok kontrolü (client-side)
    ↓
Checkout sayfası
    ↓
Frontend: stockStore.reserveCartStock()
    ↓
WebSocket: STOCK_RESERVATION oluştur (15 dk timeout)
    ↓
Ödeme başarılı
    ↓
Backend: createOrder → stockStore.confirmReservation() ÇAĞRILMIYOR!
    ↓
Sipariş iptal
    ↓
Frontend: orderStore.cancelOrder() → "Stok otomatik güncellendi" (YALAN!)
```

### 4.4 Chat Flow
```
Müşteri ChatWidget aç
    ↓
WebSocket bağlantısı: wss://faj6241vp7.execute-api.eu-west-1.amazonaws.com/prod
    ↓
Lambda (chat/index.ts): connectionId kaydet
    ↓
Bot mesajı gönder
    ↓
Agent atanana kadar bekleme kuyruğu
    ↓
Agent bağlanırsa: 1-to-1 chat
    ↓
Agent bağlanmazsa: bot devam eder
```

---

## 5. DOSYA-DOSYA ANALİZ

### 5.1 Kritik Dosyalar Detaylı İnceleme

#### `src/services/api.ts` (826 satır)
**Ne yapar:** Tüm API çağrılarının merkezi noktası. Token refresh, mock mode, error handling.

**Fonksiyonlar:**
- `fetchApi()` — HTTP wrapper, 401 handling, token refresh
- `getIdToken()` — localStorage'dan token okur
- `isMockMode()` — Mock mode kontrolü (GÜVENLİ versiyon)
- `authApi` — Login, register, verify, logout, refresh, change password
- `productsApi` — getAll, getById, search
- `categoriesApi` — getAll, getBySlug, getById
- `reviewsApi` — getByProduct, getByUser, create, markHelpful, delete
- `cartApi` — get, addItem, updateItem, removeItem, clear
- `ordersApi` — getAll, getById, create, updateStatus, cancel, refund
- `usersApi` — getAll, getById, updateRole, softDelete, restore, getMe, updateMe
- `chatApi` — Raw fetch, NO token refresh, NO auth standardization

**Sorunlar:**
- `fetchApi` `Promise<any>` dönüyor
- `timeout` yok
- Race condition: eşzamanlı 401'lerde çoklu refresh
- Proaktif token refresh yok
- Social login catch bloğunda sahte kullanıcı
- User API catch bloğunda fake test data
- Payment endpoint mismatch (`/payments/create-intent` vs `/payments/intent`)
- Chat API raw fetch kullanıyor (token yok)

#### `src/stores/authStore.ts` (759 satır)
**Ne yapar:** Kimlik doğrulama, token yönetimi, adres yönetimi.

**State:**
```typescript
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsVerification: boolean;
  pendingVerificationEmail: string | null;
}
```

**Actions:**
- `initAuth()` — Uygulama başladığında session doğrula
- `login()` — Email/şifre girişi (rate limit: 5 deneme / 5 dk)
- `register()` — Kayıt (rate limit: 3 deneme / 1 saat)
- `verifyEmail()` — 6 haneli kod doğrulama
- `resendVerificationCode()` — Kod tekrar gönder
- `logout()` — Çıkış (cross-store temizlik YOK!)
- `socialLogin()` — Google/Facebook OAuth
- `googleSignIn()` — Google credential girişi
- `updateUser()` — Profil güncelle (server çağrısı YOK!)
- `addAddress()` — Adres ekle (server çağrısı YOK!)
- `removeAddress()` — Adres sil (server çağrısı YOK!)
- `setDefaultAddress()` — Varsayılan adres (server çağrısı YOK!)
- `forgotPassword()` — Şifre sıfırlama (rate limit YOK!)
- `resetPassword()` — Şifre güncelleme (rate limit YOK!)
- `changePassword()` — Şifre değiştirme (rate limit YOK!)
- `refreshToken()` — Token yenileme

**Sorunlar:**
- Ayrı `isMockMode()` tanımı (api.ts'ten farklı)
- `console.log` dolu (bilgi sızıntısı)
- `forgotPassword` catch bloğunda her zaman `true` dönüyor
- Adres yönetimi sadece local state (server'e gitmiyor)
- Logout'ta diğer store'lar temizlenmiyor
- `setTimeout` ile role sync (race condition)

#### `src/stores/cartStore.ts` (263 satır)
**Ne yapar:** Sepet yönetimi, server sync, kupon uygulama.

**State:**
```typescript
interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  isLoading: boolean;
}
```

**Actions:**
- `addToCart()` — Ürün ekle (stok kontrollü)
- `removeFromCart()` — Ürün sil
- `updateQuantity()` — Miktar güncelle
- `clearCart()` — Sepet temizle
- `applyCoupon()` — Kupon uygula (hardcoded 5 kupon)
- `removeCoupon()` — Kupon kaldır
- `syncWithServer()` — Server ile senkronize et
- `totalItems()` — Toplam ürün sayısı
- `totalPrice()` — Toplam fiyat
- `finalPrice()` — İndirim + kargo dahil
- `shippingCost()` — Kargo ücreti (hardcoded: 500₺ üzeri bedava)

**Sorunlar:**
- `shippingCost()` hardcoded (`settingsStore`'den almıyor)
- `COUPONS` hardcoded
- `syncWithServer()` `any` kullanıyor
- Server sync başarısız olursa local state kalıyor (tutarsızlık)

#### `backend/src/handlers/orders/index.ts` (700 satır)
**Ne yapar:** Sipariş CRUD, atomik transactions, bildirimler, audit log.

**Fonksiyonlar:**
- `getOrders()` — Cursor pagination + PII decryption
- `getOrder()` — Tek sipariş + PII decryption
- `createOrder()` — ATOMIK: TransactWriteCommand (order + stock düş)
- `updateOrderStatus()` — Durum güncelle + email/SMS + audit log
- `cancelOrder()` — Sipariş iptal (stock return AYRI transaction)
- `refundOrder()` — İade (stock return AYRI transaction)

**PII Encryption:**
- `shippingAddress`, `billingAddress`, `phone`, `email`, `fullName` KMS ile şifrelenir
- `encryptObjectFields()` / `decryptObjectFields()` kullanır

**Sorunlar:**
- `cancelOrder` ve `refundOrder` atomik değil (stock return ayrı çağrı)
- Stok mesajı yanıltıcı ("Stok otomatik güncellendi" ama güncellenmiyor)
- `updateOrderStatus` stock return yapmıyor

#### `backend/src/handlers/products/index.ts` (172 satır)
**Ne yapar:** Ürün CRUD, pagination, arama.

**Fonksiyonlar:**
- `getProducts()` — Cursor pagination (Query/Scan)
- `getProduct()` — Tek ürün
- `searchProducts()` — İsim/açıklama/marka arama

**Sorunlar:**
- `searchProducts()` `ScanCommand` kullanıyor (TÜM tabloyu tarar!)
- CORS `*` hardcoded (security.ts'i bypass ediyor)
- Arama memory'de filtreleniyor (DynamoDB'de değil)

#### `backend/src/utils/security.ts` (264 satır)
**Ne yapar:** Güvenlik header'ları, şifreleme, rate limiting, input sanitization.

**Fonksiyonlar:**
- `validatePasswordStrength()` — Şifre güçlülüğü
- `hashPassword()` / `verifyPassword()` — bcrypt
- `checkRateLimit()` — In-memory rate limiting (Lambda'da ÇALIŞMAZ!)
- `generateSecureToken()` — `Math.random()` kullanıyor (GÜVENSİZ!)
- `sanitizeInput()` — Basit XSS önleme
- `detectSQLInjection()` — SQL pattern detection (SQL DB yok, gereksiz)
- `getClientIP()` — IP çıkarma
- `securityHeaders` — CORS + güvenlik header'ları

**Sorunlar:**
- `generateSecureToken()` kriptografik olarak güvensiz
- `checkRateLimit()` Lambda'da işe yaramaz
- CORS wildcard fallback
- `detectSQLInjection` gereksiz (DynamoDB kullanılıyor)

#### `backend/src/utils/authorization.ts` (207 satır)
**Ne yapar:** JWT/Cognito auth, RBAC, mock header kontrolü.

**Fonksiyonlar:**
- `getUserFromToken()` — Cognito claims'den user çıkar
- `getUserId()` — User ID al (mock fallback dev'te)
- `requireAuth()` — Auth zorunlu (mock header sadece dev'te)
- `requireRole()` — Rol kontrolü
- `requireAdmin()` — Admin kontrolü
- `requireStaff()` — Staff kontrolü
- `isSuperAdmin()` — Super admin mi?
- `unauthorizedResponse()` — 401 response (CORS `*`)
- `forbiddenResponse()` — 403 response (CORS `*`)

**Sorunlar:**
- `unauthorizedResponse` ve `forbiddenResponse`'ta CORS `*`
- `getUserInfo()` fallback `'unknown'` — auth'sız isteklere izin veriyor

---

## 6. TESPİT EDİLEN TÜM SORUNLAR

### 🔴 KRİTİK (11 adet)

| Kod | Sorun | Dosya | Etki |
|-----|-------|-------|------|
| K1 | `generateSecureToken()` `Math.random()` kullanıyor | `backend/utils/security.ts` | Token'lar tahmin edilebilir |
| K2 | `checkRateLimit()` in-memory Map | `backend/utils/security.ts` | Lambda'da rate limit yok |
| K3 | 3 farklı `isMockMode()` | `api.ts`, `authStore.ts`, `googleAuth.ts` | Split-brain durumu |
| K4 | Social login sahte kullanıcı | `api.ts:390-408` | Auth bypass |
| K5 | User API fake data | `api.ts:538-565` | Veri tutarsızlığı |
| K6 | Payment endpoint uyuşmazlığı | `api.ts` vs `backend/payments` | Ödeme çalışmaz |
| K7 | CORS wildcard fallback | `security.ts`, `authorization.ts` | CORS bypass |
| K8 | Hassas veri localStorage'da | Tüm store'lar | XSS = token çalınması |
| K9 | MOCK_USERS production bundle | `mockUsers.ts` | Hash'ler sızdırılıyor |
| K10 | Reviews API backend'te yok | `api.ts:423-450` | 404 hatası |
| K11 | Soft delete endpoint'leri yok | `api.ts:568-616` | Admin işlev eksik |

### 🟠 YÜKSEK (15 adet)

| Kod | Sorun | Dosya |
|-----|-------|-------|
| Y1 | fetch() timeout yok | `api.ts` |
| Y2 | `fetchApi` `Promise<any>` | `api.ts` |
| Y3 | Eşzamanlı 401 race condition | `api.ts` |
| Y4 | Proaktif token refresh yok | `api.ts` |
| Y5 | ProtectedRoute auth init'ten önce redirect | `App.tsx` |
| Y6 | Chat API hardcoded AWS URL | `api.ts` |
| Y7 | 3 ayrı chat store | `stores/chat*` |
| Y8 | i18n yok | Tüm sayfalar |
| Y9 | ARIA label yok | Tüm sayfalar |
| Y10 | `<img>` hâlâ kullanılıyor | `ProductDetail`, `Cart`, `Checkout` |
| Y11 | DynamoDB `ScanCommand` arama | `products/index.ts` |
| Y12 | `products/index.ts` CORS `*` | `products/index.ts` |
| Y13 | `authStore.ts` console.log dolu | `authStore.ts` |
| Y14 | Google kullanıcıları localStorage'dan | `mockUsers.ts` |
| Y15 | Image upload auth yok | `backend/handlers/images` |

### 🟡 ORTA (18 adet)

| Kod | Sorun | Etki |
|-----|-------|------|
| O1 | Error boundary yok | Beyaz ekran |
| O2 | Klavye navigasyonu yok | Erişilebilirlik |
| O3 | `confirm()` kullanılıyor | Admin sayfaları |
| O4 | Login sonrası redirect yok | Kullanıcı deneyimi |
| O5 | Chat API auth'suz raw fetch | Güvenlik |
| O6 | Kod tekrarı (validation, email, bcrypt) | Bakım zorluğu |
| O7 | `partialize` eksik (10 store) | localStorage şişiyor |
| O8 | cartStore/loyaltyStore kupon sync yok | Kuponlar çalışmıyor |
| O9 | Adres yönetimi server'sız | Veri kaybı |
| O10 | Logout cross-store temizlik yok | Veri kalıntısı |
| O11 | OTP brute-force koruması yok | Kod kırılabilir |
| O12 | `encryptObjectFields` recursive yanlış | Tüm nested alanlar şifreleniyor |
| O13 | `generateUserDataReport` stub | GDPR yok |
| O14 | Stock reservation race condition | Aynı ürün 2 kez satılabilir |
| O15 | PII encryption invoices/shipping'te yok | Veri güvenliği |
| O16 | Chat messages sanitize edilmiyor | XSS |
| O17 | Invoice number atomic değil | Aynı numara üretilebilir |
| O18 | `detectSQLInjection` gereksiz | SQL DB yok |

### 🟢 DÜŞÜK (9 adet)

| Kod | Sorun |
|-----|-------|
| D1 | Lazy import pattern tutarsız |
| D2 | Loading spinner standart değil |
| D3 | Mock data production bundle'ında |
| D4 | Mixed AWS SDK v2/v3 |
| D5 | `auth/cognito-inline.ts` duplicate |
| D6 | `utils/auditLog.ts` duplicate |
| D7 | `OrderTracking` default import |
| D8 | `shippingCost()` hardcoded |
| D9 | `COUPONS` hardcoded |

---

## 7. KOD TEKRARLARI VE TUTARSIZLIKLAR

### 7.1 Büyük Tekrarlar

| # | Tekrarlanan Kod | Konum | Çözüm |
|---|----------------|-------|-------|
| 1 | **3 Chat Store** | `chatStore.ts` (718), `liveChatStore.ts` (772), `simpleChatStore.ts` (418) | Tek store'a birleştir |
| 2 | **Password Validation** | `src/utils/security.ts` + `backend/utils/security.ts` | Shared package |
| 3 | **Email Validation** | `src/utils/security.ts` + `backend/utils/security.ts` | Shared package |
| 4 | **Bcrypt Helpers** | `src/utils/security.ts` + `backend/utils/security.ts` | Shared package |
| 5 | **Mask Sensitive Data** | `src/utils/security.ts` + `backend/utils/encryption.ts` | Tek yerde tut |
| 6 | **CORS/Response Helpers** | 18+ handler'da copy-paste | `utils/response.ts` oluştur |
| 7 | **Audit Logger** | `auditLog.ts` (280) + `auditLogger.ts` (366) | `auditLog.ts` sil |
| 8 | **Cognito Service** | `auth/cognito.ts` + `auth/cognito-inline.ts` + `services/cognito.ts` | Tek dosyada birleştir |
| 9 | **Notification Templates** | `orders/index.ts` + `notifications/index.ts` | `notifications`'ta birleştir |
| 10 | **Stock Update** | `orders/index.ts` + `stock/index.ts` | `stock/index.ts`'te tut |
| 11 | **Category Attributes** | `categories/index.ts` + `category-attributes/index.ts` | `category-attributes`'ta tut |
| 12 | **Low Stock** | `stock/index.ts` + `admin/index.ts` | `stock/index.ts`'te tut |

### 7.2 Tutarsızlıklar

| # | Tutarsızlık | Etki |
|---|-------------|------|
| 1 | `isMockMode()` 3 farklı implementasyon | Uygulama kafası karışık |
| 2 | `timestamp` tipi: `string` vs `number` | Chat store'lar arası uyumsuzluk |
| 3 | Error response format: 5 farklı şekil | Frontend parsing hataları |
| 4 | Token field naming: `token` vs `idToken` | Confusion, bug riski |
| 5 | `isOpen` vs `isChatOpen` | Chat store'lar arası uyumsuzluk |
| 6 | Lazy import: named vs default | Tutarsız pattern |
| 7 | CORS: `securityHeaders` vs hardcoded `*` | Bazı endpoint'ler CORS'suz |
| 8 | AWS SDK: v2 vs v3 | Bundle bloat, inconsistent API |
| 9 | Mock mode register: auto-auth vs verification | Farklı davranış |
| 10 | Order store toast: "Stok güncellendi" (yalan) | Kullanıcı yanıltma |

---

## 8. AMAZON/TRENDYOL SEVİYESİ EKSİKLİKLER

### 8.1 Arama & Keşif
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| Elasticsearch/OpenSearch | ❌ Yok | DynamoDB `ScanCommand` kullanılıyor |
| Faceted search | ⚠️ Basit | Kategori + fiyat + marka |
| Autocomplete | ❌ Yok | Kullanıcı yazarken öneri yok |
| Spell correction | ❌ Yok | "ayrphone" düzeltmesi yok |
| Search analytics | ❌ Yok | En çok aranan kelimeler |
| Recommendation engine | ❌ Yok | "Bunu alanlar bunu da aldı" |
| Personalization | ❌ Yok | Kullanıcı bazlı öneri |

### 8.2 Ürün Yönetimi
| Özellik | Durum |
|---------|-------|
| Product variations | ⚠️ Var (tablo var, UI yok) |
| SKU-level inventory | ✅ Var |
| Multi-image gallery with zoom | ⚠️ Basit (zoom yok) |
| Product comparison | ⚠️ Var (max 4) |
| Wishlist collections | ❌ Yok |
| Product videos | ❌ Yok |
| 360° view | ❌ Yok |
| Size guide | ❌ Yok |

### 8.3 Sepet & Ödeme
| Özellik | Durum |
|---------|-------|
| Guest checkout | ❌ Yok |
| Save cart for later | ❌ Yok |
| Abandoned cart recovery | ❌ Yok |
| Installment (taksit) | ❌ Yok |
| Payment redundancy | ❌ Yok |
| Invoice/e-fatura | ⚠️ Var (test edilmemiş) |
| Order tracking | ⚠️ Var (test edilmemiş) |

### 8.4 Altyapı
| Özellik | Durum |
|---------|-------|
| CDN (CloudFront) | ❌ Yok |
| Redis caching | ❌ Yok |
| Message queue (SQS) | ⚠️ Kısmen |
| Elasticsearch | ❌ Yok |
| PWA | ❌ Yok |
| i18n | ❌ Yok |
| SSR/Prerendering | ❌ Yok |

---

## 9. YOL HARİTASI

### Faz 1: Güvenlik Acil Durumu (1-2 gün)
- [ ] K1: `generateSecureToken()` → `crypto.randomBytes()`
- [ ] K2: `checkRateLimit()` → DynamoDB tabanlı
- [ ] K3: Tek `isMockMode()` fonksiyonu
- [ ] K4: Social login catch bloğunu kaldır
- [ ] K5: User API catch bloğunu kaldır
- [ ] K6: Payment endpoint'leri eşleştir
- [ ] K7: CORS wildcard'ları temizle
- [ ] K8: Token'ları `httpOnly` cookie'ye taşı

### Faz 2: Temel Fonksiyonellik (2-3 gün)
- [ ] K10: Reviews backend handler'ı yaz
- [ ] K11: Soft delete/restore endpoint'lerini yaz
- [ ] Y11: DynamoDB `ScanCommand` → `QueryCommand` + GSI
- [ ] Y1: fetch timeout ekle (10s)
- [ ] Y3: Token refresh race condition düzelt
- [ ] O14: Stock reservation conditional write

### Faz 3: Kod Kalitesi (3-5 gün)
- [ ] Y7: 3 chat store'u birleştir
- [ ] O6: Shared package oluştur
- [ ] O7: Tüm store'lara `partialize` ekle
- [ ] D5/D6: Duplicate dosyaları sil
- [ ] O12: `encryptObjectFields` recursive mantığını düzelt
- [ ] O9: Adres yönetimi server'a bağla
- [ ] O10: Logout cross-store temizlik

### Faz 4: Trendyol Seviyesi (2-4 hafta)
- [ ] Elasticsearch/OpenSearch entegrasyonu
- [ ] Autocomplete / Search suggestions
- [ ] Recommendation engine
- [ ] Guest checkout
- [ ] Abandoned cart recovery (SQS + SES)
- [ ] Redis caching layer
- [ ] CloudFront CDN
- [ ] i18n (react-i18next)
- [ ] PWA (Service Worker)
- [ ] Error boundaries + Loading skeletons

---

## 10. EK: TEKNİK DETAYLAR

### 10.1 Teknoloji Stack'i

**Frontend:**
- React 19.2.0, React DOM 19.2.0, React Router 7.13.1
- Vite 7.3.2, TypeScript 5.9.3
- Tailwind CSS 3.4.19, tailwind-merge 3.4.0, clsx 2.1.1
- shadcn/ui (55+ Radix component)
- Zustand 5.0.11 (state management)
- React Hook Form 7.70.0, Zod 4.3.5
- Recharts 2.15.4 (charts)
- Sonner 2.0.7 (toasts)
- Lucide React 0.562.0 (icons)
- Embla Carousel 8.6.0

**Backend:**
- Node.js 20.x
- AWS SDK v3 (DynamoDB, Cognito, SES, SNS, KMS, S3)
- bcrypt 6.0.0
- fast-xml-parser 5.5.10
- iyzipay 2.0.67

**Infrastructure:**
- AWS Lambda (Node.js 20)
- API Gateway (REST + WebSocket)
- DynamoDB (PAY_PER_REQUEST)
- Cognito (User Pools)
- SES (Email), SNS (SMS)
- KMS (Encryption)
- S3 (Images)
- SAM (Deployment)

### 10.2 Bağımlılık Analizi

**Frontend `package.json`'de ama kullanılmayan paketler:**
- `aws-sdk` (v2) — Sadece backend'te kullanılmalı
- `@aws-sdk/*` (frontend package.json'de) — Kullanılmıyor
- `iyzipay` — Node.js `fs` modülü kullanıyor, browser'da patlar
- `amazon-cognito-identity-js` — Kullanılıyor olabilir, kontrol et

**Backend `package.json`:**
- Doğru yapılandırılmış
- `iyzipay` backend'te doğru yerde
- `bcrypt` (native) backend'te doğru

### 10.3 Build Analizi

**Production Build:**
- `tsc -b && vite build`
- Output: `dist/` (Vite default)
- Chunk size (optimizasyon sonrası):
  - `index.js`: 539 KB (gzip: 142 KB)
  - `vendor-react`: 67 KB
  - `vendor-radix`: 149 KB
  - `vendor-ui`: 94 KB
  - `vendor-charts`: 420 KB

### 10.4 Test Durumu

| Test Türü | Durum | Kapsam |
|-----------|-------|--------|
| Unit Test | ⚠️ Var | Sadece `authStore.test.ts` (1 dosya) |
| Integration Test | ❌ Yok | |
| E2E Test | ❌ Yok | |
| Load Test | ❌ Yok | |
| Security Test | ❌ Yok | |

---

*Bu rapor 4 paralel AI agent + manuel derinlemesine kod incelemesi ile oluşturulmuştur.*  
*Toplam incelenen dosya: 220 | Satır: 62,204 | Export: 654 | Süre: ~45 dakika*  
*Agent'lar: Frontend Stores · Backend Handlers · Frontend Services · Frontend Pages*
