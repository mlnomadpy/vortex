<template>
  <div class="mnist-visualization">
    <!-- Header with mode selector -->
    <div class="visualization-header">
      <div class="mode-selector">
        <button
          v-for="mode in visualizationModes"
          :key="mode.id"
          @click="currentMode = mode.id as 'weights' | 'activations' | 'similarity'"
          :class="['mode-btn', { active: currentMode === mode.id }]"
        >
          <component :is="mode.icon" class="mode-icon" />
          <span>{{ mode.label }}</span>
        </button>
      </div>
      
      <div class="visualization-controls">
        <div class="control-group">
          <label class="control-label">Selected Neuron:</label>
          <select v-model="selectedNeuronId" class="neuron-select">
            <option value="all">All Neurons</option>
            <option v-for="neuron in store.neurons" :key="neuron.id" :value="neuron.id">
              {{ neuron.label || `Neuron ${neuron.id}` }}
            </option>
          </select>
        </div>
        
              <div class="control-group" v-if="currentMode === 'weights'">
        <label class="control-label">Colormap:</label>
        <select v-model="colormap" class="colormap-select">
          <option value="viridis">Viridis</option>
          <option value="plasma">Plasma</option>
          <option value="grayscale">Grayscale</option>
          <option value="cool">Cool</option>
          <option value="hot">Hot</option>
        </select>
      </div>
      
      <div class="control-group">
        <button @click="forceUpdate" class="force-update-btn" title="Force visualization update">
          🔄 Force Update
        </button>
      </div>
      </div>
    </div>

    <!-- Main visualization area -->
    <div class="visualization-content">
      <!-- Weight matrices visualization -->
      <div v-if="currentMode === 'weights'" class="weights-grid">
        <div v-if="selectedNeuronId === 'all'" class="all-neurons-grid">
          <div
            v-for="neuron in store.neurons"
            :key="neuron.id"
            class="neuron-weight-container"
            @click="selectNeuron(neuron.id)"
          >
            <div class="neuron-header">
              <span class="neuron-label">{{ neuron.label || `Digit ${neuron.id}` }}</span>
              <span class="neuron-stats">
                Norm: {{ getNeuronWeightNorm(neuron).toFixed(3) }}
              </span>
            </div>
            <canvas
              :ref="el => { if (el) neuronCanvases[neuron.id] = el as HTMLCanvasElement }"
              class="weight-canvas"
              :width="imageSize"
              :height="imageSize"
            ></canvas>
          </div>
        </div>
        
        <div v-else-if="selectedNeuron" class="single-neuron-view">
          <div class="neuron-detail-header">
            <h3>{{ selectedNeuron.label || `Digit ${selectedNeuron.id}` }}</h3>
            <div class="neuron-detail-stats">
              <div class="stat-item">
                <span class="stat-label">Weight Norm:</span>
                <span class="stat-value">{{ getNeuronWeightNorm(selectedNeuron).toFixed(4) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Bias:</span>
                <span class="stat-value">{{ selectedNeuron.bias.toFixed(4) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avg Weight:</span>
                <span class="stat-value">{{ getAverageWeight(selectedNeuron).toFixed(4) }}</span>
              </div>
            </div>
          </div>
          <canvas
            ref="detailCanvas"
            class="weight-canvas-large"
            :width="imageSize * 4"
            :height="imageSize * 4"
          ></canvas>
          
          <!-- Weight histogram -->
          <div class="weight-histogram">
            <h4>Weight Distribution</h4>
            <canvas
              ref="histogramCanvas"
              class="histogram-canvas"
              width="300"
              height="100"
            ></canvas>
          </div>
        </div>
      </div>
      
      <!-- Activations visualization -->
      <div v-else-if="currentMode === 'activations'" class="activations-view">
        <div class="activations-grid">
          <div
            v-for="neuron in store.neurons"
            :key="neuron.id"
            class="activation-bar-container"
          >
            <div class="activation-label">{{ neuron.label || `Digit ${neuron.id}` }}</div>
            <div class="activation-bar-wrapper">
              <div
                class="activation-bar"
                :style="{
                  width: `${Math.max(2, getActivationLevel(neuron) * 100)}%`,
                  backgroundColor: neuron.color
                }"
              ></div>
              <span class="activation-value">{{ getActivationLevel(neuron).toFixed(3) }}</span>
            </div>
          </div>
        </div>
        
        <div class="sample-input-area">
          <h4>Test with Sample Input</h4>
          <canvas
            ref="sampleCanvas"
            class="sample-canvas"
            :width="imageSize"
            :height="imageSize"
            @click="generateRandomSample"
          ></canvas>
          <p class="sample-hint">Click to generate a new random sample</p>
        </div>
      </div>
      
      <!-- Similarity metrics comparison -->
      <div v-else-if="currentMode === 'similarity'" class="similarity-view">
        <div class="similarity-comparison">
          <h4>Similarity Metrics Comparison</h4>
          <div class="metrics-grid">
            <div
              v-for="metric in availableMetrics"
              :key="metric.id"
              class="metric-comparison"
            >
              <h5>{{ metric.label }}</h5>
              <div class="metric-bars">
                <div
                  v-for="neuron in store.neurons"
                  :key="neuron.id"
                  class="metric-bar-container"
                >
                  <span class="metric-neuron-label">{{ neuron.id }}</span>
                  <div class="metric-bar">
                    <div
                      class="metric-bar-fill"
                      :style="{
                        width: `${Math.max(2, getSimilarityScore(neuron, metric.id) * 100)}%`,
                        backgroundColor: neuron.color
                      }"
                    ></div>
                  </div>
                  <span class="metric-value">{{ getSimilarityScore(neuron, metric.id).toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Info panel -->
    <div class="info-panel">
      <div class="info-item">
        <span class="info-label">Dataset:</span>
        <span class="info-value">{{ store.datasetInfo.trainSize }} train, {{ store.datasetInfo.testSize }} test</span>
      </div>
      <div class="info-item">
        <span class="info-label">Similarity:</span>
        <span class="info-value">{{ store.similarityMetric }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Activation:</span>
        <span class="info-value">{{ store.activationFunction }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Accuracy:</span>
        <span class="info-value">{{ store.trainAccuracy.toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { weightsToImage, calculateNDSimilarityScore } from '@/utils/ndMathCore'
import type { NDNeuron, NDSimilarityMetric } from '@/types'
import {
  EyeIcon,
  ChartBarSquareIcon,
  ChartBarIcon,
  CpuChipIcon
} from '@/components/ui/icons'

const store = useMNISTClassifierStore()

// Reactive state
const currentMode = ref<'weights' | 'activations' | 'similarity'>('weights')
const selectedNeuronId = ref<string | number>('all')
const colormap = ref('viridis')
const imageSize = 28 // MNIST image size

// Canvas references
const neuronCanvases = ref<Record<number, HTMLCanvasElement>>({})
const detailCanvas = ref<HTMLCanvasElement | null>(null)
const histogramCanvas = ref<HTMLCanvasElement | null>(null)
const sampleCanvas = ref<HTMLCanvasElement | null>(null)

// Test sample for activations
const testSample = ref<number[]>(new Array(784).fill(0))

// Configuration
const visualizationModes = [
  { id: 'weights', label: 'Weights', icon: EyeIcon },
  { id: 'activations', label: 'Activations', icon: ChartBarIcon },
  { id: 'similarity', label: 'Similarity', icon: ChartBarSquareIcon }
]

const availableMetrics: Array<{ id: NDSimilarityMetric, label: string }> = [
  { id: 'dotProduct', label: 'Dot Product' },
  { id: 'euclidean', label: 'Euclidean' },
  { id: 'yatProduct', label: 'YAT Product' },
  { id: 'cosine', label: 'Cosine' },
  { id: 'manhattan', label: 'Manhattan' },
  { id: 'rbf', label: 'RBF' }
]

// Computed properties
const selectedNeuron = computed(() => {
  if (selectedNeuronId.value === 'all') return null
  return store.neurons.find(n => n.id === selectedNeuronId.value) || null
})

// Methods
function selectNeuron(neuronId: number) {
  selectedNeuronId.value = neuronId
  store.selectedNeuron = store.neurons.find(n => n.id === neuronId) || null
}

function getNeuronWeightNorm(neuron: NDNeuron): number {
  return Math.sqrt(neuron.weights.reduce((sum, w) => sum + w * w, 0))
}

function getAverageWeight(neuron: NDNeuron): number {
  return neuron.weights.reduce((sum, w) => sum + w, 0) / neuron.weights.length
}

function getActivationLevel(neuron: NDNeuron): number {
  if (testSample.value.length === 0) return 0
  try {
    const score = calculateNDSimilarityScore(neuron, testSample.value, store.similarityMetric)
    return Math.max(0, Math.min(1, (score + 5) / 10)) // Normalize for display
  } catch {
    return 0
  }
}

function getSimilarityScore(neuron: NDNeuron, metric: NDSimilarityMetric): number {
  if (testSample.value.length === 0) return 0
  try {
    const score = calculateNDSimilarityScore(neuron, testSample.value, metric)
    return Math.max(0, Math.min(1, (score + 5) / 10)) // Normalize for display
  } catch {
    return 0
  }
}

function generateRandomSample() {
  // Generate a simple random pattern
  testSample.value = new Array(784).fill(0).map(() => Math.random())
  renderSampleCanvas()
  
  // Update activations display
  if (currentMode.value === 'activations') {
    // Force reactivity update
    nextTick()
  }
}

function renderWeightCanvas(canvas: HTMLCanvasElement, weights: number[]) {
  const ctx = canvas.getContext('2d')
  
  if (!ctx || weights.length !== 784) return

  try {
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const range = maxWeight - minWeight || 0.001
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const imageMatrix = weightsToImage(weights, 28, 28)
    const imageData = ctx.createImageData(28, 28)
    
    // Enhanced visualization with better contrast and colors
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const value = imageMatrix[y][x]
        
        // Smart normalization
        let normalized = (value - minWeight) / range
        normalized = Math.max(0, Math.min(1, normalized))
        
        // Apply selected colormap
        const color = applyColormap(normalized, colormap.value)
        
        const index = (y * 28 + x) * 4
        imageData.data[index] = color.r
        imageData.data[index + 1] = color.g
        imageData.data[index + 2] = color.b
        imageData.data[index + 3] = 255
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // Add subtle border for visual separation
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 0.5
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
    
  } catch (error) {
    console.error('Error rendering weight canvas:', error)
  }
}

function renderSampleCanvas() {
  if (!sampleCanvas.value) return
  
  const ctx = sampleCanvas.value.getContext('2d')
  if (!ctx) return

  const imageData = ctx.createImageData(28, 28)
  
  for (let i = 0; i < 784; i++) {
    const value = Math.floor(testSample.value[i] * 255)
    const pixelIndex = i * 4
    imageData.data[pixelIndex] = value
    imageData.data[pixelIndex + 1] = value
    imageData.data[pixelIndex + 2] = value
    imageData.data[pixelIndex + 3] = 255
  }
  
  ctx.putImageData(imageData, 0, 0)
}

function renderWeightHistogram(weights: number[]) {
  if (!histogramCanvas.value) return
  
  const ctx = histogramCanvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, 300, 100)
  
  // Create histogram
  const bins = 20
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const binSize = (maxWeight - minWeight) / bins
  const histogram = new Array(bins).fill(0)
  
  weights.forEach(weight => {
    const binIndex = Math.min(bins - 1, Math.floor((weight - minWeight) / binSize))
    histogram[binIndex]++
  })
  
  const maxCount = Math.max(...histogram)
  const barWidth = 300 / bins
  
  // Draw bars
  ctx.fillStyle = '#007acc'
  histogram.forEach((count, i) => {
    const height = (count / maxCount) * 80
    ctx.fillRect(i * barWidth, 100 - height, barWidth - 1, height)
  })
  
  // Draw axes
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 100)
  ctx.lineTo(300, 100)
  ctx.stroke()
}

function applyColormap(value: number, cmapName: string): { r: number, g: number, b: number } {
  // Clamp value to [0, 1]
  value = Math.max(0, Math.min(1, value))
  
  switch (cmapName) {
    case 'viridis':
      return viridisColormap(value)
    case 'plasma':
      return plasmaColormap(value)
    case 'grayscale':
      const gray = Math.floor(value * 255)
      return { r: gray, g: gray, b: gray }
    case 'cool':
      return { r: Math.floor(value * 255), g: Math.floor((1 - value) * 255), b: 255 }
    case 'hot':
      if (value < 1/3) {
        return { r: Math.floor(value * 3 * 255), g: 0, b: 0 }
      } else if (value < 2/3) {
        return { r: 255, g: Math.floor((value - 1/3) * 3 * 255), b: 0 }
      } else {
        return { r: 255, g: 255, b: Math.floor((value - 2/3) * 3 * 255) }
      }
    default:
      const def = Math.floor(value * 255)
      return { r: def, g: def, b: def }
  }
}

function viridisColormap(t: number): { r: number, g: number, b: number } {
  // Simplified viridis colormap
  const r = Math.floor(255 * (0.267 + 0.392 * t - 0.712 * t * t + 0.674 * t * t * t))
  const g = Math.floor(255 * (0.004 + 1.336 * t - 1.055 * t * t))
  const b = Math.floor(255 * (0.329 + 2.078 * t - 2.706 * t * t + 1.299 * t * t * t))
  
  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b))
  }
}

function plasmaColormap(t: number): { r: number, g: number, b: number } {
  // Simplified plasma colormap
  const r = Math.floor(255 * (0.050 + 2.065 * t - 1.632 * t * t + 0.517 * t * t * t))
  const g = Math.floor(255 * (0.013 + 0.775 * t + 0.624 * t * t - 0.412 * t * t * t))
  const b = Math.floor(255 * (0.540 + 1.667 * t - 2.377 * t * t + 1.170 * t * t * t))
  
  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b))
  }
}

