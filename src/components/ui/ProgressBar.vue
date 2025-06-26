<template>
  <div class="progress-container">
    <div v-if="label" class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium text-theme-primary">{{ label }}</span>
      <span v-if="showPercentage" class="text-sm text-theme-secondary">
        {{ Math.round(value) }}%
      </span>
    </div>
    
    <div 
      :class="trackClasses"
      role="progressbar"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-label="ariaLabel"
    >
      <div 
        :class="fillClasses"
        :style="fillStyle"
      >
        <div v-if="animated" class="progress-shine"></div>
      </div>
    </div>
    
    <div v-if="description" class="text-xs text-theme-secondary mt-1">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  label?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  animated?: boolean
  showPercentage?: boolean
  striped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  variant: 'default',
  size: 'md',
  animated: false,
  showPercentage: true,
  striped: false
})

const trackClasses = computed(() => [
  'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
  {
    'h-1': props.size === 'xs',
    'h-2': props.size === 'sm',
    'h-3': props.size === 'md',
    'h-4': props.size === 'lg',
  }
])

const fillClasses = computed(() => [
  'h-full transition-all duration-300 ease-out relative overflow-hidden',
  {
    'bg-blue-500': props.variant === 'default',
    'bg-green-500': props.variant === 'success',
    'bg-yellow-500': props.variant === 'warning',
    'bg-red-500': props.variant === 'error',
  },
  {
    'progress-striped': props.striped,
    'progress-animated': props.animated,
  }
])

const fillStyle = computed(() => ({
  width: `${Math.max(0, Math.min(100, props.value))}%`
}))

const ariaLabel = computed(() => 
  props.label || `Progress: ${Math.round(props.value)}%`
)
</script>

<style scoped>
.progress-striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.progress-animated.progress-striped {
  animation: progress-stripe 1s linear infinite;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s ease-in-out infinite;
}

@keyframes progress-stripe {
  0% {
    background-position: 1rem 0;
  }
  100% {
    background-position: 0 0;
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .progress-animated,
  .progress-shine {
    animation: none !important;
  }
  
  .h-full {
    transition: none !important;
  }
}
</style> 