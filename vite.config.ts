import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { BRANDING } from './src/app/branding'

/**
 * Dev-only: browser calls same-origin `/api/...`; Vite forwards to the API origin.
 * Production builds do not use this — CloudFront routes `/api/*` on biowira.dpdns.org.
 */
import { loadEnv } from 'vite'
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
const BIOWIRA_API_ORIGIN = env.VITE_DEV_API_ORIGIN || 'https://api.biowira.dpdns.org'

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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        globIgnores: [
          // Home-page background duplicates are served from /backgrounds/ (canonical).
          // The /home-page/ copies were deleted; this guard prevents re-adding them.
          'home-page/home-background-*.webp',
          // /icons/nav/home-page/ mirrors /home-page/ for nav icons only.
          // Exclude everything EXCEPT the 5 small nav icons actually used by iconRegistry.ts.
          'icons/nav/home-page/home-background-*.webp',
        ],
        /**
         * Activate new precache revisions as soon as the updated service worker installs.
         * Pairs with `registerType: 'autoUpdate'` + workbox-window reload in the client.
         */
        skipWaiting: true,
        clientsClaim: true,
        // Hero PNG images exceed the 2 MiB Workbox default (desktop is ~2.8 MiB).
        // Raised to 4 MiB so all three device-specific hero assets are precached.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB
        // Prevent root SW from hijacking navigation to branch deployments
        navigateFallbackDenylist: [/^\/iteration\d+/],
        // Remove old precache entries from previous deployments.
        // Critical: ensures stale JS bundles (which may contain old /api paths)
        // are evicted from the cache when a new SW version takes over.
        cleanupOutdatedCaches: true,
        // Do not cache any /api/* network requests — always go to the network.
        // This prevents a cached response from an old /api/... endpoint masking
        // 404s or serving stale data after the backend contract changes.
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            // Cache audio files with CacheFirst + range-request support.
            // MP3s are large (music: ~3MB, SFX: ~100KB) — better served from cache on repeat visits.
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
            // Cache game static assets including the stage-preview-background.jpg.
            // These don't change unless a new deploy is pushed.
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
      // Production: CloudFront routes /api/* to the backend — no proxy needed.
      '/api': {
        target: BIOWIRA_API_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
      // Proxy CDN images so canvas drawing can import them without CORS issues.
      // In production, CloudFront should be configured with CORS headers.
      '/_cdn': {
        target: 'https://d1ap4awiq83k2q.cloudfront.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/_cdn/, ''),
      },
    },
  },
})
