<template>
  <div class="enhanced-metrics-panel">
    <!-- Header with Status -->
    <div class="metrics-header">
      <div class="header-left">
        <div class="panel-icon">
          <ChartBarIcon class="w-5 h-5" />
        </div>
        <div class="panel-title">
          <h3>Performance Metrics</h3>
          <div class="panel-subtitle">
            Real-time network performance analytics
          </div>
        </div>
      </div>
      
      <div class="metrics-status" :class="{ recording: isTrainingActive }">
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>{{ isTrainingActive ? 'Recording' : 'Idle' }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="quick-stats-grid">
      <div class="stat-card primary">
        <div class="stat-header">
          <CalculatorIcon class="w-4 h-4" />
          <span class="stat-title">Accuracy</span>
        </div>
        <div class="stat-value large">{{ currentAccuracy.toFixed(1) }}%</div>
        <div class="stat-change" :class="accuracyTrend">
          <component :is="getTrendIcon(accuracyTrend)" class="w-3 h-3" />
          <span>{{ accuracyChange }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <ChartLineIcon class="w-4 h-4" />
          <span class="stat-title">Loss</span>
        </div>
        <div class="stat-value">{{ currentLoss.toFixed(4) }}</div>
        <div class="stat-change" :class="lossTrend">
          <component :is="getTrendIcon(lossTrend)" class="w-3 h-3" />
          <span>{{ lossChange }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <BoltIcon class="w-4 h-4" />
          <span class="stat-title">Learning Rate</span>
        </div>
        <div class="stat-value small">{{ learningRate.toFixed(4) }}</div>
        <div class="stat-meta">{{ learningRateStatus }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <CpuChipIcon class="w-4 h-4" />
          <span class="stat-title">Step</span>
        </div>
        <div class="stat-value">{{ currentStep }}</div>
        <div class="stat-meta">{{ epochProgress }}% complete</div>
      </div>
    </div>

    <!-- Detailed Metrics Tabs -->
    <div class="metrics-tabs">
      <div class="tab-headers">
        <button
          v-for="tab in metricsTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-header', { active: activeTab === tab.id }]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Classification Metrics Tab -->
        <div v-if="activeTab === 'classification'" class="metrics-content">
          <div class="metrics-section">
            <h4 class="section-title">Classification Performance</h4>
            
            <div class="classification-metrics">
              <div class="metric-row">
                <div class="metric-label">Precision</div>
                <div class="metric-value-bar">
                  <div class="metric-bar">
                    <div class="bar-fill precision" :style="{ width: `${precision}%` }"></div>
                  </div>
                  <span class="metric-value">{{ precision.toFixed(1) }}%</span>
                </div>
              </div>
              
              <div class="metric-row">
                <div class="metric-label">Recall</div>
                <div class="metric-value-bar">
                  <div class="metric-bar">
                    <div class="bar-fill recall" :style="{ width: `${recall}%` }"></div>
                  </div>
                  <span class="metric-value">{{ recall.toFixed(1) }}%</span>
                </div>
              </div>
              
              <div class="metric-row">
                <div class="metric-label">F1 Score</div>
                <div class="metric-value-bar">
                  <div class="metric-bar">
                    <div class="bar-fill f1" :style="{ width: `${f1Score}%` }"></div>
                  </div>
                  <span class="metric-value">{{ f1Score.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Confusion Matrix Mini -->
            <div class="confusion-matrix-mini">
              <h5 class="matrix-title">Confusion Matrix</h5>
              <div class="matrix-grid">
                <div class="matrix-cell header">Predicted</div>
                <div class="matrix-cell header">Class A</div>
                <div class="matrix-cell header">Class B</div>
                
                <div class="matrix-cell label">Class A</div>
                <div class="matrix-cell value true-positive">{{ confusionMatrix.tp }}</div>
                <div class="matrix-cell value false-negative">{{ confusionMatrix.fn }}</div>
                
                <div class="matrix-cell label">Class B</div>
                <div class="matrix-cell value false-positive">{{ confusionMatrix.fp }}</div>
                <div class="matrix-cell value true-negative">{{ confusionMatrix.tn }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Training Progress Tab -->
        <div v-if="activeTab === 'training'" class="metrics-content">
          <div class="metrics-section">
            <h4 class="section-title">Training Progress</h4>
            
            <div class="progress-metrics">
              <div class="progress-item">
                <div class="progress-header">
                  <span class="progress-label">Overall Progress</span>
                  <span class="progress-value">{{ overallProgress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${overallProgress}%` }"></div>
                </div>
                <div class="progress-details">
                  <span>{{ currentStep }} / {{ totalSteps }} steps</span>
                  <span>ETA: {{ estimatedTimeRemaining }}</span>
                </div>
              </div>
              
              <div class="training-stats-grid">
                <div class="training-stat">
                  <div class="stat-icon">
                    <BoltIcon class="w-4 h-4" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-label">Steps/sec</div>
                    <div class="stat-value">{{ stepsPerSecond.toFixed(1) }}</div>
                  </div>
                </div>
                
                <div class="training-stat">
                  <div class="stat-icon">
                    <ChartLineIcon class="w-4 h-4" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-label">Best Loss</div>
                    <div class="stat-value">{{ bestLoss.toFixed(4) }}</div>
                  </div>
                </div>
                
                <div class="training-stat">
                  <div class="stat-icon">
                    <CalculatorIcon class="w-4 h-4" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-label">Best Accuracy</div>
                    <div class="stat-value">{{ bestAccuracy.toFixed(1) }}%</div>
                  </div>
                </div>
                
                <div class="training-stat">
                  <div class="stat-icon">
                    <CogIcon class="w-4 h-4" />
                  </div>
                  <div class="stat-content">
                    <div class="stat-label">Convergence</div>
                    <div class="stat-value">{{ convergenceStatus }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Network Analysis Tab -->
        <div v-if="activeTab === 'network'" class="metrics-content">
          <div class="metrics-section">
            <h4 class="section-title">Network Analysis</h4>
            
            <div class="network-analysis">
              <div class="analysis-grid">
                <div class="analysis-card">
                  <div class="card-header">
                    <CpuChipIcon class="w-4 h-4" />
                    <span>Network Size</span>
                  </div>
                  <div class="card-content">
                    <div class="size-metric">
                      <span class="size-label">Neurons</span>
                      <span class="size-value">{{ networkSize.neurons }}</span>
                    </div>
                    <div class="size-metric">
                      <span class="size-label">Parameters</span>
                      <span class="size-value">{{ networkSize.parameters }}</span>
                    </div>
                    <div class="size-metric">
                      <span class="size-label">Connections</span>
                      <span class="size-value">{{ networkSize.connections }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="analysis-card">
                  <div class="card-header">
                    <ChartBarIcon class="w-4 h-4" />
                    <span>Efficiency</span>
                  </div>
                  <div class="card-content">
                    <div class="efficiency-metric">
                      <span class="eff-label">Memory Usage</span>
                      <div class="eff-bar">
                        <div class="eff-fill" :style="{ width: `${memoryUsage}%` }"></div>
                      </div>
                      <span class="eff-value">{{ memoryUsage }}%</span>
                    </div>
                    <div class="efficiency-metric">
                      <span class="eff-label">Compute Load</span>
                      <div class="eff-bar">
                        <div class="eff-fill" :style="{ width: `${computeLoad}%` }"></div>
                      </div>
                      <span class="eff-value">{{ computeLoad }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Neuron Health Overview -->
              <div class="neuron-health">
                <h5 class="health-title">Neuron Health Overview</h5>
                <div class="health-grid">
                  <div 
                    v-for="neuron in healthyNeurons"
                    :key="neuron.id"
                    class="neuron-health-item"
                    :class="neuron.status"
                    :title="`Neuron ${neuron.id}: ${neuron.description}`"
                  >
                    <div class="neuron-indicator" :style="{ backgroundColor: neuron.color }">
                      {{ neuron.id }}
                    </div>
                    <div class="health-status">
                      <component :is="getHealthIcon(neuron.status)" class="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="metrics-actions">
      <Button
        @click="exportMetrics"
        variant="outline"
        size="sm"
        :disabled="!hasMetricsData"
      >
        <ArrowDownTrayIcon class="w-4 h-4" />
        Export Metrics
      </Button>
      
      <Button
        @click="resetMetrics"
        variant="outline"
        size="sm"
        :disabled="!hasMetricsData"
      >
        <ArrowPathIcon class="w-4 h-4" />
        Reset
      </Button>
      
      <Button
        @click="toggleAutoUpdate"
        :variant="autoUpdate ? 'default' : 'outline'"
        size="sm"
      >
        <BoltIcon class="w-4 h-4" />
        {{ autoUpdate ? 'Auto' : 'Manual' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  ChartBarIcon, 
  CalculatorIcon, 
  ChartLineIcon, 
  BoltIcon, 
  CpuChipIcon, 
  CogIcon,
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import type { OptimizationStep } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

// UI State
const activeTab = ref('classification')
const autoUpdate = ref(true)

// Metrics tabs configuration
const metricsTabs = [
  { id: 'classification', label: 'Classification', icon: CalculatorIcon },
  { id: 'training', label: 'Training', icon: ChartLineIcon },
  { id: 'network', label: 'Network', icon: CpuChipIcon }
]

// Computed metrics
const isTrainingActive = computed(() => store.optimizationHistory.isRunning)
const currentAccuracy = computed(() => store.accuracy || 0)
const currentLoss = computed(() => store.currentLoss || 0)
const learningRate = computed(() => store.optimizationHistory.config.learningRate)
const currentStep = computed(() => store.optimizationHistory.currentStep || 0)

const historySteps = computed<OptimizationStep[]>(() => store.optimizationHistory.steps)

// Trend calculations
const accuracyTrend = computed(() => {
  if (historySteps.value.length < 2) return 'neutral'
  const recent = historySteps.value.slice(-2)
  const diff = recent[1].accuracy - recent[0].accuracy
  if (diff > 0.5) return 'up'
  if (diff < -0.5) return 'down'
  return 'neutral'
})

const lossTrend = computed(() => {
  if (historySteps.value.length < 2) return 'neutral'
  const recent = historySteps.value.slice(-2)
  const diff = recent[1].loss - recent[0].loss
  if (diff < -0.001) return 'up' // Loss decreasing is good
  if (diff > 0.001) return 'down' // Loss increasing is bad
  return 'neutral'
})

const accuracyChange = computed(() => {
  if (historySteps.value.length < 2) return '—'
  const recent = historySteps.value.slice(-2)
  const diff = recent[1].accuracy - recent[0].accuracy
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
})

const lossChange = computed(() => {
  if (historySteps.value.length < 2) return '—'
  const recent = historySteps.value.slice(-2)
  const diff = recent[1].loss - recent[0].loss
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(4)}`
})

const learningRateStatus = computed(() => {
  const lr = learningRate.value
  if (lr > 0.01) return 'High'
  if (lr > 0.001) return 'Normal'
  if (lr > 0.0001) return 'Low'
  return 'Very Low'
})

const epochProgress = computed(() => {
  const total = store.optimizationHistory.totalSteps || 1
  return Math.round((currentStep.value / total) * 100)
})

// Classification metrics - Stubbed for now
const precision = computed(() => 85.2)
const recall = computed(() => 92.5)
const f1Score = computed(() => 88.7)
const confusionMatrix = computed(() => ({ tp: 85, tn: 90, fp: 10, fn: 5 }))

// Training progress metrics
const overallProgress = computed(() => {
  const total = store.optimizationHistory.totalSteps || 1
  return Math.round((currentStep.value / total) * 100)
})

const totalSteps = computed(() => store.optimizationHistory.totalSteps || 0)

// Stubbed as we don't have this logic yet
const estimatedTimeRemaining = computed(() => '5m')
const stepsPerSecond = computed(() => 12.5)
const bestLoss = computed(() => Math.min(...historySteps.value.map(s => s.loss), Infinity))
const bestAccuracy = computed(() => Math.max(...historySteps.value.map(s => s.accuracy), 0))

const convergenceStatus = computed(() => {
  const recentLoss = historySteps.value.map(s => s.loss).slice(-10)
  if (recentLoss.length < 5) return 'Starting'
  
  const variance = recentLoss.reduce((acc, val) => acc + Math.pow(val - recentLoss[0], 2), 0) / recentLoss.length
  if (variance < 0.0001) return 'Converged'
  if (variance < 0.001) return 'Converging'
  return 'Training'
})

// Network analysis metrics
const networkSize = computed(() => ({
  neurons: store.neurons.length,
  parameters: store.neurons.length * 4, // Simplified parameter count
  connections: store.neurons.length * (store.neurons.length - 1)
}))

// Stubbed data
const memoryUsage = computed(() => 30)
const computeLoad = computed(() => 55)
const healthyNeurons = computed(() => {
  return store.neurons.map(neuron => ({
    id: neuron.id,
    color: neuron.color,
    status: 'healthy',
    description: 'Normal activity'
  }))
})

const hasMetricsData = computed(() => historySteps.value.length > 0)

// Helper functions
function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up': return CheckCircleIcon
    case 'down': return XCircleIcon
    default: return ExclamationTriangleIcon
  }
}

function getHealthIcon(status: string) {
  switch (status) {
    case 'healthy': return CheckCircleIcon
    case 'inactive': return ExclamationTriangleIcon
    case 'overactive': return XCircleIcon
    default: return CheckCircleIcon
  }
}

// Actions
function exportMetrics() {
  const data = {
    accuracy: historySteps.value.map(s => s.accuracy),
    loss: historySteps.value.map(s => s.loss),
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  notificationStore.addNotification({
    message: 'Performance metrics have been exported successfully',
    type: 'success'
  })
}

function resetMetrics() {
  if (confirm('Are you sure you want to reset all metrics data?')) {
    store.clearOptimizationHistory()
    notificationStore.addNotification({
      message: 'All metrics data has been cleared',
      type: 'info'
    })
  }
}

function toggleAutoUpdate() {
  autoUpdate.value = !autoUpdate.value
  notificationStore.addNotification({
    message: `Metrics will ${autoUpdate.value ? 'automatically' : 'manually'} update`,
    type: 'info'
  })
}
</script>

<style scoped>
.enhanced-metrics-panel {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.metrics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(var(--color-primary));
  color: white;
  border-radius: 8px;
}

.panel-title h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0 0 0.25rem 0;
}

.panel-subtitle {
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
}

.metrics-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metrics-status.recording {
  background: rgb(var(--color-success));
  color: white;
  border-color: rgb(var(--color-success));
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: rgb(var(--text-tertiary));
  border-radius: 50%;
}

.metrics-status.recording .status-dot {
  background: white;
  animation: pulse 2s infinite;
}

/* Quick Stats Grid */
.quick-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.stat-card {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.stat-card.primary {
  border-color: rgb(var(--color-primary));
  background: rgba(var(--color-primary), 0.02);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: rgb(var(--text-secondary));
}

.stat-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
  margin-bottom: 0.5rem;
  font-family: monospace;
}

.stat-value.large {
  font-size: 2rem;
  color: rgb(var(--color-primary));
}

.stat-value.small {
  font-size: 1.25rem;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-change.up {
  color: rgb(var(--color-success));
}

.stat-change.down {
  color: rgb(var(--color-error));
}

.stat-change.neutral {
  color: rgb(var(--text-tertiary));
}

.stat-meta {
  font-size: 0.75rem;
  color: rgb(var(--text-tertiary));
  text-transform: capitalize;
}

/* Metrics Tabs */
.metrics-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-tertiary));
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: rgb(var(--text-secondary));
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
  justify-content: center;
  border-bottom: 2px solid transparent;
}

.tab-header:hover {
  background: rgb(var(--bg-hover));
  color: rgb(var(--text-primary));
}

.tab-header.active {
  color: rgb(var(--color-primary));
  border-bottom-color: rgb(var(--color-primary));
  background: rgb(var(--bg-primary));
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.metrics-content {
  padding: 1.5rem;
}

/* Metrics Sections */
.metrics-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

/* Classification Metrics */
.classification-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-primary));
  min-width: 5rem;
}

.metric-value-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.metric-bar {
  flex: 1;
  height: 8px;
  background: rgb(var(--bg-tertiary));
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.bar-fill.precision {
  background: rgb(var(--color-success));
}

.bar-fill.recall {
  background: rgb(var(--color-warning));
}

.bar-fill.f1 {
  background: rgb(var(--color-primary));
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  font-family: monospace;
  min-width: 3rem;
  text-align: right;
}

/* Confusion Matrix */
.confusion-matrix-mini {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  padding: 1rem;
}

.matrix-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 1rem;
}

.matrix-grid {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 0.5rem;
  align-items: center;
}

.matrix-cell {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  border-radius: 4px;
}

.matrix-cell.header {
  font-weight: 600;
  color: rgb(var(--text-secondary));
  background: rgb(var(--bg-tertiary));
}

.matrix-cell.label {
  font-weight: 500;
  color: rgb(var(--text-primary));
  background: rgb(var(--bg-tertiary));
}

.matrix-cell.value {
  font-weight: 600;
  color: white;
  font-family: monospace;
}

.matrix-cell.true-positive {
  background: rgb(var(--color-success));
}

.matrix-cell.true-negative {
  background: rgb(var(--color-success));
}

.matrix-cell.false-positive {
  background: rgb(var(--color-error));
}

.matrix-cell.false-negative {
  background: rgb(var(--color-error));
}

/* Training Progress */
.progress-metrics {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-primary));
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-primary));
  font-family: monospace;
}

