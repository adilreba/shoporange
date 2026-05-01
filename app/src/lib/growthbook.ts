/**
 * GrowthBook A/B Test Configuration
 * ================================
 * Kullanım:
 *   import { useFeature } from '@growthbook/growthbook-react';
 *   const variant = useFeature('homepage_hero_variant').value;
 * 
 * Test Tanımlamaları:
 *   1. homepage_hero_variant: Video vs Statik görsel
 *   2. cart_button_color: Turuncu vs Yeşil vs Mavi
 *   3. checkout_flow: Tek sayfa vs Çok adımlı
 *   4. free_shipping_threshold: 500 vs 750 vs 1000 TL
 *   5. discount_display: Yüzde vs TL kazanç
 * 
 * Admin Panel: /admin/ab-tests
 */

import { GrowthBook } from '@growthbook/growthbook-react';
import { analytics } from './analytics';

// =============================================================================
// CONFIG
// =============================================================================

const API_HOST = import.meta.env.VITE_GROWTHBOOK_API_HOST || 'https://cdn.growthbook.io';
const CLIENT_KEY = import.meta.env.VITE_GROWTHBOOK_CLIENT_KEY || '';
const DECRYPTION_KEY = import.meta.env.VITE_GROWTHBOOK_DECRYPTION_KEY || '';

// =============================================================================
// FEATURE FLAG DEFINITIONS
// =============================================================================

export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  variants: string[];
  defaultValue: string;
  targetPages?: string[];
  metrics?: string[];
}

export const ACTIVE_TESTS: TestDefinition[] = [
  {
    id: 'homepage_hero_variant',
    name: 'Ana Sayfa Hero Banner',
    description: 'Video mu yoksa statik görsel mi daha yüksek dönüşüm sağlıyor?',
    variants: ['static_image', 'video'],
    defaultValue: 'static_image',
    targetPages: ['/'],
    metrics: ['clickthrough_rate', 'conversion_rate'],
  },
  {
    id: 'cart_button_color',
    name: 'Sepete Ekle Buton Rengi',
    description: 'Hangi renk buton daha fazla sepete ekleme sağlıyor?',
    variants: ['orange', 'green', 'blue'],
    defaultValue: 'orange',
    targetPages: ['/products', '/product/:id'],
    metrics: ['add_to_cart_rate'],
  },
  {
    id: 'checkout_flow',
    name: 'Ödeme Akışı',
    description: 'Tek sayfa checkout mı yoksa çok adımlı mı daha iyi tamamlanma oranı veriyor?',
    variants: ['single_page', 'multi_step'],
    defaultValue: 'multi_step',
    targetPages: ['/checkout'],
    metrics: ['checkout_completion_rate', 'cart_abandonment_rate'],
  },
  {
    id: 'free_shipping_threshold',
    name: 'Ücretsiz Kargo Eşiği',
    description: 'Hangi eşik ortalama sipariş değerini (AOV) artırıyor?',
    variants: ['500', '750', '1000'],
    defaultValue: '500',
    targetPages: ['/cart', '/checkout'],
    metrics: ['average_order_value', 'conversion_rate'],
  },
  {
    id: 'discount_display',
    name: 'İndirim Gösterim Formatı',
    description: 'Yüzde olarak mı yoksa TL kazancı olarak mı göstermek daha etkili?',
    variants: ['percentage', 'amount_saved'],
    defaultValue: 'percentage',
    targetPages: ['/products', '/product/:id', '/cart'],
    metrics: ['clickthrough_rate', 'conversion_rate'],
  },
  {
    id: 'urgency_message',
    name: 'Aciliyet Mesajı',
    description: '"Son 3 ürün" mü yoksa "Stok azalıyor" mu daha etkili?',
    variants: ['stock_count', 'low_stock_generic'],
    defaultValue: 'low_stock_generic',
    targetPages: ['/product/:id'],
    metrics: ['add_to_cart_rate', 'conversion_rate'],
  },
  {
    id: 'product_card_layout',
    name: 'Ürün Kartı Tasarımı',
    description: 'Büyük fotoğraf mı yoksa fiyat vurgusu mu daha çok tıklanıyor?',
    variants: ['image_focused', 'price_focused', 'compact'],
    defaultValue: 'image_focused',
    targetPages: ['/products', '/'],
    metrics: ['clickthrough_rate'],
  },
  {
    id: 'trust_badge_position',
    name: 'Güven Rozeti Konumu',
    description: 'Header, footer veya ürün sayfası — hangi konum güveni artırıyor?',
    variants: ['header', 'product_page', 'checkout'],
    defaultValue: 'product_page',
    targetPages: ['*'],
    metrics: ['conversion_rate'],
  },
  {
    id: 'review_sort_default',
    name: 'Varsayılan Yorum Sıralaması',
    description: 'En yeni mi yoksa en faydalı mı?',
    variants: ['newest', 'most_helpful'],
    defaultValue: 'most_helpful',
    targetPages: ['/product/:id'],
    metrics: ['time_on_page', 'conversion_rate'],
  },
  {
    id: 'exit_intent_popup',
    name: 'Çıkış Niyeti Popup\'ı',
    description: 'Mouse çıkarken mi yoksa scroll up\'ta mı göstermek daha iyi?',
    variants: ['mouse_exit', 'scroll_up', 'disabled'],
    defaultValue: 'disabled',
    targetPages: ['/product/:id', '/cart'],
    metrics: ['cart_recovery_rate', 'conversion_rate'],
  },
];

