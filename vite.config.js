import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: false, // Usamos nuestro propio manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:mp3|wav|ogg|m4a|flac|aac)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:mp3|wav|ogg|m4a|flac|aac)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
              }
            }
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/musical-list-pwa/' : '/',
  server: {
    host: true,
    port: 3000
  }
})