function updateVisualization() {
  console.log(`🔄 updateVisualization called at ${new Date().toLocaleTimeString()} - Mode: ${currentMode.value}, Neurons: ${store.neurons.length}`)
  
  nextTick(() => {
    if (currentMode.value === 'weights') {
      // Simple approach: iterate through neurons and update their canvases
      for (const neuron of store.neurons) {
        const canvas = neuronCanvases.value[neuron.id]
        if (canvas) {
          console.log(`🎯 Updating canvas for neuron ${neuron.id}`)
          renderWeightCanvas(canvas, neuron.weights)
        } else {
          console.warn(`❌ No canvas found for neuron ${neuron.id}`)
        }
      }
      
      // Update detailed view if needed
      if (selectedNeuron.value && detailCanvas.value) {
        renderWeightCanvas(detailCanvas.value, selectedNeuron.value.weights)
        if (histogramCanvas.value) {
          renderWeightHistogram(selectedNeuron.value.weights)
        }
      }
    }
  })
}

// Watchers
watch(() => store.neurons, () => {
  updateVisualization()
}, { deep: true, immediate: true })

watch(currentMode, () => {
  updateVisualization()
})

watch(colormap, () => {
  updateVisualization()
})

watch(selectedNeuronId, () => {
  updateVisualization()
})

