<template>
  <div class="container-fluid min-vh-100 bg-light">
    <!-- Navbar simple -->
    <nav class="navbar navbar-dark bg-purple shadow-sm mb-4">
      <div class="container">
        <span class="navbar-brand">
          <i class="bi bi-music-note-beamed me-2"></i>
          Sambango Prepa
        </span>
        <div class="d-flex gap-2 align-items-center">
          <a href="https://github.com/AdelaFoofur82/sambango-prepa" target="_blank" class="btn btn-sm btn-outline-light"
            title="Ver código fuente">
            <i class="bi bi-github"></i>
          </a>
          <button v-if="showInstallButton" @click="installPWA" class="btn btn-sm btn-light">
            <i class="bi bi-download me-1"></i> Instalar
          </button>
        </div>
      </div>
    </nav>

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">

          <!-- Gestor de Playlists (solo en modo edición) -->
          <div v-if="!readOnlyMode" class="card shadow border-0 mb-3">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="bi bi-collection-play me-2"></i>
                Mis Listas
              </h5>
              <button @click="showPlaylistManager = !showPlaylistManager" class="btn btn-sm btn-outline-primary">
                <i class="bi" :class="showPlaylistManager ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                {{ showPlaylistManager ? 'Ocultar' : 'Gestionar' }}
              </button>
            </div>

            <div v-show="showPlaylistManager" class="card-body">
              <!-- Lista de playlists -->
              <div class="list-group mb-3">
                <div v-for="playlist in playlists" :key="playlist.id"
                  class="list-group-item d-flex justify-content-between align-items-center"
                  :class="{ 'active': playlist.id === activePlaylistId }" @click="selectPlaylist(playlist.id)"
                  style="cursor: pointer;">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-music-note-list me-2"></i>
                    <div>
                      <div class="fw-bold">{{ playlist.name }}</div>
                      <small class="text-muted">{{ playlist.songs.length }} canciones</small>
                    </div>
                  </div>
                  <div class="btn-group btn-group-sm" @click.stop>
                    <button @click="renamePlaylist(playlist.id)" class="btn btn-outline-secondary" title="Renombrar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button @click="deletePlaylist(playlist.id)" class="btn btn-outline-danger"
                      :disabled="playlists.length === 1" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Crear nueva playlist -->
              <div class="input-group">
                <input v-model="newPlaylistName" type="text" class="form-control" placeholder="Nueva lista de música..."
                  @keyup.enter="createPlaylist">
                <button @click="createPlaylist" class="btn btn-purple">
                  <i class="bi bi-plus-circle me-1"></i>
                  Crear
                </button>
              </div>
            </div>
          </div>

          <!-- Card principal -->
          <div class="card shadow border-0">
            <div class="card-body p-4">
              <h2 class="card-title mb-4 text-purple">
                <i class="bi bi-music-note-list me-2"></i>
                {{ readOnlyMode ? playlistName : playlistName }}
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

              <!-- Reproductor ÚNICO (visible en ambos modos) -->
              <div v-if="songs.length > 0" class="card bg-dark text-white mb-4">
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

                    <!-- Elemento de audio con controles nativos -->
                    <audio ref="audioPlayer" controls class="w-100" preload="none"></audio>

                    <div class="d-flex justify-content-center mt-3">
                      <button @click="restartPlaylist" class="btn btn-outline-warning btn-sm mx-1"
                        title="Volver al inicio de la lista">
                        <i class="bi bi-skip-start-fill"></i>
                      </button>
                      <button @click="playPrevious" class="btn btn-outline-light btn-sm mx-1" :disabled="!hasPrevious">
                        <i class="bi bi-skip-backward"></i>
                      </button>
                      <button @click="restartTrack" class="btn btn-outline-light btn-sm mx-1" :disabled="!currentSong"
                        title="Reiniciar canción actual">
                        <i class="bi bi-arrow-clockwise"></i>
                      </button>
                      <button v-if="!(isPlaying || isPlayingTTS)" @click="play" class="btn btn-light btn-sm mx-1">
                        <i class="bi bi-play"></i>
                      </button>
                      <button v-else @click="pause" class="btn btn-light btn-sm mx-1">
                        <i class="bi bi-pause"></i>
                      </button>
                      <button @click="playNext" class="btn btn-outline-light btn-sm mx-1" :disabled="!hasNext">
                        <i class="bi bi-skip-forward"></i>
                      </button>
                    </div>

                    <!-- Selector de voz TTS -->
                    <div v-if="availableVoices.length > 0" class="mt-3">
                      <label class="form-label small">
                        <i class="bi bi-mic me-1"></i>
                        Voz del título:
                      </label>
                      <select v-model="selectedVoiceIndex" class="form-select form-select-sm">
                        <option v-for="(voice, index) in availableVoices" :key="index" :value="index">
                          {{ voice.name }} ({{ voice.lang }})
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Audio invisible para preview cuando no hay canciones -->
              <audio v-if="songs.length === 0" ref="audioPlayer" class="d-none" preload="none"></audio>

              <!-- Campo nombre de playlist en modo edición -->
              <div v-if="!readOnlyMode" class="mb-4">
                <label class="form-label fw-bold">
                  <i class="bi bi-card-heading me-1"></i>
                  Nombre de tu lista
                </label>
                <input type="text" v-model="playlistName" @input="saveToStorage" class="form-control form-control-lg"
                  placeholder="Mi Lista de Música">
              </div>

              <!-- Formulario SIMPLE para agregar canciones -->
              <div v-if="!readOnlyMode" class="mb-4">
                <!-- Toggle para cambiar entre URL manual y explorador -->
                <div class="d-flex justify-content-center mb-3">
                  <div class="btn-group" role="group">
                    <button type="button" class="btn" :class="useUrlInput ? 'btn-primary' : 'btn-outline-primary'"
                      @click="useUrlInput = true">
                      <i class="bi bi-link-45deg me-1"></i>
                      URL Manual
                    </button>
                    <button type="button" class="btn" :class="!useUrlInput ? 'btn-primary' : 'btn-outline-primary'"
                      @click="toggleInputMode">
                      <i class="bi bi-folder-music me-1"></i>
                      Explorar Sambango
                    </button>
                  </div>
                </div>

                <!-- Explorador de archivos Sambango -->
                <div v-if="!useUrlInput" class="card bg-dark text-white mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="card-title mb-0">
                        <i class="bi bi-music-note-list me-2"></i>
                        Explorador de Ritmos Sambango
                      </h6>
                      <button @click="handleReloadSambangoTree" class="btn btn-sm btn-outline-light"
                        :disabled="loadingSambangoTree" title="Recargar biblioteca">
                        <i class="bi bi-arrow-clockwise"></i>
                      </button>
                    </div>

                    <!-- Breadcrumb de navegación -->
                    <nav v-if="currentPath.length > 0" aria-label="breadcrumb" class="mb-3">
                      <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item">
                          <a href="#" @click.prevent="handleNavigateToRoot" class="text-decoration-none">
                            <i class="bi bi-house-fill"></i>
                          </a>
                        </li>
                        <li v-for="(part, index) in currentPath" :key="index" class="breadcrumb-item text-white"
                          :class="{ 'active': index === currentPath.length - 1 }">
                          <a v-if="index < currentPath.length - 1" href="#"
                            @click.prevent="handleNavigateToBreadcrumb(index)" class="text-decoration-none">
                            {{ part }}
                          </a>
                          <span v-else>{{ part }}</span>
                        </li>
                      </ol>
                    </nav>

                    <!-- Loading -->
                    <div v-if="loadingSambangoTree" class="text-center py-4">
                      <div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                      <p class="mt-2 mb-0">Explorando biblioteca...</p>
                    </div>

                    <!-- Lista de archivos y carpetas -->
                    <div v-else-if="getCurrentFolder" ref="sambangoTreeContainer" class="list-group list-group-flush"
                      style="max-height: 60vh; overflow-y: auto; overflow-x: hidden;">
                      <!-- Botón volver si no estamos en raíz -->
                      <button v-if="currentPath.length > 0" @click="handleNavigateBack"
                        class="list-group-item list-group-item-action bg-secondary text-white border-dark sticky-top"
                        style="z-index: 1;">
                        <i class="bi bi-arrow-left me-2"></i>
                        Volver
                      </button>

                      <!-- Carpetas -->
                      <button v-for="item in (getCurrentFolder || []).filter(i => i.type === 'folder')" :key="item.name"
                        @click="handleNavigateToFolder(item.name)"
                        class="list-group-item list-group-item-action bg-dark text-white border-dark">
                        <i class="bi bi-folder-fill text-warning me-2"></i>
                        {{ item.name }}
                      </button>

                      <!-- Archivos MP3 -->
                      <div v-for="item in (getCurrentFolder || []).filter(i => i.type === 'file')" :key="item.url"
                        class="list-group-item list-group-item-action bg-dark text-white border-dark d-flex justify-content-between align-items-center"
                        :class="{ 'active': selectedMp3?.url === item.url }">
                        <div @click="selectMp3File(item)" class="flex-grow-1" style="cursor: pointer;">
                          <i class="bi bi-file-music text-info me-2"></i>
                          {{ item.title }}
                        </div>
                        <div class="btn-group btn-group-sm" @click.stop>
                          <button v-if="previewingUrl !== item.url" @click="handlePlayPreview(item.url)"
                            class="btn btn-outline-light" title="Preview">
                            <i class="bi bi-play-fill"></i>
                          </button>
                          <button v-if="previewingUrl === item.url" @click="handleStopPreview()"
                            class="btn btn-outline-danger" title="Stop Preview">
                            <i class="bi bi-stop-fill"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Mensaje si está vacío -->
                      <div v-if="(getCurrentFolder || []).length === 0" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i>
                        <p class="mb-0">Carpeta vacía</p>
                      </div>
                    </div>

                    <!-- Archivo seleccionado -->
                    <div v-if="selectedMp3" class="alert alert-info mt-3 mb-0">
                      <strong>Seleccionado:</strong> {{ selectedMp3.title }}
                    </div>
                  </div>
                </div>

                <!-- Campos de entrada manual (siempre visibles para mostrar selección) -->
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-link-45deg me-1"></i>
                    URL de la canción
                  </label>
                  <input type="url" v-model="newSongUrl" class="form-control form-control-lg"
                    :class="{ 'bg-light': !useUrlInput && selectedMp3 }" placeholder="https://ejemplo.com/cancion.mp3"
                    :readonly="!useUrlInput" @keyup.enter="addSong">
                </div>

                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-card-text me-1"></i>
                    Título (opcional)
                  </label>
                  <input type="text" v-model="newSongTitle" class="form-control"
                    :class="{ 'bg-light': !useUrlInput && selectedMp3 }" placeholder="Nombre de la canción"
                    @keyup.enter="addSong">
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
                  <div v-for="(song, index) in songs" :key="index"
                    class="list-group-item list-group-item-action border-start-0 border-end-0 rounded-0 cursor-pointer"
                    :class="{
                      'active': currentSongIndex === index,
                      'dragging': draggedIndex === index,
                      'drag-over': dragOverIndex === index && draggedIndex !== index
                    }" @click="playIndex(index, false)" :draggable="false" @dragover="onDragOver($event, index)"
                    @dragleave="onDragLeave($event)" @drop.prevent="onDrop($event, index)">
                    <div class="d-flex justify-content-between align-items-center">
                      <div class="d-flex align-items-center flex-grow-1">
                        <!-- Handle de arrastre (solo en modo edición) -->
                        <span v-if="!readOnlyMode" class="drag-handle me-2" draggable="true"
                          @dragstart="onDragStart($event, index)" @dragend="onDragEnd" @click.stop
                          title="Arrastra para reordenar">
                          <i class="bi bi-grip-vertical"></i>
                        </span>
                        <span class="badge bg-purple me-3">{{ index + 1 }}</span>
                        <div class="flex-grow-1">
                          <div class="fw-bold">{{ song.title || 'Sin título' }}</div>
                          <small class="text-muted d-block text-truncate" style="max-width: 300px;">
                            {{ song.url }}
                          </small>
                        </div>
                      </div>

                      <div class="d-flex align-items-center gap-2">
                        <!-- Botón de caché -->
                        <button v-if="getCacheStatus(song.url) === 'caching'" class="btn btn-sm btn-outline-primary"
                          disabled title="Cacheando..." @click.stop>
                          <span class="spinner-border spinner-border-sm me-1"></span>
                          <i class="bi bi-download"></i>
                        </button>
                        <button v-else-if="getCacheStatus(song.url) === 'queued'"
                          class="btn btn-sm btn-outline-secondary" disabled title="En cola para cachear" @click.stop>
                          <i class="bi bi-clock"></i>
                        </button>
                        <button v-else-if="getCacheStatus(song.url) === 'cached'" class="btn btn-sm btn-outline-success"
                          @click.stop="recacheAudio(song.url, song.title)" title="Recargar caché">
                          <i class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button v-else class="btn btn-sm btn-outline-info"
                          @click.stop="audioPlayerComposable.cacheAudio(song.url, song.title)" title="Cachear ahora">
                          <i class="bi bi-download"></i>
                        </button>

                        <!-- Botones de orden (solo en modo edición) -->
                        <div v-if="!readOnlyMode" class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" @click.stop="moveSongUp(index)"
                            :disabled="index === 0" title="Mover arriba">
                            <i class="bi bi-arrow-up"></i>
                          </button>
                          <button class="btn btn-outline-secondary" @click.stop="moveSongDown(index)"
                            :disabled="index === songs.length - 1" title="Mover abajo">
                            <i class="bi bi-arrow-down"></i>
                          </button>
                          <button class="btn btn-outline-danger" @click.stop="removeSong(index)" title="Eliminar">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
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
          <div class="card mt-4 border-0 shadow-sm" :class="{ 'cursor-pointer': showInstallButton }"
            @click="showInstallButton ? installPWA() : null" :style="showInstallButton ? 'cursor: pointer;' : ''">
            <div class="card-body text-center">
              <i class="bi bi-phone display-4 text-purple mb-3"></i>
              <h5>Instala como App</h5>
              <p class="text-muted">
                {{ showInstallButton ? 'Haz click aquí para instalar la app en tu dispositivo' : 'Usa el botón "Instalar" para tenerla en tu teléfono como app nativa' }}
              </p>
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
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as bootstrap from 'bootstrap'
import { useSambangoTree } from './composables/useSambangoTree.js'
import { useAudioPlayer } from './composables/useAudioPlayer.js'

