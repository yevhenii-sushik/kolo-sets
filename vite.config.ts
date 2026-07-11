import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
          'Learn Norwegian with spaced repetition. Build flashcard collections, track your streak, and let the SM-2 algorithm surface the right words at the right time.',
        theme_color: '#FF5733',
        background_color: '#F5F2ED',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
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
        navigateFallbackDenylist: [/^\/__/],
      },
      devOptions: {
        // Не включаем SW в dev-режиме — избегаем кэш-сюрпризов при разработке
        enabled: false,
      },
    }),
  ],
})
