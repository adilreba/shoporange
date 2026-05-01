import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { initializeAnalytics } from './lib/analytics'
import { initializeCapacitor, onDeepLink } from './lib/capacitor'
import { ABTestProvider } from './components/analytics/ABTestProvider'
import './i18n'
import './index.css'
import App from './App.tsx'

// =============================================================================
// ANALYTICS INITIALIZATION
// =============================================================================
initializeAnalytics()

// =============================================================================
// CAPACITOR NATIVE INITIALIZATION
// =============================================================================
initializeCapacitor()

// Deep link handler (window.location ile, Router context gerektirmez)
onDeepLink((data) => {
  console.log('Deep link received:', data)
  if (data.path && data.path !== '/') {
    window.location.href = data.path + (data.queryParams ? '?' + new URLSearchParams(data.queryParams).toString() : '')
  }
})

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
