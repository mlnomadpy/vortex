<template>
  <div class="progress-container">
    <div v-if="label" class="progress-header">
      <span class="progress-label">{{ label }}</span>
      <div class="progress-stats">
        <span class="progress-percentage">{{ Math.round(value) }}%</span>
        <span v-if="eta" class="progress-eta">ETA: {{ eta }}</span>
      </div>
    </div>
    
    <div class="progress-track">
      <div 
        class="progress-fill" 
        :style="fillStyle"
        :class="{ animated: animated }"
      >
        <div v-if="animated" class="progress-shine"></div>
      </div>
      
      <!-- Milestones -->
      <div v-if="milestones && milestones.length" class="progress-milestones">
        <div 
          v-for="milestone in milestones"
          :key="milestone"
          class="milestone"
          :style="{ left: `${milestone}%` }"
          :class="{ reached: value >= milestone }"
        >
          <div class="milestone-marker"></div>
          <div class="milestone-label">{{ milestone }}%</div>
        </div>
      </div>
    </div>
    
    <div v-if="showSteps" class="progress-steps">
      <span class="step-current">{{ current }}</span>
      <span class="step-separator">/</span>
      <span class="step-total">{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number
  current?: number
  total?: number
  label?: string
  eta?: string
  animated?: boolean
  showSteps?: boolean
  milestones?: number[]
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  current: 0,
  total: 0,
  animated: false,
  showSteps: true,
  milestones: () => [25, 50, 75],
  variant: 'default'
})

const fillStyle = computed(() => {
  const clampedValue = Math.max(0, Math.min(100, props.value))
  
  let gradient = ''
  switch (props.variant) {
    case 'success':
      gradient = 'linear-gradient(90deg, #28a745 0%, #20c997 100%)'
      break
    case 'warning':
      gradient = 'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)'
      break
    case 'error':
      gradient = 'linear-gradient(90deg, #dc3545 0%, #e74c3c 100%)'
      break
    default:
      if (clampedValue < 25) {
        gradient = 'linear-gradient(90deg, #007acc 0%, #0084d1 100%)'
      } else if (clampedValue < 50) {
        gradient = 'linear-gradient(90deg, #007acc 0%, #0084d1 50%, #00a2ff 100%)'
      } else if (clampedValue < 75) {
        gradient = 'linear-gradient(90deg, #007acc 0%, #00a2ff 50%, #28a745 100%)'
      } else {
        gradient = 'linear-gradient(90deg, #007acc 0%, #00a2ff 33%, #28a745 66%, #20c997 100%)'
      }
  }
  
  return {
    width: `${clampedValue}%`,
    background: gradient
  }
})
</script>

<style scoped>
.progress-container {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  font-weight: 500;
  color: #cccccc;
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
}

.progress-percentage {
  font-weight: 600;
  color: #007acc;
}

.progress-eta {
  color: #999999;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 8px;
  background: #464647;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill.animated {
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
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
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s ease-in-out infinite;
}

.progress-milestones {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.milestone {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
}

.milestone-marker {
  width: 3px;
  height: 16px;
  background: #464647;
  border-radius: 2px;
  margin: 0 auto;
  transition: background 0.3s ease;
}

.milestone.reached .milestone-marker {
  background: #007acc;
  box-shadow: 0 0 4px rgba(0, 122, 204, 0.5);
}

.milestone-label {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #999999;
  white-space: nowrap;
}

.milestone.reached .milestone-label {
  color: #007acc;
  font-weight: 600;
}

.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
}

.step-current {
  font-weight: 600;
  color: #007acc;
}

.step-separator {
  color: #666666;
}

.step-total {
  color: #999999;
}

/* Animations */
@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
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

/* Responsive */
@media (max-width: 480px) {
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .progress-stats {
    gap: 8px;
  }
  
  .progress-track {
    height: 6px;
  }
  
  .milestone-marker {
    width: 2px;
    height: 12px;
  }
  
  .milestone-label {
    font-size: 8px;
    top: 14px;
  }
}
</style> 