<template>
  <div class="mnist-training-panel">
    <!-- Enhanced Training Status Header with Live Updates -->
    <div class="training-status-header">
      <div class="status-indicator">
        <div :class="['status-dot', trainingStatusClass, { pulsing: store.isTraining && !isPaused }]"></div>
        <span class="status-text">{{ trainingStatusText }}</span>
        <div class="live-indicator" v-if="store.isTraining && !isPaused">
          <div class="pulse-ring"></div>
          <span class="live-text">LIVE</span>
        </div>
      </div>
      
      <div class="training-metrics-header">
        <div class="training-timer" v-if="trainingStartTime || pausedTime > 0">
          <BoltIcon class="timer-icon" />
          <span>{{ formattedTrainingTime }}</span>
        </div>
        
        <div class="connection-status" :class="{ connected: store.apiConnected, local: !store.apiConnected }">
          <div class="connection-dot"></div>
          <span>{{ store.apiConnected ? 'JAX API' : 'Local CPU' }}</span>
        </div>
        
        <div class="training-speed" v-if="store.isTraining">
          <span class="speed-label">Speed:</span>
          <span class="speed-value">{{ getBatchesPerSecond() }}</span>
        </div>
      </div>
    </div>

    <div class="training-controls">
      <h4 class="section-title">Training Configuration</h4>
      
      <div class="control-grid">
        <div class="control-group">
          <label class="control-label">
            Learning Rate
            <span class="control-tooltip" title="Higher values = faster learning but less stable">ⓘ</span>
          </label>
          <div class="input-with-presets">
            <input 
              v-model.number="config.learningRate"
              type="number"
              step="0.001"
              min="0.001"
              max="1"
              class="control-input"
              :disabled="store.isTraining && !isPaused"
            />
            <div class="preset-buttons">
              <button @click="config.learningRate = 0.001" class="preset-btn" :disabled="store.isTraining && !isPaused">Slow</button>
              <button @click="config.learningRate = 0.01" class="preset-btn" :disabled="store.isTraining && !isPaused">Normal</button>
              <button @click="config.learningRate = 0.1" class="preset-btn" :disabled="store.isTraining && !isPaused">Fast</button>
            </div>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">
            Epochs
            <span class="control-tooltip" title="Number of complete passes through the dataset">ⓘ</span>
          </label>
          <input 
            v-model.number="config.epochs"
            type="number"
            min="1"
            max="1000"
            class="control-input"
            :disabled="store.isTraining && !isPaused"
          />
        </div>
        
        <div class="control-group">
          <label class="control-label">
            Batch Size
            <span class="control-tooltip" title="Number of samples processed together">ⓘ</span>
          </label>
          <div class="input-with-slider">
            <input 
              v-model.number="config.batchSize"
              type="number"
              min="1"
              max="256"
              class="control-input"
              :disabled="store.isTraining && !isPaused"
            />
            <input 
              v-model.number="config.batchSize"
              type="range"
              min="1"
              max="256"
              class="batch-slider"
              :disabled="store.isTraining && !isPaused"
            />
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">
            Animation Speed
            <span class="control-tooltip" title="Controls visualization update rate">ⓘ</span>
          </label>
          <div class="speed-control">
            <input 
              v-model.number="config.speed"
              type="range"
              step="0.1"
              min="0.1"
              max="10"
              class="speed-slider"
              @input="updateSpeedInRealTime"
            />
            <div class="speed-display">
              <span class="speed-value">{{ config.speed.toFixed(1) }}x</span>
              <div class="speed-labels">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>
        
                 
      </div>
      
      <!-- Enhanced Training Actions -->
      <div class="training-actions">
        <div class="primary-actions">
          <button 
            @click="startTraining"
            :disabled="!canTrain || (store.isTraining && !isPaused)"
            class="action-btn primary large"
          >
            <RocketLaunchIcon class="btn-icon" />
            {{ getStartButtonText }}
          </button>
          
          <button 
            @click="togglePauseResume"
            :disabled="!store.isTraining"
            class="action-btn secondary"
          >
            <component :is="isPaused ? PlayIcon : PauseIcon" class="btn-icon" />
            {{ isPaused ? 'Resume' : 'Pause' }}
          </button>
          
          <button 
            @click="stopTraining"
            :disabled="!store.isTraining"
            class="action-btn danger"
          >
            <StopIcon class="btn-icon" />
            Stop
          </button>
        </div>
        
        <div class="secondary-actions">
          <button 
            @click="resetTraining"
            :disabled="store.isTraining && !isPaused"
            class="action-btn outline"
          >
            <ArrowPathIcon class="btn-icon" />
            Reset All
          </button>
          
          <button 
            @click="clearHistory"
            :disabled="store.isTraining && !isPaused"
            class="action-btn outline"
          >
            <TrashIcon class="btn-icon" />
            Clear History
          </button>
          
          <button 
            @click="quickTrain"
            :disabled="!canTrain || store.isTraining"
            class="action-btn outline quick-train"
          >
            <BoltIcon class="btn-icon" />
            Quick Train (10 epochs)
          </button>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Training Progress -->
    <div class="training-progress" v-if="store.optimizationHistory.steps.length > 0">
      <h4 class="section-title">Real-time Training Progress</h4>
      
      <div class="progress-overview">
        <div class="progress-stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <span class="stat-label">Epoch</span>
              <span class="stat-value">{{ store.optimizationHistory.currentStep }} / {{ store.optimizationHistory.totalSteps }}</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📉</div>
            <div class="stat-info">
              <span class="stat-label">Loss</span>
              <span class="stat-value" :class="getLossChangeClass">{{ currentLossDisplay }}</span>
              <span class="stat-change" v-if="lossChange !== 0">{{ lossChange > 0 ? '+' : '' }}{{ lossChange.toFixed(4) }}</span>
              <div class="stat-trend" v-if="lossHistory.length > 1">
                <div class="mini-chart">
                  <svg width="60" height="20" class="loss-sparkline">
                    <polyline 
                      :points="lossSparklinePoints" 
                      fill="none" 
                      stroke="rgb(var(--color-error))" 
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <span class="stat-label">Train Accuracy</span>
              <span class="stat-value accuracy">{{ currentAccuracyDisplay }}</span>
              <div class="stat-trend" v-if="accuracyHistory.length > 1">
                <div class="mini-chart">
                  <svg width="60" height="20" class="accuracy-sparkline">
                    <polyline 
                      :points="accuracySparklinePoints" 
                      fill="none" 
                      stroke="rgb(var(--color-success))" 
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="stat-card" v-if="store.testAccuracy > 0">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <span class="stat-label">Test Accuracy</span>
              <span class="stat-value accuracy">{{ store.testAccuracy.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
        
        <div class="progress-bar-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${trainingProgress}%` }"
              ></div>
              <div class="progress-segments" v-if="store.optimizationHistory.totalSteps > 0">
                <div 
                  v-for="step in Math.min(store.optimizationHistory.totalSteps, 20)" 
                  :key="step"
                  class="progress-segment"
                  :class="{ completed: step <= store.optimizationHistory.currentStep }"
                ></div>
              </div>
            </div>
            <div class="progress-labels">
              <span class="progress-text">{{ trainingProgress.toFixed(1) }}%</span>
              <span class="eta-text" v-if="estimatedTimeRemaining">ETA: {{ estimatedTimeRemaining }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Real-time Batch Metrics with Live Updates -->
      <div class="batch-metrics" v-if="store.isTraining && store.optimizationHistory.steps.length > 0">
        <h5 class="subsection-title">
          Live Batch Metrics
          <div class="live-pulse" v-if="store.isTraining && !isPaused"></div>
        </h5>
        <div class="metrics-grid">
          <div class="metric-card" :class="{ updating: recentMetricUpdate }">
            <div class="metric-header">
              <span class="metric-title">Current Batch</span>
              <span class="metric-value">{{ store.currentBatch.length }} samples</span>
            </div>
            <div class="metric-details">
              <span>Step {{ store.optimizationHistory.steps.length }}</span>
              <div class="update-indicator" v-if="recentMetricUpdate">📊</div>
            </div>
          </div>
          
          <div class="metric-card" :class="{ improving: lossChange < 0, degrading: lossChange > 0 }">
            <div class="metric-header">
              <span class="metric-title">Loss Trend</span>
              <span class="metric-value" :class="getLossChangeClass">
                {{ lossHistory.length > 1 ? (lossChange > 0 ? '↗️' : '↘️') : '—' }}
              </span>
            </div>
            <div class="metric-details">
              <span v-if="lossHistory.length > 1">
                {{ Math.abs(lossChange * 100).toFixed(2) }}% change
              </span>
              <div class="trend-sparkline" v-if="lossHistory.length > 5">
                <svg width="40" height="16" class="mini-sparkline">
                  <polyline 
                    :points="getSparklinePoints(lossHistory.slice(-10))" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="1"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          <div class="metric-card" :class="{ improving: getAccuracyChangeValue() > 0, degrading: getAccuracyChangeValue() < 0 }">
            <div class="metric-header">
              <span class="metric-title">Accuracy Trend</span>
              <span class="metric-value accuracy">
                {{ accuracyHistory.length > 1 ? getAccuracyTrend() : '—' }}
              </span>
            </div>
            <div class="metric-details">
              <span v-if="accuracyHistory.length > 1">
                {{ getAccuracyChange() }}
              </span>
              <div class="trend-sparkline" v-if="accuracyHistory.length > 5">
                <svg width="40" height="16" class="mini-sparkline">
                  <polyline 
                    :points="getSparklinePoints(accuracyHistory.slice(-10))" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="1"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Training Speed</span>
              <span class="metric-value">{{ getBatchesPerSecond() }}</span>
            </div>
            <div class="metric-details">
              <span>{{ store.apiConnected ? 'JAX accelerated' : 'CPU compute' }}</span>
              <div class="performance-indicator" :class="{ high: store.apiConnected, standard: !store.apiConnected }">
                {{ store.apiConnected ? '🚀' : '💻' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Live Neuron Updates Visualization -->
      <div class="neuron-updates" v-if="store.currentBatch.length > 0">
        <h5 class="subsection-title">Live Neuron Updates</h5>
        <div class="neuron-grid">
          <div 
            v-for="(neuron, index) in store.neurons" 
            :key="neuron.id"
            class="neuron-update-card"
            :class="{ active: recentlyUpdatedNeurons.includes(neuron.id) }"
          >
            <div class="neuron-label">{{ neuron.label || `Neuron ${index}` }}</div>
            <div class="neuron-metrics">
              <div class="metric">
                <span class="metric-label">Weights:</span>
                <span class="metric-value">{{ getNeuronWeightSummary(neuron) }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Bias:</span>
                <span class="metric-value">{{ neuron.bias.toFixed(3) }}</span>
              </div>
            </div>
            <div class="neuron-activity-indicator" :style="{ backgroundColor: neuron.color, opacity: getNeuronActivity(neuron) }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { useNotificationStore } from '@/stores/notification'
import {
  RocketLaunchIcon,
  StopIcon,
  ArrowPathIcon,
  BoltIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon
} from '@/components/ui/icons'

const store = useMNISTClassifierStore()
const notificationStore = useNotificationStore()

// Enhanced training state management
const isPaused = ref(false)
const trainingStartTime = ref<number | null>(null)
const pausedTime = ref(0)
const previousLoss = ref(0)
const recentlyUpdatedNeurons = ref<number[]>([])
const recentMetricUpdate = ref(false)
let updateAnimationTimeout: NodeJS.Timeout | null = null

// Real-time metrics tracking
const lossHistory = ref<number[]>([])
const accuracyHistory = ref<number[]>([])
const maxHistoryLength = 50 // Keep last 50 values for sparklines

const config = ref({
  learningRate: 0.01,
  epochs: 50,
  batchSize: 32,
  speed: 1
})

// Computed properties
const canTrain = computed(() => {
  // Allow training to start if:
  // 1. We have both neurons and data ready, OR
  // 2. The training system can auto-initialize (always possible now)
  // The startTraining function will handle initialization and data loading as needed
  return !store.isTraining
})

const trainingProgress = computed(() => {
  if (store.optimizationHistory.totalSteps === 0) return 0
  return (store.optimizationHistory.currentStep / store.optimizationHistory.totalSteps) * 100
})

const trainingStatusClass = computed(() => {
  if (store.isTraining) {
    return isPaused.value ? 'status-paused' : 'status-running'
  }
  return 'status-idle'
})

const trainingStatusText = computed(() => {
  if (store.isTraining) {
    return isPaused.value ? 'Paused' : 'Training Active'
  }
  return 'Ready to Train'
})

const formattedTrainingTime = computed(() => {
  if (!trainingStartTime.value) return '00:00'
  
  const elapsed = isPaused.value 
    ? pausedTime.value 
    : Date.now() - trainingStartTime.value - pausedTime.value
  
  const seconds = Math.floor(elapsed / 1000) % 60
  const minutes = Math.floor(elapsed / 60000)
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const estimatedTimeRemaining = computed(() => {
  if (!trainingStartTime.value || store.optimizationHistory.currentStep === 0) return null
  
  const elapsed = Date.now() - trainingStartTime.value - pausedTime.value
  const progress = store.optimizationHistory.currentStep / store.optimizationHistory.totalSteps
  const remaining = (elapsed / progress) - elapsed
  
  if (remaining < 60000) {
    return `${Math.ceil(remaining / 1000)}s`
  } else {
    return `${Math.ceil(remaining / 60000)}m`
  }
})

const lossChange = computed(() => {
  const current = store.currentLoss
  const previous = previousLoss.value
  return current - previous
})

const getLossChangeClass = computed(() => {
  const change = lossChange.value
  if (change < 0) return 'improving'
  if (change > 0) return 'worsening'
  return 'stable'
})

const getStartButtonText = computed(() => {
  if (store.isTraining) {
    return isPaused.value ? 'Resume Training' : 'Training...'
  }
  
  // Provide helpful text based on current state
  if (store.neurons.length === 0 && store.trainData.length === 0) {
    return 'Start Training (Auto-setup)'
  } else if (store.neurons.length === 0) {
    return 'Start Training (Init Network)'
  } else if (store.trainData.length === 0) {
    return 'Start Training (Load Data)'
  }
  
  return 'Start Training'
})

// Real-time loss and accuracy displays
const currentLossDisplay = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length === 0) return '0.0000'
  const latestLoss = steps[steps.length - 1].loss
  return latestLoss.toFixed(4)
})

const currentAccuracyDisplay = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length === 0) return '0.0%'
  const latestAccuracy = steps[steps.length - 1].trainAccuracy
  return `${latestAccuracy.toFixed(1)}%`
})

// Sparkline data for mini charts
const lossSparklinePoints = computed(() => {
  if (lossHistory.value.length < 2) return ''
  
  const maxLoss = Math.max(...lossHistory.value)
  const minLoss = Math.min(...lossHistory.value)
  const range = maxLoss - minLoss || 1
  
  return lossHistory.value
    .map((loss, index) => {
      const x = (index / (lossHistory.value.length - 1)) * 60
      const y = 20 - ((loss - minLoss) / range) * 20
      return `${x},${y}`
    })
    .join(' ')
})

const accuracySparklinePoints = computed(() => {
  if (accuracyHistory.value.length < 2) return ''
  
  const maxAccuracy = Math.max(...accuracyHistory.value)
  const minAccuracy = Math.min(...accuracyHistory.value)
  const range = maxAccuracy - minAccuracy || 1
  
  return accuracyHistory.value
    .map((accuracy, index) => {
      const x = (index / (accuracyHistory.value.length - 1)) * 60
      const y = 20 - ((accuracy - minAccuracy) / range) * 20
      return `${x},${y}`
    })
    .join(' ')
})

async function startTraining() {
  console.log('🚀 Start Training clicked')
  console.log('API Connected:', store.apiConnected)
  console.log('Use API Compute:', store.useApiCompute)
  console.log('Can train?', canTrain.value)
  console.log('Neurons count:', store.neurons.length)
  console.log('Train data count:', store.trainData.length)
  console.log('Filtered train data count:', store.filteredTrainData.length)
  
  // Check if we need to initialize the API connection first
  if (!store.apiConnected && store.useApiCompute) {
    console.log('Attempting to connect to API...')
    notificationStore.addNotification({
      message: 'Connecting to API...',
      type: 'info'
    })
    
    try {
      await store.initializeApiConnection()
      if (store.apiConnected) {
        notificationStore.addNotification({
          message: 'Successfully connected to API!',
          type: 'success'
        })
      } else {
        notificationStore.addNotification({
          message: 'API unavailable, using local computation',
          type: 'warning'
        })
      }
    } catch (error) {
      console.error('Failed to connect to API:', error)
      notificationStore.addNotification({
        message: 'API connection failed, using local computation',
        type: 'warning'
      })
    }
  }
  
  // Always check if we need to initialize, regardless of canTrain status
  // Initialize classifier if needed
  if (store.neurons.length === 0) {
    console.log('No neurons found, initializing classifier...')
    notificationStore.addNotification({
      message: 'Initializing neural network...',
      type: 'info'
    })
    
    try {
      await store.initializeClassifier()
      notificationStore.addNotification({
        message: 'Neural network initialized!',
        type: 'success'
      })
    } catch (error) {
      notificationStore.addNotification({
        message: `Failed to initialize classifier: ${error}`,
        type: 'error'
      })
      return
    }
  }
  
  // Load dataset if needed
  if (store.trainData.length === 0) {
    console.log('No training data found, loading dataset...')
    notificationStore.addNotification({
      message: 'Loading training dataset...',
      type: 'info'
    })
    
    try {
      // Use a reasonable amount of data for training
      await store.loadDataset({ train: 1000, test: 200 })
      notificationStore.addNotification({
        message: `Loaded ${store.trainData.length} training samples!`,
        type: 'success'
      })
    } catch (error) {
      notificationStore.addNotification({
        message: `Failed to load dataset: ${error}`,
        type: 'error'
      })
      return
    }
  }
  
  // Final check - ensure we have what we need for training
  if (store.neurons.length === 0) {
    notificationStore.addNotification({
      message: 'Cannot start training: failed to initialize neural network',
      type: 'error'
    })
    return
  }
  
  if (store.trainData.length === 0 && !store.apiConnected) {
    notificationStore.addNotification({
      message: 'Cannot start training: no training data available and API not connected',
      type: 'error'
    })
    return
  }
  
  // Validate training configuration
  if (config.value.learningRate <= 0) {
    notificationStore.addNotification({
      message: 'Learning rate must be greater than 0',
      type: 'error'
    })
    return
  }
  
  if (config.value.epochs <= 0) {
    notificationStore.addNotification({
      message: 'Number of epochs must be greater than 0',
      type: 'error'
    })
    return
  }
  
  console.log('✅ Starting training with config:', config.value)
  console.log(`🔧 Training mode: ${store.apiConnected && store.useApiCompute ? 'API (JAX)' : 'Local (JS)'}`)
  
  // Update store config
  store.updateOptimizationConfig(config.value)
  
  // Set training start time for timer
  trainingStartTime.value = Date.now()
  isPaused.value = false
  
  // Clear previous history if requested
  lossHistory.value = []
  accuracyHistory.value = []
  previousLoss.value = 0
  
  // Show training status
  notificationStore.addNotification({
    message: `Training started with ${store.apiConnected && store.useApiCompute ? 'JAX API acceleration' : 'local computation'}`,
    type: 'success'
  })
  
  try {
    await store.runTraining()
    
    // Training completed successfully
    notificationStore.addNotification({
      message: 'Training completed successfully!',
      type: 'success'
    })
    
    // Update final accuracy metrics
    await store.updateAccuracyMetrics()
    
  } catch (error) {
    console.error('Training error:', error)
    notificationStore.addNotification({
      message: `Training failed: ${error}`,
      type: 'error'
    })
  } finally {
    // Reset training state
    trainingStartTime.value = null
    isPaused.value = false
  }
}

function stopTraining() {
  store.stopTraining()
  notificationStore.addNotification({
    message: 'Training stopped',
    type: 'info'
  })
}

function resetTraining() {
  store.clearHistory()
  store.initializeClassifier()
  trainingStartTime.value = null
  pausedTime.value = 0
  isPaused.value = false
  recentlyUpdatedNeurons.value = []
  
  // Clear metrics history
  lossHistory.value = []
  accuracyHistory.value = []
  previousLoss.value = 0
  
  notificationStore.addNotification({
    message: 'Training reset and neurons reinitialized',
    type: 'info'
  })
}

// Enhanced training control functions
function updateSpeedInRealTime() {
  // Update speed dynamically during training
  store.updateOptimizationConfig({ speed: config.value.speed })
}

function togglePauseResume() {
  if (isPaused.value) {
    // Resume training
    isPaused.value = false
    store.resumeTraining()
    if (trainingStartTime.value) {
      pausedTime.value += Date.now() - (pausedTime.value > 0 ? pausedTime.value : trainingStartTime.value)
    }
    notificationStore.addNotification({
      message: 'Training resumed',
      type: 'info'
    })
  } else {
    // Pause training
    isPaused.value = true
    store.pauseTraining()
    pausedTime.value = Date.now()
    notificationStore.addNotification({
      message: 'Training paused',
      type: 'info'
    })
  }
}

function clearHistory() {
  store.clearHistory()
  
  // Clear metrics history
  lossHistory.value = []
  accuracyHistory.value = []
  previousLoss.value = 0
  
  notificationStore.addNotification({
    message: 'Training history cleared',
    type: 'info'
  })
}

async function quickTrain() {
  config.value.epochs = 10
  config.value.speed = 5
  await startTraining()
}

// Helper functions for live metrics
function getSparklinePoints(data: number[]): string {
  if (data.length < 2) return ''
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 40
      const y = 16 - ((value - min) / range) * 16
      return `${x},${y}`
    })
    .join(' ')
}

