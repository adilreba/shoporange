/**
 * GrowthBook A/B Test Provider
 * =============================
 * Uygulamanın kök seviyesinde sarmalar. Şunları yapar:
 * 1. Sayfa değişikliklerinde GrowthBook'a bildirir
 * 2. Kullanıcı login/logout durumlarını GrowthBook'a senkronize eder
 * 3. Sepet durumunu (ürün sayısı, toplam tutar) GrowthBook'a bildirir
 * 4. Aktif sayfaya göre ilgili testleri yükler
 */

import { useEffect, useRef } from 'react';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { useLocation } from 'react-router-dom';
import { growthbook, setGrowthBookAttributes } from '@/lib/growthbook';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

// ---------------------------------------------------------------------------
// GrowthBook Attribute Sync Hook
// ---------------------------------------------------------------------------

function useGrowthBookSync() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const cartStore = useCartStore();
  const totalItems = cartStore.totalItems();
  const totalPrice = cartStore.totalPrice();
  const prevPathRef = useRef(location.pathname);

  // Sayfa değişikliğinde GrowthBook'a bildir
  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;

      // Sayfa bazlı özellikleri güncelle
      setGrowthBookAttributes({
        page: location.pathname,
        url: window.location.href,
        referrer: document.referrer,
      });

      // GrowthBook'u refresh et (yeni sayfa için farklı testler yüklenebilir)
      growthbook.refreshFeatures();
    }
  }, [location.pathname]);

  // Kullanıcı durumu değiştiğinde GrowthBook'a bildir
  useEffect(() => {
    const attrs: Record<string, any> = {
      loggedIn: isAuthenticated,
    };

    if (user) {
      attrs.id = user.id;
      attrs.email = user.email;
      attrs.role = user.role;
      attrs.name = user.name;
    }

    setGrowthBookAttributes(attrs);
  }, [user, isAuthenticated]);

  // Sepet durumu değiştiğinde GrowthBook'a bildir
  useEffect(() => {
    setGrowthBookAttributes({
      cartItems: totalItems,
      cartValue: totalPrice,
      hasItems: totalItems > 0,
      isHighValueCart: totalPrice > 1000,
    });
  }, [totalItems, totalPrice]);

  // İlk yüklemede GrowthBook'u başlat
  useEffect(() => {
    // GrowthBook'u init et (API'den feature'ları çek)
    growthbook.init({ streaming: true }).catch((err: any) => {
      console.warn('[GrowthBook] Init failed, using defaults:', err);
    });

    return () => {
      growthbook.destroy();
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

export function ABTestProvider({ children }: { children: React.ReactNode }) {
  useGrowthBookSync();

  return (
    <GrowthBookProvider growthbook={growthbook}>
      {children}
    </GrowthBookProvider>
  );
}

export default ABTestProvider;
