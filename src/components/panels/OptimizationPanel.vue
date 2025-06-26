<template>
  <FloatingPanel 
    title="Optimization" 
    :icon="RocketLaunchIcon"
    :width="320"
    :initial-position="{ x: 600, y: 80 }"
  >
    <!-- Training Controls -->
    <div class="panel-section">
      <div class="section-header">
        <RocketLaunchIcon class="section-icon" />
        <span class="section-title">Training</span>
        <div class="status-indicator" :class="{ active: isRunning }">
          <div class="status-dot"></div>
          <span class="status-text">{{ isRunning ? 'Running' : 'Stopped' }}</span>
        </div>
      </div>
      
      <div class="training-controls">
        <!-- Primary Action -->
        <div class="primary-action">
          <Button
            v-if="!isRunning"
            @click="startOptimization"
            :disabled="!canOptimize"
            variant="default"
            size="lg"
            class="start-btn"
          >
            <PlayIcon class="btn-icon" />
            Start Training
          </Button>
          
          <Button
            v-else
            @click="stopOptimization"
            variant="destructive"
            size="lg"
            class="stop-btn"
          >
            <StopIcon class="btn-icon" />
            Stop Training
          </Button>
        </div>
        
        <!-- Secondary Actions -->
        <div class="secondary-actions">
          <Button
            @click="pauseOptimization"
            :disabled="!isRunning"
            variant="outline"
            size="sm"
            class="secondary-btn"
          >
            <component :is="PauseIcon" class="btn-icon" />
            Pause
          </Button>
          
          <Button
            @click="resetOptimization"
            :disabled="isRunning"
            variant="outline"
            size="sm"
            class="secondary-btn"
          >
            <ArrowPathIcon class="btn-icon" />
            Reset
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Progress -->
    <div v-if="isRunning || hasHistory" class="panel-section">
      <div class="section-header">
        <ChartBarIcon class="section-icon" />
        <span class="section-title">Progress</span>
        <span class="progress-percent">{{ progressPercent }}%</span>
      </div>
      
      <div class="progress-controls">
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
          <div class="progress-text">
            Step {{ currentStep }} / {{ totalSteps }}
          </div>
        </div>
        
        <!-- Real-time Metrics -->
        <div class="metrics-grid">
          <div class="metric-card loss">
            <div class="metric-label">Loss</div>
            <div class="metric-value">{{ currentLoss.toFixed(4) }}</div>
            <div class="metric-trend" :class="lossTrend">
              <component :is="getTrendIcon(lossTrend)" class="trend-icon" />
            </div>
          </div>
          
          <div class="metric-card accuracy">
            <div class="metric-label">Accuracy</div>
            <div class="metric-value">{{ currentAccuracy.toFixed(1) }}%</div>
            <div class="metric-trend" :class="accuracyTrend">
              <component :is="getTrendIcon(accuracyTrend)" class="trend-icon" />
            </div>
          </div>
          
          <div class="metric-card rate">
            <div class="metric-label">Steps/sec</div>
            <div class="metric-value">{{ stepsPerSecond.toFixed(1) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="panel-divider"></div>
    
    <!-- Configuration -->
    <div class="panel-section">
      <div class="section-header">
        <CogIcon class="section-icon" />
        <span class="section-title">Configuration</span>
      </div>
      
      <div class="config-controls">
        <!-- Learning Rate -->
        <div class="param-control">
          <div class="param-header">
            <label class="param-label">Learning Rate</label>
            <span class="param-value">{{ config.learningRate }}</span>
          </div>
          <input
            v-model.number="config.learningRate"
            type="range"
            min="0.001"
            max="1"
            step="0.001"
            class="param-slider"
            :disabled="isRunning"
            @input="updateConfig"
          />
          <div class="param-marks">
            <span>0.001</span>
            <span>0.1</span>
            <span>1.0</span>
          </div>
        </div>
        
        <!-- Epochs -->
        <div class="param-control">
          <div class="param-header">
            <label class="param-label">Epochs</label>
            <input
              v-model.number="config.epochs"
              type="number"
              min="1"
              max="1000"
              class="param-input"
              :disabled="isRunning"
              @change="updateConfig"
            />
          </div>
        </div>
        
        <!-- Speed -->
        <div class="param-control">
          <div class="param-header">
            <label class="param-label">Speed</label>
            <span class="param-value">{{ config.speed.toFixed(1) }}x</span>
          </div>
          <input
            v-model.number="config.speed"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            class="param-slider"
            @input="updateConfig"
          />
          <div class="param-marks">
            <span>0.1x</span>
            <span>1x</span>
            <span>5x</span>
          </div>
        </div>
        
        <!-- Advanced Settings Toggle -->
        <button 
          @click="showAdvanced = !showAdvanced"
          class="advanced-toggle"
        >
          <component :is="ChevronDownIcon" :class="['toggle-icon', { rotated: showAdvanced }]" />
          Advanced Settings
        </button>
        
        <!-- Advanced Settings -->
        <div v-if="showAdvanced" class="advanced-settings">
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Batch Size</label>
              <input
                v-model.number="config.batchSize"
                type="number"
                min="1"
                max="100"
                class="param-input small"
                :disabled="isRunning"
                @change="updateConfig"
              />
            </div>
          </div>
          
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Momentum</label>
              <span class="param-value">{{ config.momentum.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="config.momentum"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="param-slider"
              :disabled="isRunning"
              @input="updateConfig"
            />
          </div>
        </div>
      </div>
    </div>
  </FloatingPanel>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import FloatingPanel from '@/components/ui/FloatingPanel.vue'
import { Button } from '@/components/ui'
import { 
  RocketLaunchIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CogIcon,
  ChevronDownIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

// Create missing icons
const PauseIcon = {
  render() {
    return h('svg', {
      class: 'w-4 h-4',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }
}

const TrendUpIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
      })
    ])
  }
}

const TrendDownIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
      })
    ])
  }
}

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const showAdvanced = ref(false)