// =============================================================================
// GROWTHBOOK CLIENT
// =============================================================================

export const growthbook = new GrowthBook({
  apiHost: API_HOST,
  clientKey: CLIENT_KEY,
  decryptionKey: DECRYPTION_KEY || undefined,
  enableDevMode: import.meta.env.DEV,

  // Tracking callback — test sonuçlarını GA4 + Pixel'e gönder
  trackingCallback: (experiment, result) => {
    const testDef = ACTIVE_TESTS.find(t => t.id === experiment.key);

    console.log(`[A/B Test] ${experiment.key}:`, {
      variant: result.variationId,
      value: result.value,
    });

    // GA4'e custom event olarak gönder
    analytics.customEvent('ab_test_exposure', {
      test_id: experiment.key,
      test_name: testDef?.name || experiment.key,
      variant_id: result.variationId,
      variant_value: result.value,
    });

    // GTM DataLayer'a gönder (GrowthBook entegrasyonu için)
    window.dataLayer?.push({
      event: 'ab_test_exposure',
      ab_test_id: experiment.key,
      ab_test_name: testDef?.name || experiment.key,
      ab_variant_id: result.variationId,
      ab_variant_value: result.value,
    });
  },

  // Kullanıcı atamalarını tutarlı yap (aynı kullanıcı aynı varyasyonu görür)
  // GrowthBook varsayılan olarak localStorage sticky bucket kullanır

  // Kullanıcı özellikleri
  attributes: {},
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Kullanıcı özelliklerini GrowthBook'a set et
 * (login, sayfa değişimi, sepet durumu vb. değişikliklerde çağrılır)
 */
export function setGrowthBookAttributes(attrs: Record<string, any>) {
  growthbook.setAttributes({
    ...growthbook.getAttributes(),
    ...attrs,
  });
}

/**
 * GrowthBook kullanıcı özelliklerini sıfırla (logout)
 */
export function clearGrowthBookAttributes() {
  growthbook.setAttributes({});
}

/**
 * Belirli bir sayfa için aktif testleri döndür
 */
export function getActiveTestsForPage(pathname: string): TestDefinition[] {
  return ACTIVE_TESTS.filter((test) => {
    if (!test.targetPages || test.targetPages.includes('*')) return true;
    return test.targetPages.some((page) => {
      // Exact match
      if (page === pathname) return true;
      // Wildcard match (e.g., /product/:id matches /product/123)
      if (page.includes(':')) {
        const regex = new RegExp('^' + page.replace(/:\w+/g, '\\w+') + '$');
        return regex.test(pathname);
      }
      return false;
    });
  });
}

/**
 * Test sonuçlarını formatla (admin panel için)
 */
export function getTestResults() {
  return ACTIVE_TESTS.map((test) => {
    // @ts-ignore — evalFeature internal API
    const feature = (growthbook as any).evalFeature?.(test.id) || { value: test.defaultValue };
    return {
      ...test,
      currentValue: feature.value ?? test.defaultValue,
      isOn: feature.on ?? true,
      source: feature.source ?? 'defaultValue',
      experiment: feature.experiment
        ? {
            key: feature.experiment.key,
            variations: feature.experiment.variations,
          }
        : null,
    };
  });
}

// =============================================================================
// FEATURE DEFAULTS (Offline fallback)
// =============================================================================

// GrowthBook API'ye ulaşılamazsa bu default değerler kullanılır
export const FEATURE_DEFAULTS: Record<string, any> = {
  homepage_hero_variant: 'static_image',
  cart_button_color: 'orange',
  checkout_flow: 'multi_step',
  free_shipping_threshold: '500',
  discount_display: 'percentage',
  urgency_message: 'low_stock_generic',
  product_card_layout: 'image_focused',
  trust_badge_position: 'product_page',
  review_sort_default: 'most_helpful',
  exit_intent_popup: 'disabled',
};

// Default'ları GrowthBook'a set et (API yanıtı gelene kadar fallback)
Object.entries(FEATURE_DEFAULTS).forEach(([key, value]) => {
  growthbook.setPayload({
    features: {
      ...growthbook.getPayload()?.features,
      [key]: { defaultValue: value },
    },
  });
});
