/**
 * useMobileDetect
 * ===============
 * Cihaz tipi, boyut ve native platform tespiti.
 */

import { useState, useEffect } from 'react';
import { isNative, isIOS, isAndroid } from '@/lib/capacitor';

interface MobileDetectResult {
  /** Mobil cihaz mı? */
  isMobile: boolean;
  /** Tablet mi? */
  isTablet: boolean;
  /** iOS native app mi? */
  isIOSApp: boolean;
  /** Android native app mi? */
  isAndroidApp: boolean;
  /** Herhangi bir native app mi? */
  isNativeApp: boolean;
  /** Ekran boyutu */
  width: number;
  height: number;
  /** Yatay mod mu? */
  isLandscape: boolean;
  /** Touch desteği var mı? */
  hasTouch: boolean;
}

export function useMobileDetect(): MobileDetectResult {
  const [state, setState] = useState<MobileDetectResult>(() => ({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isIOSApp: isIOS(),
    isAndroidApp: isAndroid(),
    isNativeApp: isNative(),
    width: window.innerWidth,
    height: window.innerHeight,
    isLandscape: window.innerWidth > window.innerHeight,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }));

  useEffect(() => {
    const handleResize = () => {
      setState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isIOSApp: isIOS(),
        isAndroidApp: isAndroid(),
        isNativeApp: isNative(),
        width: window.innerWidth,
        height: window.innerHeight,
        isLandscape: window.innerWidth > window.innerHeight,
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}

export default useMobileDetect;
