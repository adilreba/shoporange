/**
 * NetworkStatus
 * =============
 * Çevrimdışı/çevrimiçi durum bildirimi.
 * Native + Web desteği.
 */

import { useState, useEffect } from 'react';
import { onNetworkChange, isNative } from '@/lib/capacitor';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // İlk durum
    setOnline(navigator.onLine);

    const unsubscribe = onNetworkChange((status) => {
      const nowOnline = status.connected;
      setOnline(nowOnline);

      if (!nowOnline) {
        setShowBanner(true);
      } else {
        // Tekrar online olduğunda 3 saniye göster sonra kapat
        setShowBanner(true);
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        online
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
      style={{
        paddingTop: isNative() ? 'env(safe-area-inset-top, 8px)' : '8px',
      }}
    >
      <div className="flex items-center justify-center gap-2">
        {online ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>İnternet bağlantısı geri geldi</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>İnternet bağlantısı yok</span>
          </>
        )}
      </div>
    </div>
  );
}

export default NetworkStatus;
