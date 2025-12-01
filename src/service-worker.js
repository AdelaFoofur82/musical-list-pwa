// Cache names
const CACHE_STATIC = 'static-v1'
const CACHE_AUDIO = 'audio-v1'

// Archivos a cachear estáticamente
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
]

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  )
})

// Activación
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_STATIC, CACHE_AUDIO].includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  
  // Cachear archivos de audio
  if (url.pathname.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
    event.respondWith(
      caches.open(CACHE_AUDIO).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
    return
  }
  
  // Para otros archivos, usar network-first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear respuestas exitosas
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_STATIC).then(cache => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})

// Background sync para audio (experimental)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-audio') {
    console.log('Background sync for audio')
  }
})