// Watch the visualization update trigger for real-time updates during training
watch(() => store.visualizationUpdateTrigger, (newValue, oldValue) => {
  console.log(`🎨 Visualization trigger changed: ${oldValue} -> ${newValue} at ${new Date().toLocaleTimeString()}`)
  updateVisualization()
}, { immediate: true })

// Also watch the neurons array more directly
watch(() => store.neurons.map(n => n.weights.slice(0, 5)), (newWeights, oldWeights) => {
  console.log('🧠 Neuron weights changed (first 5 of each neuron):', {
    new: newWeights.map(w => w.map(v => v.toFixed(3))),
    old: oldWeights?.map(w => w.map(v => v.toFixed(3))) || []
  })
  updateVisualization()
}, { deep: true })

// Expose methods for parent components
function forceUpdate() {
  console.log('🔄 Force update triggered from parent')
  updateVisualization()
}

// Lifecycle
onMounted(() => {
  generateRandomSample()
  updateVisualization()
})

// Expose methods
defineExpose({
  forceUpdate,
  updateVisualization
})
</script>

<style scoped>
.mnist-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #2d2d30;
  color: #cccccc;
}

.visualization-header {
  padding: 12px;
  border-bottom: 1px solid #464647;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.mode-selector {
  display: flex;
  gap: 4px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #cccccc;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.mode-btn:hover {
  background: #404040;
  border-color: #666666;
}

