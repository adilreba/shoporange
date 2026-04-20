# AtusHome — Tam Kapsamlı Güvenlik & Mimari Denetim Raporu

> **Tarih:** 2025-04-20  
> **Denetim Kapsamı:** 220 dosya, 62,204 satır kod, 654 export  
> **Hedef:** Amazon · Trendyol · Hepsiburada seviyesine çıkarma yol haritası  
> **Bulunan Toplam Sorun:** 53 (Kritik 11 · Yüksek 15 · Orta 18 · Düşük 9)

---

## ÖZET

Bu denetim 4 paralel agent + manuel derinlemesine inceleme ile yapılmıştır. Her dosya tek tek okunmuş, fonksiyonlar analiz edilmiş, tutarsızlıklar ve tekrarlar tespit edilmiştir.

**En Kritik 5 Sorun:**
1. `generateSecureToken()` kriptografik olarak güvensiz (`Math.random`)
2. Rate limiting Lambda'da çalışmıyor (in-memory Map)
3. 3 farklı `isMockMode()` implementasyonu — uygulama kafası karışık
4. Social login her hatada **sahte kullanıcı** oluşturuyor
5. Payment endpoint frontend/backend uyuşmuyor — ödeme hiç çalışmaz

---

## 1. KRİTİK SORUNLAR (🔴 11 adet)

### K1. `generateSecureToken()` — Kriptografik Güvensiz Token Üretimi
| | |
|---|---|
| **Dosya** | `backend/src/utils/security.ts` (satır 195-202) |
| **Sorun** | `Math.random()` kullanılıyor. Kriptografik olarak güvenli DEĞİL. Tahmin edilebilir. |
| **Etki** | Şifre sıfırlama token'ları, doğrulama kodları brute-force ile bulunabilir. |
| **Doğrusu** | `crypto.randomBytes()` veya `crypto.randomUUID()` |
| **Örnek** | ```ts
// YANLIŞ
const chars = 'ABC...xyz012';
for (let i=0; i<length; i++) token += chars[Math.floor(Math.random() * chars.length)];

// DOĞRU
import { randomBytes } from 'crypto';
return randomBytes(length).toString('base64url');
``` |

### K2. `checkRateLimit()` — Lambda'da Tamamen İşlevsiz
| | |
|---|---|
| **Dosya** | `backend/src/utils/security.ts` (satır 161-190) |
| **Sorun** | In-memory `Map` kullanıyor. Lambda stateless — her istek yeni instance. |
| **Etki** | Rate limiting **%100 işe yaramıyor**. Brute force saldırıları sınırsız. |
| **Doğrusu** | DynamoDB veya Redis (ElastiCache) tabanlı rate limiting |

### K3. 3 Farklı `isMockMode()` — "Split-Brain" Durumu
| | |
|---|---|
| **Dosyalar** | `api.ts` · `authStore.ts` · `googleAuth.ts` |
| **Sorun** | Üç dosya da farklı mantık kullanıyor. `authStore.ts` boş URL'de `true` dönüyor, `api.ts` `false` dönüyor. |
| **Etki** | Uygulama tutarsız davranır. Bazı kısımlar mock, bazıları real moda geçer. Güvenlik açığı. |
| **Doğrusu** | Tek bir `isMockMode()` fonksiyonu, tüm uygulama tarafından paylaşılmalı |

### K4. Social Login — Her Backend Hatasında Sahte Kullanıcı
| | |
|---|---|
| **Dosya** | `src/services/api.ts` (satır 390-408) |
| **Sorun** | `catch` bloğunda backend hatası fark etmeksizin sahte demo kullanıcı oluşturuyor. |
| **Etki** | Kimlik doğrulama bypass edilebilir. Saldırgan herhangi bir hatada giriş yapabilir. |
| **Kod** | ```ts
catch (error) {
  const mockSocialUser = { id: `social-${provider}-${Date.now()}`, ... };
  return { token: `mock_token_...`, user: mockSocialUser };
}
``` |

### K5. User API — Hata Olunca Fake Test Data Dönüyor
| | |
|---|---|
| **Dosya** | `src/services/api.ts` (satır 538-565) |
| **Sorun** | `getProfile` / `updateProfile` backend hata verirse mock test data dönüyor. |
| **Etki** | Kullanıcı başkasının profilini görebilir veya kendi profilini güncelleyemeyebilir. |

