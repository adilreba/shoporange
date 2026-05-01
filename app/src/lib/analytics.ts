/**
 * AtusHome Analytics Service
 * ===========================
 * Merkezi tracking service: GA4, Facebook Pixel, GTM, Hotjar
 * Cookie consent (KVKK) uyumlu - kullanıcı onayı olmadan analytics/marketing yüklenmez
 * 
 * Kullanım:
 *   import { analytics } from '@/lib/analytics'
 *   analytics.viewItem(product)
 *   analytics.addToCart(product, quantity)
 *   analytics.purchase(order)
 */

import type { Product } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

export interface AnalyticsProduct {
  item_id: string
  item_name: string
  item_category?: string
  item_category2?: string
  item_brand?: string
  price: number
  quantity?: number
  currency?: string
}

export interface AnalyticsOrder {
  transaction_id: string
  value: number
  tax?: number
  shipping?: number
  currency: string
  coupon?: string
  items: AnalyticsProduct[]
}

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  accepted: boolean
}

// =============================================================================
// CONFIG
// =============================================================================

const GA_ID = import.meta.env.VITE_GA_ID || ''
const GTM_ID = import.meta.env.VITE_GTM_ID || ''
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || ''
const HOTJAR_ID = import.meta.env.VITE_HOTJAR_ID || ''
const HOTJAR_SV = import.meta.env.VITE_HOTJAR_SV || '6'
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID || ''

const STORAGE_KEY = 'cookie_consent_v1'

// =============================================================================
// COOKIE CONSENT HELPERS
// =============================================================================

function getConsent(): CookiePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return { necessary: true, analytics: false, marketing: false, accepted: false }
}

function isAnalyticsAllowed(): boolean {
  return getConsent().analytics
}

function isMarketingAllowed(): boolean {
  return getConsent().marketing
}

// =============================================================================
// GA4 (Google Analytics 4)
// =============================================================================

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

function ensureGA4(): boolean {
  if (typeof window === 'undefined') return false
  if (window.gtag) return true
  if (!GA_ID) return false

  // Load GA4 script dynamically
  const existing = document.getElementById('ga4-script')
  if (existing) return true

  const script1 = document.createElement('script')
  script1.id = 'ga4-script'
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script1)

  const script2 = document.createElement('script')
  script2.id = 'ga4-config'
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      'anonymize_ip': true,
      'send_page_view': false,
      'currency': 'TRY',
      'transport_type': 'beacon'
    });
  `
  document.head.appendChild(script2)

  return true
}

// =============================================================================
// GTM (Google Tag Manager)
// =============================================================================

function ensureGTM(): boolean {
  if (typeof window === 'undefined') return false
  if (window.dataLayer) return true
  if (!GTM_ID) return false

  const existing = document.getElementById('gtm-script')
  if (existing) return true

  window.dataLayer = window.dataLayer || []

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GTM_ID}');
  `
  document.head.appendChild(script)

  return true
}

// =============================================================================
// FACEBOOK PIXEL
// =============================================================================