.mode-btn.active {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.mode-icon {
  width: 14px;
  height: 14px;
}

.visualization-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 11px;
  color: #999999;
  white-space: nowrap;
}

.neuron-select,
.colormap-select {
  padding: 4px 8px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  min-width: 100px;
}

.force-update-btn {
  padding: 4px 8px;
  background: #007acc;
  border: 1px solid #007acc;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.force-update-btn:hover {
  background: #005a9e;
}

.visualization-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Weights visualization */
.all-neurons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.neuron-weight-container {
  background: #383838;
  border: 1px solid #555555;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.neuron-weight-container:hover {
  border-color: #007acc;
  transform: translateY(-2px);
}

.neuron-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.neuron-label {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
}

.neuron-stats {
  font-size: 9px;
  color: #999999;
}

.weight-canvas {
  width: 100%;
  height: auto;
  max-width: 100px;
  image-rendering: pixelated;
  border: 1px solid #464647;
  border-radius: 3px;
}

.single-neuron-view {
  max-width: 600px;
  margin: 0 auto;
}

.neuron-detail-header {
  text-align: center;
  margin-bottom: 20px;
}

.neuron-detail-header h3 {
  margin: 0 0 12px 0;
  color: #007acc;
}

.neuron-detail-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 10px;
  color: #999999;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
}

