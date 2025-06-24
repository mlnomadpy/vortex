<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Background particles effect -->
    <ParticlesBackground />
    
    <!-- Main router view -->
    <router-view />
    
    <!-- Global notifications -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ParticlesBackground from '@/components/ui/ParticlesBackground.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// Helper function to wait for MathJax to be ready
const waitForMathJax = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkMathJax = () => {
      if (window.MathJax && window.MathJax.typesetPromise && typeof window.MathJax.typesetPromise === 'function') {
        resolve()
      } else {
        setTimeout(checkMathJax, 100) // Check every 100ms
      }
    }
    checkMathJax()
  })
}

onMounted(async () => {
  // Initialize MathJax when it's ready
  try {
    await waitForMathJax()
    await window.MathJax.typesetPromise()
  } catch (error) {
    console.warn('MathJax initialization failed:', error)
  }
  
  // Welcome notification
  setTimeout(() => {
    notificationStore.addNotification({
      message: 'Welcome! Upload a CSV file or click on the canvas to start building your neural network.',
      type: 'info',
      duration: 4000
    })
  }, 1000)
})
</script>

<style>
/* Global styles will be handled by Tailwind CSS */
</style>
