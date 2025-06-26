<template>
  <div v-if="isVisible" class="tutorial-progress">
    <div class="progress-container">
      <div class="progress-info">
        <span class="progress-icon">📚</span>
        <span class="progress-text">{{ message }}</span>
        <span class="progress-step">{{ currentStep + 1 }}/{{ totalSteps }}</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ 
            width: `${progressPercentage}%`,
            backgroundColor: progressColor
          }"
        ></div>
      </div>
      <div class="progress-actions">
        <button
          v-if="showSkip"
          @click="$emit('skip')"
          class="progress-action skip"
          title="Skip tutorial"
        >
          Skip
        </button>
        <button
          v-if="showNext && !waitingForAction"
          @click="$emit('next')"
          class="progress-action next"
          title="Continue to next step"
        >
          Next
        </button>
        <span v-if="waitingForAction" class="waiting-indicator">
          <span class="waiting-dot"></span>
          <span class="waiting-text">{{ waitingMessage }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isVisible: boolean
  currentStep: number
  totalSteps: number
  message: string
  waitingForAction?: boolean
  waitingMessage?: string
  showSkip?: boolean
  showNext?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  waitingForAction: false,
  waitingMessage: 'Complete the action to continue...',
  showSkip: true,
  showNext: true
})

const emit = defineEmits<{
  skip: []
  next: []
}>()

const progressPercentage = computed(() => {
  return Math.round(((props.currentStep + 1) / props.totalSteps) * 100)
})

const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 25) return 'rgb(239 68 68)' // red-500
  if (percentage < 50) return 'rgb(245 158 11)' // amber-500
  if (percentage < 75) return 'rgb(59 130 246)' // blue-500
  return 'rgb(34 197 94)' // green-500
})
</script>

<style scoped>
.tutorial-progress {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 55;
  animation: slide-down 0.4s ease-out;
}

.progress-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.05);
  min-width: 320px;
  max-width: 500px;
}

.dark .progress-container {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-icon {
  font-size: 1.25rem;
}

.progress-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-primary));
  line-height: 1.4;
}

.progress-step {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  background: rgb(var(--bg-tertiary));
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgb(var(--bg-tertiary));
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  transition: all 0.4s ease-out;
  border-radius: 3px;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s ease-in-out infinite;
}

.progress-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.progress-action {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.progress-action.skip {
  background: transparent;
  color: rgb(var(--text-secondary));
}

.progress-action.skip:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgb(var(--text-primary));
}

.dark .progress-action.skip:hover {
  background: rgba(255, 255, 255, 0.05);
}

.progress-action.next {
  background: rgb(59 130 246);
  color: white;
}

.progress-action.next:hover {
  background: rgb(37 99 235);
  transform: translateY(-1px);
}

.waiting-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(var(--text-secondary));
  font-size: 0.75rem;
}

.waiting-dot {
  width: 8px;
  height: 8px;
  background: rgb(59 130 246);
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.waiting-text {
  font-weight: 500;
}

/* Animations */
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .tutorial-progress {
    left: 1rem;
    right: 1rem;
    transform: none;
  }
  
  .progress-container {
    min-width: auto;
    padding: 0.75rem 1rem;
  }
  
  .progress-info {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .progress-text {
    font-size: 0.8125rem;
  }
  
  .progress-actions {
    gap: 0.5rem;
  }
  
  .progress-action {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tutorial-progress,
  .progress-fill,
  .progress-fill::after,
  .waiting-dot,
  .progress-action {
    animation: none !important;
    transition-duration: 0.1s !important;
  }
  
  .progress-action.next:hover {
    transform: none;
  }
}
</style> 