/**
 * Capacitor Native Integration
 * ============================
 * iOS/Android native özelliklerin yönetimi.
 * Web'de çalışmaz — sadece Capacitor runtime'da aktif.
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { Keyboard, KeyboardStyle, KeyboardResize } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DeepLinkData {
  url: string;
  path: string;
  queryParams: Record<string, string>;
}

export type DeepLinkHandler = (data: DeepLinkData) => void;

// =============================================================================
// UTILITIES
// =============================================================================

/** Capacitor native ortamda mı çalışıyoruz? */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/** iOS mu? */
export const isIOS = (): boolean => Capacitor.getPlatform() === 'ios';

/** Android mi? */
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

/** Web mi? */
export const isWeb = (): boolean => Capacitor.getPlatform() === 'web';

// =============================================================================
// STATUS BAR
// =============================================================================

export async function initStatusBar() {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn('StatusBar init failed:', err);
  }
}

/** Status bar rengini değiştir (örn: light page'de) */
export async function setStatusBarColor(color: string, style: Style = Style.Dark) {
  if (!isNative()) return;
  try {
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style });
  } catch (err) {
    console.warn('StatusBar color failed:', err);
  }
}

// =============================================================================
// SPLASH SCREEN
// =============================================================================

export async function hideSplashScreen() {
  if (!isNative()) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 500 });
  } catch (err) {
    console.warn('SplashScreen hide failed:', err);
  }
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

const deepLinkHandlers: DeepLinkHandler[] = [];

export function onDeepLink(handler: DeepLinkHandler): () => void {
  deepLinkHandlers.push(handler);
  return () => {
    const idx = deepLinkHandlers.indexOf(handler);
    if (idx >= 0) deepLinkHandlers.splice(idx, 1);
  };
}

export async function initPushNotifications() {
  if (!isNative()) return;

  try {
    // İzin iste
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission denied');
      return;
    }

    // Kayıt ol
    await PushNotifications.register();

    // Token al
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      // Backend'e token gönderilecek
      savePushToken(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    // Bildirim geldiğinde (app açıkken)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      // In-app toast göster
      Toast.show({
        text: notification.title || 'Yeni bildirim',
        duration: 'long',
      });
    });

    // Bildirime tıklandığında
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data as Record<string, any>;
      console.log('Push action performed:', data);

      // Deep link varsa işle
      if (data?.url || data?.deeplink) {
        const url = data.url || data.deeplink;
        const urlObj = new URL(url);
        deepLinkHandlers.forEach((h) =>
          h({
            url,
            path: urlObj.pathname,
            queryParams: Object.fromEntries(urlObj.searchParams),
          })
        );
      }
    });
  } catch (err) {
    console.error('Push notification init failed:', err);
  }
}

async function savePushToken(token: string) {
  try {
    await Preferences.set({ key: 'push_token', value: token });
  } catch (err) {
    console.warn('Failed to save push token:', err);
  }
}

// =============================================================================
// APP LIFECYCLE (background/foreground/Back button)
// =============================================================================

export async function initAppLifecycle() {
  if (!isNative()) return;

  try {
    // App background'a geçtiğinde
    App.addListener('appStateChange', (state) => {
      console.log('App state changed:', state.isActive ? 'active' : 'background');
      if (!state.isActive) {
        // Background'a geçerken yapılacaklar
      }
    });

    // Android back button
    App.addListener('backButton', (data) => {
      console.log('Back button pressed, canGoBack:', data.canGoBack);
      // Default behavior: navigate back in web view
      // Eğer geri gidilecek sayfa yoksa app'i minimize et
      if (!data.canGoBack) {
        App.minimizeApp();
      }
    });

    // App URL open (deep link)
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url);
      const urlObj = new URL(data.url);
      deepLinkHandlers.forEach((h) =>
        h({
          url: data.url,
          path: urlObj.pathname,
          queryParams: Object.fromEntries(urlObj.searchParams),
        })
      );
    });
  } catch (err) {
    console.error('App lifecycle init failed:', err);
  }
}

// =============================================================================
// KEYBOARD
// =============================================================================

export async function initKeyboard() {
  if (!isNative()) return;
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
  } catch (err) {
    console.warn('Keyboard init failed:', err);
  }
}

// =============================================================================
// NETWORK
// =============================================================================

export async function getNetworkStatus() {
  if (!isNative()) return { connected: navigator.onLine, connectionType: 'unknown' as const };
  try {
    return await Network.getStatus();
  } catch (err) {
    console.warn('Network status failed:', err);
    return { connected: navigator.onLine, connectionType: 'unknown' as const };
  }
}

export function onNetworkChange(callback: (status: { connected: boolean; connectionType: string }) => void) {
  if (!isNative()) {
    const handler = () => callback({ connected: navigator.onLine, connectionType: 'unknown' });
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }
  // Capacitor native listener
  const listener = Network.addListener('networkStatusChange', callback);
  return () => listener.then((l) => l.remove());
}

// =============================================================================
// NATIVE SHARE
// =============================================================================

export async function nativeShare(options: { title: string; text: string; url: string; dialogTitle?: string }) {
  if (!isNative()) {
    // Web fallback: Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title: options.title, text: options.text, url: options.url });
        return;
      } catch {
        // Kullanıcı iptal etti, sessizce geç
      }
    }
    // Fallback: clipboard'a kopyala
    try {
      await navigator.clipboard.writeText(options.url);
      Toast.show({ text: 'Link kopyalandı!', duration: 'short' });
    } catch {
      console.warn('Share fallback failed');
    }
    return;
  }

  try {
    await Share.share({
      title: options.title,
      text: options.text,
      url: options.url,
      dialogTitle: options.dialogTitle || 'Paylaş',
    });
  } catch (err) {
    console.warn('Native share failed:', err);
  }
}

// =============================================================================
// EXTERNAL BROWSER
// =============================================================================

export async function openInBrowser(url: string) {
  if (!isNative()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    await Browser.open({ url, presentationStyle: 'popover' });
  } catch (err) {
    console.warn('Browser open failed:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// =============================================================================
// PREFERENCES (Native key-value storage)
// =============================================================================

export const nativeStorage = {
  async set(key: string, value: string) {
    if (isNative()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  async get(key: string): Promise<string | null> {
    if (isNative()) {
      const result = await Preferences.get({ key });
      return result.value;
    }
    return localStorage.getItem(key);
  },
  async remove(key: string) {
    if (isNative()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};

// =============================================================================
// MAIN INITIALIZATION
// =============================================================================

export async function initializeCapacitor() {
  if (!isNative()) {
    console.log('Capacitor: running in web mode, native features disabled');
    return;
  }

  console.log('Capacitor: initializing native features...');

  await initStatusBar();
  await initKeyboard();
  await initPushNotifications();
  await initAppLifecycle();

  // Splash screen'i biraz sonra gizle (app yüklendikten sonra)
  setTimeout(() => {
    hideSplashScreen();
  }, 1500);

  console.log('Capacitor: native features initialized');
}

export default {
  isNative,
  isIOS,
  isAndroid,
  isWeb,
  initializeCapacitor,
  initStatusBar,
  setStatusBarColor,
  hideSplashScreen,
  initPushNotifications,
  initAppLifecycle,
  initKeyboard,
  getNetworkStatus,
  onNetworkChange,
  nativeShare,
  openInBrowser,
  onDeepLink,
  nativeStorage,
};
