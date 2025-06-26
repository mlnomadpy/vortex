<template>
  <div class="optimization-controls">
    <div class="controls-header">
      <div class="controls-title">
        <span>Optimization</span>
      </div>
      <div class="status-indicator" :class="{ active: isRunning }">
        <div class="status-dot"></div>
        <span>{{ isRunning ? 'Running' : 'Stopped' }}</span>
      </div>
    </div>
    
    <div class="controls-content">
      <!-- Configuration Controls -->
      <div class="config-section">
        <div class="control-group">
          <label class="control-label">Learning Rate</label>
          <input
            v-model.number="config.learningRate"
            type="number"
            step="0.001"
            min="0.001"
            max="1"
            class="control-input"
            :disabled="isRunning"
            @change="updateConfig"
          />
        </div>
        
        <div class="control-group">
          <label class="control-label">Epochs</label>
          <input
            v-model.number="config.epochs"
            type="number"
            step="1"
            min="1"
            max="1000"
            class="control-input"
            :disabled="isRunning"
            @change="updateConfig"
          />
        </div>
        
        <div class="control-group">
          <label class="control-label">
            Speed
            <span class="speed-value">{{ config.speed.toFixed(1) }}x</span>
          </label>
          <input
            v-model.number="config.speed"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            class="speed-slider"
            @input="updateConfig"
          />
          <div class="speed-labels">
            <span>0.1x</span>
            <span>5.0x</span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-section">
        <Button
          v-if="!isRunning"
          @click="startOptimization"
          :disabled="!canOptimize"
          variant="default"
          size="sm"
          title="Start Gradient Descent"
          data-tour="train-button"
          class="action-button primary-action"
        >
          <RocketLaunchIcon class="button-icon" />
          Start
        </Button>
        
        <Button
          v-else
          @click="stopOptimization"
          variant="destructive"
          size="sm"
          title="Stop Optimization"
          class="action-button stop-action"
        >
          <StopIcon class="button-icon" />
          Stop
        </Button>
        
        <Button
          @click="resetOptimization"
          :disabled="isRunning"
          variant="outline"
          size="sm"
          title="Reset History"
          class="action-button reset-action"
        >
          <ArrowPathIcon class="button-icon" />
          Reset
        </Button>
      </div>
      
      <!-- Progress Bar -->
      <div v-if="isRunning || hasHistory" class="progress-section">
        <div class="progress-info">
          <span class="progress-text">
            Step {{ currentStep }} / {{ totalSteps }}
          </span>
          <span class="progress-percent">
            {{ ((currentStep / Math.max(totalSteps, 1)) * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${(currentStep / Math.max(totalSteps, 1)) * 100}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Real-time Metrics -->
      <div v-if="hasHistory" class="metrics-section">
        <div class="metric-item">
          <span class="metric-label">Current Loss</span>
          <span class="metric-value metric-loss">{{ currentLoss.toFixed(4) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Accuracy</span>
          <span class="metric-value metric-accuracy">{{ currentAccuracy.toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Steps/sec</span>
          <span class="metric-value metric-rate">{{ stepsPerSecond.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RocketLaunchIcon, StopIcon, ArrowPathIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

// Local config state
const config = ref({
  learningRate: store.optimizationHistory.config.learningRate,
  epochs: store.optimizationHistory.config.epochs,
  speed: store.optimizationHistory.config.speed
})

// Computed properties
const isRunning = computed(() => store.optimizationHistory.isRunning)
const currentStep = computed(() => store.optimizationHistory.currentStep)
const totalSteps = computed(() => store.optimizationHistory.totalSteps)
const hasHistory = computed(() => store.optimizationHistory.steps.length > 0)

const canOptimize = computed(() => 
  store.neurons.length > 0 && 
  store.filteredDataPoints.length > 0 && 
  !isRunning.value
)

const currentLoss = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].loss : 0
})

const currentAccuracy = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].accuracy : 0
})

const stepsPerSecond = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 0
  
  const recentSteps = steps.slice(-10) // Last 10 steps
  if (recentSteps.length < 2) return 0
  
  const timeSpan = recentSteps[recentSteps.length - 1].timestamp - recentSteps[0].timestamp
  const stepCount = recentSteps.length - 1
  
  return timeSpan > 0 ? (stepCount / (timeSpan / 1000)) : 0
})

// Actions
function updateConfig() {
  store.updateOptimizationConfig({
    learningRate: config.value.learningRate,
    epochs: config.value.epochs,
    speed: config.value.speed
  })
}

async function startOptimization() {
  if (!canOptimize.value) {
    notificationStore.addNotification({
      message: 'Cannot start optimization: need neurons and data points',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  updateConfig() // Ensure config is synced
  
  notificationStore.addNotification({
    message: `Starting optimization: ${config.value.epochs} epochs at ${config.value.speed}x speed`,
    type: 'info',
    duration: 2000
  })
  
  try {
    await store.runGradientDescent()
    
    if (store.optimizationHistory.currentStep >= store.optimizationHistory.totalSteps) {
      notificationStore.addNotification({
        message: 'Optimization completed successfully!',
        type: 'success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Optimization error:', error)
    notificationStore.addNotification({
      message: 'Optimization failed. Please try again.',
      type: 'error',
      duration: 4000
    })
  }
}

function stopOptimization() {
  store.stopOptimization()
  notificationStore.addNotification({
    message: 'Optimization stopped',
    type: 'info',
    duration: 2000
  })
}

function resetOptimization() {
  store.clearOptimizationHistory()
  notificationStore.addNotification({
    message: 'Optimization history cleared',
    type: 'info',
    duration: 2000
  })
}

// Watch for store config changes and sync local config
watch(() => store.optimizationHistory.config, (newConfig) => {
  config.value = { ...newConfig }
}, { deep: true })
</script>

<style scoped>
.optimization-controls {
  background: rgb(var(--bg-secondary));
  border-radius: 6px;
  border: 1px solid rgb(var(--border-primary));
  overflow: hidden;
  transition: all 0.2s ease;
}

.optimization-controls:hover {
  border-color: rgb(var(--border-secondary));
  box-shadow: 0 2px 8px rgba(var(--shadow-light));
}

.controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-primary));
}

.controls-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.title-icon {
  width: 16px;
  height: 16px;
  color: rgb(var(--color-primary));
  transition: color 0.2s ease;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  padding: 4px 8px;
  background: rgb(var(--bg-primary));
  border-radius: 12px;
  border: 1px solid rgb(var(--border-secondary));
  transition: all 0.2s ease;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--color-error));
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.status-indicator.active {
  background: rgba(var(--color-success), 0.1);
  border-color: rgb(var(--color-success));
  color: rgb(var(--color-success));
}

.status-indicator.active .status-dot {
  background: rgb(var(--color-success));
  animation: pulse-glow 2s infinite;
  box-shadow: 0 0 4px rgba(var(--color-success), 0.6);
}

@keyframes pulse-glow {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.1);
  }
}

