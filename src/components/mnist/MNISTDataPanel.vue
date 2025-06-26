<template>
  <div class="mnist-data-panel">
    <div class="panel-section">
      <h3 class="section-title">Dataset</h3>
      
      <div class="dataset-stats" v-if="store.datasetInfo.trainSize > 0">
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
          @click="loadQuickDemo" 
          class="action-btn primary"
          :disabled="isLoading"
        >
          <BoltIcon class="btn-icon" />
          Quick Demo (200 samples)
        </button>
        
        <button 
          @click="loadSmallDataset" 
          class="action-btn"
          :disabled="isLoading"
        >
          <DatabaseIcon class="btn-icon" />
          Small Dataset (1K samples)
        </button>
        
        <button 
          @click="loadMediumDataset" 
          class="action-btn"
          :disabled="isLoading"
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
    
    <div class="panel-section" v-if="store.datasetInfo.trainSize > 0">
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
    
    <div class="panel-section" v-if="store.datasetInfo.trainSize > 0">
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
      
      <button @click="refreshSamples" class="refresh-btn">
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

function selectSample(sample: NDDataPoint) {
  // Could emit event or update store for detailed view
  notificationStore.addNotification({
    message: `Selected sample: Digit ${sample.label}`,
    type: 'info'
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
.mnist-data-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.panel-section {
  padding: 12px 0;
}

.panel-section:not(:last-child) {
  border-bottom: 1px solid #464647;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #007acc;
}

/* Dataset Stats */
.dataset-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat-card {
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  padding: 8px;
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 9px;
  color: #999999;
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
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.action-btn:hover:not(:disabled) {
  background: #404040;
  border-color: #666666;
}

.action-btn.primary {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #0066aa;
  border-color: #0066aa;
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
  background: rgba(0, 122, 204, 0.1);
  border: 1px solid #007acc;
  border-radius: 4px;
  font-size: 11px;
  color: #007acc;
  margin-top: 12px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid #007acc;
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
  color: #cccccc;
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
  color: #999999;
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
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sample-container:hover {
  border-color: #007acc;
  transform: translateY(-1px);
}

.sample-canvas {
  width: 32px;
  height: 32px;
  border: 1px solid #464647;
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