.progress-bar {
  height: 8px;
  background: rgb(var(--bg-tertiary));
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgb(var(--color-primary));
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
}

.training-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.training-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(var(--color-primary), 0.1);
  color: rgb(var(--color-primary));
  border-radius: 6px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  font-family: monospace;
}

/* Network Analysis */
.network-analysis {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.analysis-card {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.card-content {
  padding: 0.5rem 1rem 1rem 1rem;
}

.size-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.size-metric:last-child {
  border-bottom: none;
}

.size-label {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
}

.size-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  font-family: monospace;
}

.efficiency-metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.efficiency-metric:last-child {
  margin-bottom: 0;
}

.eff-label {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
}

.eff-bar {
  height: 6px;
  background: rgb(var(--bg-tertiary));
  border-radius: 3px;
  overflow: hidden;
  flex: 1;
}

.eff-fill {
  height: 100%;
  background: rgb(var(--color-primary));
  transition: width 0.3s ease;
  border-radius: 3px;
}

.eff-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  font-family: monospace;
  text-align: right;
}

/* Neuron Health */
.neuron-health {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  padding: 1rem;
}

.health-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 1rem;
}

.health-grid {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.neuron-health-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.neuron-health-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.neuron-health-item.healthy {
  border-color: rgb(var(--color-success));
}

.neuron-health-item.inactive {
  border-color: rgb(var(--color-warning));
}

.neuron-health-item.overactive {
  border-color: rgb(var(--color-error));
}

.neuron-indicator {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.health-status {
  color: rgb(var(--text-secondary));
}

.neuron-health-item.healthy .health-status {
  color: rgb(var(--color-success));
}

.neuron-health-item.inactive .health-status {
  color: rgb(var(--color-warning));
}

.neuron-health-item.overactive .health-status {
  color: rgb(var(--color-error));
}

/* Actions */
.metrics-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-tertiary));
  flex-shrink: 0;
}

.metrics-actions .button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .quick-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-headers {
    flex-wrap: wrap;
  }
  
  .tab-header {
    flex: 1;
    min-width: 0;
  }
  
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .training-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .health-grid {
    justify-content: center;
  }
  
  .metrics-actions {
    flex-direction: column;
  }
}

/* Custom scrollbar */
.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
}

.tab-content::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}
</style>
