# Music List PWA 🎵

[![Deploy to GitHub Pages](https://github.com/tuusuario/musical-list-pwa/actions/workflows/deploy.yml/badge.svg)](https://github.com/tuusuario/musical-list-pwa/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

Una aplicación web progresiva (PWA) para crear, compartir y reproducir listas de música mediante URLs. Totalmente responsive y funciona offline.

## 🌐 Demo en Vivo

🔗 **URL de la aplicación:** https://tuusuario.github.io/musical-list-pwa/

## ✨ Características

- 🎨 **Diseño responsive** con Bootstrap 5
- 📱 **PWA completa** - Instálala como app nativa
- 🔄 **Share Target API** - Recibe canciones desde otras apps
- 🔗 **Comparte listas** mediante URLs únicas
- 🔊 **Reproductor integrado** con controles básicos
- 💾 **Funciona offline** gracias al Service Worker
- 📱 **Compatibilidad móvil** y desktop
- 🚀 **Despliegue automático** con GitHub Actions

## 🚀 Cómo Usar

### 1. Agregar Canciones
- Ingresa URLs de archivos de audio MP3 en el campo de texto
- O usa el botón "Compartir" desde otras apps para enviar URLs directamente

### 2. Compartir Listas
1. Crea tu lista de canciones
2. Haz clic en "Compartir Lista"
3. Copia el enlace generado
4. Comparte el enlace con quien quieras

### 3. Instalar como App
- En Chrome/Edge: Haz clic en el botón "Instalar" o usa el menú de instalación
- En móviles: Agrega a la pantalla de inicio desde el menú del navegador

## 🛠️ Desarrollo Local

### Requisitos Previos
- Node.js 18 o superior
- npm 9 o superior

### Pasos de Instalación

```bash
# Clonar repositorio
git clone https://github.com/adelafoofur82/musical-list-pwa.git
cd musical-list-pwa

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview