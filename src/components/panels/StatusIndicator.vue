<template>
  <div class="status-indicator" :class="statusClass">
    <div class="status-icon">
      <component :is="statusIcon" class="icon" />
    </div>
    <div class="status-content">
      <span class="status-text">{{ statusText }}</span>
      <span v-if="showProgress && isRunning" class="status-progress">
        {{ progressText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@/components/ui/icons'

interface Props {
  status: 'ready' | 'training' | 'stopped' | 'completed' | 'error'
  isRunning?: boolean
  currentStep?: number
  totalSteps?: number
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRunning: false,
  currentStep: 0,
  totalSteps: 0,
  showProgress: true
})

const statusClass = computed(() => [
  'status-indicator',
  `status-${props.status}`,
  {
    'is-running': props.isRunning,
    'has-progress': props.showProgress && props.isRunning
  }
])

const statusIcon = computed(() => {
  switch (props.status) {
    case 'training':
      return PlayIcon
    case 'completed':
      return CheckCircleIcon
    case 'stopped':
      return StopIcon
    case 'error':
      return ExclamationTriangleIcon
    default:
      return CogIcon
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'training':
      return 'Training'
    case 'completed':
      return 'Completed'
    case 'stopped':
      return 'Stopped'
    case 'error':
      return 'Error'
    default:
      return 'Ready'
  }
})

const progressText = computed(() => {
  if (!props.showProgress || !props.isRunning) return ''
  if (props.totalSteps === 0) return 'Starting...'
  
  const percent = Math.round((props.currentStep / props.totalSteps) * 100)
  return `${props.currentStep}/${props.totalSteps} (${percent}%)`
})
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #2d2d30;
  border: 1px solid #464647;
  transition: all 0.3s ease;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.icon {
  width: 12px;
  height: 12px;
  transition: all 0.3s ease;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-progress {
  font-size: 10px;
  color: #999999;
}

/* Status Variants */
.status-ready {
  border-color: #555555;
}

.status-ready .status-icon {
  background: #555555;
}

.status-ready .icon {
  color: #cccccc;
}

.status-training {
  border-color: #007acc;
  background: rgba(0, 122, 204, 0.1);
}

.status-training .status-icon {
  background: #007acc;
  animation: pulse 2s infinite;
}

.status-training .icon {
  color: white;
}

.status-completed {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.status-completed .status-icon {
  background: #28a745;
}

.status-completed .icon {
  color: white;
}

.status-stopped {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.1);
}

.status-stopped .status-icon {
  background: #ffc107;
}

.status-stopped .icon {
  color: #333;
}

.status-error {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.status-error .status-icon {
  background: #dc3545;
}

.status-error .icon {
  color: white;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .status-indicator {
    padding: 4px 8px;
    gap: 6px;
  }
  
  .status-icon {
    width: 16px;
    height: 16px;
  }
  
  .icon {
    width: 10px;
    height: 10px;
  }
  
  .status-text {
    font-size: 11px;
  }
  
  .status-progress {
    font-size: 9px;
  }
}
</style> 