<template>
  <div class="optimization-panel">
    <!-- Header with Status -->
    <header class="panel-header">
      <div class="header-content">
        <div class="title-section">
          <RocketLaunchIcon class="panel-icon" />
          <h2 class="panel-title">Optimization</h2>
        </div>
        <div class="status-indicator" :class="{ active: isRunning, completed: isCompleted }">
          <div class="status-dot"></div>
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
      </div>
    </header>

    <!-- Quick Actions Section -->
    <section class="quick-actions">
      <h3 class="section-title">
        <PlayIcon class="section-icon" />
        Quick Actions
      </h3>
      
      <!-- Training Presets -->
      <div class="preset-selection">
        <label class="preset-label">Training Presets</label>
        <div class="preset-grid">
          <button 
            v-for="preset in trainingPresets"
            :key="preset.id"
            @click="applyPreset(preset)"
            :class="['preset-btn', preset.color, { selected: selectedPreset === preset.id }]"
            :disabled="isRunning"
          >
            <component :is="preset.icon" class="preset-icon" />
            <div class="preset-info">
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-desc">{{ preset.description }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Primary Controls -->
      <div class="primary-controls">
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
        
        <div v-else class="training-controls">
          <Button
            @click="pauseOptimization"
            variant="outline"
            size="lg"
            class="pause-btn"
          >
            <PauseIcon class="btn-icon" />
            Pause
          </Button>
          
          <Button
            @click="stopOptimization"
            variant="destructive"
            size="lg"
            class="stop-btn"
          >
            <StopIcon class="btn-icon" />
            Stop
          </Button>
        </div>
      </div>
    </section>

    <!-- Training Progress Section -->
    <section v-if="isRunning || hasHistory" class="training-progress">
      <h3 class="section-title">
        <ChartBarIcon class="section-icon" />
        Training Progress
        <div class="progress-summary">
          <span class="progress-percent">{{ progressPercent }}%</span>
          <span class="eta">ETA: {{ estimatedTimeRemaining }}</span>
        </div>
      </h3>

      <!-- Enhanced Progress Bar -->
      <ProgressBarEnhanced
        :value="progressPercent"
        :current="currentStep"
        :total="totalSteps"
        :eta="estimatedTimeRemaining"
        :animated="isRunning"
        :milestones="progressMilestones"
        variant="default"
        show-steps
      />

      <!-- Performance Metrics -->
      <div class="metrics-section">
        <div class="metrics-header">
          <span>Performance Metrics</span>
          <button 
            @click="showDetailedMetrics = !showDetailedMetrics"
            class="metrics-toggle"
          >
            {{ showDetailedMetrics ? 'Compact' : 'Detailed' }}
          </button>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Current Loss</div>
            <div class="metric-value">{{ formatMetricValue(currentLoss, 4) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Accuracy</div>
            <div class="metric-value">{{ formatMetricValue(currentAccuracy, 1) }}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Speed</div>
            <div class="metric-value">{{ formatMetricValue(stepsPerSecond, 1) }}/s</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Status</div>
            <div class="metric-value">{{ convergenceStatus }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Configuration Section -->
    <section class="configuration">
      <h3 class="section-title">
        <CogIcon class="section-icon" />
        Configuration
        <button 
          @click="resetToDefaults"
          class="reset-btn"
          :disabled="isRunning"
        >
          <ArrowPathIcon class="reset-icon" />
          Reset
        </button>
      </h3>

      <!-- Configuration Tabs -->
      <div class="config-tabs">
        <button
          v-for="tab in configTabs"
          :key="tab.id"
          @click="activeConfigTab = tab.id"
          :class="['config-tab', { active: activeConfigTab === tab.id }]"
        >
          <component :is="tab.icon" class="tab-icon" />
          {{ tab.name }}
        </button>
      </div>

      <!-- Essential Parameters -->
      <div v-if="activeConfigTab === 'essential'" class="config-content">
        <div class="param-group">
          <!-- Learning Rate -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Learning Rate</label>
              <span class="param-value">{{ config.learningRate.toFixed(4) }}</span>
            </div>
            <input
              v-model.number="config.learningRate"
              type="range"
              min="0.0001"
              max="1"
              step="0.0001"
              class="param-slider"
              :disabled="isRunning"
              @input="updateConfig"
            />
            <div class="param-marks">
              <span>0.0001</span>
              <span>0.01</span>
              <span>0.1</span>
              <span>1.0</span>
            </div>
          </div>

          <!-- Epochs -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Epochs</label>
              <div class="param-actions">
                <input
                  v-model.number="config.epochs"
                  type="number"
                  min="1"
                  max="10000"
                  class="param-input"
                  :disabled="isRunning"
                  @change="updateConfig"
                />
                <button 
                  @click="suggestEpochs"
                  class="suggest-btn"
                  :disabled="isRunning"
                >
                  Auto
                </button>
              </div>
            </div>
            <div class="param-suggestions">
              <button 
                v-for="suggestion in epochSuggestions"
                :key="suggestion.value"
                @click="config.epochs = suggestion.value; updateConfig()"
                class="suggestion-chip"
                :disabled="isRunning"
              >
                {{ suggestion.value }} <span class="chip-label">{{ suggestion.label }}</span>
              </button>
            </div>
          </div>

          <!-- Training Speed -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Training Speed</label>
              <span class="param-value">{{ config.speed.toFixed(1) }}x</span>
            </div>
            <input
              v-model.number="config.speed"
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              class="param-slider"
              :disabled="isRunning"
              @input="updateConfig"
            />
            <div class="param-marks">
              <span>0.1x</span>
              <span>1x</span>
              <span>5x</span>
              <span>10x</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Parameters -->
      <div v-if="activeConfigTab === 'advanced'" class="config-content">
        <div class="param-group">
          <!-- Optimizer -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Optimizer</label>
              <select 
                v-model="config.optimizer"
                class="param-select"
                :disabled="isRunning"
                @change="updateConfig"
              >
                <option value="sgd">SGD</option>
                <option value="momentum">SGD with Momentum</option>
                <option value="adam">Adam</option>
                <option value="rmsprop">RMSprop</option>
              </select>
            </div>
          </div>

          <!-- Batch Size -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Batch Size</label>
              <input
                v-model.number="config.batchSize"
                type="number"
                min="1"
                max="1000"
                class="param-input"
                :disabled="isRunning"
                @change="updateConfig"
              />
            </div>
            <div class="param-help">Smaller batches = more updates, noisier gradients</div>
          </div>

          <!-- Momentum (conditional) -->
          <div v-if="config.optimizer === 'momentum' || config.optimizer === 'adam'" class="param-control">
            <div class="param-header">
              <label class="param-label">Momentum</label>
              <span class="param-value">{{ config.momentum.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="config.momentum"
              type="range"
              min="0"
              max="0.99"
              step="0.01"
              class="param-slider"
              :disabled="isRunning"
              @input="updateConfig"
            />
          </div>

          <!-- Weight Decay -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Weight Decay</label>
              <span class="param-value">{{ config.weightDecay.toFixed(4) }}</span>
            </div>
            <input
              v-model.number="config.weightDecay"
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              class="param-slider"
              :disabled="isRunning"
              @input="updateConfig"
            />
            <div class="param-help">Regularization to prevent overfitting</div>
          </div>
        </div>
      </div>

      <!-- Schedule Parameters -->
      <div v-if="activeConfigTab === 'schedule'" class="config-content">
        <div class="param-group">
          <!-- Learning Rate Schedule -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Learning Rate Schedule</label>
              <input
                v-model="useLearningRateSchedule"
                type="checkbox"
                class="param-checkbox"
                :disabled="isRunning"
                @change="updateConfig"
              />
            </div>
            <div v-if="useLearningRateSchedule" class="schedule-options">
              <select 
                v-model="learningRateSchedule.type"
                class="param-select"
                :disabled="isRunning"
              >
                <option value="exponential">Exponential Decay</option>
                <option value="step">Step Decay</option>
                <option value="cosine">Cosine Annealing</option>
              </select>
            </div>
          </div>

          <!-- Early Stopping -->
          <div class="param-control">
            <div class="param-header">
              <label class="param-label">Early Stopping</label>
              <input
                v-model="config.earlyStopping"
                type="checkbox"
                class="param-checkbox"
                :disabled="isRunning"
                @change="updateConfig"
              />
            </div>
            <div v-if="config.earlyStopping" class="early-stopping-options">
              <div class="param-header">
                <label class="param-label">Patience</label>
                <input
                  v-model.number="config.patience"
                  type="number"
                  min="5"
                  max="100"
                  class="param-input"
                  :disabled="isRunning"
                  @change="updateConfig"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Training History Section -->
    <section v-if="hasHistory" class="training-history">
      <h3 class="section-title">
        <ArrowPathIcon class="section-icon" />
        Training History
      </h3>

      <div class="history-actions">
        <Button
          @click="exportTrainingData"
          variant="outline"
          size="sm"
          class="history-btn"
        >
          <ArrowDownTrayIcon class="btn-icon" />
          Export Data
        </Button>
        
        <Button
          @click="visualizeTrainingHistory"
          variant="outline"
          size="sm"
          class="history-btn"
        >
          <ChartLineIcon class="btn-icon" />
          View Charts
        </Button>
        
        <Button
          @click="resetOptimization"
          :disabled="isRunning"
          variant="outline"
          size="sm"
          class="history-btn destructive"
        >
          <TrashIcon class="btn-icon" />
          Clear History
        </Button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui'
import {
  RocketLaunchIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  ArrowPathIcon,
  CogIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ChartLineIcon,
  CursorArrowRaysIcon as SparklesIcon,
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

// Child Components
import ProgressBarEnhanced from '../ui/ProgressBarEnhanced.vue'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

// UI State
const activeConfigTab = ref('essential')
const selectedPreset = ref<string | null>(null)
const showDetailedMetrics = ref(false)
const useLearningRateSchedule = ref(false)

// Configuration tabs
const configTabs = [
  { id: 'essential', name: 'Essential', icon: SparklesIcon },
  { id: 'advanced', name: 'Advanced', icon: CogIcon },
  { id: 'schedule', name: 'Schedule', icon: ArrowPathIcon }
]

// Training Presets
const trainingPresets = [
  {
    id: 'quick',
    name: 'Quick',
    description: 'Fast convergence for experimentation',
    icon: BoltIcon,
    config: { learningRate: 0.1, epochs: 50, speed: 3.0, optimizer: 'sgd' },
    color: 'success'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance of speed and accuracy',
    icon: ChartBarIcon,
    config: { learningRate: 0.01, epochs: 100, speed: 1.0, optimizer: 'sgd' },
    color: 'primary'
  },
  {
    id: 'thorough',
    name: 'Thorough',
    description: 'Stable training with fine-tuning',
    icon: CogIcon,
    config: { learningRate: 0.001, epochs: 200, speed: 0.5, optimizer: 'sgd' },
    color: 'secondary'
  }
]

// Configuration with defaults
const config = ref({
  learningRate: 0.01,
  epochs: 100,
  speed: 1.0,
  batchSize: 10,
  momentum: 0.9,
  weightDecay: 0.0001,
  optimizer: 'sgd',
  earlyStopping: false,
  patience: 20
})

// Learning rate schedule
const learningRateSchedule = ref({
  type: 'exponential',
  factor: 0.95
})

// Computed values
const isRunning = computed(() => store.optimizationHistory.isRunning)
const currentStep = computed(() => store.optimizationHistory.currentStep)
const totalSteps = computed(() => store.optimizationHistory.totalSteps)
const currentLoss = computed(() => store.currentLoss || 0)
const currentAccuracy = computed(() => store.accuracy || 0)
const hasHistory = computed(() => store.optimizationHistory.steps.length > 0)
const isCompleted = computed(() => hasHistory.value && !isRunning.value && currentStep.value >= totalSteps.value)

const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round((currentStep.value / totalSteps.value) * 100)
})

const progressMilestones = [25, 50, 75]

const canOptimize = computed(() => {
  return store.neurons.length > 0 && store.dataPoints.length > 0
})

const currentStatus = computed(() => {
  if (isCompleted.value) return 'completed'
  if (isRunning.value) return 'training'
  if (hasHistory.value) return 'stopped'
  return 'ready'
})

// Epoch suggestions based on data size
const epochSuggestions = computed(() => {
  const dataSize = store.dataPoints.length
  if (dataSize < 50) return [
    { value: 20, label: 'quick' },
    { value: 50, label: 'standard' },
    { value: 100, label: 'thorough' }
  ]
  if (dataSize < 200) return [
    { value: 50, label: 'quick' },
    { value: 100, label: 'standard' },
    { value: 200, label: 'thorough' }
  ]
  return [
    { value: 100, label: 'quick' },
    { value: 200, label: 'standard' },
    { value: 500, label: 'thorough' }
  ]
})

// Performance metrics
const stepsPerSecond = computed(() => {
  const history = store.optimizationHistory.steps
  if (history.length < 2) return 0
  
  const recent = history.slice(-10)
  if (recent.length < 2) return 0
  
  const timeSpan = (recent[recent.length - 1]?.timestamp || 0) - (recent[0]?.timestamp || 0)
  if (timeSpan <= 0) return 0
  
  return (recent.length - 1) / (timeSpan / 1000)
})

const bestLoss = computed(() => {
  if (!hasHistory.value) return 0
  return Math.min(...store.optimizationHistory.steps.map(s => s.loss))
})

const bestAccuracy = computed(() => {
  if (!hasHistory.value) return 0
  return Math.max(...store.optimizationHistory.steps.map(s => s.accuracy))
})

const estimatedTimeRemaining = computed(() => {
  if (!isRunning.value || stepsPerSecond.value === 0) return '—'
  
  const remainingSteps = totalSteps.value - currentStep.value
  const remainingSeconds = remainingSteps / stepsPerSecond.value
  
  if (remainingSeconds < 60) return `${Math.round(remainingSeconds)}s`
  if (remainingSeconds < 3600) return `${Math.round(remainingSeconds / 60)}m`
  return `${Math.round(remainingSeconds / 3600)}h`
})

// Trend calculations - using 5-step averages for smoother trends
const lossTrend = computed(() => {
  const history = store.optimizationHistory.steps
  if (history.length < 5) return 'neutral'
  
  const recent = history.slice(-5)
  const avgRecent = recent.reduce((sum, step) => sum + step.loss, 0) / recent.length
  const avgPrevious = history.slice(-10, -5).reduce((sum, step) => sum + step.loss, 0) / 5
  
  const diff = avgRecent - avgPrevious
  if (diff < -0.001) return 'up' // Loss decreasing is good
  if (diff > 0.001) return 'down' // Loss increasing is bad
  return 'neutral'
})

const accuracyTrend = computed(() => {
  const history = store.optimizationHistory.steps
  if (history.length < 5) return 'neutral'
  
  const recent = history.slice(-5)
  const avgRecent = recent.reduce((sum, step) => sum + step.accuracy, 0) / recent.length
  const avgPrevious = history.slice(-10, -5).reduce((sum, step) => sum + step.accuracy, 0) / 5
  
  const diff = avgRecent - avgPrevious
  if (diff > 0.5) return 'up'
  if (diff < -0.5) return 'down'
  return 'neutral'
})

const convergenceStatus = computed(() => {
  const recentLoss = store.optimizationHistory.steps.map(s => s.loss).slice(-10)
  if (recentLoss.length < 5) return 'Starting'
  
  const mean = recentLoss.reduce((sum, val) => sum + val, 0) / recentLoss.length
  const variance = recentLoss.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / recentLoss.length
  
  if (variance < 0.0001) return 'Converged'
  if (variance < 0.001) return 'Converging'
  if (variance < 0.01) return 'Training'
  return 'Unstable'
})

// Helper functions
function getStatusText() {
  if (isCompleted.value) return 'Completed'
  if (isRunning.value) return 'Training'
  if (hasHistory.value) return 'Stopped'
  return 'Ready'
}

function formatMetricValue(value: number, decimals: number = 2) {
  if (value === 0) return '0'
  if (isNaN(value)) return '—'
  return value.toFixed(decimals)
}

function getImprovementValue() {
  if (!hasHistory.value) return 0
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 0
  
  const firstAccuracy = steps[0].accuracy
  const currentAccuracy = steps[steps.length - 1].accuracy
  return currentAccuracy - firstAccuracy
}

// Actions
function applyPreset(preset: any) {
  Object.assign(config.value, preset.config)
  selectedPreset.value = preset.id
  updateConfig()
  
  notificationStore.addNotification({
    message: `Applied ${preset.name} training preset`,
    type: 'info'
  })
}

async function startOptimization() {
  if (!canOptimize.value) {
    notificationStore.addNotification({
      message: 'Add data points and neurons before starting optimization',
      type: 'warning'
    })
    return
  }
  
  updateConfig()
  
  try {
    await store.runGradientDescent()
    
    if (store.optimizationHistory.currentStep >= store.optimizationHistory.totalSteps) {
      notificationStore.addNotification({
        message: 'Training completed successfully!',
        type: 'success'
      })
    }
  } catch (error) {
    console.error('Training error:', error)
    notificationStore.addNotification({
      message: 'Training failed. Please try again.',
      type: 'error'
    })
  }
}

function stopOptimization() {
  store.stopOptimization()
  notificationStore.addNotification({
    message: 'Training stopped',
    type: 'info'
  })
}

function pauseOptimization() {
  store.stopOptimization()
  notificationStore.addNotification({
    message: 'Training paused',
    type: 'info'
  })
}

function resetOptimization() {
  if (confirm('Are you sure you want to clear all training history?')) {
    store.clearOptimizationHistory()
    notificationStore.addNotification({
      message: 'Training history cleared',
      type: 'info'
    })
  }
}

function resetToDefaults() {
  config.value = {
    learningRate: 0.01,
    epochs: 100,
    speed: 1.0,
    batchSize: 10,
    momentum: 0.9,
    weightDecay: 0.0001,
    optimizer: 'sgd',
    earlyStopping: false,
    patience: 20
  }
  
  useLearningRateSchedule.value = false
  selectedPreset.value = null
  updateConfig()
  
  notificationStore.addNotification({
    message: 'Configuration reset to defaults',
    type: 'info'
  })
}

function suggestEpochs() {
  const dataSize = store.dataPoints.length
  const neuronCount = store.neurons.length
  
  let suggested = Math.max(50, Math.min(500, dataSize * 2))
  if (neuronCount > 5) suggested *= 1.5
  
  config.value.epochs = Math.round(suggested)
  updateConfig()
  
  notificationStore.addNotification({
    message: `Suggested ${config.value.epochs} epochs based on your data`,
    type: 'info'
  })
}

function exportTrainingData() {
  const data = {
    config: config.value,
    history: store.optimizationHistory.steps,
    metadata: {
      neurons: store.neurons.length,
      dataPoints: store.dataPoints.length,
      exportTime: new Date().toISOString()
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `training-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  notificationStore.addNotification({
    message: 'Training data exported successfully',
    type: 'success'
  })
}

function visualizeTrainingHistory() {
  notificationStore.addNotification({
    message: 'Training history visualization (coming soon)',
    type: 'info'
  })
}

function updateConfig() {
  store.updateOptimizationConfig({
    learningRate: config.value.learningRate,
    epochs: config.value.epochs,
    speed: config.value.speed
  })
}

// Watch for store config changes
watch(() => store.optimizationHistory.config, (newConfig) => {
  config.value = { ...config.value, ...newConfig }
}, { immediate: true })
</script>

<style scoped>
.optimization-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

/* Header */
.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #464647;
  background: #2d2d30;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 20px;
  height: 20px;
  color: #007acc;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
  margin: 0;
}

/* Sections */
section {
  padding: 0 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #464647;
}

.section-icon {
  width: 16px;
  height: 16px;
  color: #007acc;
}

/* Quick Actions */
.preset-selection {
  margin-bottom: 20px;
}

.preset-label {
  display: block;
  font-size: 12px;
  color: #cccccc;
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.primary-controls {
  display: flex;
  gap: 12px;
}

.start-btn {
  flex: 1;
}

.training-controls {
  display: flex;
  gap: 8px;
  flex: 1;
}

.pause-btn, .stop-btn {
  flex: 1;
}

/* Progress Section */
.progress-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  font-size: 12px;
  color: #999999;
}

.progress-percent {
  font-weight: 600;
  color: #007acc;
}

.eta {
  color: #cccccc;
}

.metrics-section {
  margin-top: 16px;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metrics-toggle {
  background: none;
  border: 1px solid #555555;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metrics-toggle:hover {
  border-color: #007acc;
  color: #007acc;
}

/* Configuration */
.config-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #464647;
}

.config-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: #999999;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.config-tab:hover {
  color: #cccccc;
}

.config-tab.active {
  color: #007acc;
  border-bottom-color: #007acc;
}

.tab-icon {
  width: 14px;
  height: 14px;
}

.config-content {
  padding-top: 8px;
}

.param-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-label {
  font-size: 12px;
  color: #cccccc;
  font-weight: 500;
}

.param-value {
  font-size: 12px;
  color: #007acc;
  font-weight: 600;
}

.param-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-input {
  width: 70px;
  padding: 4px 8px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  font-size: 12px;
  text-align: center;
}

.param-input:focus {
  border-color: #007acc;
  outline: none;
}

.param-slider {
  width: 100%;
  height: 4px;
  background: #555555;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.param-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
}

.param-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.param-marks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999999;
  margin-top: 4px;
}

.param-select {
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 12px;
}

.param-select:focus {
  border-color: #007acc;
  outline: none;
}

.param-help {
  font-size: 10px;
  color: #999999;
  margin-top: 4px;
}

.param-suggestions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.suggestion-chip {
  background: #383838;
  border: 1px solid #555555;
  border-radius: 12px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  border-color: #007acc;
  color: #007acc;
}

.chip-label {
  color: #999999;
  margin-left: 4px;
}

.suggest-btn {
  background: #007acc;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggest-btn:hover {
  background: #005a9e;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.reset-btn:hover {
  border-color: #007acc;
  color: #007acc;
}

.reset-icon {
  width: 12px;
  height: 12px;
  }
  
  /* Status Indicator */
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666666;
    transition: background 0.3s ease;
  }
  
  .status-indicator.active .status-dot {
    background: #28a745;
    animation: pulse 2s infinite;
  }
  
  .status-indicator.completed .status-dot {
    background: #ffc107;
  }
  
  .status-text {
    font-size: 12px;
    color: #cccccc;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  /* Preset Buttons */
.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 6px;
  color: #cccccc;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.preset-btn:hover:not(:disabled) {
  background: #404040;
  border-color: #666666;
}

.preset-btn.selected {
  border-color: #007acc;
  background: rgba(0, 122, 204, 0.1);
}

.preset-btn.success {
  border-color: #28a745;
}

.preset-btn.primary {
  border-color: #007acc;
}

.preset-btn.secondary {
  border-color: #6c757d;
}

.preset-icon {
  width: 16px;
  height: 16px;
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preset-name {
  font-size: 12px;
  font-weight: 600;
}

.preset-desc {
  font-size: 10px;
  color: #999999;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.metric-card {
  padding: 8px;
  background: #383838;
  border-radius: 4px;
  border-left: 3px solid #007acc;
}

.metric-label {
  font-size: 10px;
  color: #999999;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
}

/* Checkbox */
.param-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #007acc;
}

/* Training History */
.history-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* Schedule Options */
.schedule-options,
.early-stopping-options {
  margin-top: 8px;
  padding: 8px;
  background: #383838;
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 480px) {
  .preset-grid {
    grid-template-columns: 1fr;
  }
  
  .training-controls {
    flex-direction: column;
  }
  
  .config-tabs {
    flex-wrap: wrap;
  }
  
  .history-actions {
    flex-direction: column;
  }
}
</style> 