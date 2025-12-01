import { createApp } from 'vue'
import App from './App.vue'

// Importar Bootstrap JS si es necesario
import * as bootstrap from 'bootstrap'

// Registrar service worker manualmente
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registrado exitosamente:', registration.scope)
      })
      .catch(error => {
        console.log('Error registrando ServiceWorker:', error)
      })
  })
}

// Crear y montar la aplicación
const app = createApp(App)

// Hacer bootstrap disponible globalmente si es necesario
app.config.globalProperties.$bootstrap = bootstrap

app.mount('#app')