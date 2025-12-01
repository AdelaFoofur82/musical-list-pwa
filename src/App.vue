<template>
  <div class="container-fluid min-vh-100 bg-light">
    <!-- Navbar simple -->
    <nav class="navbar navbar-dark bg-purple shadow-sm mb-4">
      <div class="container">
        <span class="navbar-brand">
          <i class="bi bi-music-note-beamed me-2"></i>
          {{ readOnlyMode ? playlistName : 'Music List PWA' }}
        </span>
        <div>
          <button v-if="showInstallButton" @click="installPWA" class="btn btn-sm btn-light">
            <i class="bi bi-download me-1"></i> Instalar
          </button>
        </div>
      </div>
    </nav>

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <!-- Card principal -->
          <div class="card shadow border-0">
            <div class="card-body p-4">
              <h2 class="card-title mb-4 text-purple">
                <i class="bi bi-music-note-list me-2"></i>
                {{ readOnlyMode ? playlistName : 'Crea tu Lista de Música' }}
              </h2>
              
              <!-- Mensaje de modo solo lectura -->
              <div v-if="readOnlyMode" class="alert alert-info mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <span>
                    <i class="bi bi-eye me-2"></i>
                    Estás viendo una lista compartida (solo reproducción)
                  </span>
                  <button @click="exitReadOnlyMode" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-pencil me-1"></i> Crear mi propia lista
                  </button>
                </div>
              </div>
              
              <!-- Reproductor ARRIBA en modo solo lectura -->
              <div v-if="songs.length > 0 && readOnlyMode" class="card bg-dark text-white mb-4">
                <div class="card-body">
                  <h5 class="card-title">
                    <i class="bi bi-play-btn me-2"></i>
                    Reproductor
                  </h5>
                  
                  <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <small>Ahora sonando:</small>
                      <small v-if="currentSong">{{ currentSong.title || 'Canción actual' }}</small>
                    </div>
                    
                    <audio 
                      ref="audioPlayer"
                      :src="currentSong?.url"
                      @ended="playNext"
                      controls
                      class="w-100"
                    ></audio>
                    
                    <div class="d-flex justify-content-center mt-3">
                      <button @click="playPrevious" class="btn btn-outline-light btn-sm mx-2" :disabled="!hasPrevious">
                        <i class="bi bi-skip-backward"></i>
                      </button>
                      <button @click="togglePlay" class="btn btn-light btn-sm mx-2">
                        <i class="bi" :class="{'bi-pause': isPlaying, 'bi-play': !isPlaying}"></i>
                      </button>
                      <button @click="playNext" class="btn btn-outline-light btn-sm mx-2" :disabled="!hasNext">
                        <i class="bi bi-skip-forward"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Campo nombre de playlist en modo edición -->
              <div v-if="!readOnlyMode" class="mb-4">
                <label class="form-label fw-bold">
                  <i class="bi bi-card-heading me-1"></i>
                  Nombre de tu lista
                </label>
                <input 
                  type="text" 
                  v-model="playlistName"
                  @input="saveToStorage"
                  class="form-control form-control-lg"
                  placeholder="Mi Lista de Música"
                >
              </div>
              
              <!-- Formulario SIMPLE para agregar canciones -->
              <div v-if="!readOnlyMode" class="mb-4">
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-link-45deg me-1"></i>
                    URL de la canción
                  </label>
                  <input 
                    type="url" 
                    v-model="newSongUrl"
                    class="form-control form-control-lg"
                    placeholder="https://ejemplo.com/cancion.mp3"
                    @keyup.enter="addSong"
                  >
                </div>
                
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-card-text me-1"></i>
                    Título (opcional)
                  </label>
                  <input 
                    type="text" 
                    v-model="newSongTitle"
                    class="form-control"
                    placeholder="Nombre de la canción"
                    @keyup.enter="addSong"
                  >
                </div>
                
                <button @click="addSong" class="btn btn-purple btn-lg w-100">
                  <i class="bi bi-plus-circle me-2"></i>
                  Agregar a la Lista
                </button>
                
                <div class="form-text mt-2 text-center">
                  <i class="bi bi-info-circle me-1"></i>
                  También puedes compartir URLs desde otras apps
                </div>
              </div>
              
              <!-- Lista de canciones VISIBLE -->
              <div v-if="songs.length > 0" class="mb-4">
                <h4 class="mb-3">
                  <i class="bi bi-list-ul me-2"></i>
                  {{ readOnlyMode ? 'Lista de Canciones' : 'Tu Lista' }} ({{ songs.length }} canciones)
                </h4>
                
                <div class="list-group">
                  <div 
                    v-for="(song, index) in songs" 
                    :key="index"
                    class="list-group-item list-group-item-action border-start-0 border-end-0 rounded-0"
                    :class="{ 'active': currentSongIndex === index }"
                    @click="currentSongIndex = index"
                  >
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center">
                        <span class="badge bg-purple me-3">{{ index + 1 }}</span>
                        <div>
                          <div class="fw-bold">{{ song.title || 'Sin título' }}</div>
                          <small class="text-muted d-block text-truncate" style="max-width: 300px;">
                            {{ song.url }}
                          </small>
                        </div>
                      </div>
                      
                      <div v-if="!readOnlyMode" class="btn-group btn-group-sm">
                        <button 
                          class="btn btn-outline-secondary"
                          @click.stop="moveSongUp(index)"
                          :disabled="index === 0"
                          title="Mover arriba"
                        >
                          <i class="bi bi-arrow-up"></i>
                        </button>
                        <button 
                          class="btn btn-outline-secondary"
                          @click.stop="moveSongDown(index)"
                          :disabled="index === songs.length - 1"
                          title="Mover abajo"
                        >
                          <i class="bi bi-arrow-down"></i>
                        </button>
                        <button 
                          class="btn btn-outline-danger"
                          @click.stop="removeSong(index)"
                          title="Eliminar"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="!readOnlyMode" class="text-end mt-2">
                  <button @click="clearPlaylist" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash me-1"></i> Limpiar todo
                  </button>
                </div>
              </div>
              
              <!-- Reproductor SIMPLE (solo en modo edición, abajo) -->
              <div v-if="songs.length > 0 && !readOnlyMode" class="card bg-dark text-white mt-4">
                <div class="card-body">
                  <h5 class="card-title">
                    <i class="bi bi-play-btn me-2"></i>
                    Reproductor
                  </h5>
                  
                  <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <small>Ahora sonando:</small>
                      <small v-if="currentSong">{{ currentSong.title || 'Canción actual' }}</small>
                    </div>
                    
                    <audio 
                      ref="audioPlayer"
                      :src="currentSong?.url"
                      @ended="playNext"
                      controls
                      class="w-100"
                    ></audio>
                    
                    <div class="d-flex justify-content-center mt-3">
                      <button @click="playPrevious" class="btn btn-outline-light btn-sm mx-2" :disabled="!hasPrevious">
                        <i class="bi bi-skip-backward"></i>
                      </button>
                      <button @click="togglePlay" class="btn btn-light btn-sm mx-2">
                        <i class="bi" :class="{'bi-pause': isPlaying, 'bi-play': !isPlaying}"></i>
                      </button>
                      <button @click="playNext" class="btn btn-outline-light btn-sm mx-2" :disabled="!hasNext">
                        <i class="bi bi-skip-forward"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Compartir lista SIMPLE (solo en modo edición) -->
              <div v-if="!readOnlyMode" class="mt-4">
                <div class="d-grid gap-2">
                  <button @click="copyShareLink" class="btn btn-success btn-lg" :disabled="songs.length === 0">
                    <i class="bi" :class="linkCopied ? 'bi-check-circle' : 'bi-clipboard'"></i>
                    <span class="ms-2">{{ linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de la lista' }}</span>
                  </button>
                </div>
                
                <div class="text-center mt-2">
                  <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    El enlace contiene toda tu lista de canciones
                  </small>
                </div>
              </div>
              
              <!-- Instrucciones -->
              <div v-if="!readOnlyMode" class="alert alert-info mt-4">
                <h5><i class="bi bi-lightbulb me-2"></i> Cómo usar:</h5>
                <ol class="mb-0">
                  <li>Ponle un nombre a tu lista</li>
                  <li>Pega URLs de canciones (MP3, WAV, etc.)</li>
                  <li>Ordena las canciones como quieras</li>
                  <li>Copia el enlace para compartir</li>
                  <li>¡Comparte con amigos!</li>
                </ol>
              </div>
            </div>
          </div>
          
          <!-- Info PWA -->
          <div class="card mt-4 border-0 shadow-sm">
            <div class="card-body text-center">
              <i class="bi bi-phone display-4 text-purple mb-3"></i>
              <h5>Instala como App</h5>
              <p class="text-muted">Usa el botón "Instalar" para tenerla en tu teléfono como app nativa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast simple -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div ref="toast" class="toast" role="alert">
        <div class="toast-body d-flex justify-content-between align-items-center">
          <span id="toast-message"></span>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as bootstrap from 'bootstrap'

export default {
  name: 'App',
  
  setup() {
    // Estado básico
    const songs = ref([])
    const playlistName = ref('Mi Lista de Música')
    const readOnlyMode = ref(false)
    const newSongUrl = ref('')
    const newSongTitle = ref('')
    const currentSongIndex = ref(0)
    const isPlaying = ref(false)
    const audioPlayer = ref(null)
    const showInstallButton = ref(false)
    const deferredPrompt = ref(null)
    const toast = ref(null)
    const bootstrapToast = ref(null)
    const linkCopied = ref(false)

    // Computed properties
    const currentSong = computed(() => songs.value[currentSongIndex.value])
    const hasPrevious = computed(() => currentSongIndex.value > 0)
    const hasNext = computed(() => currentSongIndex.value < songs.value.length - 1)

    // Inicialización
    onMounted(() => {
      initToast()
      setupPWA()
      loadFromStorage()
      checkUrlForPlaylist()
      handleShareTarget()
    })

    const initToast = () => {
      if (toast.value) {
        bootstrapToast.value = new bootstrap.Toast(toast.value)
      }
    }

    const setupPWA = () => {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt.value = e
        showInstallButton.value = true
      })
    }

    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem('musicPlaylist')
        if (saved) {
          songs.value = JSON.parse(saved)
        }
        const savedName = localStorage.getItem('playlistName')
        if (savedName) {
          playlistName.value = savedName
        }
      } catch (e) {
        console.error('Error cargando:', e)
      }
    }

    const saveToStorage = () => {
      localStorage.setItem('musicPlaylist', JSON.stringify(songs.value))
      localStorage.setItem('playlistName', playlistName.value)
    }

    const handleShareTarget = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const sharedUrl = urlParams.get('url')
      const sharedText = urlParams.get('text')
      
      if (sharedUrl) {
        const title = urlParams.get('title') || sharedText || 'Canción compartida'
        songs.value.push({
          url: sharedUrl,
          title: title
        })
        saveToStorage()
        showToast('¡Canción agregada desde compartir!', 'success')
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    const checkUrlForPlaylist = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const playlistParam = urlParams.get('playlist')
      const nameParam = urlParams.get('name')
      
      if (playlistParam) {
        try {
          // Decodificar desde base64 (con soporte UTF-8)
          const decoded = decodeURIComponent(atob(playlistParam))
          const parsed = JSON.parse(decoded)
          if (Array.isArray(parsed)) {
            songs.value = parsed
            readOnlyMode.value = true
            
            // Cargar nombre si existe
            if (nameParam) {
              playlistName.value = decodeURIComponent(nameParam)
            }
            
            showToast('Lista cargada - Modo solo reproducción', 'info')
            
            // NO limpiar URL en modo solo lectura para mantener el contexto
          }
        } catch (e) {
          console.error('Error:', e)
          showToast('Error cargando lista', 'danger')
        }
      }
    }

    // Métodos principales
    const addSong = () => {
      const url = newSongUrl.value.trim()
      const title = newSongTitle.value.trim() || `Canción ${songs.value.length + 1}`
      
      if (url) {
        songs.value.push({
          url: url,
          title: title
        })
        newSongUrl.value = ''
        newSongTitle.value = ''
        saveToStorage()
        showToast('Canción agregada', 'success')
        
        // Enfocar el campo de URL para seguir agregando
        setTimeout(() => {
          document.querySelector('input[type="url"]').focus()
        }, 100)
      } else {
        showToast('Ingresa una URL', 'warning')
      }
    }

    const removeSong = (index) => {
      songs.value.splice(index, 1)
      saveToStorage()
      showToast('Canción eliminada', 'info')
    }

    const moveSongUp = (index) => {
      if (index > 0) {
        [songs.value[index], songs.value[index - 1]] = [songs.value[index - 1], songs.value[index]]
        if (currentSongIndex.value === index) currentSongIndex.value--
        saveToStorage()
      }
    }

    const moveSongDown = (index) => {
      if (index < songs.value.length - 1) {
        [songs.value[index], songs.value[index + 1]] = [songs.value[index + 1], songs.value[index]]
        if (currentSongIndex.value === index) currentSongIndex.value++
        saveToStorage()
      }
    }

    const togglePlay = () => {
      if (!audioPlayer.value || !currentSong.value) return
      
      if (isPlaying.value) {
        audioPlayer.value.pause()
      } else {
        audioPlayer.value.play()
      }
      isPlaying.value = !isPlaying.value
    }

    const playNext = () => {
      if (hasNext.value) {
        currentSongIndex.value++
        nextTick(() => {
          if (audioPlayer.value) {
            audioPlayer.value.play()
            isPlaying.value = true
          }
        })
      }
    }

    const playPrevious = () => {
      if (hasPrevious.value) {
        currentSongIndex.value--
        nextTick(() => {
          if (audioPlayer.value) {
            audioPlayer.value.play()
            isPlaying.value = true
          }
        })
      }
    }

    const copyShareLink = async () => {
      if (songs.value.length === 0) {
        showToast('Agrega canciones primero', 'warning')
        return
      }
      
      try {
        // Generar hash desde JSON usando base64 (con soporte UTF-8)
        const playlistString = JSON.stringify(songs.value)
        // Codificar para soportar caracteres Unicode
        const encoded = btoa(encodeURIComponent(playlistString))
        const encodedName = encodeURIComponent(playlistName.value)
        const shareUrl = `${window.location.origin}${window.location.pathname}?playlist=${encoded}&name=${encodedName}`
        
        // Copiar al portapapeles
        try {
          await navigator.clipboard.writeText(shareUrl)
        } catch (clipErr) {
          // Fallback para navegadores sin clipboard API
          const textarea = document.createElement('textarea')
          textarea.value = shareUrl
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        
        // Mostrar feedback visual
        linkCopied.value = true
        showToast('¡Enlace copiado al portapapeles!', 'success')
        
        // Resetear el estado después de 3 segundos
        setTimeout(() => {
          linkCopied.value = false
        }, 3000)
        
      } catch (err) {
        console.error('Error:', err)
        showToast('Error al copiar enlace', 'danger')
      }
    }

    const clearPlaylist = () => {
      if (songs.value.length === 0) return
      
      if (confirm('¿Seguro que quieres borrar toda la lista?')) {
        songs.value = []
        saveToStorage()
        showToast('Lista borrada', 'info')
      }
    }

    const exitReadOnlyMode = () => {
      readOnlyMode.value = false
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      showToast('Ahora puedes editar tu lista', 'success')
    }

    const installPWA = async () => {
      if (deferredPrompt.value) {
        deferredPrompt.value.prompt()
        const { outcome } = await deferredPrompt.value.userChoice
        if (outcome === 'accepted') {
          showInstallButton.value = false
          showToast('App instalada', 'success')
        }
        deferredPrompt.value = null
      }
    }

    const showToast = (message, type = 'success') => {
      const toastMessage = document.getElementById('toast-message')
      if (toastMessage && toast.value) {
        toastMessage.textContent = message
        
        // Color según tipo
        const colors = {
          success: 'bg-success text-white',
          info: 'bg-info text-white',
          warning: 'bg-warning text-dark',
          danger: 'bg-danger text-white'
        }
        
        toast.value.className = 'toast ' + (colors[type] || colors.success)
        bootstrapToast.value?.show()
      }
    }

    return {
      // Estado
      songs,
      playlistName,
      readOnlyMode,
      newSongUrl,
      newSongTitle,
      currentSong,
      isPlaying,
      audioPlayer,
      showInstallButton,
      toast,
      linkCopied,
      
      // Computed
      hasPrevious,
      hasNext,
      currentSongIndex,
      
      // Métodos
      addSong,
      removeSong,
      moveSongUp,
      moveSongDown,
      togglePlay,
      playNext,
      playPrevious,
      copyShareLink,
      clearPlaylist,
      exitReadOnlyMode,
      installPWA
    }
  }
}
</script>

<style>
/* Estilos personalizados simples */
:root {
  --purple: #6f42c1;
}

.bg-purple {
  background-color: var(--purple) !important;
}

.text-purple {
  color: var(--purple) !important;
}

.btn-purple {
  background-color: var(--purple);
  border-color: var(--purple);
  color: white;
}

.btn-purple:hover {
  background-color: #5a32a3;
  border-color: #5a32a3;
  color: white;
}

.card {
  border-radius: 10px;
}

.list-group-item.active {
  background-color: rgba(111, 66, 193, 0.1);
  border-color: var(--purple);
  color: var(--purple);
}

.badge.bg-purple {
  background-color: var(--purple) !important;
}

/* Mejorar apariencia del input de URL */
input[type="url"]:focus,
input[type="text"]:focus {
  border-color: var(--purple);
  box-shadow: 0 0 0 0.25rem rgba(111, 66, 193, 0.25);
}

/* Ajustes responsivos */
@media (max-width: 768px) {
  .card-body {
    padding: 1rem !important;
  }
  
  .btn-group .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  
  .text-truncate {
    max-width: 200px;
  }
}
</style>