import { ref, computed } from 'vue'

export function useSambangoTree() {
  const sambangoTree = ref(null)
  const loadingSambangoTree = ref(false)
  const currentPath = ref([])
  const selectedMp3 = ref(null)

  const loadSambangoTree = async () => {
    // Intentar cargar desde cache primero
    const cached = localStorage.getItem('sambangoTreeCache')
    const cacheTime = localStorage.getItem('sambangoTreeCacheTime')
    
    // Cache válido por 24 horas
    const cacheValid = cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000
    
    if (cached && cacheValid) {
      sambangoTree.value = JSON.parse(cached)
      return
    }
    
    // Si no hay cache válido, explorar
    loadingSambangoTree.value = true
    try {
      const tree = await exploreSambangoDirectory('https://sambango.com/ritmos')
      sambangoTree.value = tree
      
      // Guardar en cache
      localStorage.setItem('sambangoTreeCache', JSON.stringify(tree))
      localStorage.setItem('sambangoTreeCacheTime', Date.now().toString())
    } catch (error) {
      console.error('Error explorando sambango:', error)
      throw error
    } finally {
      loadingSambangoTree.value = false
    }
  }

  const exploreSambangoDirectory = async (url, depth = 0, maxDepth = 3) => {
    if (depth > maxDepth) {
      console.log(`⚠️ Max depth alcanzado en: ${url}`)
      return []
    }
    
    console.log(`📁 Explorando [depth=${depth}]: ${url}`)
    
    try {
      // Usar mod_autoindex con formato de tabla simple para facilitar el parseo
      // F=0 = formato HTML simple, C=N = ordenar por nombre, O=A = orden ascendente
      const urlWithParams = new URL(url)
      urlWithParams.searchParams.set('F', '0') // Formato HTML fancy off (más simple)
      urlWithParams.searchParams.set('C', 'N') // Ordenar por nombre
      urlWithParams.searchParams.set('O', 'A') // Orden ascendente
      
      const response = await fetch(urlWithParams)
      if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status} en: ${url}`)
        return []
      }
      
      const html = await response.text()
      
      // Parsear HTML para encontrar enlaces
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // En mod_autoindex, los enlaces están en <a> dentro de <pre> o en una tabla
      // Buscar todos los enlaces excluyendo el parent directory
      const links = Array.from(doc.querySelectorAll('a')).filter(link => {
        const href = link.getAttribute('href')
        return href && href !== '../' && !href.startsWith('?') && !href.startsWith('#') && !href.startsWith('/')
      })
      
      console.log(`  → Encontrados ${links.length} enlaces`)
      
      const items = []
      
      for (const link of links) {
        const href = link.getAttribute('href')
        
        // Construir URL completa correctamente
        // Si href ya es absoluto o empieza con /, usar url como base
        // Asegurarnos de que url termina con / para rutas relativas
        const baseUrl = url.endsWith('/') ? url : url + '/'
        const fullUrl = new URL(href, baseUrl).href
        
        // El nombre es solo el último segmento sin el trailing slash
        const name = decodeURIComponent(href.replace(/\/$/, ''))
        
        // Evitar bucles: no explorar si la URL es la misma que la base
        if (fullUrl === url || fullUrl === baseUrl) {
          console.warn(`⚠️ Evitando bucle: ${fullUrl}`)
          continue
        }
        
        if (href.endsWith('.mp3')) {
          // Es un archivo MP3
          // Extraer la ruta desde /ritmos/ para usarla en el título
          const urlObj = new URL(fullUrl)
          const pathParts = urlObj.pathname.split('/').filter(p => p && p !== 'ritmos')
          
          // Decodificar cada parte de la ruta
          const decodedParts = pathParts.map(p => decodeURIComponent(p))
          const fileName = decodedParts.pop().replace('.mp3', '') // Último elemento es el archivo
          const folderPath = decodedParts.join(' - ') // Carpetas separadas por guión
          const title = folderPath ? `${folderPath} - ${fileName}` : fileName
          
          items.push({
            type: 'file',
            name: name,
            url: fullUrl,
            title: title
          })
        } else if (href.endsWith('/')) {
          // Es un directorio - explorar recursivamente
          const subTree = await exploreSambangoDirectory(fullUrl, depth + 1, maxDepth)
          if (subTree && subTree.length > 0) {
            items.push({
              type: 'folder',
              name: name,
              url: fullUrl,
              children: subTree
            })
          }
        }
      }
      
      console.log(`  ✅ ${items.length} items procesados`)
      return items
    } catch (error) {
      console.error(`❌ Error explorando ${url}:`, error)
      return []
    }
  }

  const getCurrentFolder = computed(() => {
    if (!sambangoTree.value) return null
    
    let current = sambangoTree.value
    for (const pathPart of currentPath.value) {
      const folder = current.find(item => item.type === 'folder' && item.name === pathPart)
      if (!folder) return null
      current = folder.children
    }
    
    return current
  })

  const navigateToFolder = (folderName) => {
    currentPath.value.push(folderName)
  }

  const navigateBack = () => {
    if (currentPath.value.length > 0) {
      currentPath.value.pop()
    }
  }

  const selectMp3File = (file) => {
    selectedMp3.value = file
    return {
      url: file.url,
      title: file.title
    }
  }

  const resetPath = () => {
    currentPath.value = []
  }

  const clearSelection = () => {
    selectedMp3.value = null
  }

  const reloadTree = async () => {
    // Limpiar cache
    localStorage.removeItem('sambangoTreeCache')
    localStorage.removeItem('sambangoTreeCacheTime')
    
    // Resetear estado
    sambangoTree.value = null
    currentPath.value = []
    selectedMp3.value = null
    
    // Recargar
    await loadSambangoTree()
  }

  return {
    // State
    sambangoTree,
    loadingSambangoTree,
    currentPath,
    selectedMp3,
    
    // Computed
    getCurrentFolder,
    
    // Methods
    loadSambangoTree,
    navigateToFolder,
    navigateBack,
    selectMp3File,
    resetPath,
    clearSelection,
    reloadTree
  }
}
