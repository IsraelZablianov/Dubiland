import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const base = isGitHubPages ? '/Dubiland/' : '/';

const DAY_IN_SECONDS = 60 * 60 * 24;
const WEEK_IN_SECONDS = DAY_IN_SECONDS * 7;
const MONTH_IN_SECONDS = DAY_IN_SECONDS * 30;

export default defineConfig({
  base,
  envDir: path.resolve(__dirname, '../../'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'robots.txt', 'llms.txt'],
      manifest: {
        id: base,
        name: 'Dubiland',
        short_name: 'Dubiland',
        description: 'Hebrew-first learning platform for children ages 3-7.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#FFF8E7',
        background_color: '#FFFFFF',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/(?:api|auth|rest)\//, /supabase\.co\/(?:auth|rest|storage|functions)\//],
        runtimeCaching: [
          // Auth/session/API traffic must never be cached by SW.
          {
            urlPattern: /supabase\.co\/(?:auth|rest|storage|functions)\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/(?:api|auth|rest)\//,
            handler: 'NetworkOnly',
          },
          // HTML app shell for previously visited routes.
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell-pages',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: WEEK_IN_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Core hashed assets (JS/CSS/fonts/workers) with stale-while-revalidate.
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ['script', 'style', 'font', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-runtime-assets',
              expiration: {
                maxEntries: 128,
                maxAgeSeconds: MONTH_IN_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Audio manifest and audio files are stale-while-revalidate for reliability.
          {
            urlPattern: /\/audio\/he\/manifest\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'audio-manifest',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: DAY_IN_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/audio\/he\/.*\.(?:mp3|m4a|aac|ogg|wav)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'audio-assets',
              expiration: {
                maxEntries: 1200,
                maxAgeSeconds: MONTH_IN_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Local images should be resilient offline after first visit.
          {
            urlPattern: /\/images\/.*\.(?:avif|webp|png|jpe?g|svg)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-assets',
              expiration: {
                maxEntries: 256,
                maxAgeSeconds: MONTH_IN_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
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
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
