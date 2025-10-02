<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50" @click="close"></div>
    
    <!-- Settings Panel -->
    <div class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-theme-primary">Settings</h2>
        <button 
          class="p-2 text-theme-secondary hover:text-theme-primary rounded-lg transition-colors"
          aria-label="Close settings"
          @click="close"
        >
          ✕
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto max-h-96">
        <!-- Theme Section -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-theme-primary mb-4">🎨 Theme & Appearance</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-theme-primary mb-2">Theme</label>
              <div class="flex gap-4">
                <label class="flex items-center">
                  <input 
                    v-model="localPreferences.theme" 
                    type="radio" 
                    value="light"
                    class="mr-2"
                    @change="updateTheme"
                  />
                  Light
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="localPreferences.theme" 
                    type="radio" 
                    value="dark"
                    class="mr-2"
                    @change="updateTheme"
                  />
                  Dark
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="localPreferences.theme" 
                    type="radio" 
                    value="auto"
                    class="mr-2"
                    @change="updateTheme"
                  />
                  Auto
                </label>
              </div>
            </div>
            
            <label class="flex items-center">
              <input 
                v-model="localPreferences.showTooltips" 
                type="checkbox"
                class="mr-2"
                @change="updatePreference('showTooltips', ($event.target as HTMLInputElement).checked)"
              />
              Show tooltips
            </label>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-4">
          <button 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" 
            @click="restartTour"
          >
            Restart Tutorial
          </button>
          <button 
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" 
            @click="resetAllPreferences"
          >
            Reset Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserPreferences } from '@/composables/useUserPreferences'
import { useTheme } from '@/composables/useTheme'
import { useNotificationStore } from '@/stores/notification'

interface Props {
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'restart-tour'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { preferences, updatePreference, resetPreferences } = useUserPreferences()
const { setTheme } = useTheme()
const notificationStore = useNotificationStore()

const localPreferences = ref({ ...preferences.value })

watch(preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })

const close = () => {
  emit('close')
}

const updateTheme = () => {
  setTheme(localPreferences.value.theme === 'auto' ? 'light' : localPreferences.value.theme as 'light' | 'dark')
  updatePreference('theme', localPreferences.value.theme)
}

const restartTour = () => {
  updatePreference('hasSeenTutorial', false)
  close()
  emit('restart-tour')
  
  notificationStore.addNotification({
    message: 'Tutorial will start when you reload the page',
    type: 'info',
    duration: 3000
  })
}

const resetAllPreferences = () => {
  if (confirm('Are you sure you want to reset all settings?')) {
    resetPreferences()
    localPreferences.value = { ...preferences.value }
    
    notificationStore.addNotification({
      message: 'Settings reset to defaults',
      type: 'success',
      duration: 3000
    })
  }
}
</script> 