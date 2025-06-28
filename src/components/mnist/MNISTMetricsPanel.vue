<template>
  <div class="mnist-metrics-panel">
    <!-- Enhanced Header with Live Status -->
    <div class="metrics-header">
      <div class="header-section">
        <h3>Training Metrics</h3>
        <div class="live-status-container">
          <div class="api-status" :class="{ 
            connected: store.apiConnected, 
            syncing: isLoadingMetrics,
            error: hasError 
          }">
            <div class="status-dot" :class="{ pulsing: store.isTraining }"></div>
            <span class="status-text">
              {{ store.apiConnected ? 'API Connected' : 'Local Mode' }}
            </span>
            <span v-if="lastUpdate" class="last-update">
              Updated {{ formatTime(lastUpdate) }}
            </span>
          </div>
          
          <!-- Live Training Indicator -->
          <div v-if="store.isTraining" class="live-training-indicator">
            <div class="live-pulse"></div>
            <span class="live-text">LIVE</span>
            <span class="live-stats">
              Epoch {{ currentEpoch }} • {{ formatNumber(metricsUpdateRate, 1) }}/s
            </span>
          </div>
          
          <!-- Performance Indicator -->
          <div class="performance-indicator" :class="{ 
            high: store.apiConnected && store.useApiCompute,
            medium: store.apiConnected && !store.useApiCompute,
            low: !store.apiConnected 
          }">
            <div class="performance-icon">
              {{ store.apiConnected ? (store.useApiCompute ? '🚀' : '⚡') : '💻' }}
            </div>
            <span class="performance-text">
              {{ store.apiConnected ? (store.useApiCompute ? 'JAX GPU' : 'JAX CPU') : 'Local JS' }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="header-controls">
        <button 
          @click="refreshMetrics" 
          :disabled="isLoadingMetrics"
          class="refresh-btn"
          title="Refresh metrics from API"
        >
          <div class="refresh-icon" :class="{ spinning: isLoadingMetrics }">🔄</div>
        </button>
        
        <button 
          @click="toggleAutoRefresh" 
          :class="['auto-refresh-btn', { active: autoRefresh }]"
          title="Toggle automatic refresh"
        >
          <div class="auto-icon">{{ autoRefresh ? '🔄' : '⏸️' }}</div>
        </button>
        
        <div class="view-selector">
          <button
            v-for="view in availableViews"
            :key="view.id"
            @click="currentView = view.id as 'overview' | 'loss' | 'weights' | 'api'"
            :class="['view-btn', { active: currentView === view.id }]"
            :title="view.description"
          >
            {{ view.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Metrics Content -->
    <div class="metrics-content">
      <!-- Performance Overview -->
      <div v-if="currentView === 'overview'" class="overview-section">
    <div class="metrics-grid">
          <!-- Training Progress -->
          <div class="metric-card training-progress">
            <div class="card-header">
              <h4>Training Progress</h4>
              <div class="training-status" :class="{ active: store.isTraining }">
                {{ store.isTraining ? 'Training' : 'Idle' }}
              </div>
            </div>
            <div class="progress-content">
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">Epoch:</span>
                  <span class="stat-value">{{ currentEpoch }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Loss:</span>
                  <span class="stat-value loss">{{ formatNumber(store.currentLoss, 4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Learning Rate:</span>
                  <span class="stat-value">{{ store.optimizationHistory.config.learningRate }}</span>
                </div>
              </div>
              
              <div class="progress-bar-container">
                <div class="progress-label">Training Progress</div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${trainingProgress}%` }"
                  ></div>
                </div>
                <div class="progress-text">{{ trainingProgress.toFixed(1) }}%</div>
              </div>
            </div>
          </div>

          <!-- Accuracy Metrics -->
          <div class="metric-card accuracy-metrics">
            <div class="card-header">
              <h4>Model Accuracy</h4>
              <div class="accuracy-trend" :class="accuracyTrend">
                {{ accuracyTrend === 'up' ? '📈' : accuracyTrend === 'down' ? '📉' : '➡️' }}
              </div>
            </div>
            <div class="accuracy-content">
              <div class="accuracy-item">
                <div class="accuracy-label">Train Accuracy</div>
                <div class="accuracy-value train">{{ formatNumber(store.trainAccuracy, 1) }}%</div>
                <div class="accuracy-bar">
                  <div 
                    class="accuracy-fill train" 
                    :style="{ width: `${store.trainAccuracy}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="accuracy-item">
                <div class="accuracy-label">Test Accuracy</div>
                <div class="accuracy-value test">{{ formatNumber(store.testAccuracy, 1) }}%</div>
                <div class="accuracy-bar">
                  <div 
                    class="accuracy-fill test" 
                    :style="{ width: `${store.testAccuracy}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="accuracy-gap">
                <span class="gap-label">Overfitting Gap:</span>
                <span class="gap-value" :class="{ warning: overfittingGap > 10 }">
                  {{ formatNumber(overfittingGap, 1) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Weight Statistics -->
          <div class="metric-card weight-stats">
            <div class="card-header">
              <h4>Weight Statistics</h4>
              <button @click="refreshWeightStats" class="mini-refresh-btn">🔄</button>
            </div>
            <div class="weight-content">
              <div class="weight-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Parameters:</span>
                  <span class="summary-value">{{ totalParameters.toLocaleString() }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Weight Norm:</span>
                  <span class="summary-value">{{ formatNumber(totalWeightNorm, 3) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Gradient Norm:</span>
                  <span class="summary-value">{{ formatNumber(lastGradientNorm, 3) }}</span>
                </div>
              </div>
              
              <div class="weight-distribution">
                <canvas 
                  ref="weightDistributionCanvas" 
                  class="distribution-canvas"
                  width="200" 
                  height="80"
                ></canvas>
              </div>
            </div>
          </div>

          <!-- Dataset Information -->
          <div class="metric-card dataset-info">
            <div class="card-header">
              <h4>Dataset Info</h4>
              <div class="dataset-status">{{ store.selectedDataset || 'Local' }}</div>
            </div>
            <div class="dataset-content">
              <div class="dataset-stats">
                <div class="dataset-item">
                  <span class="dataset-label">Training Samples:</span>
                  <span class="dataset-value">{{ store.datasetInfo.trainSize.toLocaleString() }}</span>
                </div>
                <div class="dataset-item">
                  <span class="dataset-label">Test Samples:</span>
                  <span class="dataset-value">{{ store.datasetInfo.testSize.toLocaleString() }}</span>
                </div>
                <div class="dataset-item">
                  <span class="dataset-label">Active Classes:</span>
                  <span class="dataset-value">{{ store.activeClasses.length }}/10</span>
                </div>
                <div class="dataset-item">
                  <span class="dataset-label">Features:</span>
                  <span class="dataset-value">{{ store.datasetInfo.numFeatures }}</span>
                </div>
              </div>
              
              <div class="class-distribution">
                <div class="class-label">Active Classes:</div>
                <div class="class-chips">
                  <div 
                    v-for="classId in store.activeClasses" 
                    :key="classId"
                    class="class-chip"
                    :style="{ backgroundColor: getClassColor(classId) }"
                  >
                    {{ classId }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loss History Chart -->
      <div v-else-if="currentView === 'loss'" class="loss-section">
        <div class="chart-container">
          <div class="chart-header">
            <h4>Loss History</h4>
            <div class="chart-controls">
              <select v-model="lossTimeframe" class="timeframe-select">
                <option value="all">All Time</option>
                <option value="recent">Recent (50 steps)</option>
                <option value="last100">Last 100 steps</option>
              </select>
              <button @click="clearLossHistory" class="clear-btn">Clear</button>
            </div>
          </div>
          
          <canvas 
            ref="lossChartCanvas" 
            class="loss-chart"
            width="800" 
            height="300"
          ></canvas>
          
          <div class="loss-stats">
            <div class="loss-stat">
              <span class="stat-label">Current Loss:</span>
              <span class="stat-value">{{ formatNumber(store.currentLoss, 4) }}</span>
            </div>
            <div class="loss-stat">
              <span class="stat-label">Min Loss:</span>
              <span class="stat-value">{{ formatNumber(minLoss, 4) }}</span>
            </div>
            <div class="loss-stat">
              <span class="stat-label">Loss Trend:</span>
              <span class="stat-value" :class="lossTrend">
                {{ lossTrend === 'decreasing' ? 'Decreasing ↓' : lossTrend === 'increasing' ? 'Increasing ↑' : 'Stable →' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Weight Analysis -->
      <div v-else-if="currentView === 'weights'" class="weights-section">
        <div class="weights-analysis">
          <div class="analysis-header">
            <h4>Weight Analysis</h4>
            <div class="analysis-controls">
              <select v-model="selectedWeightMetric" class="metric-select">
                <option value="norm">Weight Norm</option>
                <option value="mean">Mean Weight</option>
                <option value="std">Std Deviation</option>
                <option value="range">Weight Range</option>
              </select>
            </div>
          </div>
          
          <div class="neuron-weights-grid">
            <div 
              v-for="neuron in store.neurons" 
              :key="neuron.id"
              class="neuron-weight-card"
            >
              <div class="neuron-card-header">
                <span class="neuron-label">Class {{ neuron.id }}</span>
                <span class="neuron-metric">{{ getNeuronMetric(neuron, selectedWeightMetric) }}</span>
              </div>
              
              <div class="weight-mini-chart">
                <canvas 
                  :ref="el => { if (el) neuronChartCanvases[neuron.id] = el as HTMLCanvasElement }"
                  class="mini-chart"
                  width="120" 
                  height="60"
                ></canvas>
              </div>
              
              <div class="neuron-stats">
                <div class="mini-stat">
                  <span class="mini-label">‖w‖:</span>
                  <span class="mini-value">{{ getNeuronWeightNorm(neuron).toFixed(3) }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">μ:</span>
                  <span class="mini-value">{{ getAverageWeight(neuron).toFixed(3) }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">σ:</span>
                  <span class="mini-value">{{ getWeightStandardDeviation(neuron).toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Metrics -->
      <div v-else-if="currentView === 'api'" class="api-section">
        <div class="api-metrics">
          <div class="api-header">
            <h4>API Performance</h4>
            <div class="api-status-indicator" :class="{ connected: store.apiConnected }">
              {{ store.apiConnected ? 'Connected' : 'Disconnected' }}
            </div>
          </div>
          
          <div class="api-stats-grid">
            <div class="api-stat-card">
              <div class="api-stat-label">Response Time</div>
              <div class="api-stat-value">{{ apiResponseTime }}ms</div>
            </div>
            
            <div class="api-stat-card">
              <div class="api-stat-label">Requests/min</div>
              <div class="api-stat-value">{{ requestsPerMinute }}</div>
            </div>
            
            <div class="api-stat-card">
              <div class="api-stat-label">Success Rate</div>
              <div class="api-stat-value">{{ successRate }}%</div>
            </div>
            
            <div class="api-stat-card">
              <div class="api-stat-label">Last Sync</div>
              <div class="api-stat-value">{{ lastSyncTime ? formatTime(lastSyncTime) : 'Never' }}</div>
            </div>
          </div>
          
          <div class="api-operations">
            <h5>Recent Operations</h5>
            <div class="operations-list">
              <div 
                v-for="(operation, index) in recentOperations" 
                :key="index"
                class="operation-item"
                :class="{ success: operation.success, error: !operation.success }"
              >
                <span class="operation-type">{{ operation.type }}</span>
                <span class="operation-time">{{ formatTime(operation.timestamp) }}</span>
                <span class="operation-status">{{ operation.success ? '✓' : '✗' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { mnistApiService } from '@/services/mnistApiService'
import type { NDNeuron } from '@/types'

const store = useMNISTClassifierStore()

// Reactive state
const currentView = ref<'overview' | 'loss' | 'weights' | 'api'>('overview')
const autoRefresh = ref(true)
const isLoadingMetrics = ref(false)
const hasError = ref(false)
const lastUpdate = ref<number | null>(null)
const lossTimeframe = ref('recent')
const selectedWeightMetric = ref('norm')

// Canvas references
const lossChartCanvas = ref<HTMLCanvasElement | null>(null)
const weightDistributionCanvas = ref<HTMLCanvasElement | null>(null)
const neuronChartCanvases = ref<Record<number, HTMLCanvasElement>>({})

// API metrics
const apiResponseTime = ref(0)
const requestsPerMinute = ref(0)
const successRate = ref(100)
const lastSyncTime = ref<number | null>(null)
const recentOperations = ref<Array<{
  type: string
  timestamp: number
  success: boolean
}>>([])

// Training metrics
const trainingStartTime = ref<number | null>(null)
const lossHistory = ref<number[]>([])
const currentEpoch = ref(0)
const totalWeightNorm = ref(0)
const lastGradientNorm = ref(0)
const totalParameters = ref(0)
const metricsUpdateRate = ref(0)

// Previous values for trend calculation
const previousTrainAccuracy = ref(0)
const previousTestAccuracy = ref(0)
const previousLoss = ref(0)

// Metrics update tracking
const metricsUpdateTimes = ref<number[]>([])
const lastMetricsUpdate = ref(Date.now())

// Configuration
const availableViews = [
  { id: 'overview', label: 'Overview', description: 'General training metrics' },
  { id: 'loss', label: 'Loss', description: 'Loss history and trends' },
  { id: 'weights', label: 'Weights', description: 'Weight analysis by neuron' },
  { id: 'api', label: 'API', description: 'API performance metrics' }
]

// Computed properties
const trainingProgress = computed(() => {
  if (!store.isTraining || store.optimizationHistory.totalSteps === 0) return 0
  return (store.optimizationHistory.currentStep / store.optimizationHistory.totalSteps) * 100
})

const accuracyTrend = computed(() => {
  const trainTrend = store.trainAccuracy - previousTrainAccuracy.value
  if (trainTrend > 1) return 'up'
  if (trainTrend < -1) return 'down'
  return 'stable'
})

const overfittingGap = computed(() => {
  return Math.max(0, store.trainAccuracy - store.testAccuracy)
})

const minLoss = computed(() => {
  if (lossHistory.value.length === 0) return 0
  return Math.min(...lossHistory.value)
})

const lossTrend = computed(() => {
  if (lossHistory.value.length < 10) return 'stable'
  const recent = lossHistory.value.slice(-10)
  const older = lossHistory.value.slice(-20, -10)
  
  if (older.length === 0) return 'stable'
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length
  
  if (recentAvg < olderAvg * 0.95) return 'decreasing'
  if (recentAvg > olderAvg * 1.05) return 'increasing'
  return 'stable'
})

// Methods
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000) return 'now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

function getClassColor(classId: number): string {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]
  return colors[classId % colors.length]
}

async function refreshMetrics(): Promise<void> {
  if (isLoadingMetrics.value) return
  
  isLoadingMetrics.value = true
  hasError.value = false
  
  try {
    if (store.apiConnected) {
      // Fetch latest metrics from API
      const startTime = Date.now()
      
      // Get training metrics
      const metricsResponse = await mnistApiService.getTrainingMetrics()
      currentEpoch.value = metricsResponse.current_epoch
      lastGradientNorm.value = metricsResponse.gradient_norm
      
      // Get weight statistics
      await refreshWeightStats()
      
      // Track API performance
      const responseTime = Date.now() - startTime
      apiResponseTime.value = responseTime
      
      // Add to recent operations
      recentOperations.value.unshift({
        type: 'Metrics Refresh',
        timestamp: Date.now(),
        success: true
      })
      
      // Keep only last 10 operations
      if (recentOperations.value.length > 10) {
        recentOperations.value = recentOperations.value.slice(0, 10)
      }
    }
    
    lastUpdate.value = Date.now()
    
  } catch (error) {
    console.error('Failed to refresh metrics:', error)
    hasError.value = true
    
    recentOperations.value.unshift({
      type: 'Metrics Refresh',
      timestamp: Date.now(),
      success: false
    })
  } finally {
    isLoadingMetrics.value = false
  }
}

function toggleAutoRefresh(): void {
  autoRefresh.value = !autoRefresh.value
}

async function refreshWeightStats(): Promise<void> {
  try {
    if (store.apiConnected) {
      const weightData = await mnistApiService.getModelWeights()
      
      // Calculate total parameters
      totalParameters.value = weightData.weights.reduce((sum, weights) => sum + weights.length, 0) + weightData.biases.length
      
      // Calculate total weight norm
      const allWeights = weightData.weights.flat()
      totalWeightNorm.value = Math.sqrt(allWeights.reduce((sum, w) => sum + w * w, 0))
      
      // Render weight distribution
      renderWeightDistribution(allWeights)
    } else {
      // Use local neuron data
      const allWeights = store.neurons.flatMap(n => n.weights)
      totalParameters.value = allWeights.length + store.neurons.length
      totalWeightNorm.value = Math.sqrt(allWeights.reduce((sum, w) => sum + w * w, 0))
      
      renderWeightDistribution(allWeights)
    }
  } catch (error) {
    console.warn('Failed to refresh weight stats:', error)
  }
}

function renderWeightDistribution(weights: number[]): void {
  const canvas = weightDistributionCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Create histogram
  const bins = 20
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const binSize = (maxWeight - minWeight) / bins
  
  const histogram = new Array(bins).fill(0)
  for (const weight of weights) {
    const binIndex = Math.min(bins - 1, Math.floor((weight - minWeight) / binSize))
    histogram[binIndex]++
  }
  
  const maxCount = Math.max(...histogram)
  const barWidth = canvas.width / bins
  
  // Draw bars
  ctx.fillStyle = getClassColor(0)
  for (let i = 0; i < bins; i++) {
    const barHeight = (histogram[i] / maxCount) * canvas.height
    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
  }
}

function clearLossHistory(): void {
  lossHistory.value = []
  renderLossChart()
}

function renderLossChart(): void {
  const canvas = lossChartCanvas.value
  if (!canvas || lossHistory.value.length < 2) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Filter data based on timeframe
  let data = lossHistory.value
  switch (lossTimeframe.value) {
    case 'recent':
      data = data.slice(-50)
      break
    case 'last100':
      data = data.slice(-100)
      break
    case 'all':
    default:
      // Use all data
      break
  }
  
  if (data.length < 2) return
  
  // Setup
  const padding = 40
  const width = canvas.width - 2 * padding
  const height = canvas.height - 2 * padding
  
  const minLoss = Math.min(...data)
  const maxLoss = Math.max(...data)
  const lossRange = maxLoss - minLoss || 1
  
  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  
  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (height / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(padding + width, y)
    ctx.stroke()
  }
  
  // Vertical grid lines
  for (let i = 0; i <= 10; i++) {
    const x = padding + (width / 10) * i
    ctx.beginPath()
    ctx.moveTo(x, padding)
    ctx.lineTo(x, padding + height)
    ctx.stroke()
  }
  
  // Draw loss line
  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  data.forEach((loss, index) => {
    const x = padding + (width / (data.length - 1)) * index
    const y = padding + height - ((loss - minLoss) / lossRange) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Draw labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  
  // Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const value = maxLoss - (lossRange / 5) * i
    const y = padding + (height / 5) * i + 3
    ctx.fillText(value.toFixed(3), padding - 5, y)
  }
}

function getNeuronWeightNorm(neuron: NDNeuron): number {
  return Math.sqrt(neuron.weights.reduce((sum, w) => sum + w * w, 0))
}

function getAverageWeight(neuron: NDNeuron): number {
  return neuron.weights.reduce((sum, w) => sum + w, 0) / neuron.weights.length
}

function getWeightStandardDeviation(neuron: NDNeuron): number {
  const mean = getAverageWeight(neuron)
  const variance = neuron.weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / neuron.weights.length
  return Math.sqrt(variance)
}

function getNeuronMetric(neuron: NDNeuron, metric: string): string {
  switch (metric) {
    case 'norm':
      return getNeuronWeightNorm(neuron).toFixed(3)
    case 'mean':
      return getAverageWeight(neuron).toFixed(3)
    case 'std':
      return getWeightStandardDeviation(neuron).toFixed(3)
    case 'range':
      const min = Math.min(...neuron.weights)
      const max = Math.max(...neuron.weights)
      return (max - min).toFixed(3)
    default:
      return '0.000'
  }
}

function renderNeuronChart(neuron: NDNeuron): void {
  const canvas = neuronChartCanvases.value[neuron.id]
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Simple weight histogram for the neuron
  const weights = neuron.weights
  const bins = 10
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const binSize = (maxWeight - minWeight) / bins
  
  const histogram = new Array(bins).fill(0)
  for (const weight of weights) {
    const binIndex = Math.min(bins - 1, Math.floor((weight - minWeight) / binSize))
    histogram[binIndex]++
  }
  
  const maxCount = Math.max(...histogram)
  const barWidth = canvas.width / bins
  
  ctx.fillStyle = getClassColor(neuron.id)
  for (let i = 0; i < bins; i++) {
    const barHeight = (histogram[i] / maxCount) * canvas.height
    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
  }
}

// Watchers
watch(() => store.currentLoss, (newLoss) => {
  if (store.isTraining) {
    lossHistory.value.push(newLoss)
    
    // Keep reasonable history size
    if (lossHistory.value.length > 500) {
      lossHistory.value = lossHistory.value.slice(-500)
    }
    
    nextTick(() => {
      renderLossChart()
    })
  }
})

watch(() => store.isTraining, (isTraining) => {
  if (isTraining) {
    trainingStartTime.value = Date.now()
  }
})

watch(() => store.neurons, () => {
  refreshWeightStats()
  
  // Render individual neuron charts
  nextTick(() => {
    for (const neuron of store.neurons) {
      renderNeuronChart(neuron)
    }
  })
}, { deep: true })

watch(() => currentView.value, () => {
  nextTick(() => {
    if (currentView.value === 'loss') {
      renderLossChart()
    } else if (currentView.value === 'weights') {
      for (const neuron of store.neurons) {
        renderNeuronChart(neuron)
      }
    }
  })
})

// Track metrics update rate
watch(() => store.optimizationHistory.steps.length, () => {
  const now = Date.now()
  metricsUpdateTimes.value.push(now)
  
  // Keep only last 10 updates for rate calculation
  if (metricsUpdateTimes.value.length > 10) {
    metricsUpdateTimes.value = metricsUpdateTimes.value.slice(-10)
  }
  
  // Calculate update rate (updates per second)
  if (metricsUpdateTimes.value.length >= 2) {
    const timeSpan = now - metricsUpdateTimes.value[0]
    const updateCount = metricsUpdateTimes.value.length - 1
    metricsUpdateRate.value = (updateCount / (timeSpan / 1000)) || 0
  }
  
  lastMetricsUpdate.value = now
})

// Auto refresh interval
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshMetrics()
  refreshWeightStats()
  
  // Set up auto refresh
  if (autoRefresh.value) {
    refreshInterval = setInterval(() => {
      if (autoRefresh.value && !isLoadingMetrics.value) {
        refreshMetrics()
      }
    }, 5000) // Refresh every 5 seconds
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.mnist-metrics-panel {
  padding: 16px;
  color: rgb(var(--text-primary));
}

.metrics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-section {
  display: flex;
  align-items: center;
}

.header-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--color-primary));
  margin-right: 16px;
}

.api-status {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  margin-right: 4px;
}

.status-text {
  font-size: 12px;
  color: rgb(var(--text-tertiary));
}

.last-update {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.header-controls {
  display: flex;
  align-items: center;
}

.refresh-btn,
.auto-refresh-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-left: 4px;
}

.refresh-icon,
.auto-icon {
  font-size: 16px;
  color: rgb(var(--color-primary));
}

.view-selector {
  display: flex;
  align-items: center;
}

.view-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-left: 4px;
}

.view-btn.active {
  font-weight: 600;
}

.metrics-content {
  margin-top: 16px;
}

.overview-section {
  margin-bottom: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-header h4 {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.training-progress {
  grid-column: span 3;
}

.progress-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.loss {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.progress-bar-container {
  width: 300px;
  height: 20px;
  background: rgb(var(--bg-tertiary));
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: rgb(var(--color-primary));
}

.progress-fill {
  height: 100%;
  background: rgb(var(--color-primary));
}

.progress-text {
  font-size: 12px;
  color: rgb(var(--text-tertiary));
}

.accuracy-metrics {
  grid-column: span 3;
}

.accuracy-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.accuracy-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.accuracy-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.accuracy-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.accuracy-bar {
  width: 300px;
  height: 20px;
  background: rgb(var(--bg-tertiary));
  border-radius: 10px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  background: rgb(var(--color-primary));
}

.accuracy-trend {
  font-size: 16px;
  color: rgb(var(--color-primary));
}

.up {
  color: rgb(var(--color-positive));
}

.down {
  color: rgb(var(--color-negative));
}

.weights-section {
  margin-top: 24px;
}

.weights-analysis {
  padding: 16px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.analysis-controls {
  display: flex;
  align-items: center;
}

.metric-select {
  margin-left: 8px;
}

.neuron-weights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.neuron-weight-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.neuron-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.neuron-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.neuron-metric {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.weight-mini-chart {
  margin-bottom: 12px;
}

.mini-chart {
  width: 100%;
  height: 60px;
}

.neuron-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mini-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.mini-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.api-section {
  margin-top: 24px;
}

.api-metrics {
  padding: 16px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.api-status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
}

.api-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.api-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.api-stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.api-stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.api-operations {
  margin-top: 12px;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
}

.operation-type {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.operation-time {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.operation-status {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.loss-section {
  margin-top: 24px;
}

.chart-container {
  position: relative;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.timeframe-select {
  margin-left: 8px;
}

.clear-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-left: 8px;
}

.loss-chart {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loss-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.loss-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.weights-section {
  margin-top: 24px;
}

.weights-analysis {
  padding: 16px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.analysis-controls {
  display: flex;
  align-items: center;
}

.metric-select {
  margin-left: 8px;
}

.neuron-weights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.neuron-weight-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.neuron-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.neuron-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.neuron-metric {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.weight-mini-chart {
  margin-bottom: 12px;
}

.mini-chart {
  width: 100%;
  height: 60px;
}

.neuron-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mini-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.mini-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.api-section {
  margin-top: 24px;
}

.api-metrics {
  padding: 16px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.api-status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
}

.api-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.api-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.api-stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.api-stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.api-operations {
  margin-top: 12px;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
}

.operation-type {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.operation-time {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.operation-status {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.loss-section {
  margin-top: 24px;
}

.chart-container {
  position: relative;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.timeframe-select {
  margin-left: 8px;
}

.clear-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  margin-left: 8px;
}

.loss-chart {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loss-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.loss-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}
</style> 