function getAccuracyChangeValue(): number {
  if (accuracyHistory.value.length < 2) return 0
  const current = accuracyHistory.value[accuracyHistory.value.length - 1]
  const previous = accuracyHistory.value[accuracyHistory.value.length - 2]
  return current - previous
}

// Neuron visualization helper functions
function getNeuronWeightSummary(neuron: any): string {
  const weights = neuron.weights
  const avg = weights.reduce((a: number, b: number) => a + b, 0) / weights.length
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  return `${avg.toFixed(3)} (${min.toFixed(2)}→${max.toFixed(2)})`
}

function getNeuronActivity(neuron: any): number {
  // Calculate activity based on weight magnitude and recent updates
  const weightMagnitude = Math.abs(neuron.weights.reduce((a: number, b: number) => a + Math.abs(b), 0))
  const isRecentlyUpdated = recentlyUpdatedNeurons.value.includes(neuron.id)
  return Math.min(1, weightMagnitude / 100) * (isRecentlyUpdated ? 1 : 0.3)
}

// Real-time metrics helper functions
function getAccuracyTrend(): string {
  if (accuracyHistory.value.length < 2) return '—'
  const current = accuracyHistory.value[accuracyHistory.value.length - 1]
  const previous = accuracyHistory.value[accuracyHistory.value.length - 2]
  return current > previous ? '↗️' : current < previous ? '↘️' : '→'
}

