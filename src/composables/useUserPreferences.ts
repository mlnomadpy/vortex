import { ref, watch, computed } from 'vue'

export interface UserPreferences {
  // Theme preferences
  theme: 'light' | 'dark' | 'auto'
  reducedMotion: boolean
  
  // UI preferences
  compactMode: boolean
  showTooltips: boolean
  autoSave: boolean
  
  // Visualization preferences
  defaultGridSize: number
  defaultActivationFunction: string
  defaultSimilarityMetric: string
  showAdvancedControls: boolean
  
  // Onboarding
  hasSeenTutorial: boolean
  dismissedNotifications: string[]
  
  // Accessibility
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  keyboardNavigation: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  reducedMotion: false,
  compactMode: false,
  showTooltips: true,
  autoSave: true,
  defaultGridSize: 30,
  defaultActivationFunction: 'none',
  defaultSimilarityMetric: 'dotProduct',
  showAdvancedControls: false,
  hasSeenTutorial: false,
  dismissedNotifications: [],
  highContrast: false,
  fontSize: 'medium',
  keyboardNavigation: false
}

const STORAGE_KEY = 'vortex-user-preferences'

// Global preferences state
const preferences = ref<UserPreferences>({ ...DEFAULT_PREFERENCES })
const isInitialized = ref(false)

export function useUserPreferences() {
  const initializePreferences = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge with defaults to handle new preference additions
        preferences.value = { ...DEFAULT_PREFERENCES, ...parsed }
      }
      
      // Check system preferences
      checkSystemPreferences()
      
      isInitialized.value = true
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
      preferences.value = { ...DEFAULT_PREFERENCES }
      isInitialized.value = true
    }
  }
  
  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }
  
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    preferences.value[key] = value
    savePreferences()
  }
  
  const resetPreferences = () => {
    preferences.value = { ...DEFAULT_PREFERENCES }
    savePreferences()
  }
  
  const dismissNotification = (notificationId: string) => {
    if (!preferences.value.dismissedNotifications.includes(notificationId)) {
      preferences.value.dismissedNotifications.push(notificationId)
      savePreferences()
    }
  }
  
  const isNotificationDismissed = (notificationId: string) => {
    return preferences.value.dismissedNotifications.includes(notificationId)
  }
  
  const checkSystemPreferences = () => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      preferences.value.reducedMotion = true
    }
    
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      preferences.value.highContrast = true
    }
  }
  
  // Computed properties for easy access
  const shouldShowTooltips = computed(() => preferences.value.showTooltips)
  const shouldUseReducedMotion = computed(() => preferences.value.reducedMotion)
  const shouldUseCompactMode = computed(() => preferences.value.compactMode)
  const shouldShowAdvancedControls = computed(() => preferences.value.showAdvancedControls)
  const shouldUseHighContrast = computed(() => preferences.value.highContrast)
  
  // Watch for changes and auto-save
  watch(
    preferences,
    () => {
      if (isInitialized.value) {
        savePreferences()
      }
    },
    { deep: true }
  )
  
  // Initialize on first use
  if (!isInitialized.value) {
    initializePreferences()
  }
  
  return {
    preferences,
    updatePreference,
    resetPreferences,
    dismissNotification,
    isNotificationDismissed,
    shouldShowTooltips,
    shouldUseReducedMotion,
    shouldUseCompactMode,
    shouldShowAdvancedControls,
    shouldUseHighContrast,
    initializePreferences,
    isInitialized
  }
} 