.controls-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.speed-value {
  font-size: 9px;
  color: rgb(var(--color-primary));
  font-weight: 500;
  background: rgba(var(--color-primary), 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(var(--color-primary), 0.2);
}

.control-input {
  padding: 6px 8px;
  font-size: 11px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  transition: all 0.2s ease;
}

.control-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 2px rgba(var(--color-primary), 0.1);
  background: rgba(var(--color-primary), 0.02);
}

.control-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgb(var(--bg-tertiary));
}

.speed-slider {
  width: 100%;
  height: 6px;
  background: rgb(var(--bg-tertiary));
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s ease;
}

.speed-slider:hover {
  background: rgb(var(--bg-quaternary));
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(var(--shadow-medium));
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(var(--color-primary), 0.3);
}

.speed-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  margin-top: 4px;
  font-weight: 500;
}

.action-section {
  display: flex;
  gap: 8px;
}

.action-button {
  flex: 1;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}

.button-icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgb(var(--text-secondary));
  font-weight: 500;
}

.progress-text {
  color: rgb(var(--text-primary));
}

.progress-percent {
  color: rgb(var(--color-primary));
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: rgb(var(--bg-tertiary));
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--color-primary)), rgb(var(--color-secondary)));
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { left: -50%; }
  100% { left: 100%; }
}

.metrics-section {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: rgb(var(--bg-primary));
  border-radius: 6px;
  border: 1px solid rgb(var(--border-secondary));
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  text-align: center;
}

.metric-label {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
  transition: color 0.2s ease;
}

.metric-loss {
  color: rgb(var(--color-error));
}

.metric-accuracy {
  color: rgb(var(--color-success));
}

.metric-rate {
  color: rgb(var(--color-primary));
}

/* Responsive Design */
@media (max-width: 768px) {
  .controls-content {
    padding: 12px;
    gap: 12px;
  }
  
  .action-section {
    flex-direction: column;
    gap: 6px;
  }
  
  .action-button {
    flex: none;
  }
  
  .metrics-section {
    flex-direction: column;
    gap: 6px;
  }
  
  .metric-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }
}

/* Enhanced focus states for accessibility */
@media (prefers-reduced-motion: no-preference) {
  .optimization-controls {
    will-change: transform;
  }
  
  .action-button,
  .control-input,
  .speed-slider {
    will-change: transform;
  }
}

/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  .optimization-controls {
    border-width: 2px;
  }
  
  .status-dot {
    border: 1px solid currentColor;
  }
  
  .metric-loss,
  .metric-accuracy,
  .metric-rate {
    text-decoration: underline;
  }
}
</style> 