<template>
  <div class="progress-container">
    <div class="progress-header">
      <span class="progress-label">Training Progress</span>
      <span class="progress-percentage">{{ progress }}%</span>
    </div>
    
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ 
            width: `${progress}%`,
            background: progressGradient
          }"
        ></div>
        
        <!-- Milestone markers -->
        <div class="progress-milestones">
          <div 
            v-for="milestone in milestones"
            :key="milestone"
            class="milestone"
            :style="{ left: `${milestone}%` }"
            :class="{ reached: progress >= milestone }"
            :title="`${milestone}% milestone`"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="progress-info">
      <div class="step-info">
        <span class="step-current">{{ currentStep }}</span>
        <span class="step-separator">/</span>
        <span class="step-total">{{ totalSteps }}</span>
        <span class="step-label">steps</span>
      </div>
      
      <div class="progress-details">
        <div v-if="remainingSteps > 0" class="remaining">
          {{ remainingSteps }} remaining
        </div>
        <div v-else class="completed">
          Complete!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number
  currentStep: number
  totalSteps: number
  milestones?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  milestones: () => [25, 50, 75, 90]
})

const remainingSteps = computed(() => 
  Math.max(0, props.totalSteps - props.currentStep)
)

const progressGradient = computed(() => {
  const percent = props.progress
  if (percent < 25) {
    return 'linear-gradient(90deg, #007acc 0%, #0084d1 100%)'
  } else if (percent < 50) {
    return 'linear-gradient(90deg, #007acc 0%, #0084d1 50%, #00a2ff 100%)'
  } else if (percent < 75) {
    return 'linear-gradient(90deg, #007acc 0%, #00a2ff 50%, #28a745 100%)'
  } else if (percent < 90) {
    return 'linear-gradient(90deg, #007acc 0%, #00a2ff 33%, #28a745 66%, #20c997 100%)'
  } else {
    return 'linear-gradient(90deg, #28a745 0%, #20c997 50%, #17a2b8 100%)'
  }
})
</script>

<style scoped>
.progress-container {
  padding: 16px;
  background: var(--progress-bg, #2d2d30);
  border-radius: 6px;
  border: 1px solid var(--progress-border, #464647);
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
  color: var(--text-secondary, #999999);
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #cccccc);
}

.progress-bar-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--progress-track, #464647);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
  background: var(--progress-fill, #007acc);
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
  width: 3px;
  height: 100%;
  background: var(--milestone-color, #555555);
  border-radius: 1px;
  transition: all 0.3s ease;
  top: 0;
  transform: translateX(-50%);
}

.milestone.reached {
  background: var(--milestone-reached, #ffffff);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.milestone:hover {
  background: var(--milestone-hover, #cccccc);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 11px;
}

.step-current {
  font-weight: 600;
  color: var(--primary-color, #007acc);
}

.step-separator {
  color: var(--text-tertiary, #777777);
}

.step-total {
  color: var(--text-secondary, #999999);
  font-weight: 500;
}

.step-label {
  color: var(--text-tertiary, #777777);
  font-size: 10px;
  margin-left: 2px;
}

.progress-details {
  font-size: 10px;
  color: var(--text-secondary, #999999);
}

.remaining {
  color: var(--warning-color, #ffc107);
}

.completed {
  color: var(--success-color, #28a745);
  font-weight: 600;
}

/* Animation for progress fill */
@keyframes progress-fill {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.progress-fill {
  background-size: 200% 100%;
  animation: progress-fill 2s linear infinite;
}

/* Responsive design */
@media (max-width: 576px) {
  .progress-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .progress-container {
    padding: 12px;
  }
}
</style> 