import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Локально функций нет: /api проксируем на развёрнутые (по умолчанию — рабочий сайт).
  // Функции — на kolo.dakuta.dev; для превью ветки: KOLO_API_TARGET=https://<ветка>--dakuta-kolo.netlify.app npm run dev
  server: {
    proxy: {
      '/api': { target: process.env.KOLO_API_TARGET ?? 'https://kolo.dakuta.dev', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Регистрируем SW сами (src/utils/registerServiceWorker.ts), чтобы
      // управлять моментом активации нового деплоя вручную, без авто-инжекта
      injectRegister: null,
      manifest: {
        name: 'Kolo Sets',
        short_name: 'Kolo',
        description:
          'Learn words in almost any language with spaced repetition. Build flashcard collections, set a weekly goal, and let Kolo bring each word back right before you forget it.',
        theme_color: '#F5F6FA',
        background_color: '#F5F6FA',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Прекэшируем весь билд (все чанки роутов, включая lazy-loaded) —
        // после активации новой версии SW отдаёт уже новые файлы
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Firebase (Auth/Firestore) не проксируем через SW — только статика
        navigateFallbackDenylist: [/^\/__/, /^\/api\//],
      },
      devOptions: {
        // Не включаем SW в dev-режиме — избегаем кэш-сюрпризов при разработке
        enabled: false,
      },
    }),
  ],
})
