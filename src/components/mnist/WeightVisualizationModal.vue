<template>
  <div v-if="isVisible" class="weight-visualization-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-info">
          <h2>{{ getClassLabel(neuron.id) }} Weight Visualization</h2>
          <div class="header-stats">
            <span class="class-id">Class {{ neuron.id }}</span>
            <span class="weight-norm">‖w‖: {{ getNeuronWeightNorm(neuron).toFixed(4) }}</span>
          </div>
        </div>
        
        <div class="header-controls">
          <div class="zoom-controls">
            <button :disabled="zoomLevel <= 1" class="zoom-btn" @click="zoomOut">
              <span class="zoom-icon">🔍-</span>
            </button>
            <span class="zoom-level">{{ zoomLevel.toFixed(1) }}x</span>
            <button :disabled="zoomLevel >= 8" class="zoom-btn" @click="zoomIn">
              <span class="zoom-icon">🔍+</span>
            </button>
          </div>
          
          <div class="colormap-selector">
            <label>Colormap:</label>
            <select v-model="selectedColormap" @change="updateVisualization">
              <option value="diverging">Diverging</option>
              <option value="viridis">Viridis</option>
              <option value="plasma">Plasma</option>
              <option value="grayscale">Grayscale</option>
              <option value="hot">Hot</option>
            </select>
          </div>
          
          <button class="close-btn" @click="close">
            <span class="close-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div class="visualization-container">
          <!-- Main Weight Canvas -->
          <div class="main-canvas-container">
            <div class="canvas-wrapper" :style="{ transform: `scale(${zoomLevel})` }">
              <canvas
                ref="mainCanvas"
                class="weight-canvas-main"
                :width="canvasSize"
                :height="canvasSize"
                @wheel="handleWheel"
                @mousedown="startPan"
                @mousemove="handlePan"
                @mouseup="endPan"
                @mouseleave="endPan"
              ></canvas>
              
              <!-- Pixel value tooltip -->
              <div 
                v-if="hoveredPixel"
                class="pixel-tooltip"
                :style="{ left: hoveredPixel.x + 'px', top: hoveredPixel.y + 'px' }"
              >
                <div class="tooltip-content">
                  <div class="pixel-coords">Pixel ({{ hoveredPixel.row }}, {{ hoveredPixel.col }})</div>
                  <div class="pixel-value">Value: {{ hoveredPixel.value.toFixed(4) }}</div>
                  <div class="pixel-normalized">Norm: {{ hoveredPixel.normalized.toFixed(3) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Canvas Controls -->
            <div class="canvas-controls">
              <button class="control-btn" @click="resetView">
                <span class="control-icon">🎯</span>
                Reset View
              </button>
              
              <button class="control-btn" :class="{ active: showGrid }" @click="toggleGrid">
                <span class="control-icon">⊞</span>
                Grid
              </button>
              
              <button class="control-btn" @click="exportImage">
                <span class="control-icon">💾</span>
                Export
              </button>
            </div>
          </div>

          <!-- Side Panel -->
          <div class="side-panel">
            <!-- Weight Statistics -->
            <div class="stats-section">
              <h3>Weight Statistics</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Mean (μ):</span>
                  <span class="stat-value">{{ getAverageWeight(neuron).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Std Dev (σ):</span>
                  <span class="stat-value">{{ getWeightStandardDeviation(neuron).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Min:</span>
                  <span class="stat-value">{{ Math.min(...neuron.weights).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Max:</span>
                  <span class="stat-value">{{ Math.max(...neuron.weights).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Range:</span>
                  <span class="stat-value">{{ (Math.max(...neuron.weights) - Math.min(...neuron.weights)).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">L2 Norm:</span>
                  <span class="stat-value">{{ getNeuronWeightNorm(neuron).toFixed(4) }}</span>
                </div>
              </div>
            </div>

            <!-- Weight Distribution Histogram -->
            <div class="histogram-section">
              <h3>Weight Distribution</h3>
              <canvas
                ref="histogramCanvas"
                class="histogram-canvas"
                width="280"
                height="160"
              ></canvas>
              <div class="histogram-stats">
                <div class="hist-stat">
                  <span class="hist-label">Skewness:</span>
                  <span class="hist-value">{{ calculateSkewness(neuron.weights).toFixed(3) }}</span>
                </div>
                <div class="hist-stat">
                  <span class="hist-label">Kurtosis:</span>
                  <span class="hist-value">{{ calculateKurtosis(neuron.weights).toFixed(3) }}</span>
                </div>
              </div>
            </div>

            <!-- Colormap Legend -->
            <div class="legend-section">
              <h3>Color Scale</h3>
              <div class="colormap-legend">
                <div class="legend-gradient" :class="`${selectedColormap}-gradient`"></div>
                <div class="legend-labels">
                  <span class="legend-min">{{ Math.min(...neuron.weights).toFixed(3) }}</span>
                  <span class="legend-max">{{ Math.max(...neuron.weights).toFixed(3) }}</span>
                </div>
              </div>
            </div>

            <!-- Weight Actions -->
            <div class="actions-section">
              <h3>Actions</h3>
              <div class="action-buttons">
                <button class="action-btn reset" @click="resetWeights">
                  <span class="action-icon">🔄</span>
                  Reset Weights
                </button>
                <button class="action-btn randomize" @click="randomizeWeights">
                  <span class="action-icon">🎲</span>
                  Randomize
                </button>
                <button class="action-btn normalize" @click="normalizeWeights">
                  <span class="action-icon">⚖️</span>
                  Normalize
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="pixel-count">{{ neuron.weights.length }} weights (28×28)</span>
          <span v-if="lastUpdate" class="update-time">Updated {{ formatTime(lastUpdate) }}</span>
        </div>
        
        <div class="footer-actions">
          <button class="footer-btn secondary" @click="close">Close</button>
          <button class="footer-btn primary" :disabled="!hasChanges" @click="applyChanges">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { NDNeuron } from '@/types'

interface Props {
  neuron: NDNeuron
  isVisible: boolean
  colormap?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'update-neuron', neuron: NDNeuron): void
}

const props = withDefaults(defineProps<Props>(), {
  colormap: 'diverging'
})

const emit = defineEmits<Emits>()

// Reactive state
const mainCanvas = ref<HTMLCanvasElement>()
const histogramCanvas = ref<HTMLCanvasElement>()
const selectedColormap = ref(props.colormap)
const zoomLevel = ref(1)
const showGrid = ref(false)
const hasChanges = ref(false)
const lastUpdate = ref<number | null>(null)

// Canvas dimensions
const canvasSize = 420 // 28x28 * 15 for much better visibility
const pixelSize = canvasSize / 28

// Pan and zoom state
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const panOffset = ref({ x: 0, y: 0 })

// Hover state
const hoveredPixel = ref<{
  x: number
  y: number
  row: number
  col: number
  value: number
  normalized: number
} | null>(null)

// Working copy of neuron weights
const workingWeights = ref<number[]>([...props.neuron.weights])

// Computed properties
const getClassLabel = (classId: number): string => {
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  return labels[classId] || `Class ${classId}`
}

const getNeuronWeightNorm = (neuron: NDNeuron): number => {
  return Math.sqrt(neuron.weights.reduce((sum, w) => sum + w * w, 0))
}

const getAverageWeight = (neuron: NDNeuron): number => {
  return neuron.weights.reduce((sum, w) => sum + w, 0) / neuron.weights.length
}

const getWeightStandardDeviation = (neuron: NDNeuron): number => {
  const mean = getAverageWeight(neuron)
  const variance = neuron.weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / neuron.weights.length
  return Math.sqrt(variance)
}

// Statistical functions
function calculateSkewness(weights: number[]): number {
  const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length
  const std = Math.sqrt(weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length)
  const skewness = weights.reduce((sum, w) => sum + Math.pow((w - mean) / std, 3), 0) / weights.length
  return skewness
}

function calculateKurtosis(weights: number[]): number {
  const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length
  const std = Math.sqrt(weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length)
  const kurtosis = weights.reduce((sum, w) => sum + Math.pow((w - mean) / std, 4), 0) / weights.length - 3
  return kurtosis
}

// Event handlers
function handleBackdropClick() {
  close()
}

function close() {
  emit('close')
}

function zoomIn() {
  zoomLevel.value = Math.min(8, zoomLevel.value * 1.5)
}

function zoomOut() {
  zoomLevel.value = Math.max(1, zoomLevel.value / 1.5)
}

function resetView() {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
}

function toggleGrid() {
  showGrid.value = !showGrid.value
  updateVisualization()
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  if (event.deltaY < 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

function startPan(event: MouseEvent) {
  isPanning.value = true
  panStart.value = { x: event.clientX, y: event.clientY }
}

function handlePan(event: MouseEvent) {
  if (isPanning.value) {
    const deltaX = event.clientX - panStart.value.x
    const deltaY = event.clientY - panStart.value.y
    panOffset.value = { x: deltaX, y: deltaY }
  }
  
  // Update hover tooltip
  updateHoverTooltip(event)
}

function endPan() {
  isPanning.value = false
}

function updateHoverTooltip(event: MouseEvent) {
  if (!mainCanvas.value) return
  
  const rect = mainCanvas.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / zoomLevel.value
  const y = (event.clientY - rect.top) / zoomLevel.value
  
  const col = Math.floor(x / pixelSize)
  const row = Math.floor(y / pixelSize)
  
  if (row >= 0 && row < 28 && col >= 0 && col < 28) {
    const index = row * 28 + col
    const value = workingWeights.value[index]
    const min = Math.min(...workingWeights.value)
    const max = Math.max(...workingWeights.value)
    const normalized = (value - min) / (max - min)
    
    hoveredPixel.value = {
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      row,
      col,
      value,
      normalized
    }
  } else {
    hoveredPixel.value = null
  }
}

// Weight manipulation functions
function resetWeights() {
  workingWeights.value = new Array(784).fill(0)
  hasChanges.value = true
  updateVisualization()
}

function randomizeWeights() {
  workingWeights.value = Array.from({ length: 784 }, () => (Math.random() - 0.5) * 0.5)
  hasChanges.value = true
  updateVisualization()
}

function normalizeWeights() {
  const norm = Math.sqrt(workingWeights.value.reduce((sum, w) => sum + w * w, 0))
  if (norm > 0) {
    workingWeights.value = workingWeights.value.map(w => w / norm)
    hasChanges.value = true
    updateVisualization()
  }
}

function applyChanges() {
  const updatedNeuron = { ...props.neuron, weights: [...workingWeights.value] }
  emit('update-neuron', updatedNeuron)
  hasChanges.value = false
  lastUpdate.value = Date.now()
}

function exportImage() {
  if (!mainCanvas.value) return
  
  const link = document.createElement('a')
  link.download = `class_${props.neuron.id}_weights.png`
  link.href = mainCanvas.value.toDataURL()
  link.click()
}

// Visualization functions
function updateVisualization() {
  nextTick(() => {
    renderWeightCanvas()
    renderHistogram()
  })
}

function renderWeightCanvas() {
  if (!mainCanvas.value) return
  
  const canvas = mainCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Get weight statistics
  const weights = workingWeights.value
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 0.001
  
  // Render weight pixels
  for (let row = 0; row < 28; row++) {
    for (let col = 0; col < 28; col++) {
      const index = row * 28 + col
      const weight = weights[index]
      const normalized = (weight - minWeight) / range
      
      const x = col * pixelSize
      const y = row * pixelSize
      
      ctx.fillStyle = getColorForValue(normalized, selectedColormap.value)
      ctx.fillRect(x, y, pixelSize, pixelSize)
    }
  }
  
  // Draw grid if enabled
  if (showGrid.value) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 0.5
    
    for (let i = 0; i <= 28; i++) {
      ctx.beginPath()
      ctx.moveTo(i * pixelSize, 0)
      ctx.lineTo(i * pixelSize, canvas.height)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i * pixelSize)
      ctx.lineTo(canvas.width, i * pixelSize)
      ctx.stroke()
    }
  }
}

function renderHistogram() {
  if (!histogramCanvas.value) return
  
  const canvas = histogramCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const weights = workingWeights.value
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 0.001
  
  // Create histogram bins
  const numBins = 50
  const bins = new Array(numBins).fill(0)
  
  weights.forEach(weight => {
    const binIndex = Math.floor(((weight - minWeight) / range) * (numBins - 1))
    bins[Math.max(0, Math.min(numBins - 1, binIndex))]++
  })
  
  const maxBinCount = Math.max(...bins)
  const binWidth = canvas.width / numBins
  const canvasHeight = canvas.height - 20
  
  // Draw histogram bars
  ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'
  bins.forEach((count, i) => {
    const barHeight = (count / maxBinCount) * canvasHeight
    const x = i * binWidth
    const y = canvas.height - barHeight - 10
    
    ctx.fillRect(x, y, binWidth - 1, barHeight)
  })
  
  // Draw axes
  ctx.strokeStyle = 'rgba(156, 163, 175, 1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - 10)
  ctx.lineTo(canvas.width, canvas.height - 10)
  ctx.stroke()
}

function getColorForValue(normalized: number, colormap: string): string {
  // Clamp value between 0 and 1
  const value = Math.max(0, Math.min(1, normalized))
  
  switch (colormap) {
    case 'diverging':
      if (value < 0.5) {
        const t = value * 2
        return `rgb(${Math.floor(255 * (1 - t))}, ${Math.floor(255 * (1 - t))}, 255)`
      } else {
        const t = (value - 0.5) * 2
        return `rgb(255, ${Math.floor(255 * (1 - t))}, ${Math.floor(255 * (1 - t))})`
      }
    
    case 'viridis':
      const r = Math.floor(255 * (0.267 + 0.004 * value))
      const g = Math.floor(255 * (0.005 + 0.803 * value))
      const b = Math.floor(255 * (0.334 + 0.659 * value))
      return `rgb(${r}, ${g}, ${b})`
    
    case 'plasma':
      const pr = Math.floor(255 * (0.050 + 0.950 * value))
      const pg = Math.floor(255 * (0.030 + 0.570 * value))
      const pb = Math.floor(255 * (0.530 + 0.470 * value))
      return `rgb(${pr}, ${pg}, ${pb})`
    
    case 'grayscale':
      const gray = Math.floor(255 * value)
      return `rgb(${gray}, ${gray}, ${gray})`
    
    case 'hot':
      if (value < 0.33) {
        const t = value / 0.33
        return `rgb(${Math.floor(255 * t)}, 0, 0)`
      } else if (value < 0.66) {
        const t = (value - 0.33) / 0.33
        return `rgb(255, ${Math.floor(255 * t)}, 0)`
      } else {
        const t = (value - 0.66) / 0.34
        return `rgb(255, 255, ${Math.floor(255 * t)})`
      }
    
    default:
      return `rgb(${Math.floor(255 * value)}, ${Math.floor(255 * value)}, ${Math.floor(255 * value)})`
  }
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000) return 'now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

// Watchers
watch(() => props.isVisible, (visible) => {
  if (visible) {
    workingWeights.value = [...props.neuron.weights]
    hasChanges.value = false
    nextTick(() => {
      updateVisualization()
    })
  }
})

watch(() => props.neuron.weights, (newWeights) => {
  if (!hasChanges.value) {
    workingWeights.value = [...newWeights]
    updateVisualization()
  }
}, { deep: true })

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (!props.isVisible) return
  
  switch (event.key) {
    case 'Escape':
      close()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetView()
      break
    case 'g':
      toggleGrid()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  updateVisualization()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.weight-visualization-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: rgb(var(--bg-primary));
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 95vw;
  max-height: 95vh;
  width: 1400px;
  height: 900px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgb(var(--border-primary));
  background: rgb(var(--bg-secondary));
}

.header-info h2 {
  margin: 0 0 4px 0;
  color: rgb(var(--text-primary));
  font-size: 20px;
  font-weight: 600;
}

.header-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: rgb(var(--text-secondary));
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  padding: 6px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
  color: rgb(var(--text-secondary));
}

.colormap-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.colormap-selector select {
  padding: 4px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  font-size: 11px;
}

.close-btn {
  padding: 8px;
  background: none;
  border: none;
  color: rgb(var(--text-secondary));
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgb(var(--bg-tertiary));
  color: rgb(var(--text-primary));
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 24px;
}

.visualization-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  height: 100%;
}

.main-canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(var(--bg-secondary));
  border-radius: 8px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  cursor: grab;
  transition: transform 0.2s ease;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.weight-canvas-main {
  border: 2px solid rgb(var(--border-primary));
  border-radius: 4px;
  background: white;
  image-rendering: pixelated;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.pixel-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.canvas-controls {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.control-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: white;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.stats-section,
.histogram-section,
.legend-section,
.actions-section {
  background: rgb(var(--bg-secondary));
  border-radius: 8px;
  padding: 16px;
}

.stats-section h3,
.histogram-section h3,
.legend-section h3,
.actions-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.stat-label {
  color: rgb(var(--text-secondary));
}

.stat-value {
  color: rgb(var(--text-primary));
  font-weight: 500;
}

.histogram-canvas {
  width: 100%;
  height: 160px;
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  background: rgb(var(--bg-tertiary));
}

.histogram-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
}

.hist-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hist-label {
  color: rgb(var(--text-secondary));
}

.hist-value {
  color: rgb(var(--text-primary));
  font-weight: 500;
}

.colormap-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-gradient {
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgb(var(--border-primary));
}

.diverging-gradient {
  background: linear-gradient(to right, #0000ff, #ffffff, #ff0000);
}

.viridis-gradient {
  background: linear-gradient(to right, #440154, #31688e, #35b779, #fde725);
}

.plasma-gradient {
  background: linear-gradient(to right, #0d0887, #7e03a8, #cc4778, #f89441, #f0f921);
}

.grayscale-gradient {
  background: linear-gradient(to right, #000000, #ffffff);
}

.hot-gradient {
  background: linear-gradient(to right, #000000, #ff0000, #ffff00, #ffffff);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgb(var(--text-secondary));
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  background: rgb(var(--bg-tertiary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.action-btn.reset:hover {
  border-color: rgb(var(--color-warning));
}

.action-btn.randomize:hover {
  border-color: rgb(var(--color-info));
}

.action-btn.normalize:hover {
  border-color: rgb(var(--color-success));
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid rgb(var(--border-primary));
  background: rgb(var(--bg-secondary));
}

.footer-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgb(var(--text-secondary));
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.footer-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn.secondary {
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  color: rgb(var(--text-primary));
}

.footer-btn.secondary:hover {
  background: rgb(var(--bg-quaternary));
}

.footer-btn.primary {
  background: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  color: white;
}

.footer-btn.primary:hover:not(:disabled) {
  background: rgb(var(--color-primary-dark));
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content {
    width: 95vw;
    height: 90vh;
  }
  
  .visualization-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .side-panel {
    max-height: 300px;
  }
}
</style>