### K6. Payment Endpoint Uyuşmazlığı
| | |
|---|---|
| **Dosya** | `api.ts` vs `backend/payments/index.ts` |
| **Sorun** | Frontend `/payments/create-intent` çağırıyor, backend `/payments/intent` bekliyor. |
| **Etki** | Ödeme hiçbir zaman çalışmaz. 404 hatası. |

### K7. CORS Wildcard Hâlâ Fallback
| | |
|---|---|
| **Dosyalar** | `backend/src/utils/security.ts` (satır 125) · `authorization.ts` |
| **Sorun** | `CORS_ORIGIN || '*'` — env var boşsa wildcard. Ayrıca `unauthorizedResponse` ve `forbiddenResponse` fonksiyonlarında da `*` hardcoded. |
| **Etki** | Prodüksiyonda CORS koruması bypass edilebilir. |

### K8. Hassas Veriler localStorage'da
| | |
|---|---|
| **Dosyalar** | Tüm Zustand store'lar |
| **Sorun** | JWT token'lar, refresh token'lar, API key'ler, IBAN'lar `localStorage`'da persist ediliyor. |
| **Etki** | XSS saldırısında tüm token'lar çalınır. Session hijacking. |
| **Doğrusu** | `httpOnly` cookie + `SameSite=Strict` + CSRF token |

### K9. `MOCK_USERS` Production Bundle'ında
| | |
|---|---|
| **Dosya** | `src/data/mockUsers.ts` |
| **Sorun** | bcrypt hash'li şifreler ve yorumda plaintext şifreler (`AtusHome2024!`, `Admin1234`) build'e giriyor. |
| **Etki** | Hash'ler saldırganın eline geçerse offline brute force yapılabilir. |

### K10. Reviews API — Backend'te Tamamen Yok
| | |
|---|---|
| **Dosya** | `src/services/api.ts` (satır 423-450) |
| **Sorun** | Frontend reviews CRUD API'si var ama backend handler'ı yok. |
| **Etki** | 404 hatası. Kullanıcı yorum yapamaz. |

### K11. Soft Delete / Restore Endpoint'leri Yok
| | |
|---|---|
| **Dosya** | `src/services/api.ts` (satır 568-616) |
| **Sorun** | Frontend'te `softDeleteUser` / `restoreUser` fonksiyonları var ama backend karşılığı yok. |
| **Etki** | Admin kullanıcı silme/geri yükleme yapamaz. |

---

## 2. YÜKSEK SORUNLAR (🟠 15 adet)

| # | Sorun | Dosya | Etki |
|---|-------|-------|------|
| Y1 | `fetch()` timeout yok | `api.ts` | Request asılı kalabilir, kullanıcı bekler |
| Y2 | `fetchApi` `Promise<any>` dönüyor | `api.ts` | Zero type safety, runtime hataları |
| Y3 | Eşzamanlı 401'lerde çoklu refresh | `api.ts` | Race condition, token corruption |
| Y4 | Proaktif token refresh yok | `api.ts` | Sadece 401 sonrası, kullanıcı deneyimi kötü |
| Y5 | ProtectedRoute auth init'ten önce redirect | `App.tsx` | Flash/loop, kullanıcı tekrar login'e atılır |
| Y6 | Chat API hardcoded AWS URL | `api.ts` | Esneklik yok, stage değişiminde patlar |
| Y7 | 3 ayrı chat store | `stores/chat* ` | Kod tekrarı, bakım kabusu |
| Y8 | i18n yok, Türkçe stringler hardcoded | Tüm sayfalar | Uluslararasılaşma imkansız |
| Y9 | İkon butonlarında ARIA label yok | Tüm sayfalar | Ekran okuyucu kullanıcılar için erişilebilirlik yok |
| Y10 | `<img>` hâlâ kullanılıyor | `ProductDetail`, `Cart`, `Checkout` | Performans, LCP etkilenir |
| Y11 | DynamoDB `ScanCommand` arama | `products/index.ts` | **Her arama tüm tabloyu tarar**. Maliyetli, yavaş. |
| Y12 | `products/index.ts` CORS `*` | `products/index.ts` | `security.ts` CORS fix'ini bypass ediyor |
| Y13 | `authStore.ts` `console.log` dolu | `authStore.ts` | Token, email, role bilgisi console'a sızdırılıyor |
| Y14 | Google kullanıcıları localStorage'dan yükleniyor | `mockUsers.ts` | `loadGoogleUsersFromStorage()` — neden? |
| Y15 | Image upload endpoint'te auth yok | `backend/handlers/images` | Herkes upload yapabilir |

