import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { BOOT_MS } from './src/config/boot'

// Метка сборки — одна на билд. Она вшита в код (__BUILD_ID__) и лежит в /version.json:
// если они расходятся, на устройстве открыта старая версия (src/utils/registerServiceWorker.ts)
const BUILD_ID = new Date().toISOString()

// /version.json не попадает в прекэш (в globPatterns нет .json), поэтому всегда идёт в сеть
// и показывает, какая сборка сейчас на сервере
function buildVersionFile(): Plugin {
  const body = JSON.stringify({ build: BUILD_ID })
  return {
    name: 'kolo-build-version',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(body)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: body })
    },
  }
}

// Статичная заставка в index.html видна, пока качается код, — когда ни i18n, ни src/config/boot.ts ещё нет.
// Вписываем ей тайминги и подписи всех языков из common.json → boot (чего нет — из английского),
// чтобы тексты жили там же, где остальные переводы
function bootSplashConfig(): Plugin {
  const dir = fileURLToPath(new URL('./src/locales/', import.meta.url))
  const read = (lang: string): Record<string, string> => {
    const file = `${dir}${lang}/common.json`
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).boot ?? {}) : {}
  }
  return {
    name: 'kolo-boot-splash',
    transformIndexHtml(html) {
      // Метка должна стоять ровно в одном месте — в коде заставки, не в комментарии
      if (html.split('__KOLO_BOOT__').length !== 2) throw new Error('index.html: метка __KOLO_BOOT__ для настроек заставки должна быть ровно одна')
      const en = read('en')
      const t: Record<string, Record<string, string>> = {}
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) t[entry.name] = { ...en, ...read(entry.name) }
      }
      // Внутри <script>: «<» экранируем, чтобы строка перевода не могла закрыть тег
      return html.replace('__KOLO_BOOT__', JSON.stringify({ ms: BOOT_MS, t }).replace(/</g, '\\u003c'))
    },
  }
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  // Локально функций нет: /api проксируем на развёрнутые (по умолчанию — рабочий сайт).
  // Функции — на kolo.dakuta.dev; для превью ветки: KOLO_API_TARGET=https://<ветка>--dakuta-kolo.netlify.app npm run dev
  server: {
    proxy: {
      '/api': { target: process.env.KOLO_API_TARGET ?? 'https://kolo.dakuta.dev', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    buildVersionFile(),
    bootSplashConfig(),
    VitePWA({
      registerType: 'autoUpdate',
      // Регистрируем SW сами (src/utils/registerServiceWorker.ts): перезагрузка на новую
      // версию ждёт безопасного момента, а не обрывает тренировку
      injectRegister: null,
      manifest: {
        name: 'Kolo',
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
        // после активации новой версии SW отдаёт уже новые файлы. Звуки (~330 КБ) — тоже, чтобы играли офлайн
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}'],
        // Картинка превью ссылок нужна только мессенджерам — не тянем её в кэш каждому пользователю
        globIgnores: ['**/og-image.png'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Firebase (Auth/Firestore) не проксируем через SW — только статика
        // robots.txt и sitemap.xml — настоящие файлы, а не страницы приложения
        navigateFallbackDenylist: [/^\/__/, /^\/api\//, /^\/(robots\.txt|sitemap\.xml)$/],
      },
      devOptions: {
        // Не включаем SW в dev-режиме — избегаем кэш-сюрпризов при разработке
        enabled: false,
      },
    }),
  ],
})