function ensurePixel(): boolean {
  if (typeof window === 'undefined') return false
  if (window.fbq) return true
  if (!FB_PIXEL_ID) return false

  const existing = document.getElementById('fb-pixel-script')
  if (existing) return true

  const script = document.createElement('script')
  script.id = 'fb-pixel-script'
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `
  document.head.appendChild(script)

  return true
}

function fbq(event: string, ...params: any[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(event, ...params)
  }
}

// =============================================================================
// HOTJAR
// =============================================================================

function ensureHotjar(): boolean {
  if (typeof window === 'undefined') return false
  if (!HOTJAR_ID) return false

  const existing = document.getElementById('hotjar-script')
  if (existing) return true

  const script = document.createElement('script')
  script.id = 'hotjar-script'
  script.innerHTML = `
    (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_SV}};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `
  document.head.appendChild(script)

  return true
}

// =============================================================================
// MICROSOFT CLARITY
// =============================================================================

function ensureClarity(): boolean {
  if (typeof window === 'undefined') return false
  if (!CLARITY_ID) return false

  const existing = document.getElementById('clarity-script')
  if (existing) return true

  const script = document.createElement('script')
  script.id = 'clarity-script'
  script.innerHTML = `
    (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${CLARITY_ID}");
  `
  document.head.appendChild(script)

  return true
}

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return

  // Analytics izni varsa GA4 + GTM + Hotjar + Clarity yükle
  if (isAnalyticsAllowed()) {
    ensureGA4()
    ensureGTM()
    ensureHotjar()
    ensureClarity()
  }

  // Marketing izni varsa Pixel yükle
  if (isMarketingAllowed()) {
    ensurePixel()
  }
}

// =============================================================================
// E-COMMERCE EVENTS — GA4
// =============================================================================

function mapProductToGA4(product: Product | AnalyticsProduct, quantity = 1): AnalyticsProduct {
  if ('item_id' in product) return { ...product, quantity }
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    item_category2: (product as any).subcategory || (product as any).subCategory,
    item_brand: product.brand,
    price: product.price,
    quantity,
    currency: 'TRY',
  }
}

function sendGA4Event(eventName: string, params: Record<string, any> = {}) {
  if (!isAnalyticsAllowed()) return
  ensureGA4()
  gtag('event', eventName, {
    ...params,
    send_to: GA_ID,
  })
}

function sendPixelEvent(eventName: string, params: Record<string, any> = {}) {
  if (!isMarketingAllowed()) return
  ensurePixel()
  fbq('track', eventName, params)
}

function sendDataLayer(event: string, ecommerce?: any) {
  if (!isAnalyticsAllowed()) return
  ensureGTM()
  window.dataLayer?.push({ event, ecommerce })
}

// =============================================================================
// PUBLIC API
// =============================================================================

export const analytics = {
  // ---------------------------------------------------------------------------
  // PAGE / NAVIGATION
  // ---------------------------------------------------------------------------

  pageView(path: string, title?: string) {
    if (!isAnalyticsAllowed()) return
    ensureGA4()
    gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      send_to: GA_ID,
    })
    sendDataLayer('pageview')
  },

  search(term: string, resultsCount?: number) {
    sendGA4Event('search', { search_term: term, results_count: resultsCount })
    sendPixelEvent('Search', { search_string: term })
    sendDataLayer('search', { search_term: term })
  },

  // ---------------------------------------------------------------------------
  // PRODUCT EVENTS
  // ---------------------------------------------------------------------------

  viewItem(product: Product | AnalyticsProduct) {
    const item = mapProductToGA4(product)
    sendGA4Event('view_item', {
      currency: 'TRY',
      value: item.price,
      items: [item],
    })
    sendPixelEvent('ViewContent', {
      content_ids: [item.item_id],
      content_type: 'product',
      value: item.price,
      currency: 'TRY',
    })
    sendDataLayer('view_item', { items: [item] })
  },

  viewItemList(items: (Product | AnalyticsProduct)[], listName: string) {
    const gaItems = items.map((p) => mapProductToGA4(p))
    sendGA4Event('view_item_list', {
      item_list_name: listName,
      items: gaItems,
    })
    sendDataLayer('view_item_list', { item_list_name: listName, items: gaItems })
  },

  selectItem(product: Product | AnalyticsProduct, listName?: string) {
    const item = mapProductToGA4(product)
    sendGA4Event('select_item', {
      item_list_name: listName || 'search_results',
      items: [item],
    })
    sendDataLayer('select_item', { item_list_name: listName, items: [item] })
  },

  // ---------------------------------------------------------------------------
  // CART EVENTS
  // ---------------------------------------------------------------------------

  addToCart(product: Product | AnalyticsProduct, quantity = 1) {
    const item = mapProductToGA4(product, quantity)
    sendGA4Event('add_to_cart', {
      currency: 'TRY',
      value: item.price * quantity,
      items: [item],
    })
    sendPixelEvent('AddToCart', {
      content_ids: [item.item_id],
      content_type: 'product',
      value: item.price * quantity,
      currency: 'TRY',
      num_items: quantity,
    })
    sendDataLayer('add_to_cart', { value: item.price * quantity, items: [item] })
  },

  removeFromCart(product: Product | AnalyticsProduct, quantity = 1) {
    const item = mapProductToGA4(product, quantity)
    sendGA4Event('remove_from_cart', {
      currency: 'TRY',
      value: item.price * quantity,
      items: [item],
    })
    sendDataLayer('remove_from_cart', { value: item.price * quantity, items: [item] })
  },

  viewCart(items: (Product | AnalyticsProduct)[], total: number) {
    const gaItems = items.map((p) => mapProductToGA4(p, 'quantity' in p ? (p as any).quantity : 1))
    sendGA4Event('view_cart', {
      currency: 'TRY',
      value: total,
      items: gaItems,
    })
    sendPixelEvent('InitiateCheckout', {
      content_ids: gaItems.map((i) => i.item_id),
      content_type: 'product',
      value: total,
      currency: 'TRY',
      num_items: gaItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    })
    sendDataLayer('view_cart', { value: total, items: gaItems })
  },

  // ---------------------------------------------------------------------------
  // CHECKOUT EVENTS
  // ---------------------------------------------------------------------------

  beginCheckout(items: (Product | AnalyticsProduct)[], total: number, coupon?: string) {
    const gaItems = items.map((p) => mapProductToGA4(p, 'quantity' in p ? (p as any).quantity : 1))
    sendGA4Event('begin_checkout', {
      currency: 'TRY',
      value: total,
      coupon,
      items: gaItems,
    })
    sendPixelEvent('InitiateCheckout', {
      content_ids: gaItems.map((i) => i.item_id),
      content_type: 'product',
      value: total,
      currency: 'TRY',
      num_items: gaItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    })
    sendDataLayer('begin_checkout', { value: total, coupon, items: gaItems })
  },

  addShippingInfo(items: (Product | AnalyticsProduct)[], total: number, shippingTier: string) {
    const gaItems = items.map((p) => mapProductToGA4(p, 'quantity' in p ? (p as any).quantity : 1))
    sendGA4Event('add_shipping_info', {
      currency: 'TRY',
      value: total,
      shipping_tier: shippingTier,
      items: gaItems,
    })
    sendDataLayer('add_shipping_info', { shipping_tier: shippingTier, items: gaItems })
  },

  addPaymentInfo(items: (Product | AnalyticsProduct)[], total: number, paymentType: string) {
    const gaItems = items.map((p) => mapProductToGA4(p, 'quantity' in p ? (p as any).quantity : 1))
    sendGA4Event('add_payment_info', {
      currency: 'TRY',
      value: total,
      payment_type: paymentType,
      items: gaItems,
    })
    sendDataLayer('add_payment_info', { payment_type: paymentType, items: gaItems })
  },

  // ---------------------------------------------------------------------------
  // PURCHASE
  // ---------------------------------------------------------------------------

  purchase(order: AnalyticsOrder) {
    sendGA4Event('purchase', {
      transaction_id: order.transaction_id,
      value: order.value,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      currency: order.currency || 'TRY',
      coupon: order.coupon,
      items: order.items,
    })
    sendPixelEvent('Purchase', {
      content_ids: order.items.map((i) => i.item_id),
      content_type: 'product',
      value: order.value,
      currency: order.currency || 'TRY',
      num_items: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    })
    sendDataLayer('purchase', {
      transaction_id: order.transaction_id,
      value: order.value,
      items: order.items,
    })
  },

  refund(order: AnalyticsOrder) {
    sendGA4Event('refund', {
      transaction_id: order.transaction_id,
      value: order.value,
      currency: order.currency || 'TRY',
      items: order.items,
    })
    sendDataLayer('refund', { transaction_id: order.transaction_id, value: order.value })
  },

  // ---------------------------------------------------------------------------
  // USER EVENTS
  // ---------------------------------------------------------------------------

  login(method: string) {
    sendGA4Event('login', { method })
    sendPixelEvent('CompleteRegistration', { content_name: 'login', status: true })
    sendDataLayer('login', { method })
  },

  signUp(method: string) {
    sendGA4Event('sign_up', { method })
    sendPixelEvent('CompleteRegistration', { content_name: 'sign_up', status: true })
    sendDataLayer('sign_up', { method })
  },

  // ---------------------------------------------------------------------------
  // ENGAGEMENT
  // ---------------------------------------------------------------------------

  addToWishlist(product: Product | AnalyticsProduct) {
    const item = mapProductToGA4(product)
    sendGA4Event('add_to_wishlist', {
      currency: 'TRY',
      value: item.price,
      items: [item],
    })
  },

  share(contentType: string, itemId: string) {
    sendGA4Event('share', { method: contentType, content_type: 'product', item_id: itemId })
  },

  // ---------------------------------------------------------------------------
  // CUSTOM EVENTS (GrowthBook / GTM için)
  // ---------------------------------------------------------------------------

  customEvent(name: string, params: Record<string, any> = {}) {
    sendGA4Event(name, params)
    sendDataLayer(name, params)
  },

  // ---------------------------------------------------------------------------
  // CONSENT UPDATE (CookieBanner'dan çağrılır)
  // ---------------------------------------------------------------------------

  updateConsent(preferences: CookiePreferences) {
    if (typeof window === 'undefined') return

    // GA4 consent mode
    if (window.gtag) {
      gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied',
      })
    }

    // Yeni izinlere göre servisleri yükle veya kaldır
    if (preferences.analytics) {
      initializeAnalytics()
    }

    if (preferences.marketing) {
      ensurePixel()
    }
  },
}

// Default export
export default analytics