// Local config state
const config = ref({
  learningRate: store.optimizationHistory.config.learningRate,
  epochs: store.optimizationHistory.config.epochs,
  speed: store.optimizationHistory.config.speed,
  batchSize: 32,
  momentum: 0.9
})

// Computed properties
const isRunning = computed(() => store.optimizationHistory.isRunning)
const currentStep = computed(() => store.optimizationHistory.currentStep)
const totalSteps = computed(() => store.optimizationHistory.totalSteps)
const hasHistory = computed(() => store.optimizationHistory.steps.length > 0)

const progressPercent = computed(() => 
  Math.round((currentStep.value / Math.max(totalSteps.value, 1)) * 100)
)

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

const lossTrend = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 'neutral'
  
  const recent = steps.slice(-5)
  const first = recent[0].loss
  const last = recent[recent.length - 1].loss
  
  if (last < first * 0.95) return 'down' // Good for loss
  if (last > first * 1.05) return 'up' // Bad for loss
  return 'neutral'
})

const accuracyTrend = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 'neutral'
  
  const recent = steps.slice(-5)
  const first = recent[0].accuracy
  const last = recent[recent.length - 1].accuracy
  
  if (last > first + 1) return 'up' // Good for accuracy
  if (last < first - 1) return 'down' // Bad for accuracy
  return 'neutral'
})

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up': return TrendUpIcon
    case 'down': return TrendDownIcon
    default: return 'div'
  }
}

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
  
  updateConfig()
  
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

function pauseOptimization() {
  // Implementation for pause functionality
  notificationStore.addNotification({
    message: 'Pause not yet implemented',
    type: 'info'
  })
}

function resetOptimization() {
  store.clearOptimizationHistory()
  notificationStore.addNotification({
    message: 'Optimization history cleared',
    type: 'info'
  })
}
</script>

<style scoped>
.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #464647;
}

.section-icon {
  width: 14px;
  height: 14px;
  color: #007acc;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  flex: 1;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666666;
  transition: background 0.3s ease;
}

.status-indicator.active .status-dot {
  background: #28a745;
  box-shadow: 0 0 4px rgba(40, 167, 69, 0.6);
}

.status-text {
  font-size: 9px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.progress-percent {
  font-size: 10px;
  color: #999999;
  background: #464647;
  padding: 2px 6px;
  border-radius: 8px;
}

.panel-divider {
  height: 1px;
  background: #464647;
  margin: 12px -8px;
}

/* Training Controls */
.primary-action {
  margin-bottom: 8px;
}

.start-btn, .stop-btn {
  width: 100%;
  font-size: 12px;
  padding: 12px 16px;
  height: auto;
  font-weight: 600;
}

.start-btn {
  background: #28a745;
  border-color: #28a745;
}

.start-btn:hover:not(:disabled) {
  background: #218838;
  border-color: #218838;
}

.stop-btn {
  background: #dc3545;
  border-color: #dc3545;
}

.stop-btn:hover {
  background: #c82333;
  border-color: #c82333;
}

.secondary-actions {
  display: flex;
  gap: 6px;
}

.secondary-btn {
  flex: 1;
  font-size: 10px;
  padding: 6px 8px;
  height: auto;
}

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

/* Progress */
.progress-bar-container {
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #464647;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007acc 0%, #00a2ff 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 10px;
  color: #999999;
  text-align: center;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.metric-card {
  padding: 8px;
  background: #383838;
  border-radius: 4px;
  text-align: center;
  position: relative;
}

.metric-card.loss {
  border-left: 3px solid #dc3545;
}

.metric-card.accuracy {
  border-left: 3px solid #28a745;
}

.metric-card.rate {
  border-left: 3px solid #ffc107;
}

.metric-label {
  font-size: 8px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
}

.metric-trend {
  position: absolute;
  top: 4px;
  right: 4px;
}

.metric-trend.up {
  color: #28a745;
}

.metric-trend.down {
  color: #dc3545;
}

.trend-icon {
  width: 8px;
  height: 8px;
}

/* Configuration */
.param-control {
  margin-bottom: 12px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.param-label {
  font-size: 10px;
  color: #cccccc;
  font-weight: 500;
}

.param-value {
  font-size: 10px;
  color: #007acc;
  font-weight: 600;
}

.param-input {
  width: 60px;
  padding: 3px 6px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 3px;
  color: #cccccc;
  font-size: 10px;
  text-align: center;
}

.param-input.small {
  width: 40px;
}

.param-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
}

.param-slider {
  width: 100%;
  height: 4px;
  background: #555555;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin-bottom: 4px;
  -webkit-appearance: none;
  appearance: none;
}

.param-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
}

.param-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.param-marks {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #777777;
}

/* Advanced Settings */
.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 6px 8px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  font-size: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.advanced-toggle:hover {
  background: #404040;
  border-color: #666666;
}

.toggle-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.2s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.advanced-settings {
  padding: 8px;
  background: #383838;
  border-radius: 4px;
  border: 1px solid #555555;
}
</style> 