---

## 3. ORTA SORUNLAR (🟡 18 adet)

| # | Sorun | Etki |
|---|-------|------|
| O1 | Error boundary yok | Component hatası = beyaz ekran |
| O2 | Klavye navigasyonu yok | Erişilebilirlik sorunu |
| O3 | `confirm()` kullanılıyor | Admin sayfalarında native confirm — ARIA uyumsuz |
| O4 | Login sonrası redirect yok (`?redirect=`) | Kullanıcı login sonrası ana sayfaya atılır |
| O5 | Chat API auth'suz raw fetch | Standart dışı, güvenlik zafiyeti |
| O6 | Kod tekrarı (password validation, email, bcrypt) | Frontend + backend aynı kod |
| O7 | Birçok store'da `partialize` eksik | `isLoading`, `error` localStorage'a yazılıyor |
| O8 | `cartStore` ile `loyaltyStore` kupon sync yok | Kuponlar birbirini görmüyor |
| O9 | Adres yönetimi async ama server çağrısı yok | Sadece local state değişiyor |
| O10 | Logout'ta cross-store temizlik yok | Sepet, stok rezervasyonu, chat state kalıyor |
| O11 | OTP brute-force koruması yok | Doğrulama kodu brute-force edilebilir |
| O12 | `encryptObjectFields` nested'ın TÜM alanlarını şifreliyor | `Object.keys(obj[field])` — yanlış mantık |
| O13 | `generateUserDataReport` stub | GDPR data portability implementasyonu yok |
| O14 | Stock reservation race condition | Conditional write yerine Get + Put |
| O15 | PII encryption invoices/shipping'te yok | Sadece orders'ta var |
| O16 | Chat messages sanitize edilmiyor | XSS riski |
| O17 | Invoice number generation atomic değil | Aynı numara üretilebilir |
| O18 | `detectSQLInjection` gereksiz | SQL DB yok, DynamoDB kullanılıyor |

---

## 4. DÜŞÜK SORUNLAR (🟢 9 adet)

| # | Sorun |
|---|-------|
| D1 | Lazy import pattern tutarsız (bazıları `.then(m => ({default: m.X}))`, bazıları `m.default`) |
| D2 | Loading spinner'lar standart değil |
| D3 | Mock data (`mockData.ts`) production bundle'ında |
| D4 | Mixed AWS SDK v2/v3 (`legal-pages`, `payment-methods`) |
| D5 | `auth/cognito-inline.ts` ve `auth/cognito.js` duplicate — silinmeli |
| D6 | `utils/auditLog.ts` ve `utils/auditLogger.ts` duplicate — biri silinmeli |
| D7 | `App.tsx`'te `OrderTracking` default import, diğerleri named |
| D8 | `shippingCost()` hardcoded (500₺ üzeri bedava, değilse 49₺) — settingsStore'dan alınmalı |
| D9 | `COUPONS` hardcoded — admin panelinden yönetilmeli |

---

## 5. TRENDYOL / HEPSİBURADA SEVİYESİNDE EKSİK ÖZELLİKLER

Bu bölüm mevcut sorunların ötesinde, Amazon/Trendyol/Hepsiburada gibi platformlarda olan ama bu projede **hiç olmayan** özellikleri listeler.

