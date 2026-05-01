import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"


// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AtusHome - Online Alışveriş',
        short_name: 'AtusHome',
        description: 'AtusHome e-ticaret platformu',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'aws-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 gün
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 yıl
              },
            },
          },
        ],
      },
    }),

    // Bundle analiz - build sonrasi dist/stats.html olusturur
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    // Gelistirme/debug plugin'i - sadece dev ortaminda yuklenir
    ...(process.env.NODE_ENV === 'development' 
      ? [(await import('kimi-plugin-inspect-react')).inspectAttr()] 
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ekosistemi - en kritik ve en sık kullanılan
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-helmet-async',
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
          ],
          // UI kütüphaneleri - Radix, Lucide, Tailwind utils
          'vendor-ui': [
            'lucide-react',
            'tailwind-merge',
            'clsx',
            'class-variance-authority',
            'vaul',
            'cmdk',
            'input-otp',
            'embla-carousel-react',
            'react-day-picker',
            'next-themes',
            'sonner',
          ],
          // Radix UI - çok sayıda modül, ayrı chunk'ta topla
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-icons',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // Form ve validasyon
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          // Grafik ve chart
          'vendor-charts': [
            'recharts',
          ],
          // State yönetimi ve data fetching
          'vendor-state': [
            'zustand',
            '@tanstack/react-query',
          ],
          // AWS SDK - frontend'de kullanılmıyor, kaldırıldı
          // 'vendor-aws': [
          //   'aws-sdk',
          //   'amazon-cognito-identity-js',
          // ],
          // Ödeme sistemleri
          'vendor-payment': [
            '@stripe/react-stripe-js',
            '@stripe/stripe-js',
            'iyzipay',
          ],
          // HTTP ve utilities
          'vendor-utils': [
            'axios',
            'date-fns',
            'bcryptjs',
          ],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
});