function getAccuracyChange(): string {
  if (accuracyHistory.value.length < 2) return ''
  const current = accuracyHistory.value[accuracyHistory.value.length - 1]
  const previous = accuracyHistory.value[accuracyHistory.value.length - 2]
  const change = current - previous
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
}

function getBatchesPerSecond(): string {
  if (!trainingStartTime.value || store.optimizationHistory.steps.length === 0) return '0.0'
  
  const elapsed = (Date.now() - trainingStartTime.value - pausedTime.value) / 1000
  const batchesProcessed = store.optimizationHistory.steps.length
  const rate = batchesProcessed / elapsed
  
  return rate.toFixed(1)
}

// Training lifecycle management
function startTrainingSession() {
  trainingStartTime.value = Date.now()
  pausedTime.value = 0
  isPaused.value = false
  previousLoss.value = store.currentLoss
}

function endTrainingSession() {
  trainingStartTime.value = null
  pausedTime.value = 0
  isPaused.value = false
  recentlyUpdatedNeurons.value = []
}

// Animation and visualization updates
function highlightUpdatedNeurons() {
  // Temporarily highlight neurons that were just updated
  const neuronIds = store.neurons.map(n => n.id)
  console.log('🎨 Highlighting neurons:', neuronIds)
  recentlyUpdatedNeurons.value = neuronIds
  
  if (updateAnimationTimeout) {
    clearTimeout(updateAnimationTimeout)
  }
  
  updateAnimationTimeout = setTimeout(() => {
    console.log('⏰ Clearing neuron highlights')
    recentlyUpdatedNeurons.value = []
  }, 1000)
}

