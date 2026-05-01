import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration
 * =======================
 * Native iOS/Android app configuration for AtusHome.
 * Web output: dist/ (Vite build directory)
 */

const config: CapacitorConfig = {
  appId: 'com.atushome.app',
  appName: 'AtusHome',
  webDir: 'dist',
  server: {
    // Production build'da true yapılacak
    // androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#f97316',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: '#0f172a',
      style: 'DARK',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'AtusHome',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0f172a',
  },
};

export default config;