export default {
  name: 'App',

  setup() {
    // Estado para múltiples playlists
    const playlists = ref([]) // Array de {id, name, songs}
    const activePlaylistId = ref(null) // ID de la playlist activa
    const showPlaylistManager = ref(false)
    const newPlaylistName = ref('')

    // Estado básico (ahora derivado de la playlist activa)
    const readOnlyMode = ref(false)
    const newSongUrl = ref('')
    const newSongTitle = ref('')
    const currentSongIndex = ref(0)
    const audioPlayer = ref(null)
    const showInstallButton = ref(false)
    const deferredPrompt = ref(null)
    const toast = ref(null)
    const bootstrapToast = ref(null)
    const linkCopied = ref(false)
    const sambangoTreeContainer = ref(null)

    // Estado para drag and drop
    const draggedIndex = ref(null)
    const dragOverIndex = ref(null)

    // Estado para explorador de archivos Sambango
    const useUrlInput = ref(true) // true = URL manual, false = árbol
    const previewingUrl = ref(null) // URL del archivo en preview
    const {
      sambangoTree,
      loadingSambangoTree,
      currentPath,
      selectedMp3,
      getCurrentFolder,
      loadSambangoTree,
      navigateToFolder,
      navigateBack,
      selectMp3File: selectMp3FromTree,
      clearSelection,
      reloadTree
    } = useSambangoTree()

    // Composable para audio con TTS
    const audioPlayerComposable = useAudioPlayer()
    const {
      preloadTrack,
      playTrackWithTTS,
      pause: pauseAudio,
      resume: resumeAudio,
      restart: restartAudio,
      restartPlaylist: restartPlaylistAudio,
      playState,        // Estado único de reproducción
      playPreview,
      stopPreview,
      availableVoices,
      selectedVoiceIndex,
      selectedVoice,
      // Funciones de caché
      getCacheStatus,
      recacheAudio,
      currentlyCaching,
      cachedUrls
    } = audioPlayerComposable

    // Computed para compatibilidad con el template
    const isPlaying = computed(() => playState.playing && playState.type === 'audio')
    const isPlayingTTS = computed(() => playState.playing && playState.type === 'tts')
    const isPlayingPreview = computed(() => playState.playing && playState.type === 'preview')

    // Computed properties
    const activePlaylist = computed(() =>
      playlists.value.find(p => p.id === activePlaylistId.value) || null
    )

    const songs = computed(() => activePlaylist.value?.songs || [])
    const playlistName = computed({
      get: () => activePlaylist.value?.name || 'Mi Lista de Música',
      set: (value) => {
        if (activePlaylist.value) {
          activePlaylist.value.name = value
          saveToStorage()
        }
      }
    })

    const currentSong = computed(() => songs.value[currentSongIndex.value])
    const hasPrevious = computed(() => currentSongIndex.value > 0)
    const hasNext = computed(() => currentSongIndex.value < songs.value.length - 1)

    // Watcher para precargar cuando cambia la canción actual
    watch(currentSong, async (newSong) => {
      if (newSong && songs.value.length > 0) {
        await preloadTrack(newSong, songs.value, currentSongIndex.value)
      }
      // Resetear tiempo del audio cuando cambia la canción
      if (audioPlayer.value) {
        audioPlayer.value.currentTime = 0
      }
    })

    // Inicialización
    onMounted(() => {
      initToast()
      setupPWA()
      setupMediaSession()
      setupAudioListeners()
      loadFromStorage()
      checkUrlForPlaylist()
      handleShareTarget()
      handleLoadSambangoTree()

      // Inicializar IndexedDB para caché de audio
      audioPlayerComposable.initDB().catch(err =>
        console.error('Error inicializando DB:', err)
      )
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

    const setupAudioListeners = () => {
      // Ya no necesitamos sincronizar isPlaying porque usamos playState
      // Los eventos del audio player son informativos solamente
      watch(audioPlayer, (player) => {
        if (player) {
          player.addEventListener('ended', () => {
            playState.playing = false
            playState.type = null
          })
        }
      }, { immediate: true })
    }

    const setupMediaSession = () => {
      if ('mediaSession' in navigator) {
        // Configurar handlers de Media Session
        navigator.mediaSession.setActionHandler('play', () => {
          if (audioPlayer.value && currentSong.value && !playState.playing) {
            play()
          }
        })

        navigator.mediaSession.setActionHandler('pause', () => {
          if (audioPlayer.value && playState.playing) {
            pause()
          }
        })

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrevious()
        })

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNext()
        })

        // Watch para actualizar metadata cuando cambie la canción
        watch(currentSong, (song) => {
          if (song && 'mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: song.title || 'Sin título',
              artist: playlistName.value,
              album: 'Sambango Prepa',
              artwork: [
                {
                  src: 'https://sambango.com/img/sambango_favicon_192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            })
          }
        }, { immediate: true })
      }
    }

    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem('musicPlaylists')
        if (saved) {
          playlists.value = JSON.parse(saved)
        }

        // Si no hay playlists, crear una por defecto
        if (playlists.value.length === 0) {
          const defaultPlaylist = {
            id: Date.now(),
            name: 'Mi Lista de Música',
            songs: []
          }
          playlists.value.push(defaultPlaylist)
          activePlaylistId.value = defaultPlaylist.id
        } else {
          // Cargar la última playlist activa
          const savedActiveId = localStorage.getItem('activePlaylistId')
          if (savedActiveId && playlists.value.find(p => p.id === parseInt(savedActiveId))) {
            activePlaylistId.value = parseInt(savedActiveId)
          } else {
            activePlaylistId.value = playlists.value[0].id
          }
        }
      } catch (e) {
        console.error('Error cargando:', e)
        // Crear playlist por defecto en caso de error
        const defaultPlaylist = {
          id: Date.now(),
          name: 'Mi Lista de Música',
          songs: []
        }
        playlists.value = [defaultPlaylist]
        activePlaylistId.value = defaultPlaylist.id
      }
    }

    const saveToStorage = () => {
      localStorage.setItem('musicPlaylists', JSON.stringify(playlists.value))
      if (activePlaylistId.value) {
        localStorage.setItem('activePlaylistId', activePlaylistId.value.toString())
      }
    }

    // Funciones para el explorador Sambango
    const selectMp3File = (file) => {
      const { url, title } = selectMp3FromTree(file)
      newSongUrl.value = url
      newSongTitle.value = title
    }

    const handlePlayPreview = async (url) => {
      if (!audioPlayer.value || !url) return
      previewingUrl.value = url
      await playPreview(url, audioPlayer.value)
    }

    const handleStopPreview = () => {
      if (!audioPlayer.value) return
      previewingUrl.value = null
      stopPreview(audioPlayer.value)
    }

    const toggleInputMode = () => {
      useUrlInput.value = !useUrlInput.value
      if (useUrlInput.value) {
        // Al cambiar a URL manual, limpiar selección
        clearSelection()
      }
    }

    // Wrappers para navegación con scroll reset
    const scrollToTop = () => {
      nextTick(() => {
        if (sambangoTreeContainer.value) {
          sambangoTreeContainer.value.scrollTop = 0
        }
      })
    }

    const handleNavigateToFolder = (folderName) => {
      navigateToFolder(folderName)
      scrollToTop()
    }

    const handleNavigateBack = () => {
      navigateBack()
      scrollToTop()
    }

    const handleNavigateToRoot = () => {
      currentPath.value = []
      scrollToTop()
    }

    const handleNavigateToBreadcrumb = (index) => {
      currentPath.value = currentPath.value.slice(0, index + 1)
      scrollToTop()
    }

    const handleLoadSambangoTree = async () => {
      try {
        await loadSambangoTree()
      } catch (error) {
        showToast('Error al cargar biblioteca Sambango', 'warning')
      }
    }

    const handleReloadSambangoTree = async () => {
      try {
        await reloadTree()
        showToast('Biblioteca recargada correctamente', 'success')
      } catch (error) {
        showToast('Error al recargar biblioteca Sambango', 'warning')
      }
    }

    // Gestión de playlists
    const createPlaylist = () => {
      const name = newPlaylistName.value.trim() || `Lista ${playlists.value.length + 1}`
      const newPlaylist = {
        id: Date.now(),
        name: name,
        songs: []
      }
      playlists.value.push(newPlaylist)
      activePlaylistId.value = newPlaylist.id
      newPlaylistName.value = ''
      saveToStorage()
      showPlaylistManager.value = false
      showToast(`Playlist "${name}" creada`, 'success')
    }

    const selectPlaylist = (playlistId) => {
      activePlaylistId.value = playlistId
      currentSongIndex.value = 0
      saveToStorage()
      showPlaylistManager.value = false
      const playlist = playlists.value.find(p => p.id === playlistId)
      showToast(`Playlist "${playlist.name}" seleccionada`, 'info')
    }

    const deletePlaylist = (playlistId) => {
      if (playlists.value.length === 1) {
        showToast('No puedes eliminar la única playlist', 'warning')
        return
      }

      const playlist = playlists.value.find(p => p.id === playlistId)
      if (confirm(`¿Seguro que quieres eliminar "${playlist.name}"?`)) {
        playlists.value = playlists.value.filter(p => p.id !== playlistId)

        // Si era la activa, seleccionar otra
        if (activePlaylistId.value === playlistId) {
          activePlaylistId.value = playlists.value[0].id
        }

        saveToStorage()
        showToast('Playlist eliminada', 'info')
      }
    }

    const renamePlaylist = (playlistId) => {
      const playlist = playlists.value.find(p => p.id === playlistId)
      const newName = prompt('Nuevo nombre:', playlist.name)
      if (newName && newName.trim()) {
        playlist.name = newName.trim()
        saveToStorage()
        showToast('Playlist renombrada', 'success')
      }
    }

    const handleShareTarget = () => {
      if (!activePlaylist.value) return

      const urlParams = new URLSearchParams(window.location.search)
      const sharedUrl = urlParams.get('url')
      const sharedText = urlParams.get('text')

      if (sharedUrl) {
        const title = urlParams.get('title') || sharedText || 'Canción compartida'
        activePlaylist.value.songs.push({
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

      if (playlistParam) {
        try {
          // Decodificar desde base64 (con soporte UTF-8)
          const decoded = decodeURIComponent(atob(playlistParam))
          const parsed = JSON.parse(decoded)

          // Crear playlist temporal con los datos compartidos
          const sharedPlaylist = {
            id: Date.now(),
            name: parsed.name || 'Lista Compartida',
            songs: parsed.songs || parsed // Compatibilidad con formato antiguo
          }

          if (Array.isArray(sharedPlaylist.songs)) {
            playlists.value = [sharedPlaylist]
            activePlaylistId.value = sharedPlaylist.id
            readOnlyMode.value = true

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
      if (!activePlaylist.value) return

      const url = newSongUrl.value.trim()
      const title = newSongTitle.value.trim() || `Canción ${activePlaylist.value.songs.length + 1}`

      if (url) {
        activePlaylist.value.songs.push({
          url: url,
          title: title
        })
        newSongUrl.value = ''
        newSongTitle.value = ''
        saveToStorage()
        showToast('Canción agregada', 'success')

        // Enfocar el campo de URL para seguir agregando
        setTimeout(() => {
          document.querySelector('input[type="url"]')?.focus()
        }, 100)
      } else {
        showToast('Ingresa una URL', 'warning')
      }
    }

    const removeSong = (index) => {
      if (!activePlaylist.value) return
      activePlaylist.value.songs.splice(index, 1)
      saveToStorage()
      showToast('Canción eliminada', 'info')
    }

    const moveSongUp = (index) => {
      if (!activePlaylist.value || index === 0) return
      const songs = activePlaylist.value.songs
        ;[songs[index], songs[index - 1]] = [songs[index - 1], songs[index]]
      if (currentSongIndex.value === index) currentSongIndex.value--
      saveToStorage()
    }

    const moveSongDown = (index) => {
      if (!activePlaylist.value) return
      const songs = activePlaylist.value.songs
      if (index >= songs.length - 1) return
        ;[songs[index], songs[index + 1]] = [songs[index + 1], songs[index]]
      if (currentSongIndex.value === index) currentSongIndex.value++
      saveToStorage()
    }

    const togglePlay = async () => {
      if (!audioPlayer.value || !currentSong.value) return

      if (isPlaying.value || isPlayingTTS.value) {
        // Pausar tanto TTS como audio
        pauseAudio(audioPlayer.value)
        audioPlayer.value.pause()
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused'
        }
      } else {
        // Si el audio ya tiene src y currentTime > 0, solo reanudar
        if (audioPlayer.value.src && audioPlayer.value.currentTime > 0) {
          await resumeAudio(audioPlayer.value)
        } else {
          // Primera reproducción o cambio de canción: reproducir con TTS
          await playTrackWithTTS(
            currentSong.value,
            audioPlayer.value,
            () => playNext()
          )
        }
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing'
        }
      }
    }

    const pause = async () => {
      if (!audioPlayer.value) return

      // Si estamos pausando un preview, limpiar el estado
      if (playState.type === 'preview') {
        previewingUrl.value = null
      }

      // Llamar al pause del composable que maneja TODO
      pauseAudio(audioPlayer.value)

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    }

    const play = async () => {
      if (!audioPlayer.value) return

      // Si hay preview activo, detenerlo primero
      if (playState.type === 'preview') {
        handleStopPreview()
      }

      // Si no hay canción seleccionada, comenzar desde el principio
      if (!currentSong.value) {
        if (songs.value.length > 0) {
          currentSongIndex.value = 0
          await nextTick()
          await playTrackWithTTS(
            currentSong.value,
            audioPlayer.value,
            () => playNext(),
            currentSongIndex.value
          )
        }
        return
      }

      // Si ya hay audio cargado y tiene src válido, reanudar
      if (audioPlayer.value.src && audioPlayer.value.src !== '' && audioPlayer.value.currentTime > 0 && playState.type !== 'preview') {
        try {
          playState.playing = true
          playState.type = 'audio'
          playState.trackIndex = currentSongIndex.value
          await audioPlayer.value.play()
        } catch (error) {
          console.error('Error reanudando:', error)
        }
      } else {
        // Primera reproducción o después de pausa con TTS: reproducir desde inicio con TTS
        await playTrackWithTTS(
          currentSong.value,
          audioPlayer.value,
          () => playNext(),
          currentSongIndex.value
        )
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    }

    const restartTrack = async () => {
      console.log('Reiniciando pista...')
      if (!currentSong.value || !audioPlayer.value) return

      await restartAudio(
        currentSong.value,
        audioPlayer.value,
        () => playNext()
      )

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    }

    const restartPlaylist = async () => {
      if (!audioPlayer.value || songs.value.length === 0) return

      console.log('Reiniciando playlist desde el inicio...')

      restartPlaylistAudio();

      // Detener cualquier reproducción activa
      await pause()

      // Volver al inicio de la lista
      currentSongIndex.value = 0
      await nextTick()

      // Reproducir desde la primera canción
      if (currentSong.value) {
        await playTrackWithTTS(
          currentSong.value,
          audioPlayer.value,
          () => playNext(),
          currentSongIndex.value
        )

        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing'
        }
      }
    }

    const playNext = async () => {
      if (hasNext.value) {
        playIndex(currentSongIndex.value + 1)
      }
    }

    const playPrevious = async () => {
      if (hasPrevious.value) {
        playIndex(currentSongIndex.value - 1)
      }
    }

    const playIndex = async (index, withTTS = true) => {
      if (!audioPlayer.value || index < 0 || index >= songs.value.length) return

      // Detener cualquier reproducción activa
      await pause()

      currentSongIndex.value = index
      await nextTick()

      if (currentSong.value) {
        // Precargar canción seleccionada
        await preloadTrack(currentSong.value, songs.value, currentSongIndex.value)

        // Reproducir con TTS
        if (withTTS) {
          await playTrackWithTTS(
            currentSong.value,
            audioPlayer.value,
            () => playNext(),
            currentSongIndex.value
          )
        } else {
          // Reproducir directamente sin TTS
          try {
            playState.playing = true
            playState.type = 'audio'
            playState.trackIndex = currentSongIndex.value
            audioPlayer.value.currentTime = 0
            audioPlayer.value.play()
          } catch (error) {
            console.error('Error reproduciendo pista:', error)
          }
        } 

        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing'
        }
      }
    }

    const copyShareLink = async () => {
      if (!activePlaylist.value || activePlaylist.value.songs.length === 0) {
        showToast('Agrega canciones primero', 'warning')
        return
      }

      try {
        // Generar hash desde JSON usando base64 (con soporte UTF-8)
        const playlistData = {
          name: activePlaylist.value.name,
          songs: activePlaylist.value.songs
        }
        const playlistString = JSON.stringify(playlistData)
        // Codificar para soportar caracteres Unicode
        const encoded = btoa(encodeURIComponent(playlistString))
        const shareUrl = `${window.location.origin}${window.location.pathname}?playlist=${encoded}`

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
      if (!activePlaylist.value || activePlaylist.value.songs.length === 0) return

      if (confirm('¿Seguro que quieres borrar todas las canciones de esta lista?')) {
        activePlaylist.value.songs = []
        saveToStorage()
        showToast('Canciones borradas', 'info')
      }
    }

    const exitReadOnlyMode = () => {
      readOnlyMode.value = false
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Cargar playlists guardadas
      loadFromStorage()
      showToast('Ahora puedes editar tus listas', 'success')
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

    // Funciones de Drag and Drop
    const onDragStart = (event, index) => {
      draggedIndex.value = index

      // Crear una imagen fantasma personalizada
      const dragImage = event.target.closest('.list-group-item')
      if (dragImage) {
        const clone = dragImage.cloneNode(true)
        clone.style.position = 'absolute'
        clone.style.top = '-9999px'
        clone.style.opacity = '0.8'
        clone.style.backgroundColor = '#f0f0f0'
        document.body.appendChild(clone)
        event.dataTransfer.setDragImage(clone, 0, 0)
        setTimeout(() => document.body.removeChild(clone), 0)
      }

      event.dataTransfer.effectAllowed = 'move'
    }

    const onDragEnd = () => {
      draggedIndex.value = null
      dragOverIndex.value = null
    }

    const onDragOver = (event, index) => {
      event.preventDefault()
      if (draggedIndex.value !== null && draggedIndex.value !== index) {
        dragOverIndex.value = index
      }
    }

    const onDragLeave = (event) => {
      // Solo limpiar si realmente salimos del elemento
      if (event.target.classList.contains('list-group-item')) {
        dragOverIndex.value = null
      }
    }

    const onDrop = (event, dropIndex) => {
      event.preventDefault()
      event.stopPropagation()

      if (draggedIndex.value === null || !activePlaylist.value) return

      const fromIndex = draggedIndex.value

      // Usar dragOverIndex si está definido (más preciso que dropIndex)
      const targetIndex = dragOverIndex.value !== null ? dragOverIndex.value : dropIndex

      if (fromIndex === targetIndex) {
        onDragEnd()
        return
      }

      // Reordenar el array
      const songsCopy = [...activePlaylist.value.songs]
      const [movedSong] = songsCopy.splice(fromIndex, 1)
      songsCopy.splice(targetIndex, 0, movedSong)
      activePlaylist.value.songs = songsCopy

      // Actualizar currentSongIndex si es necesario
      if (currentSongIndex.value === fromIndex) {
        currentSongIndex.value = targetIndex
      } else if (fromIndex < currentSongIndex.value && targetIndex >= currentSongIndex.value) {
        currentSongIndex.value--
      } else if (fromIndex > currentSongIndex.value && targetIndex <= currentSongIndex.value) {
        currentSongIndex.value++
      }

      saveToStorage()
      onDragEnd()
    }

    return {
      // Estado
      playlists,
      activePlaylist,
      activePlaylistId,
      showPlaylistManager,
      newPlaylistName,
      songs,
      playlistName,
      readOnlyMode,
      newSongUrl,
      newSongTitle,
      currentSong,
      isPlaying,
      isPlayingTTS,
      audioPlayer,
      showInstallButton,
      toast,
      linkCopied,

      // Estado TTS
      availableVoices,
      selectedVoiceIndex,
      selectedVoice,

      // Estado caché
      getCacheStatus,
      recacheAudio,
      currentlyCaching,
      cachedUrls,
      audioPlayerComposable,

      // Estado explorador Sambango
      useUrlInput,
      sambangoTree,
      loadingSambangoTree,
      currentPath,
      selectedMp3,
      getCurrentFolder,
      previewingUrl,

      // Estado drag and drop
      draggedIndex,
      dragOverIndex,

      // Computed
      hasPrevious,
      hasNext,
      currentSongIndex,

      // Métodos de playlist
      createPlaylist,
      selectPlaylist,
      deletePlaylist,
      renamePlaylist,

      // Métodos de canciones
      addSong,
      removeSong,
      moveSongUp,
      moveSongDown,
      togglePlay,
      play,
      pause,
      restartTrack,
      restartPlaylist,
      playNext,
      playPrevious,
      playIndex,
      copyShareLink,
      clearPlaylist,
      exitReadOnlyMode,
      installPWA,

      // Métodos explorador Sambango
      selectMp3File,
      handlePlayPreview,
      handleStopPreview,
      isPlayingPreview,
      handleNavigateToFolder,
      handleNavigateBack,
      handleNavigateToRoot,
      handleNavigateToBreadcrumb,
      toggleInputMode,
      handleReloadSambangoTree,
      sambangoTreeContainer,

      // Métodos drag and drop
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragLeave,
      onDrop
    }
  }
}
</script>

<style>
/* Estilos personalizados con colores vibrantes sólidos */
:root {
  --magenta: rgb(255, 0, 112);
  --cyan: rgb(83, 130, 255);
  --yellow: #FFD700;
}

.bg-purple {
  background-color: var(--magenta) !important;
}

.text-purple {
  color: var(--magenta) !important;
  font-weight: 600;
}

.btn-purple {
  background-color: var(--magenta);
  border: none;
  color: white;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-purple:hover {
  background-color: var(--cyan);
  color: white;
  transform: translateY(-1px);
}

.btn-success {
  background-color: var(--cyan) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
}

.btn-success:hover {
  background-color: var(--yellow) !important;
  color: #333 !important;
}

.card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-group-item.active {
  background-color: rgba(255, 0, 112, 0.1) !important;
  border-left: 4px solid var(--magenta) !important;
  color: var(--magenta) !important;
}

.badge.bg-purple {
  background-color: var(--cyan) !important;
  color: white;
}

/* Inputs */
input[type="url"]:focus,
input[type="text"]:focus {
  border-color: var(--magenta);
  box-shadow: 0 0 0 0.25rem rgba(255, 0, 112, 0.15);
}

/* Navbar */
.navbar-dark.bg-purple {
  background-color: var(--magenta) !important;
  color: var(--yellow) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Botones outline */
.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.8) !important;
  color: white !important;
}

.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-color: white !important;
  color: white !important;
}

.btn-outline-primary {
  border-color: var(--cyan) !important;
  color: var(--cyan) !important;
}

.btn-outline-primary:hover {
  background-color: var(--cyan) !important;
  color: white !important;
}

.btn-outline-secondary {
  border-color: #ddd !important;
  color: #666 !important;
}

.btn-outline-secondary:hover {
  background-color: #f0f0f0 !important;
  border-color: #ccc !important;
  color: #333 !important;
}

.btn-outline-danger {
  border-color: #dc3545 !important;
  color: #dc3545 !important;
}

.btn-outline-danger:hover {
  background-color: #dc3545 !important;
  color: white !important;
}

/* Alert info */
.alert-info {
  background-color: #e7f3ff !important;
  border-left: 4px solid var(--cyan) !important;
  color: #004085 !important;
  border-radius: 8px;
}

/* Card oscura */
.card.bg-dark {
  background-color: #2c3e50 !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Card header personalizado */
.card-header {
  border-bottom: 2px solid #f0f0f0;
  padding: 1rem;
}

/* Drag and Drop */
.drag-handle {
  cursor: grab;
  color: #999;
  padding: 0.5rem;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s ease;
  user-select: none;
  font-size: 1.2rem;
}

.drag-handle:hover {
  color: var(--magenta);
}

.drag-handle:active {
  cursor: grabbing;
}

.list-group-item.dragging {
  opacity: 0.4;
  background-color: #e9ecef !important;
  border: 2px dashed var(--magenta) !important;
  transform: scale(0.98);
}

.list-group-item.drag-over {
  position: relative;
}

.list-group-item.drag-over::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: var(--magenta);
  z-index: 10;
  border-radius: 2px;
  margin-top: 8px;
  transition: all 0.2s ease;
}

.list-group-item {
  transition: all 0.2s ease, background-color 0.2s ease, margin 0.2s ease;
  position: relative;
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