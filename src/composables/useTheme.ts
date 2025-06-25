import { ref, computed, onMounted, watch } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'vortex-theme'

// Global theme state
const currentTheme = ref<Theme>('light')

export function useTheme() {
  // Initialize theme from storage or system preference
  const initializeTheme = () => {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      currentTheme.value = savedTheme
    } else {
      // Fall back to system preference
      currentTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    applyTheme(currentTheme.value)
  }
  
  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
    } else {
      root.removeAttribute('data-theme')
      root.classList.remove('dark')
    }
  }
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  // Set specific theme
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }
  
  // Watch for theme changes and persist
  watch(
    currentTheme,
    (newTheme) => {
      applyTheme(newTheme)
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    },
    { immediate: false }
  )
  
  // Listen for system theme changes
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (!savedTheme) {
        currentTheme.value = e.matches ? 'dark' : 'light'
      }
    }
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }
  
  // Initialize on mount
  onMounted(() => {
    initializeTheme()
    const cleanup = watchSystemTheme()
    
    // Cleanup function for unmount
    return cleanup
  })
  
  return {
    currentTheme: currentTheme.value,
    isDark: computed(() => currentTheme.value === 'dark'),
    isLight: computed(() => currentTheme.value === 'light'),
    toggleTheme,
    setTheme,
    initializeTheme
  }
}

// Export the current theme for use in other parts of the app
export { currentTheme } 