// Watch for training state changes
watch(() => store.isTraining, (isTraining) => {
  if (isTraining) {
    startTrainingSession()
    isPaused.value = false
  } else {
    endTrainingSession()
    // Don't automatically set isPaused to false here since stopping is different from pausing
  }
})

// Watch for neuron updates to trigger visual feedback
watch(() => store.neurons, (newNeurons, oldNeurons) => {
  console.log('👁️ Neurons updated:', newNeurons.length)
  if (store.isTraining) {
    console.log('🔥 Highlighting updated neurons')
    console.log(oldNeurons)
    highlightUpdatedNeurons()
    previousLoss.value = store.currentLoss
  }
}, { deep: true, immediate: true })

// Also watch for current batch changes
watch(() => store.currentBatch, (newBatch) => {
  console.log('📦 Current batch updated:', newBatch.length)
  if (newBatch.length > 0 && store.isTraining) {
    highlightUpdatedNeurons()
  }
}, { immediate: true })

// Watch for optimization history updates to track loss and accuracy
watch(() => store.optimizationHistory.steps, (newSteps) => {
  if (newSteps.length > 0) {
    const latestStep = newSteps[newSteps.length - 1]
    
    // Update loss history
    lossHistory.value.push(latestStep.loss)
    if (lossHistory.value.length > maxHistoryLength) {
      lossHistory.value.shift()
    }
    
    // Update accuracy history
    accuracyHistory.value.push(latestStep.trainAccuracy)
    if (accuracyHistory.value.length > maxHistoryLength) {
      accuracyHistory.value.shift()
    }
    
    // Update previous loss for change calculation
    if (lossHistory.value.length > 1) {
      previousLoss.value = lossHistory.value[lossHistory.value.length - 2]
    }
    
    // Trigger metric update animation
    recentMetricUpdate.value = true
    setTimeout(() => {
      recentMetricUpdate.value = false
    }, 1000)
    
    console.log(`📊 Metrics updated - Loss: ${latestStep.loss.toFixed(4)}, Accuracy: ${latestStep.trainAccuracy.toFixed(1)}%`)
  }
}, { deep: true, immediate: true })

