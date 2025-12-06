import { ref, computed, reactive } from 'vue'
import { useAudioCache } from './useAudioCache.js'

export function useAudioPlayer() {
  // ESTADO ÚNICO DE REPRODUCCIÓN
  const playState = reactive({
    playing: false,      // Si está reproduciendo (TTS o audio)
    type: null,          // 'tts' | 'audio' | null
    trackIndex: null     // Índice de la pista actual
  })
  
  const availableVoices = ref([])
  const selectedVoiceIndex = ref(null)
  let currentSpeech = null
  let currentOnEndCallback = null
  
  // Usar composable de caché
  const audioCache = useAudioCache()
  const { getAudio, cacheAudio } = audioCache

  /**
   * Cargar voces disponibles
   */
  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices()
      availableVoices.value = voices
      
      // Si no hay voz seleccionada, utilizamos el indice 7, si empieza por "es", sino la primera
      if (selectedVoiceIndex.value === null && voices.length > 0) {
        if (voices.length > 7 && voices[7].lang.startsWith('es')) {
          selectedVoiceIndex.value = 7
          console.log('🔊 Voz por defecto seleccionada (índice 7)')
          return
        }
        const spanishVoiceIndex = voices.findIndex(v => v.lang.startsWith('es'))
        selectedVoiceIndex.value = spanishVoiceIndex !== -1 ? spanishVoiceIndex : 0
      }
      
      console.log('🔊 Voces disponibles:', voices.length)
    }
  }

  // Cargar voces cuando estén disponibles
  if ('speechSynthesis' in window) {
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }

  /**
   * Voz seleccionada actual
   */
  const selectedVoice = computed(() => {
    if (selectedVoiceIndex.value !== null && availableVoices.value.length > 0) {
      return availableVoices.value[selectedVoiceIndex.value]
    }
    return null
  })

  /**
   * Sintetizar texto a voz usando Web Speech API
   * @param {string} text - Texto a sintetizar
   * @param {string} lang - Idioma (es-ES, en-US, etc.)
   * @returns {Promise} Promise que resuelve cuando termina de hablar
   */
  const speakText = (text, lang = 'es-ES') => {
    return new Promise((resolve, reject) => {
      // Verificar soporte
      if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API no soportada')
        resolve()
        return
      }

      // Si no está en modo playing, no hacer nada
      if (!playState.playing) {
        console.log('⏹️ No reproducir TTS - playState.playing es false')
        resolve()
        return
      }

      // Cancelar cualquier síntesis en curso
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Usar la voz seleccionada si está disponible
      if (selectedVoice.value) {
        utterance.voice = selectedVoice.value
        console.log('🔊 Usando voz:', selectedVoice.value.name)
      }

      utterance.onend = () => {
        console.log('✅ TTS finalizado - playState.playing:', playState.playing)
        // Solo resolver si sigue en modo playing
        if (playState.playing) {
          resolve()
        }
      }

      utterance.onerror = (event) => {
        console.error('❌ Error en TTS:', event)
        resolve()
      }

      currentSpeech = utterance
      console.log('📢 Sintetizando:', text)
      window.speechSynthesis.speak(utterance)
    })
  }

  /**
   * Precargar audio de una canción (con caché)
   * Solo cachea en IndexedDB, no crea elementos Audio separados
   * @param {string} url - URL del audio
   * @param {string} title - Título para el caché
   */
  const preloadAudio = async (url, title = '') => {
    try {
      // Obtener desde caché (esto descargará si no está cacheado)
      await getAudio(url)
      
      // Cachear en segundo plano si no está cacheado
      await cacheAudio(url, title).catch(err => 
        console.error('Error cacheando:', err)
      )
    } catch (error) {
      console.error(`Error precargando audio: ${url}`, error)
    }
  }

  /**
   * Precargar una canción (solo cachea, no crea elementos separados)
   * @param {Object} song - {title, url}
   * @param {Array} allSongs - Lista completa de canciones
   * @param {number} currentIndex - Índice actual
   */
  const preloadTrack = async (song, allSongs = [], currentIndex = 0) => {
    if (!song) return

    // Precargar audio de la canción actual (cachear en IndexedDB)
    preloadAudio(song.url, song.title)

    // Precargar siguiente canción
    if (allSongs.length > 0 && currentIndex < allSongs.length - 1) {
      const nextSong = allSongs[currentIndex + 1]
      preloadAudio(nextSong.url, nextSong.title)
    }

    // Precargar canción anterior
    if (allSongs.length > 0 && currentIndex > 0) {
      const prevSong = allSongs[currentIndex - 1]
      preloadAudio(prevSong.url, prevSong.title)
    }
  }

  /**
   * Reproducir TTS seguido del audio de la canción
   * @param {Object} song - {title, url}
   * @param {HTMLAudioElement} playerElement - Elemento audio principal
   * @param {Function} onEnd - Callback cuando termina la canción
   * @param {number} trackIndex - Índice de la pista
   */
  const playTrackWithTTS = async (song, playerElement, onEnd, trackIndex = null) => {
    if (!song || !playerElement) {
      console.error('playTrackWithTTS: song o playerElement no proporcionados')
      return
    }

    console.log('🎵 Reproduciendo con TTS:', song.title)

    // PRIMERO: DETENER TODO completamente
    // Cancelar TTS anterior
    if (currentSpeech && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      currentSpeech = null
    }
    
    // Detener audio completamente
    playerElement.pause()
    playerElement.src = ''
    playerElement.load()
    playerElement.currentTime = 0
    
    // Remover el listener anterior si existe
    if (currentOnEndCallback) {
      playerElement.removeEventListener('ended', currentOnEndCallback)
      currentOnEndCallback = null
    }

    // AHORA SÍ: ESTABLECER ESTADO DE REPRODUCCIÓN
    playState.playing = true
    playState.type = 'tts'
    playState.trackIndex = trackIndex

    try {
      // Reproducir TTS usando Web Speech API
      await speakText(song.title)
      console.log('✅ TTS completado: ', song.title)
      
      // VERIFICAR si sigue en playing
      if (playState.trackIndex !== trackIndex) {
        console.log('⏹️ No es la pista actual - no continuar a audio')
        return
      }
      
      // Cambiar a tipo audio
      playState.type = 'audio'
      
      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verificar de nuevo
      if (playState.trackIndex !== trackIndex) {
        console.log('⏹️ No es la pista actual - no reproducir después de delay')
        return
      }

      // Obtener URL desde caché
      const audioSrc = await getAudio(song.url)
      
      // Verificar antes de reproducir
      if (playState.trackIndex !== trackIndex) {
        console.log('⏹️ No es la pista actual - no asignar src')
        return
      }
      
      // Configurar el src del audio
      console.log('🎶 Reproduciendo canción:', song.url)
      playerElement.src = audioSrc
      playerElement.load()
      playerElement.currentTime = 0
      
      // Configurar evento de fin
      if (onEnd) {
        currentOnEndCallback = onEnd
        playerElement.addEventListener('ended', currentOnEndCallback, { once: true })
      }

      // Verificar antes de play()
      if (playState.trackIndex !== trackIndex) {
        console.log('⏹️ No es la pista actual - no hacer play()')
        return
      }

      await playerElement.play()
      console.log('▶️ Canción reproduciéndose')
    } catch (error) {
      console.error('❌ Error reproduciendo con TTS:', error)
      playState.type = null
      
      // Si falla TTS, reproducir solo la canción
      try {
        if (playState.trackIndex !== trackIndex) {
          console.log('⏹️ No es la pista actual - no continuar a audio en catch')
          return
        }
        
        const audioSrc = await getAudio(song.url)
        
        if (playState.trackIndex !== trackIndex) {
          console.log('⏹️ No es la pista actual - no asignar src')
          return
        }
        
        playState.type = 'audio'
        playerElement.src = audioSrc
        playerElement.load()
        playerElement.currentTime = 0
        
        if (onEnd) {
          currentOnEndCallback = onEnd
          playerElement.addEventListener('ended', currentOnEndCallback, { once: true })
        }

        await playerElement.play()
        console.log('▶️ Canción reproduciéndose (sin TTS)')
      } catch (playError) {
        console.error('❌ Error reproduciendo canción:', playError)
        playState.playing = false
        playState.type = null
        throw playError
      }
    }
  }

  /**
   * Pausar reproducción (detener TODO)
   * @param {HTMLAudioElement} playerElement - Elemento audio principal (opcional)
   */
  const pause = (playerElement) => {
    console.log('⏸️ PAUSE - deteniendo TODA reproducción')
    
    // DETENER TODO: poner playing a false
    playState.playing = false
    playState.type = null
    
    // Cancelar TTS si está activo
    if (currentSpeech && 'speechSynthesis' in window) {
      console.log('🛑 Cancelando TTS...')
      window.speechSynthesis.cancel()
      currentSpeech = null
    }
    
    // Pausar y vaciar audio si se proporciona
    if (playerElement) {
      playerElement.pause()
      console.log('🛑 Pausando audio...')
      playerElement.src = ''
      playerElement.load()
    }
  }

  /**
   * Reanudar reproducción desde donde se pausó
   * @param {HTMLAudioElement} playerElement - Elemento audio principal
   */
  const resume = async (playerElement) => {
    if (!playerElement) return
    
    try {
      await playerElement.play()
      console.log('▶️ Reproducción reanudada')
    } catch (error) {
      console.error('❌ Error reanudando reproducción:', error)
    }
  }

  /**
   * Reiniciar reproducción desde el inicio con TTS
   * @param {Object} song - {title, url}
   * @param {HTMLAudioElement} playerElement - Elemento audio principal
   * @param {Function} onEnd - Callback cuando termina la canción
   */
  const restart = async (song, playerElement, onEnd) => {
    if (!song || !playerElement) {
      console.warn('⚠️ Restart: song o playerElement no válidos')
      return
    }
    
    console.log('🔄 Reiniciando canción:', song.title)
    
    // Detener reproducción actual
    pause(playerElement)
    
    // Reproducir desde el inicio con TTS
    await playTrackWithTTS(song, playerElement, onEnd)
  }

  /**
   * Limpiar cache de preload (ya no se usa, mantenido por compatibilidad)
   */
  const clearPreloadCache = () => {
    console.log('clearPreloadCache: No hay elementos de audio separados para limpiar')
  }

  return {
    // State
    playState,           // Estado único de reproducción
    availableVoices,
    selectedVoiceIndex,
    selectedVoice,
    
    // Cache state (from audioCache composable)
    ...audioCache,
    
    // Methods
    loadVoices,
    speakText,
    preloadAudio,
    preloadTrack,
    playTrackWithTTS,
    pause,
    resume,
    restart,
    clearPreloadCache
  }
}