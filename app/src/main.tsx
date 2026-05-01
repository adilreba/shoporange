import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { initializeAnalytics } from './lib/analytics'
import { ABTestProvider } from './components/analytics/ABTestProvider'
import './i18n'
import './index.css'
import App from './App.tsx'

// =============================================================================
// ANALYTICS INITIALIZATION
// =============================================================================
// Cookie consent kontrolü içinde yapılır — kullanıcı analytics onayladıysa
// GA4, GTM, Hotjar, Clarity yüklenir. Marketing onayladıysa Pixel yüklenir.
initializeAnalytics()

// Service Worker kaydet (PWA)
registerSW({
  onNeedRefresh() {
    if (confirm('Yeni bir güncelleme mevcut. Sayfayı yenilemek ister misiniz?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('AtusHome çevrimdışı kullanıma hazır')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ABTestProvider>
      <App />
    </ABTestProvider>
  </StrictMode>,
)
