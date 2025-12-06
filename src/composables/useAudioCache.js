import { ref, computed } from 'vue'

const DB_NAME = 'AudioCacheDB'
const DB_VERSION = 1
const STORE_NAME = 'audioFiles'

// Estado global para cacheo
const currentlyCaching = ref(null) // URL que se está cacheando actualmente
const cacheQueue = ref([]) // Cola de URLs pendientes de cacheo
const cachedUrls = ref(new Set()) // URLs ya cacheadas

export function useAudioCache() {
  let db = null

  /**
   * Inicializar IndexedDB
   */
  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        loadCachedUrls()
        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        const database = event.target.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'url' })
        }
      }
    })
  }

  /**
   * Cargar lista de URLs cacheadas
   */
  const loadCachedUrls = async () => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAllKeys()

      request.onsuccess = () => {
        cachedUrls.value = new Set(request.result)
        console.log(`📦 ${cachedUrls.value.size} audios en caché`)
        resolve(cachedUrls.value)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Verificar si una URL está cacheada
   */
  const isCached = (url) => {
    return cachedUrls.value.has(url)
  }

  /**
   * Obtener estado de caché para una URL
   */
  const getCacheStatus = (url) => {
    if (currentlyCaching.value === url) {
      return 'caching' // Se está cacheando ahora
    }
    if (cacheQueue.value.includes(url)) {
      return 'queued' // En cola para cachear
    }
    if (isCached(url)) {
      return 'cached' // Ya está cacheado
    }
    return 'not-cached' // No está cacheado
  }

  /**
   * Cachear un archivo de audio
   */
  const cacheAudio = async (url, title = '') => {
    if (!db) await initDB()
    
    // Si ya está cacheado, no hacer nada
    if (isCached(url)) {
      console.log(`✅ Ya cacheado: ${title || url}`)
      return true
    }

    // Si ya está en proceso o en cola, no agregarlo de nuevo
    if (currentlyCaching.value === url || cacheQueue.value.includes(url)) {
      console.log(`⏳ Ya en proceso/cola: ${title || url}`)
      return false
    }

    // Agregar a la cola
    cacheQueue.value.push(url)
    
    // Si no hay nada cacheándose, empezar
    if (!currentlyCaching.value) {
      await processCacheQueue()
    }

    return true
  }

  /**
   * Procesar cola de cacheo (uno a la vez)
   */
  const processCacheQueue = async () => {
    while (cacheQueue.value.length > 0) {
      const url = cacheQueue.value[0]
      currentlyCaching.value = url

      try {
        console.log(`📥 Cacheando: ${url}`)
        
        // Descargar el archivo
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const blob = await response.blob()
        
        // Guardar en IndexedDB
        await new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.put({ 
            url, 
            blob,
            cachedAt: Date.now(),
            size: blob.size,
            type: blob.type
          })

          request.onsuccess = () => {
            cachedUrls.value.add(url)
            console.log(`✅ Cacheado: ${url}`)
            resolve()
          }
          request.onerror = () => reject(request.error)
        })

      } catch (error) {
        console.error(`❌ Error cacheando ${url}:`, error)
      } finally {
        // Quitar de la cola y continuar
        cacheQueue.value.shift()
        currentlyCaching.value = null
      }
    }
  }

  /**
   * Obtener audio desde caché o URL
   */
  const getAudio = async (url) => {
    if (!db) await initDB()

    // Si está en caché, obtenerlo de IndexedDB
    if (isCached(url)) {
      try {
        const cached = await new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readonly')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.get(url)

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })

        if (cached && cached.blob) {
          console.log(`💾 Usando caché: ${url}`)
          return URL.createObjectURL(cached.blob)
        }
      } catch (error) {
        console.error(`Error obteniendo de caché: ${url}`, error)
      }
    }

    // Si no está en caché, devolver URL original
    return url
  }

  /**
   * Eliminar un audio del caché
   */
  const removeCached = async (url) => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.delete(url)

      request.onsuccess = () => {
        cachedUrls.value.delete(url)
        console.log(`🗑️ Eliminado de caché: ${url}`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Re-cachear un audio (eliminar y volver a cachear)
   */
  const recacheAudio = async (url, title = '') => {
    if (isCached(url)) {
      await removeCached(url)
    }
    return cacheAudio(url, title)
  }

  /**
   * Obtener tamaño total del caché
   */
  const getCacheSize = async () => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, item) => sum + (item.size || 0), 0)
        resolve(totalSize)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Limpiar toda la caché
   */
  const clearCache = async () => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.clear()

      request.onsuccess = () => {
        cachedUrls.value.clear()
        console.log('🧹 Caché limpiada')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  return {
    // Estado
    currentlyCaching,
    cacheQueue,
    cachedUrls,

    // Métodos
    initDB,
    isCached,
    getCacheStatus,
    cacheAudio,
    getAudio,
    removeCached,
    recacheAudio,
    getCacheSize,
    clearCache
  }
}
