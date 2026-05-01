# AtusHome Mobil Uygulama Rehberi

Capacitor.js ile iOS ve Android native uygulama geliştirme rehberi.

## Kurulum

```bash
# Bağımlılıklar zaten kurulu (package.json'da)
npm install

# Web build (dist/ klasörüne çıktı verir)
npm run build

# Native projelere asset'leri kopyala
npm run cap:sync

# iOS Xcode ile aç
npm run cap:ios

# Android Android Studio ile aç
npm run cap:android
```

## Hızlı Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run cap:sync` | Web asset'leri native projelere kopyalar |
| `npm run cap:ios` | Xcode'u açar |
| `npm run cap:android` | Android Studio'yu açar |
| `npm run cap:build:ios` | Build → Sync → Xcode |
| `npm run cap:build:android` | Build → Sync → Android Studio |
| `npm run cap:copy` | Sadece web asset'leri kopyalar (sync olmadan) |

## Mimari

```
Web App (React + Vite + PWA)
        ↓
   Capacitor Bridge
        ↓
   ┌─────────┬─────────┐
   ↓         ↓         ↓
  iOS     Android    Web (PWA)
```

## Native Özellikler

### Status Bar
- iOS: Dark tema, #0f172a arka plan
- Android: Aynı tema, overlay kapalı

### Splash Screen
- 2 saniye gösterilir
- #0f172a arka plan
- Turuncu spinner
- Fade out 500ms

### Push Notifications
- iOS: APNs üzerinden
- Android: Firebase Cloud Messaging (FCM)
- Sunucu tarafı backend entegrasyonu gerekli

### Deep Links
- `atushome://product/123` → Ürün detay
- `atushome://order/456` → Sipariş detay
- `atushome://cart` → Sepet

### Native Share
- iOS: Share Sheet
- Android: Native share dialog
- Web: Web Share API veya clipboard

## iOS Yayınlama (App Store)

### Gereksinimler
1. Apple Developer hesabı ($99/yıl)
2. Xcode 15+
3. macOS

### Adımlar
```bash
# 1. Build ve sync
npm run cap:build:ios

# 2. Xcode'da açılacak
# 3. Signing & Capabilities → Team seç
# 4. Product → Archive
# 5. Organizer'dan App Store Connect'e yükle
```

### Ayarlamalar
- `ios/App/App/capacitor.config.json` → appId kontrol et
- App Store Connect'te yeni app oluştur
- App Icon (1024x1024) ve Screenshots
- Privacy manifest (PrivacyInfo.xcprivacy)

## Android Yayınlama (Google Play)

### Gereksinimler
1. Google Play Developer hesabı ($25 bir kerelik)
2. Android Studio

### Adımlar
```bash
# 1. Build ve sync
npm run cap:build:android

# 2. Android Studio'da açılacak
# 3. Build → Generate Signed Bundle/APK
# 4. AAB (Android App Bundle) oluştur
# 5. Google Play Console'a yükle
```

### Keystore Oluşturma
```bash
keytool -genkey -v -keystore atushome.keystore -alias atushome -keyalg RSA -keysize 2048 -validity 10000
```

### build.gradle Ayarları
```gradle
android {
    defaultConfig {
        applicationId "com.atushome.app"
        minSdkVersion 22
        targetSdkVersion 34
    }
}
```

## Plugin Listesi

| Plugin | Kullanım |
|--------|----------|
| `@capacitor/app` | Lifecycle, back button, deep links |
| `@capacitor/status-bar` | Status bar renk/stil |
| `@capacitor/splash-screen` | Açılış ekranı |
| `@capacitor/push-notifications` | Push bildirimleri |
| `@capacitor/keyboard` | Klavye davranışı |
| `@capacitor/network` | İnternet durumu |
| `@capacitor/share` | Native paylaşım |
| `@capacitor/browser` | Harici tarayıcı |
| `@capacitor/preferences` | Native key-value storage |
| `@capacitor/toast` | Native toast mesajları |

## Web vs Native Davranış

Tüm Capacitor kodları `isNative()` kontrolü ile çalışır:

```typescript
import { isNative, nativeShare, openInBrowser } from '@/lib/capacitor';

if (isNative()) {
  // Sadece native app'te çalışır
  nativeShare({ title: 'AtusHome', text: 'Harika ürünler!', url: 'https://atushome.com' });
} else {
  // Web fallback
  navigator.share(...);
}
```

## CSS Safe Area Desteği

```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

React bileşeni:
```tsx
import { SafeAreaView } from '@/components/mobile/SafeAreaWrapper';

<SafeAreaView>
  <PageContent />
</SafeAreaView>
```

## Geliştirme Workflow

1. Web'de geliştir: `npm run dev`
2. Native test: `npm run build && npx cap sync && npx cap open ios/android`
3. Hot reload için Live Reload ayarla (capacitor.config.ts'te server.url)

## Sorun Giderme

### iOS
- `pod install` hatası: `cd ios/App && pod install --repo-update`
- Signing hatası: Xcode'da Team seç
- White screen: `npx cap sync` yap, dist/ boş olmamalı

### Android
- Gradle sync hatası: Android Studio'da "Sync Now" tıkla
- Min SDK hatası: `build.gradle`'da `minSdkVersion 22`
- White screen: `npx cap sync` yap, `android/app/src/main/assets/public/` kontrol et

## Sıradaki Adımlar

1. ✅ Capacitor kurulumu
2. ✅ Native plugin'ler
3. ✅ Deep link yapılandırması (kod)
4. ⬜ iOS App Icon ve Splash Screen asset'leri
5. ⬜ Android App Icon ve Splash Screen asset'leri
6. ⬜ Push Notification backend entegrasyonu
7. ⬜ App Store / Google Play yayınlama
