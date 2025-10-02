<template>
  <div class="api-status-panel">
    <!-- Header with live connection status -->
    <div class="status-header">
      <div class="connection-indicator" :class="connectionStatusClass">
        <div
          class="status-dot" :class="{ 
            pulsing: store.apiConnected && isConnecting,
            error: !store.apiConnected && hasConnectionError 
          }"
        ></div>
        <span class="status-text">{{ connectionStatusText }}</span>
        <span v-if="store.apiConnected" class="uptime">{{ formatUptime(connectionUptime) }}</span>
      </div>
      
      <div class="actions">
        <button 
          :disabled="isTestingConnection" 
          class="test-btn"
          :class="{ testing: isTestingConnection }"
          @click="testConnection"
        >
          <div class="btn-icon" :class="{ spinning: isTestingConnection }">🔄</div>
          {{ isTestingConnection ? 'Testing...' : 'Test' }}
        </button>
        
        <button 
          class="auto-refresh-btn"
          :class="{ active: autoRefreshEnabled }"
          @click="toggleAutoRefresh"
        >
          <div class="btn-icon">{{ autoRefreshEnabled ? '⏸️' : '▶️' }}</div>
          Auto
        </button>
      </div>
    </div>

    <!-- Live Performance Metrics -->
    <div class="metrics-grid">
      <div class="metric-card" :class="{ warning: responseTime > 1000, error: responseTime > 5000 }">
        <div class="metric-label">Response Time</div>
        <div class="metric-value">{{ responseTime }}ms</div>
        <div class="metric-trend">
          <span :class="trendClass(responseTimeTrend)">{{ formatTrend(responseTimeTrend) }}</span>
        </div>
      </div>
      
      <div class="metric-card" :class="{ warning: successRate < 95, error: successRate < 80 }">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value">{{ successRate.toFixed(1) }}%</div>
        <div class="metric-trend">
          <span :class="trendClass(successRateTrend)">{{ formatTrend(successRateTrend) }}</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Requests/min</div>
        <div class="metric-value">{{ requestsPerMinute }}</div>
        <div class="metric-trend">
          <span :class="trendClass(requestsTrend)">{{ formatTrend(requestsTrend) }}</span>
        </div>
      </div>
      
      <div class="metric-card" :class="{ active: store.isTraining }">
        <div class="metric-label">Training Status</div>
        <div class="metric-value">{{ store.isTraining ? 'Active' : 'Idle' }}</div>
        <div v-if="store.isTraining" class="metric-trend">
          <span class="training-indicator">Epoch {{ currentEpoch }}</span>
        </div>
      </div>
    </div>

    <!-- Live Training Metrics (when training) -->
    <div v-if="store.isTraining" class="training-metrics">
      <h4>Live Training Metrics</h4>
      <div class="training-grid">
        <div class="training-metric">
          <span class="label">Current Loss:</span>
          <span class="value" :class="lossChangeClass">{{ store.currentLoss.toFixed(4) }}</span>
          <span class="change">{{ formatLossChange() }}</span>
        </div>
        
        <div class="training-metric">
          <span class="label">Train Accuracy:</span>
          <span class="value">{{ store.trainAccuracy.toFixed(1) }}%</span>
          <span class="change" :class="accuracyChangeClass">{{ formatAccuracyChange() }}</span>
        </div>
        
        <div class="training-metric">
          <span class="label">Learning Rate:</span>
          <span class="value">{{ currentLearningRate.toFixed(4) }}</span>
        </div>
        
        <div class="training-metric">
          <span class="label">Gradient Norm:</span>
          <span class="value">{{ currentGradientNorm.toFixed(6) }}</span>
        </div>
      </div>
    </div>

    <!-- API Operations History -->
    <div class="operations-section">
      <h4>Recent Operations</h4>
      <div class="operations-list">
        <div 
          v-for="(op, index) in recentOperations" 
          :key="index"
          class="operation-item"
          :class="{ 
            success: op.success, 
            error: !op.success,
            recent: isRecentOperation(op.timestamp)
          }"
        >
          <div class="operation-info">
            <span class="operation-name">{{ op.operation }}</span>
            <span class="operation-time">{{ formatRelativeTime(op.timestamp) }}</span>
          </div>
          <div class="operation-status">
            <span class="status-icon">{{ op.success ? '✅' : '❌' }}</span>
            <span class="duration">{{ op.duration }}ms</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Model State Monitoring -->
    <div class="model-state-section">
      <h4>Model State</h4>
      <div class="state-grid">
        <div class="state-item">
          <span class="state-label">Weights Initialized:</span>
          <span class="state-value" :class="{ active: hasWeights }">
            {{ hasWeights ? 'Yes' : 'No' }}
          </span>
        </div>
        
        <div class="state-item">
          <span class="state-label">Ternary Mode:</span>
          <span class="state-value" :class="{ active: store.useTernaryWeights }">
            {{ store.useTernaryWeights ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
        
        <div class="state-item">
          <span class="state-label">Dataset Loaded:</span>
          <span class="state-value" :class="{ active: hasDataset }">
            {{ store.selectedDataset || 'None' }}
          </span>
        </div>
        
        <div class="state-item">
          <span class="state-label">Similarity Metric:</span>
          <span class="state-value">{{ store.similarityMetric }}</span>
        </div>
      </div>
    </div>

    <!-- Live System Resources (if available) -->
    <div v-if="systemMetrics" class="system-metrics">
      <h4>System Resources</h4>
      <div class="resource-bars">
        <div class="resource-bar">
          <div class="resource-label">CPU Usage</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${systemMetrics.cpu}%` }"></div>
          </div>
          <span class="resource-value">{{ systemMetrics.cpu }}%</span>
        </div>
        
        <div class="resource-bar">
          <div class="resource-label">Memory Usage</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${systemMetrics.memory}%` }"></div>
          </div>
          <span class="resource-value">{{ systemMetrics.memory }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { mnistApiService } from '@/services/mnistApiService'

const store = useMNISTClassifierStore()

// Reactive state
const isConnecting = ref(false)
const hasConnectionError = ref(false)
const isTestingConnection = ref(false)
const autoRefreshEnabled = ref(true)
const connectionStartTime = ref<number | null>(null)
const connectionUptime = ref(0)

// Performance metrics
const responseTime = ref(0)
const responseTimeTrend = ref(0)
const successRate = ref(100)
const successRateTrend = ref(0)
const requestsPerMinute = ref(0)
const requestsTrend = ref(0)

// Training metrics
const currentEpoch = ref(0)
const currentLearningRate = ref(0.01)
const currentGradientNorm = ref(0)
const lastLoss = ref(0)
const lastAccuracy = ref(0)

// Operations tracking
const recentOperations = ref<Array<{
  operation: string
  timestamp: number
  success: boolean
  duration: number
}>>([])

// System metrics
const systemMetrics = ref<{
  cpu: number
  memory: number
} | null>(null)

// Model state
const hasWeights = ref(false)
const hasDataset = ref(false)

// Computed properties
const connectionStatusClass = computed(() => ({
  connected: store.apiConnected,
  connecting: isConnecting.value,
  disconnected: !store.apiConnected && !isConnecting.value,
  error: hasConnectionError.value
}))

const connectionStatusText = computed(() => {
  if (isConnecting.value) return 'Connecting...'
  if (store.apiConnected) return 'Connected'
  if (hasConnectionError.value) return 'Connection Error'
  return 'Disconnected'
})

const lossChangeClass = computed(() => {
  const change = store.currentLoss - lastLoss.value
  return {
    improving: change < -0.001,
    degrading: change > 0.001,
    stable: Math.abs(change) <= 0.001
  }
})

const accuracyChangeClass = computed(() => {
  const change = store.trainAccuracy - lastAccuracy.value
  return {
    improving: change > 0.1,
    degrading: change < -0.1,
    stable: Math.abs(change) <= 0.1
  }
})

// Methods
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function trendClass(trend: number) {
  return {
    'trend-up': trend > 0,
    'trend-down': trend < 0,
    'trend-stable': trend === 0
  }
}

function formatTrend(trend: number): string {
  if (trend === 0) return '→'
  return trend > 0 ? `↗ +${trend.toFixed(1)}` : `↘ ${trend.toFixed(1)}`
}

function formatLossChange(): string {
  const change = store.currentLoss - lastLoss.value
  if (Math.abs(change) < 0.0001) return ''
  return change > 0 ? `↗ +${change.toFixed(4)}` : `↘ ${change.toFixed(4)}`
}

function formatAccuracyChange(): string {
  const change = store.trainAccuracy - lastAccuracy.value
  if (Math.abs(change) < 0.1) return ''
  return change > 0 ? `↗ +${change.toFixed(1)}%` : `↘ ${change.toFixed(1)}%`
}

function isRecentOperation(timestamp: number): boolean {
  return Date.now() - timestamp < 5000 // 5 seconds
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 1000) return 'now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

async function testConnection(): Promise<void> {
  isTestingConnection.value = true
  const startTime = Date.now()
  
  try {
    await mnistApiService.healthCheck()
    const duration = Date.now() - startTime
    
    addOperation('Health Check', true, duration)
    responseTime.value = duration
    hasConnectionError.value = false
    
  } catch (error) {
    const duration = Date.now() - startTime
    addOperation('Health Check', false, duration)
    hasConnectionError.value = true
    console.error('Connection test failed:', error)
    
  } finally {
    isTestingConnection.value = false
  }
}

function toggleAutoRefresh(): void {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  console.log('Auto refresh', autoRefreshEnabled.value ? 'enabled' : 'disabled')
}

function addOperation(operation: string, success: boolean, duration: number): void {
  recentOperations.value.unshift({
    operation,
    timestamp: Date.now(),
    success,
    duration
  })
  
  // Keep only last 10 operations
  if (recentOperations.value.length > 10) {
    recentOperations.value = recentOperations.value.slice(0, 10)
  }
  
  // Update success rate
  const recentOps = recentOperations.value.slice(0, 20)
  const successCount = recentOps.filter(op => op.success).length
  successRate.value = (successCount / recentOps.length) * 100
}

// Watchers for live updates
watch(() => store.apiConnected, (connected) => {
  if (connected) {
    connectionStartTime.value = Date.now()
    hasConnectionError.value = false
  } else {
    connectionStartTime.value = null
  }
})

watch(() => store.currentLoss, (newLoss) => {
  lastLoss.value = newLoss
})

watch(() => store.trainAccuracy, (newAccuracy) => {
  lastAccuracy.value = newAccuracy
})

// Live data updates
let uptimeInterval: ReturnType<typeof setInterval> | null = null
let metricsInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // Start uptime counter
  uptimeInterval = setInterval(() => {
    if (connectionStartTime.value) {
      connectionUptime.value = Math.floor((Date.now() - connectionStartTime.value) / 1000)
    }
  }, 1000)
  
  // Start metrics collection
  if (autoRefreshEnabled.value) {
    metricsInterval = setInterval(async () => {
      if (store.apiConnected && autoRefreshEnabled.value) {
        try {
          // Update model state
          hasWeights.value = store.neurons.length > 0 && store.neurons[0].weights.length > 0
          hasDataset.value = !!store.selectedDataset
          
          // Could add more API calls here for system metrics
          
        } catch (error) {
          console.warn('Failed to update metrics:', error)
        }
      }
    }, 2000)
  }
  
  // Initial connection test
  if (store.apiConnected) {
    testConnection()
  }
})