// Watch for config changes and update store
watch(config, (newConfig) => {
  if (!store.isTraining || isPaused.value) {
    store.updateOptimizationConfig(newConfig)
  }
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
  if (updateAnimationTimeout) {
    clearTimeout(updateAnimationTimeout)
  }
})
</script>

<style scoped>
.mnist-training-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 11px;
  color: rgb(var(--text-tertiary));
  font-weight: 500;
}

.control-input {
  padding: 6px 8px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
}

.control-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.training-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}

.action-btn.primary {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.action-btn.primary:hover:not(:disabled) {
  background: rgb(var(--color-primary-hover));
  border-color: rgb(var(--color-primary-hover));
}

.action-btn.danger {
  background: rgb(var(--color-error));
  border-color: rgb(var(--color-error));
  color: rgb(var(--text-primary));
}

.action-btn.danger:hover:not(:disabled) {
  background: rgb(var(--color-error-hover));
  border-color: rgb(var(--color-error-hover));
}

.action-btn.secondary {
  background: rgb(var(--color-warning));
  border-color: rgb(var(--color-warning));
  color: rgb(var(--text-primary));
}

.action-btn.secondary:hover:not(:disabled) {
  background: rgb(var(--color-warning-hover));
  border-color: rgb(var(--color-warning-hover));
}

.action-btn.outline {
  background: transparent;
  border-color: rgb(var(--border-primary));
  color: rgb(var(--text-primary));
  font-size: 10px;
  padding: 6px 10px;
  flex: 1;
}

.action-btn.outline:hover:not(:disabled) {
  background: rgb(var(--bg-secondary));
  border-color: rgb(var(--border-secondary));
}

.action-btn.quick-train {
  border-color: rgb(var(--color-success));
  color: rgb(var(--color-success));
}

.action-btn.quick-train:hover:not(:disabled) {
  background: rgb(var(--color-success));
  color: rgb(var(--text-primary));
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.stat-label {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgb(var(--bg-secondary));
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--color-primary)), rgb(var(--color-secondary)));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
  min-width: 35px;
}

