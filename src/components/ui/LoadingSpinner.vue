<template>
  <div 
    :class="containerClasses"
    role="status"
    :aria-label="ariaLabel"
  >
    <div :class="spinnerClasses">
      <div class="loading-ring"></div>
      <div class="loading-ring"></div>
      <div class="loading-ring"></div>
    </div>
    
    <div v-if="message" :class="messageClasses">
      {{ message }}
    </div>
    
    <div v-if="progress !== undefined" class="mt-2">
      <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          class="bg-blue-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <div class="text-xs text-theme-secondary mt-1 text-center">
        {{ progress.toFixed(0) }}%
      </div>
    </div>
    
    <span class="sr-only">{{ ariaLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  progress?: number
  fullscreen?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  fullscreen: false,
  overlay: false
})

const containerClasses = computed(() => [
  'flex flex-col items-center justify-center',
  {
    'fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-sm': props.fullscreen || props.overlay,
    'p-4': props.fullscreen,
  }
])

const spinnerClasses = computed(() => [
  'relative',
  {
    'w-4 h-4': props.size === 'xs',
    'w-6 h-6': props.size === 'sm',
    'w-8 h-8': props.size === 'md',
    'w-12 h-12': props.size === 'lg',
    'w-16 h-16': props.size === 'xl',
  }
])

const messageClasses = computed(() => [
  'text-theme-secondary mt-3 text-center',
  {
    'text-xs': props.size === 'xs',
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'text-xl': props.size === 'xl',
  }
])

const ariaLabel = computed(() => {
  if (props.message) return props.message
  if (props.progress !== undefined) return `Loading: ${props.progress.toFixed(0)}%`
  return 'Loading...'
})
</script>

<style scoped>
.loading-ring {
  position: absolute;
  border: 2px solid transparent;
  border-top: 2px solid rgb(59 130 246); /* blue-500 */
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.loading-ring:nth-child(1) {
  width: 100%;
  height: 100%;
}

.loading-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  animation-delay: -0.4s;
  border-top-color: rgb(99 102 241); /* indigo-500 */
}

.loading-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  animation-delay: -0.8s;
  border-top-color: rgb(129 140 248); /* indigo-400 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .loading-ring {
    animation-duration: 2s;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .loading-ring {
    border-width: 3px;
  }
}
</style> 