onUnmounted(() => {
  if (uptimeInterval) clearInterval(uptimeInterval)
  if (metricsInterval) clearInterval(metricsInterval)
})
</script>

<style scoped>
.api-status-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.api-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.api-status-header h4 {
  margin: 0;
  color: rgb(var(--text-primary));
  font-size: 14px;
  font-weight: 600;
}

.api-controls {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  padding: 6px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-secondary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.status-card {
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s ease;
}

.status-card.active {
  border-color: rgb(var(--color-primary));
  background: rgb(var(--bg-quaternary));
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--text-tertiary));
  transition: background-color 0.2s ease;
}

.status-dot.active {
  background: rgb(var(--color-success));
  animation: pulse 2s infinite;
}

.status-dot.inactive {
  background: rgb(var(--color-warning));
}

.status-dot.error {
  background: rgb(var(--color-error));
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.status-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.toggle-btn {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  color: rgb(var(--text-tertiary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.toggle-btn:hover {
  background: rgb(var(--bg-quaternary));
}

.status-badge {
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
}

.status-badge.fallback {
  background: rgb(var(--color-warning));
  color: rgb(var(--text-primary));
}

.status-details {
  margin-bottom: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.detail-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.detail-value {
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
}

.detail-value.active {
  color: rgb(var(--color-success));
}

.detail-value.inactive {
  color: rgb(var(--color-warning));
}

.detail-value.error {
  color: rgb(var(--color-error));
}

.status-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feature-tag {
  padding: 2px 6px;
  font-size: 9px;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  color: rgb(var(--text-tertiary));
}

.performance-metrics {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(var(--border-primary));
}

.performance-metrics h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: rgb(var(--text-primary));
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
}

.metric-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.metric-value {
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
}

.api-testing {
  margin-top: 16px;
  padding: 12px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
}

.testing-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.test-btn {
  padding: 6px;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  color: rgb(var(--text-tertiary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-btn:hover:not(:disabled) {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.test-results {
  margin-top: 16px;
}

.results-list {
  margin-top: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  border-bottom: 1px solid rgb(var(--border-primary));
}

.result-item:last-child {
  border-bottom: none;
}

.result-icon {
  margin-right: 8px;
}

.result-text {
  flex: 1;
}

.result-time {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.training-monitor {
  margin-top: 16px;
  padding: 12px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
}

.monitor-stats {
  margin-bottom: 16px;
}

.monitor-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.stat-value {
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
}

.real-time-chart {
  height: 100px;
  position: relative;
}

.performance-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.dataset-status {
  margin-top: 16px;
  padding: 12px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
}

.dataset-info {
  margin-top: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.info-label {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.info-value {
  font-size: 10px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
}

.connection-issues {
  margin-top: 16px;
  padding: 12px;
  background: rgb(var(--bg-quaternary));
  border: 1px solid rgb(var(--color-warning));
  border-radius: 6px;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.warning-icon {
  width: 14px;
  height: 14px;
  color: rgb(var(--color-warning));
}

.issue-header span {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--color-warning));
}

.issue-details {
  font-size: 11px;
  color: rgb(var(--text-secondary));
  line-height: 1.4;
}

.issue-details ul {
  margin: 8px 0;
  padding-left: 16px;
}

.issue-details li {
  margin-bottom: 2px;
}

.fallback-note {
  margin-top: 8px;
  padding: 6px;
  background: rgb(var(--bg-tertiary));
  border-radius: 4px;
  font-style: italic;
  color: rgb(var(--color-success));
}

.connection-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.retry-btn, .help-btn {
  padding: 6px;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  color: rgb(var(--text-tertiary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover:not(:disabled), .help-btn:hover:not(:disabled) {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.retry-btn:disabled, .help-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .api-status-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .status-header {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 2px;
  }
}
</style> 