/* Enhanced Training Status Header */
.training-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgb(var(--bg-primary)), rgb(var(--bg-secondary)));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-dot.status-idle {
  background: rgb(var(--text-tertiary));
  animation: none;
}

.status-dot.status-running {
  background: rgb(var(--color-success));
}

.status-dot.status-paused {
  background: rgb(var(--color-warning));
}

.status-text {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.training-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgb(var(--text-tertiary));
}

.timer-icon {
  width: 12px;
  height: 12px;
}

/* Enhanced Control Inputs */
.control-tooltip {
  color: rgb(var(--color-primary));
  cursor: help;
  margin-left: 4px;
}

.input-with-presets {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-buttons {
  display: flex;
  gap: 2px;
}

.preset-btn {
  flex: 1;
  padding: 2px 4px;
  font-size: 9px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  color: rgb(var(--text-tertiary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover:not(:disabled) {
  background: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
  border-color: rgb(var(--color-primary));
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-with-slider {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-slider {
  -webkit-appearance: none;
  height: 4px;
  background: rgb(var(--bg-secondary));
  border-radius: 2px;
  outline: none;
}

.batch-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.speed-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.speed-slider {
  -webkit-appearance: none;
  height: 6px;
  background: linear-gradient(90deg, rgb(var(--bg-secondary)), rgb(var(--color-primary)), rgb(var(--color-secondary)));
  border-radius: 3px;
  outline: none;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: rgb(var(--bg-primary));
  border: 2px solid rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.speed-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speed-value {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  width: 100%;
}

/* Enhanced Training Actions */
.primary-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.secondary-actions {
  display: flex;
  gap: 6px;
}

.action-btn.large {
  padding: 12px 20px;
  font-size: 13px;
  flex: 1;
}

.action-btn.outline {
  background: transparent;
  border-color: rgb(var(--border-primary));
  color: rgb(var(--text-primary));
  font-size: 10px;
  padding: 6px 10px;
  flex: 1;
}

.action-btn.outline:hover:not(:disabled) {
  background: rgb(var(--bg-secondary));
  border-color: rgb(var(--border-secondary));
}

.action-btn.quick-train {
  border-color: rgb(var(--color-success));
  color: rgb(var(--color-success));
}

.action-btn.quick-train:hover:not(:disabled) {
  background: rgb(var(--color-success));
  color: rgb(var(--text-primary));
}

/* Enhanced Progress Visualization */
.progress-overview {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  padding: 16px;
}

.progress-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  transition: all 0.2s ease;
}

.stat-card.primary {
  border-color: rgb(var(--color-primary));
  background: linear-gradient(135deg, rgb(var(--bg-secondary)), rgb(var(--bg-tertiary)));
}

.stat-card:hover {
  border-color: rgb(var(--border-primary));
  transform: translateY(-1px);
}

.stat-icon {
  font-size: 16px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value.improving {
  color: rgb(var(--color-success));
}

.stat-value.worsening {
  color: rgb(var(--color-error));
}

.stat-value.accuracy {
  color: rgb(var(--color-primary));
}

.stat-change {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
}

.stat-trend {
  margin-top: 4px;
}

.mini-chart {
  height: 20px;
  width: 60px;
}

.loss-sparkline,
.accuracy-sparkline {
  width: 100%;
  height: 100%;
}

.loss-sparkline polyline {
  stroke: rgb(var(--color-error));
  stroke-width: 1.5;
  fill: none;
}

.accuracy-sparkline polyline {
  stroke: rgb(var(--color-success));
  stroke-width: 1.5;
  fill: none;
}

.progress-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  position: relative;
  flex: 1;
  height: 12px;
  background: rgb(var(--bg-secondary));
  border-radius: 6px;
  overflow: hidden;
}

.progress-segments {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
}

.progress-segment {
  flex: 1;
  border-right: 1px solid rgb(var(--border-primary));
  opacity: 0.3;
}

.progress-segment.completed {
  background: rgba(var(--color-primary), 0.3);
  opacity: 1;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eta-text {
  font-size: 9px;
  color: rgb(var(--color-primary));
}

/* Real-time Batch Metrics */
.batch-metrics {
  margin-top: 16px;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  padding: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  padding: 10px;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: rgb(var(--border-primary));
  transform: translateY(-1px);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.metric-title {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  font-weight: 600;
}

.metric-value {
  font-size: 14px;
  font-weight: 700;
  color: rgb(var(--text-primary));
}

.metric-details {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
}

/* Live Neuron Updates */
.neuron-updates {
  margin-top: 20px;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  padding: 16px;
}

.subsection-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.neuron-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.neuron-update-card {
  position: relative;
  padding: 8px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.neuron-update-card.active {
  border-color: rgb(var(--color-primary));
  background: linear-gradient(135deg, rgb(var(--bg-secondary)), rgb(var(--bg-tertiary)));
  transform: scale(1.02);
  box-shadow: 0 2px 8px var(--shadow-glow);
}

.neuron-label {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 4px;
}

.neuron-metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
}

.metric-label {
  color: rgb(var(--text-tertiary));
}

.metric-value {
  color: rgb(var(--text-primary));
  font-weight: 500;
}

.neuron-activity-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  transition: opacity 0.3s ease;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .control-grid {
    grid-template-columns: 1fr;
  }
  
  .primary-actions {
    flex-direction: column;
  }
  
  .progress-stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .neuron-grid {
    grid-template-columns: 1fr;
  }
}
</style> 