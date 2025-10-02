<template>
  <div class="mnist-data-panel">
    <!-- Dataset Selection Section -->
    <div class="panel-section">
      <h3 class="section-title">Dataset Selection</h3>
      
      <div class="dataset-selector">
        <label class="selector-label">Choose Dataset:</label>
        <select 
          v-model="store.selectedDataset" 
          class="dataset-select"
          :disabled="isLoading"
          @change="onDatasetChange"
        >
          <option 
            v-for="(info, name) in store.availableDatasets" 
            :key="name" 
            :value="name"
          >
            {{ info.description }}
          </option>
        </select>
      </div>
      
      <div v-if="store.apiConnected" class="api-status">
        <div class="status-indicator connected">
          <div class="status-dot"></div>
          <span>API Connected - Real Datasets Available</span>
        </div>
      </div>
      
      <div v-else class="api-status">
        <div class="status-indicator disconnected">
          <div class="status-dot"></div>
          <span>API Offline - Using Synthetic Data</span>
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h3 class="section-title">Dataset</h3>
      
      <div v-if="store.datasetInfo.trainSize > 0" class="dataset-stats">
        <div class="stat-card">
          <div class="stat-value">{{ store.datasetInfo.trainSize }}</div>
          <div class="stat-label">Training Samples</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ store.datasetInfo.testSize }}</div>
          <div class="stat-label">Test Samples</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ store.datasetInfo.numFeatures }}</div>
          <div class="stat-label">Features</div>
        </div>
      </div>
      
      <div class="dataset-actions">
        <button 
          class="action-btn primary" 
          :disabled="isLoading"
          @click="loadQuickDemo"
        >
          <BoltIcon class="btn-icon" />
          Quick Demo (200 samples)
        </button>
        
        <button 
          class="action-btn" 
          :disabled="isLoading"
          @click="loadSmallDataset"
        >
          <DatabaseIcon class="btn-icon" />
          Small Dataset (1K samples)
        </button>
        
        <button 
          class="action-btn" 
          :disabled="isLoading"
          @click="loadMediumDataset"
        >
          <CpuChipIcon class="btn-icon" />
          Medium Dataset (5K samples)
        </button>
      </div>
      
      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-spinner"></div>
        <span>Loading dataset...</span>
      </div>
    </div>
    
    <div v-if="store.datasetInfo.trainSize > 0" class="panel-section">
      <h3 class="section-title">Class Distribution</h3>
      
      <div class="class-distribution">
        <div 
          v-for="digit in digits"
          :key="digit"
          class="class-bar-container"
        >
          <span class="class-label">{{ digit }}</span>
          <div class="class-bar-wrapper">
            <div 
              class="class-bar"
              :style="{ 
                width: `${getClassPercentage(digit)}%`,
                backgroundColor: getDigitColor(digit)
              }"
            ></div>
            <span class="class-count">{{ getClassCount(digit) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="store.datasetInfo.trainSize > 0" class="panel-section">
      <h3 class="section-title">Sample Visualization</h3>
      
      <div class="sample-grid">
        <div 
          v-for="(sample, index) in sampleImages"
          :key="index"
          class="sample-container"
          @click="selectSample(sample)"
        >
          <canvas 
            :ref="el => { if (el) sampleCanvases[index] = el as HTMLCanvasElement }"
            class="sample-canvas"
            width="28"
            height="28"
          ></canvas>
          <span class="sample-label">{{ sample.label }}</span>
        </div>
      </div>
      
      <button class="refresh-btn" @click="refreshSamples">
        <ArrowPathIcon class="btn-icon" />
        Refresh Samples
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { useNotificationStore } from '@/stores/notification'
import type { NDDataPoint } from '@/types'
import {
  BoltIcon,
  DatabaseIcon,
  CpuChipIcon,
  ArrowPathIcon
} from '@/components/ui/icons'

const store = useMNISTClassifierStore()
const notificationStore = useNotificationStore()

const isLoading = ref(false)
const sampleImages = ref<NDDataPoint[]>([])
const sampleCanvases = ref<Record<number, HTMLCanvasElement>>({})

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const maxClassCount = computed(() => {
  return Math.max(...digits.map(d => getClassCount(d)))
})

function getClassCount(digit: number): number {
  return store.trainData.filter(point => point.label === digit).length
}

function getClassPercentage(digit: number): number {
  if (maxClassCount.value === 0) return 0
  return (getClassCount(digit) / maxClassCount.value) * 100
}

function getDigitColor(digit: number): string {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]
  return colors[digit] || '#cccccc'
}

async function loadQuickDemo() {
  isLoading.value = true
  try {
    await store.quickTest(200)
    notificationStore.addNotification({
      message: 'Quick demo loaded successfully!',
      type: 'success'
    })
    refreshSamples()
  } catch (error) {
    notificationStore.addNotification({
      message: `Failed to load demo: ${error}`,
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function loadSmallDataset() {
  isLoading.value = true
  try {
    await store.loadDataset({ train: 1000, test: 200 })
    notificationStore.addNotification({
      message: 'Small dataset loaded successfully!',
      type: 'success'
    })
    refreshSamples()
  } catch (error) {
    notificationStore.addNotification({
      message: `Failed to load dataset: ${error}`,
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function loadMediumDataset() {
  isLoading.value = true
  try {
    await store.loadDataset({ train: 5000, test: 1000 })
    notificationStore.addNotification({
      message: 'Medium dataset loaded successfully!',
      type: 'success'
    })
    refreshSamples()
  } catch (error) {
    notificationStore.addNotification({
      message: `Failed to load dataset: ${error}`,
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function onDatasetChange() {
  console.log(`Dataset changed to: ${store.selectedDataset}`)
  notificationStore.addNotification({
    message: `Switched to ${store.selectedDataset} dataset. Load data to see changes.`,
    type: 'info'
  })
}

function selectSample(sample: NDDataPoint) {
  notificationStore.addNotification({
    message: `Selected sample: digit ${sample.label}`,
    type: 'info'
  })
}

function refreshSamples() {
  if (store.trainData.length === 0) return
  
  // Get one sample from each digit class
  sampleImages.value = []
  for (const digit of digits) {
    const digitSamples = store.trainData.filter(point => point.label === digit)
    if (digitSamples.length > 0) {
      const randomIndex = Math.floor(Math.random() * digitSamples.length)
      sampleImages.value.push(digitSamples[randomIndex])
    }
  }
  
  nextTick(() => {
    renderSampleCanvases()
  })
}

function renderSampleCanvases() {
  sampleImages.value.forEach((sample, index) => {
    const canvas = sampleCanvases.value[index]
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const imageData = ctx.createImageData(28, 28)
    
    for (let i = 0; i < 784; i++) {
      const value = Math.floor(sample.features[i] * 255)
      const pixelIndex = i * 4
      imageData.data[pixelIndex] = value
      imageData.data[pixelIndex + 1] = value
      imageData.data[pixelIndex + 2] = value
      imageData.data[pixelIndex + 3] = 255
    }
    
    ctx.putImageData(imageData, 0, 0)
  })
}

// Watchers
watch(() => store.trainData, refreshSamples, { deep: true })

// Lifecycle
onMounted(() => {
  if (store.trainData.length > 0) {
    refreshSamples()
  }
})
</script>

<style scoped>
/* Panel Structure */
.mnist-data-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-primary);
}

.panel-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.panel-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Dataset Selection Styles */
.dataset-selector {
  margin-bottom: 16px;
}

.selector-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.dataset-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  transition: all 0.2s ease;
}

.dataset-select:hover {
  border-color: var(--primary);
}

.dataset-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-alpha);
}

.dataset-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* API Status Styles */
.api-status {
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-indicator.connected {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-indicator.disconnected {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Dataset Stats */
.dataset-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 8px;
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 2px;
}

.stat-label {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}

/* Dataset Actions */
.dataset-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.action-btn:hover:not(:disabled) {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-secondary));
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* Loading */
.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(var(--color-primary), 0.1);
  border: 1px solid rgb(var(--color-primary));
  border-radius: 4px;
  font-size: 11px;
  color: rgb(var(--color-primary));
  margin-top: 12px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid rgb(var(--color-primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Class Distribution */
.class-distribution {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.class-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.class-label {
  width: 16px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
  text-align: center;
}

.class-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.class-bar {
  height: 12px;
  border-radius: 6px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.class-count {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  min-width: 30px;
}

/* Sample Visualization */
.sample-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.sample-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sample-container:hover {
  border-color: rgb(var(--color-primary));
  transform: translateY(-1px);
}

.sample-canvas {
  width: 32px;
  height: 32px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  image-rendering: pixelated;
}

.sample-label {
  font-size: 10px;
  font-weight: 600;
  color: #cccccc;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 6px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
}

.refresh-btn:hover {
  background: #404040;
  border-color: #666666;
}
</style> 