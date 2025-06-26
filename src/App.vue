<template>
  <div id="app" :class="appClasses">
    <!-- Loading overlay -->
    <LoadingSpinner
      v-if="hasAnyLoading"
      :message="loadingMessage || 'Loading...'"
      :progress="loadingProgress"
      fullscreen
    />
    
    <!-- Background particles effect -->
    <ParticlesBackground />
    
    <!-- Main router view -->
    <router-view />
    
    <!-- Global notifications -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { ParticlesBackground, NotificationContainer, LoadingSpinner } from '@/components/ui'
import { useNotificationStore } from '@/stores/notification'
import { useTheme } from '@/composables/useTheme'
import { useLoadingState } from '@/composables/useLoadingState'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUserPreferences } from '@/composables/useUserPreferences'

const notificationStore = useNotificationStore()
const { initializeTheme } = useTheme()
const { hasAnyLoading, loadingMessage, loadingProgress } = useLoadingState()
const { handleError } = useErrorHandler()
const { preferences, updatePreference } = useUserPreferences()

const appClasses = computed(() => [
  'min-h-screen scroll-smooth momentum-scroll',
  {
    'compact-mode': preferences.value.compactMode,
    'keyboard-navigation': preferences.value.keyboardNavigation,
    'reduced-motion': preferences.value.reducedMotion,
    [`font-size-${preferences.value.fontSize}`]: true,
  }
])

onMounted(async () => {
  try {
    // Initialize theme system
    initializeTheme()
    
    // Welcome notification for returning users
    if (preferences.value.hasSeenTutorial) {
      setTimeout(() => {
        notificationStore.addNotification({
          message: 'Welcome back! Ready to build some networks?',
          type: 'info',
          duration: 4000
        })
      }, 1000)
    }
  } catch (error) {
    handleError(error as Error, { component: 'App', phase: 'initialization' })
  }
})
</script>

<style>
/* Global styles will be handled by Tailwind CSS */
</style>
