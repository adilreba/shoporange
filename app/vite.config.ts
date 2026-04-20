import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
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
          // AWS SDK - büyük kütüphane, ayrı chunk
          'vendor-aws': [
            'aws-sdk',
            'amazon-cognito-identity-js',
          ],
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