### 5.1 Arama & Keşif
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| Elasticsearch/OpenSearch | ❌ Yok | DynamoDB `ScanCommand` kullanılıyor |
| Faceted search (facet'ler) | ⚠️ Basit | Kategori + fiyat + marka var, ama dinamik özellikler yok |
| Autocomplete / Search suggestions | ❌ Yok | Kullanıcı yazarken öneri yok |
| Spell correction | ❌ Yok | "ayrphone" → "airphone" düzeltmesi yok |
| Search analytics | ❌ Yok | En çok aranan kelimeler, sıfır sonuç aramalar |
| Recently viewed | ✅ Var | `recentlyViewedStore.ts` mevcut |
| Recommendation engine | ❌ Yok | "Bunu alanlar bunu da aldı" yok |
| Personalization | ❌ Yok | Kullanıcı bazlı ürün önerisi yok |

### 5.2 Ürün Yönetimi
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| Product variations (size, color) | ⚠️ Var | `ProductVariationsTable` var ama UI'da yok |
| SKU-level inventory | ✅ Var | `ProductVariationsTable` mevcut |
| Multi-image gallery with zoom | ⚠️ Basit | LazyImage var ama zoom yok |
| Product comparison (detaylı) | ⚠️ Var | `compareStore.ts` var ama sadece 4 ürün |
| Wishlist with collections | ⚠️ Basit | Favoriler var ama koleksiyon yok |
| Product videos | ❌ Yok | Sadece resim |
| 360° product view | ❌ Yok | |
| Size guide | ❌ Yok | |

### 5.3 Sepet & Ödeme
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| Guest checkout | ❌ Yok | Login zorunlu |
| Save cart for later | ❌ Yok | Sepet sadece anlık |
| Abandoned cart recovery | ❌ Yok | Sepeti terk edenlere email yok |
| Multiple shipping addresses | ⚠️ Var | Adresler var ama sipariş başına tek adres |
| Installment options (taksit) | ❌ Yok | İyzico entegre ama aktif değil |
| Payment gateway redundancy | ❌ Yok | Stripe placeholder, İyzico aktif değil |
| Invoice / e-fatura | ⚠️ Var | Paraşüt entegre ama test edilmemiş |
| Order tracking integration | ⚠️ Var | Yurtiçi Kargo entegre ama test edilmemiş |

### 5.4 Kullanıcı Deneyimi
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| i18n (Çoklu dil) | ❌ Yok | Sadece Türkçe |
| PWA (Progressive Web App) | ❌ Yok | Service Worker yok |
| Push notifications | ❌ Yok | |
| Dark mode | ✅ Var | `themeStore.ts` mevcut |
| Accessibility (WCAG 2.1 AA) | ⚠️ Kısmen | ARIA label'lar eksik |
| Skeleton screens | ⚠️ Kısmen | Sadece LazyImage'te var |
| Error boundaries | ❌ Yok | Beyaz ekran riski |
| Loading states (optimistic UI) | ⚠️ Kısmen | Basit loading var |

### 5.5 Admin & Analytics
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| Real-time dashboard | ⚠️ Basit | `recharts` var ama canlı data yok |
| Sales analytics | ⚠️ Kısmen | Basit istatistikler var |
| User behavior analytics | ❌ Yok | Heatmap, funnel yok |
| A/B testing | ❌ Yok | |
| Admin activity log | ✅ Var | `auditLogger.ts` mevcut |
| Bulk operations | ❌ Yok | Toplu ürün güncelleme yok |
| Content management (CMS) | ⚠️ Var | Legal pages var ama sadece legal |
| SEO tools | ❌ Yok | Meta tag'ler var ama admin panelinden yönetilmiyor |

### 5.6 Altyapı & Ölçeklenebilirlik
| Özellik | Durum | Eksiklik |
|---------|-------|----------|
| CDN (CloudFront) | ❌ Yok | S3 + CloudFront kurulumu yok |
| Image optimization (Cloudinary/imgix) | ⚠️ Kısmen | LazyImage var ama CDN yok |
| Caching layer (Redis/ElastiCache) | ❌ Yok | Her istek DynamoDB'ye gidiyor |
| Message queue (SQS/SNS) | ⚠️ Kısmen | SNS var ama SQS yok |
| Database read replicas | ❌ Yok | DynamoDB global tables yok |
| Blue/green deployment | ❌ Yok | |
| Automated backups | ❌ Yok | DynamoDB backup politikası yok |
| Monitoring (Datadog/New Relic) | ❌ Yok | Sadece CloudWatch |

---

## 6. YOL HARİTASI (Önerilen Sıra)

### Faz 1: Güvenlik Acil Durumu (1-2 gün)
- [ ] K1: `generateSecureToken()` → `crypto.randomBytes()`
- [ ] K2: `checkRateLimit()` → DynamoDB tabanlı
- [ ] K3: Tek `isMockMode()` fonksiyonu (api.ts'te tut, diğerlerini kaldır)
- [ ] K4: Social login catch bloğunu kaldır (hata fırlat)
- [ ] K5: User API catch bloğunu kaldır
- [ ] K7: CORS wildcard'ları temizle
- [ ] K8: Token'ları `httpOnly` cookie'ye taşı

### Faz 2: Temel Fonksiyonellik (2-3 gün)
- [ ] K6: Payment endpoint'leri eşleştir
- [ ] K10: Reviews backend handler'ını yaz
- [ ] K11: Soft delete/restore endpoint'lerini yaz
- [ ] Y11: DynamoDB `ScanCommand` → `QueryCommand` + GSI
- [ ] Y1: fetch timeout ekle (10s)
- [ ] Y3: Token refresh race condition'ını düzelt

### Faz 3: Kod Kalitesi & Tutarlılık (3-5 gün)
- [ ] Y7: 3 chat store'u tekte birleştir
- [ ] O6: Shared package oluştur (password validation, email, vb.)
- [ ] O7: Tüm store'lara `partialize` ekle
- [ ] D5/D6: Duplicate dosyaları sil
- [ ] O12: `encryptObjectFields` recursive mantığını düzelt
- [ ] O14: Stock reservation conditional write yap

### Faz 4: Amazon/Trendyol Seviyesi Özellikler (2-4 hafta)
- [ ] Elasticsearch/OpenSearch entegrasyonu
- [ ] Autocomplete / Search suggestions
- [ ] Recommendation engine (basit collaborative filtering)
- [ ] Guest checkout
- [ ] Abandoned cart recovery (SQS + SES)
- [ ] Redis caching layer
- [ ] CloudFront CDN
- [ ] i18n (react-i18next)
- [ ] PWA (Service Worker + Workbox)
- [ ] Error boundaries + Loading skeletons

---

## 7. EK: DETAYLI KOD ÖRNEKLERİ

### K3 — `isMockMode()` Tutarsızlığı

```typescript
// src/services/api.ts (GÜVENLİ — K1 fix sonrası)
export const isMockMode = () => {
  if (FORCE_MOCK_MODE) return true;
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '' || envUrl.includes('your-api-gateway-url')) {
    console.error('[CONFIG ERROR] VITE_API_URL not configured!');
    return false;  // ← GÜVENLİ
  }
  return false;
};

// src/stores/authStore.ts (GÜVENSİZ — eski mantık)
const isMockMode = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '') return true;  // ← GÜVENLİK AÇIĞI
  if (envUrl.includes('your-api-gateway-url')) return true;  // ← GÜVENLİK AÇIĞI
  return false;
};

// src/services/googleAuth.ts (ÜÇÜNCÜ implementasyon!)
const isMockMode = () => {
  return import.meta.env.VITE_FORCE_MOCK_MODE === 'true' || 
         !import.meta.env.VITE_API_URL;
};
```

### Y11 — DynamoDB `ScanCommand` Maliyeti

```typescript
// YANLIŞ — Her arama TÜM tabloyu tarar ($$$)
const result = await dynamodb.send(new ScanCommand({
  TableName: PRODUCTS_TABLE,
}));
const products = result.Items.filter(p => p.name.includes(search));

// DOĞRU — Query + GSI kullan
const result = await dynamodb.send(new QueryCommand({
  TableName: PRODUCTS_TABLE,
  IndexName: 'SearchIndex',
  KeyConditionExpression: 'searchPrefix = :prefix',
  FilterExpression: 'contains(#name, :search)',
  ExpressionAttributeNames: { '#name': 'name' },
  ExpressionAttributeValues: { ':prefix': search[0], ':search': search },
}));
```

### O12 — `encryptObjectFields` Yanlış Recursive

```typescript
// YANLIŞ — Nested object'in TÜM alanlarını şifreliyor
encrypted[field] = await encryptObjectFields(
  obj[field],
  Object.keys(obj[field]),  // ← TÜM alanlar, sadece PII değil!
  context
);

// DOĞRU — Sadece belirli PII alanlarını şifrele
const NESTED_PII_FIELDS = ['street', 'city', 'phone'];
encrypted[field] = await encryptObjectFields(
  obj[field],
  NESTED_PII_FIELDS,
  context
);
```

---

*Bu rapor 4 paralel AI agent + manuel derinlemesine kod incelemesi ile oluşturulmuştur.*  
*Toplam incelenen dosya: 220 | Satır: 62,204 | Export: 654 | Süre: ~30 dakika*
