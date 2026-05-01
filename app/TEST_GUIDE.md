# AtusHome Test Rehberi

## 1. PWA + Service Worker Testi

### A. Lighthouse Audit (Chrome DevTools)
1. Chrome'da `http://localhost:5173` aç
2. F12 → Lighthouse tab
3. "Progressive Web App" seç → "Analyze page load"
4. Beklenen: PWA kategorisi yeşil (90+) olmalı

### B. Offline Test
1. Chrome DevTools → Network tab
2. "Offline" seç (throttle dropdown)
3. Sayfayı yenile (`F5`)
4. Beklenen: Sayfa hâlâ yüklenmeli (Service Worker cache'den)

### C. Manifest Kontrolü
1. Chrome DevTools → Application tab → Manifest
2. `name: "AtusHome - Online Alışveriş"` görünmeli
3. Icons 192x192 ve 512x512 listelenmeli

### D. Service Worker Kontrolü
1. Chrome DevTools → Application → Service Workers
2. `sw.js` aktif görünmeli
3. "Update on reload" ile yeni build test edilebilir

---

## 2. i18n Testi

### A. Otomatik Dil Algılama
1. Browser dilini İngilizce yap (Chrome Settings → Languages → English)
2. `http://localhost:5173` aç
3. Beklenen: "Home", "Products", "Cart" gibi metinler İngilizce görünmeli

### B. localStorage Kontrolü
1. Chrome DevTools → Application → Local Storage
2. `i18nextLng` key'i `tr` veya `en` olmalı

### C. Manuel Dil Değiştirme (kodu yazdıktan sonra)
```js
// Console'da çalıştır
i18n.changeLanguage('en');
```

---

## 3. Image Optimization Testi

### A. WebP Formatı
1. Chrome DevTools → Network tab → Img filtresi
2. Sayfayı yenile
3. Görüntülerin `Content-Type: image/webp` olmalı (modern browser'da)

### B. srcSet / Responsive
1. Herhangi bir `<img>` elementini inspect et
2. `srcset` attribute'unda `320w, 640w, 960w...` olmalı

### C. Lazy Loading
1. Network tab'ı aç, "Disable cache" işaretle
2. Sayfayı aşağı kaydır
3. Beklenen: Görüntüler viewport'a yaklaştıkça yüklenmeli (200px önceden)

### D. CDN Prefix
1. `.env` dosyasına `VITE_CDN_URL=https://cdn.example.com` ekle
2. Görüntü URL'lerinin `https://cdn.example.com/...` ile başladığını kontrol et

---

## 4. Redis Testi

### A. Local Redis Başlat
```bash
docker run -d --name atus-redis -p 6379:6379 redis:7-alpine
```

### B. Test Script Çalıştır
```bash
# backend/.env'e ekle: REDIS_URL=redis://localhost:6379
cd backend && npx tsx scripts/test-redis.ts
```

### C. Manuel Kontrol (redis-cli)
```bash
docker exec -it atus-redis redis-cli
> KEYS *
> GET "test:key"
```

---

## 5. OpenSearch Testi

### A. Local OpenSearch Başlat
```bash
docker run -d --name atus-opensearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "DISABLE_SECURITY_PLUGIN=true" \
  opensearchproject/opensearch:2
```

### B. Test Script Çalıştır
```bash
# backend/.env'e ekle: OPENSEARCH_URL=http://localhost:9200
cd backend && npx tsx scripts/test-opensearch.ts
```

### C. Manuel Kontrol (curl)
```bash
curl http://localhost:9200/_cluster/health
curl http://localhost:9200/atushome-products/_search?q=test
```

---

## 6. SSR/Prerender Testi

### A. Build Sonrası Dosya Kontrolü
```bash
npm run build
ls -la dist/products/index.html
cat dist/products/index.html | grep "<div id=\"root\"></div>"
```

### B. Static Server ile Test
```bash
npx serve dist
# http://localhost:3000/products adresine git
# Sayfa yüklenebilmeli (404 yerine index.html serve edilmeli)
```

### C. Deploy Sonrası (S3 + CloudFront)
```bash
curl https://your-domain.com/products
curl https://your-domain.com/categories
```

---

## Hızlı Tüm Testler

```bash
# 1. Redis + OpenSearch container'ları başlat
docker run -d --name atus-redis -p 6379:6379 redis:7-alpine
docker run -d --name atus-opensearch -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "DISABLE_SECURITY_PLUGIN=true" \
  opensearchproject/opensearch:2

# 2. Backend env ayarla
echo "REDIS_URL=redis://localhost:6379" >> backend/.env
echo "OPENSEARCH_URL=http://localhost:9200" >> backend/.env

# 3. Frontend build + prerender
npm run build

# 4. Test script'leri çalıştır
cd backend && npx tsx scripts/test-redis.ts
npx tsx scripts/test-opensearch.ts
```
