<template>
  <div class="optimization-controls">
    <div class="controls-header">
      <div class="controls-title">
        <CogIcon class="w-4 h-4" />
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
        >
          <RocketLaunchIcon class="w-4 h-4 mr-1" />
          Start
        </Button>
        
        <Button
          v-else
          @click="stopOptimization"
          variant="destructive"
          size="sm"
          title="Stop Optimization"
        >
          <StopIcon class="w-4 h-4 mr-1" />
          Stop
        </Button>
        
        <Button
          @click="resetOptimization"
          :disabled="isRunning"
          variant="outline"
          size="sm"
          title="Reset History"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1" />
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
          <span class="metric-value loss">{{ currentLoss.toFixed(4) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Accuracy</span>
          <span class="metric-value accuracy">{{ currentAccuracy.toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Steps/sec</span>
          <span class="metric-value rate">{{ stepsPerSecond.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CogIcon, RocketLaunchIcon, StopIcon, ArrowPathIcon } from '@/components/ui/icons'
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
}

.controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
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

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: rgb(var(--text-secondary));
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--color-error));
  transition: background 0.2s;
}

.status-indicator.active .status-dot {
  background: rgb(var(--color-success));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.controls-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.speed-value {
  font-size: 9px;
  color: rgb(var(--color-primary));
  font-weight: 500;
}

.control-input {
  padding: 4px 6px;
  font-size: 11px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
}

.control-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 1px rgb(var(--color-primary) / 0.2);
}

.control-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-slider {
  width: 100%;
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.speed-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  margin-top: 2px;
}

.action-section {
  display: flex;
  gap: 6px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.start-btn {
  background: rgb(var(--color-success));
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: rgb(var(--color-success-hover));
}

.stop-btn {
  background: rgb(var(--color-error));
  color: white;
}

.stop-btn:hover {
  background: rgb(var(--color-error-hover));
}

.reset-btn {
  background: rgb(var(--color-warning));
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: rgb(var(--color-warning-hover));
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgb(var(--text-secondary));
}

.progress-bar {
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgb(var(--color-primary));
  transition: width 0.3s ease;
}

.metrics-section {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgb(var(--bg-primary));
  border-radius: 4px;
  border: 1px solid rgb(var(--border-secondary));
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.metric-label {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  font-weight: 600;
}

.metric-value {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.metric-value.loss {
  color: #ef4444;
}

.metric-value.accuracy {
  color: #22c55e;
}

.metric-value.rate {
  color: rgb(var(--color-primary));
}
</style> 