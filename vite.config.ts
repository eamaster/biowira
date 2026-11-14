import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { BRANDING } from './src/app/branding'

/**
 * Dev-only: browser calls same-origin `/api/...`; Vite forwards to the API origin.
 * Production builds do not use this — Cloudflare Pages functions route `/api/*` to Cloudflare Worker.
 */
import { loadEnv } from 'vite'
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
const BIOWIRA_API_ORIGIN = env.VITE_DEV_API_ORIGIN || 'https://biowira-api.smah0085.workers.dev'

/** Path prefix for branch deployments (e.g. '/ver1/'). Defaults to '/' for master. */
const BASE_PATH = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [BRANDING.favicon.slice(1), BRANDING.appleTouchIcon.slice(1)],
      manifest: {
        name: BRANDING.appName,
        short_name: BRANDING.appName,
        description: 'Discover amazing Malaysian rainforest animals!',
        theme_color: '#5B8A3C',
        background_color: '#F5E6C8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: BRANDING.pwaIcon192,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: BRANDING.pwaIcon512,
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        start_url: BASE_PATH,
        scope: BASE_PATH,
      },
      workbox: {
        // Precache only core app-shell scripts/styles so SW updates install immediately
        // instead of blocking on ~56 MB of media assets or pinning stale index.html.
        globPatterns: ['assets/*.{js,css}', '*.{ico,webmanifest}', 'icons/icon-*.png'],
        globIgnores: [
          'home-page/home-background-*.webp',
          'icons/nav/home-page/home-background-*.webp',
        ],
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB
        // Never intercept navigations with a precached stale index.html fallback;
        // NetworkFirst runtimeCaching below always prefers the latest deployed index.html.
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/iteration\d+/, /^\/api\//, /^\/assets\//, /^\/all_assets\//, /^\/avatars\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'biowira-pages-v2',
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/(all_assets|icons|backgrounds|avatars)\/.+\.(webp|png|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'biowira-media-v2',
              expiration: {
                maxEntries: 180,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /\/audio\/.+\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'biowira-audio-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/games\/.+\.(jpg|jpeg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'biowira-game-assets-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Generic /api proxy covers all backend endpoints including:
      //   POST /api/v1/tts/generate
      //   GET  /api/v1/tts/audio/{textHash}
      // Production: Cloudflare Pages functions route /api/* to Cloudflare Worker — no proxy needed.
      '/api': {
        target: BIOWIRA_API_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
