<template>
  <div class="song-list">
    <h5 class="mb-3">
      <i class="bi bi-music-note-list me-2"></i>
      Lista de Canciones ({{ songs.length }})
    </h5>
    
    <div v-if="songs.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-music-note-beamed display-4 d-block mb-3"></i>
      <p>No hay canciones en la lista</p>
      <p class="small">Agrega canciones usando el campo de texto</p>
    </div>
    
    <div v-else class="list-group">
      <div 
        v-for="(song, index) in songs" 
        :key="index"
        class="list-group-item list-group-item-action"
        :class="{ 'active': currentIndex === index }"
      >
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center flex-grow-1 me-3">
            <span class="badge bg-secondary me-3">{{ index + 1 }}</span>
            <div class="flex-grow-1">
              <div class="fw-bold text-truncate">{{ song.title }}</div>
              <small class="text-muted text-truncate d-block">
                {{ song.url }}
              </small>
            </div>
          </div>
          
          <div class="btn-group btn-group-sm flex-shrink-0">
            <button 
              class="btn btn-outline-secondary"
              @click="$emit('move-up', index)"
              :disabled="index === 0"
              title="Mover arriba"
            >
              <i class="bi bi-arrow-up"></i>
            </button>
            <button 
              class="btn btn-outline-secondary"
              @click="$emit('move-down', index)"
              :disabled="index === songs.length - 1"
              title="Mover abajo"
            >
              <i class="bi bi-arrow-down"></i>
            </button>
            <button 
              class="btn btn-outline-danger"
              @click="$emit('remove-song', index)"
              title="Eliminar"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SongList',
  props: {
    songs: {
      type: Array,
      required: true,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['remove-song', 'move-up', 'move-down']
})
</script>

<style scoped>
.list-group-item {
  border-radius: 10px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.list-group-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.list-group-item.active {
  background-color: #6f42c1;
  border-color: #6f42c1;
}

.btn-group .btn {
  border-radius: 5px;
}

.text-truncate {
  max-width: 300px;
}

@media (max-width: 768px) {
  .text-truncate {
    max-width: 200px;
  }
  
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    margin-bottom: 2px;
  }
}
</style>