.weight-canvas-large {
  width: 100%;
  max-width: 280px;
  height: auto;
  margin: 0 auto;
  display: block;
  image-rendering: pixelated;
  border: 2px solid #464647;
  border-radius: 6px;
}

.weight-histogram {
  margin-top: 20px;
  text-align: center;
}

.weight-histogram h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #cccccc;
}

.histogram-canvas {
  border: 1px solid #464647;
  border-radius: 4px;
  background: #1e1e1e;
}

/* Activations visualization */
.activations-view {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 24px;
}

.activations-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activation-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activation-label {
  width: 80px;
  font-size: 11px;
  color: #cccccc;
  text-align: right;
}

.activation-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activation-bar {
  height: 16px;
  background: #007acc;
  border-radius: 8px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.activation-value {
  font-size: 10px;
  color: #999999;
  min-width: 40px;
}

.sample-input-area {
  text-align: center;
}

.sample-input-area h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #cccccc;
}

.sample-canvas {
  width: 140px;
  height: 140px;
  border: 2px solid #464647;
  border-radius: 6px;
  cursor: pointer;
  image-rendering: pixelated;
  transition: border-color 0.2s ease;
}

.sample-canvas:hover {
  border-color: #007acc;
}

.sample-hint {
  margin: 8px 0 0 0;
  font-size: 10px;
  color: #999999;
}

/* Similarity visualization */
.similarity-comparison h4 {
  margin: 0 0 16px 0;
  text-align: center;
  color: #cccccc;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-comparison h5 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #007acc;
  text-align: center;
}

.metric-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-neuron-label {
  width: 20px;
  font-size: 10px;
  color: #cccccc;
  text-align: center;
}

.metric-bar {
  flex: 1;
  height: 12px;
  background: #383838;
  border-radius: 6px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.metric-value {
  font-size: 9px;
  color: #999999;
  min-width: 35px;
}

/* Info panel */
.info-panel {
  padding: 12px;
  border-top: 1px solid #464647;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(0, 0, 0, 0.2);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.info-label {
  font-size: 9px;
  color: #999999;
  text-transform: uppercase;
}

.info-value {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
}

/* Responsive */
@media (max-width: 768px) {
  .visualization-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .visualization-controls {
    justify-content: space-between;
  }
  
  .activations-view {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style> 