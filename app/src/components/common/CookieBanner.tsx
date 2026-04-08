/**
 * KVKK Çerez Politikası Banner
 * Kullanıcı çerez kullanımına onay vermeden önce gösterilir
 */

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  accepted: boolean;
  timestamp?: string;
}

const STORAGE_KEY = 'cookie_consent_v1';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Zorunlu çerezler her zaman aktif
    analytics: false,
    marketing: false,
    accepted: false,
  });

  useEffect(() => {
    // LocalStorage'dan kullanıcı tercihini kontrol et
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.accepted) {
        setIsVisible(false);
        setPreferences(parsed);
        // Google Analytics'i yükle (eğer analytics onaylıysa)
        if (parsed.analytics) {
          loadGoogleAnalytics();
        }
      } else {
        setIsVisible(true);
      }
    } else {
      // İlk ziyaret - banner göster
      setIsVisible(true);
    }
  }, []);

  const loadGoogleAnalytics = () => {
    // Google Analytics yükleme fonksiyonu
    const gtagId = import.meta.env.VITE_GA_ID;
    if (!gtagId) return;

    // Script ekle
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
    document.head.appendChild(script1);

    // Gtag config
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gtagId}', { 'anonymize_ip': true });
    `;
    document.head.appendChild(script2);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    const data = {
      ...prefs,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setPreferences(prefs);
    setIsVisible(false);

    // Analytics çerezleri onaylandıysa yükle
    if (prefs.analytics) {
      loadGoogleAnalytics();
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      accepted: true,
    });
  };

  const handleAcceptNecessary = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      accepted: true,
    });
  };

  const handleSavePreferences = () => {
    savePreferences({
      ...preferences,
      accepted: true,
    });
    setShowDetails(false);
  };

  const handleRejectAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      accepted: true,
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Ana Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Sol: İkon ve Metin */}
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                <Cookie className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Çerez Kullanımı
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Web sitemizde size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz. 
                  Çerez politikamız hakkında daha fazla bilgi alabilirsiniz.{' '}
                  <Link 
                    to="/legal/cerez-politikasi" 
                    className="text-orange-500 hover:underline"
                  >
                    Çerez Politikası
                  </Link>
                </p>
              </div>
            </div>

            {/* Sağ: Butonlar */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-gray-600 dark:text-gray-400"
              >
                <Settings className="w-4 h-4 mr-1" />
                Ayarlar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptNecessary}
                className="border-gray-300 dark:border-gray-600"
              >
                <Shield className="w-4 h-4 mr-1" />
                Sadece Zorunlu
              </Button>
              
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Tümünü Kabul Et
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı Ayarlar Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Cookie className="w-5 h-5 text-orange-500" />
              Çerez Tercihleri
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Hangi çerezlerin kullanılacağını seçin. Zorunlu çerezler site çalışması için gereklidir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Zorunlu Çerezler */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Zorunlu Çerezler
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Site çalışması için gerekli olan çerezler. Güvenlik, oturum yönetimi ve sepet işlemleri için kullanılır.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analitik Çerezler */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Analitik Çerezler
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Site kullanımını analiz etmek ve performansı iyileştirmek için kullanılır. Google Analytics dahildir.
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Pazarlama Çerezleri */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Pazarlama Çerezleri
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Size özel reklamlar göstermek ve pazarlama kampanyalarını optimize etmek için kullanılır.
                </p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={handleRejectAll}
              className="text-gray-600 dark:text-gray-400"
            >
              <X className="w-4 h-4 mr-1" />
              Tümünü Reddet
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Tercihleri Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CookieBanner;
