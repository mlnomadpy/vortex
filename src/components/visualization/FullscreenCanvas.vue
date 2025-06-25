<template>
  <div v-if="isVisible" class="fullscreen-canvas-overlay scroll-smooth momentum-scroll">
    <!-- Compact Toolbar -->
    <div class="toolbar">
      <!-- Top Section - Main Controls -->
      <div class="toolbar-section">
        <Button
          @click="$emit('close')"
          variant="destructive"
          size="icon-sm"
          title="Exit Fullscreen (Esc)"
        >
          <XMarkIcon class="w-4 h-4" />
        </Button>
        
        <div class="toolbar-divider"></div>
        
        <Button
          @click="toggleBoundaries"
          :variant="store.showBoundaries ? 'default' : 'outline'"
          size="icon-sm"
          title="Toggle Decision Boundaries (Reinitializes Grid)"
        >
          <Square3Stack3DIcon class="w-4 h-4" />
        </Button>
        
        <Button
          @click="toggleDataPoints"
          :variant="store.showDataPoints ? 'default' : 'outline'"
          size="icon-sm"
          title="Toggle Data Points"
        >
          <ChartLineIcon class="w-4 h-4" />
        </Button>
        
        <Button
          @click="togglePredictedColors"
          :variant="store.showPredictedColors ? 'default' : 'outline'"
          size="icon-sm"
          title="Toggle Predicted Colors"
        >
          <EyeIcon class="w-4 h-4" />
        </Button>
      </div>

      <!-- Grid Controls -->
      <div class="toolbar-section">
        <div class="toolbar-label">Grid</div>
        <input
          v-model.number="store.gridSize"
          type="range"
          min="10"
          max="150"
          step="5"
          class="toolbar-slider"
          title="Grid Density"
          @input="onGridSizeChange"
        />
        <span class="toolbar-value">{{ store.gridSize }}×{{ store.gridSize }}</span>
        
        <Button
          @click="reinitializeGrid"
          variant="outline"
          size="icon-sm"
          title="Force Grid Reinitialization"
          :disabled="!store.showBoundaries"
        >
          <ArrowPathIcon class="w-3 h-3" />
        </Button>
      </div>

      <!-- Coordinate Ranges -->
      <div class="toolbar-section">
        <div class="toolbar-label">Range</div>
        <div class="coordinate-inputs">
          <input
            v-model.number="store.coordinateRanges.xMin"
            type="number"
            step="0.1"
            class="toolbar-input"
            placeholder="X Min"
            title="X Minimum"
          />
          <input
            v-model.number="store.coordinateRanges.xMax"
            type="number"
            step="0.1"
            class="toolbar-input"
            placeholder="X Max"
            title="X Maximum"
          />
          <input
            v-model.number="store.coordinateRanges.yMin"
            type="number"
            step="0.1"
            class="toolbar-input"
            placeholder="Y Min"
            title="Y Minimum"
          />
          <input
            v-model.number="store.coordinateRanges.yMax"
            type="number"
            step="0.1"
            class="toolbar-input"
            placeholder="Y Max"
            title="Y Maximum"
          />
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="toolbar-section">
        <div class="toolbar-label">Presets</div>
        <div class="preset-buttons">
          <Button @click="setCoordinatePreset('standard')" variant="outline" size="xs" title="[-1, 1]">±1</Button>
          <Button @click="setCoordinatePreset('extended')" variant="outline" size="xs" title="[-5, 5]">±5</Button>
          <Button @click="setCoordinatePreset('large')" variant="outline" size="xs" title="[-10, 10]">±10</Button>
          <Button @click="autoFitToData" variant="default" size="xs" title="Auto-fit to Data">Auto</Button>
        </div>
      </div>

      <!-- Neural Network Settings -->
      <div class="toolbar-section">
        <div class="toolbar-label">Network</div>
        <select v-model="store.similarityMetric" class="toolbar-select" title="Similarity Metric">
          <option value="dotProduct">Dot Product</option>
          <option value="euclidean">Euclidean</option>
          <option value="myProduct">My Product</option>
        </select>
        <select v-model="store.activationFunction" class="toolbar-select" title="Activation Function">
          <option value="none">None</option>
          <option value="softmax">Softmax</option>
          <option value="softermax">Softermax</option>
          <option value="sigmoid">Sigmoid</option>
          <option value="relu">ReLU</option>
          <option value="gelu">GELU</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="toolbar-section">
        <Button
          @click="store.removeLastNeuron()"
          :disabled="store.neurons.length === 0"
          variant="destructive"
          size="icon-sm"
          title="Remove Last Neuron"
        >
          <TrashIcon class="w-4 h-4" />
        </Button>
        
        <Button
          @click="runGradientDescent"
          :disabled="store.neurons.length === 0 || store.filteredDataPoints.length === 0"
          variant="default"
          size="icon-sm"
          title="Run Gradient Descent"
        >
          <RocketLaunchIcon class="w-4 h-4" />
        </Button>
        
        <Button
          @click="store.reset()"
          variant="destructive"
          size="icon-sm"
          title="Reset Everything"
        >
          <ArrowPathIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Main Canvas Area -->
    <div class="canvas-container">
      <InteractiveCanvas
        ref="canvasComponent"
        :fullscreen="true"
        :show-instructions="false"
      />
      
      <!-- Grid Processing Indicator -->
      <div v-if="isGridProcessing" class="processing-overlay">
        <div class="processing-content">
          <div class="spinner"></div>
          <div class="processing-text">Reinitializing Grid...</div>
        </div>
      </div>
      
      <!-- Fullscreen Stats Overlay -->
      <div class="stats-overlay">
        <div class="stat-item">
          <span class="stat-label">Accuracy</span>
          <span class="stat-value">{{ store.accuracy.toFixed(1) }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Data Points</span>
          <span class="stat-value">{{ store.filteredDataPoints.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Neurons</span>
          <span class="stat-value">{{ store.neurons.length }}</span>
        </div>
        <div class="stat-item" v-if="store.showBoundaries">
          <span class="stat-label">Grid Cells</span>
          <span class="stat-value">{{ gridCellCount.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Active Classes</span>
          <span class="stat-value">{{ store.activeClasses.length }}</span>
        </div>
        <div class="stat-item" v-if="avgLoss !== null">
          <span class="stat-label">Avg Loss</span>
          <span class="stat-value">{{ avgLoss.toFixed(3) }}</span>
        </div>
      </div>
    </div>

    <!-- Help Overlay -->
    <div class="help-overlay">
      <div class="help-item">
        <kbd>Click</kbd> Add Neuron
      </div>
      <div class="help-item">
        <kbd>Esc</kbd> Exit Fullscreen
      </div>
      <div class="help-item">
        <kbd>R</kbd> Reinitialize Grid
      </div>
      <div class="help-item">
        <kbd>B</kbd> Toggle Boundaries
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { 
  XMarkIcon, 
  Square3Stack3DIcon, 
  ChartLineIcon, 
  EyeIcon, 
  TrashIcon, 
  RocketLaunchIcon, 
  ArrowPathIcon 
} from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import InteractiveCanvas from './InteractiveCanvas.vue'

interface Props {
  isVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

// Reactive state
const isGridProcessing = ref(false)

// Reference to the interactive canvas component
const canvasComponent = ref<InstanceType<typeof InteractiveCanvas> | null>(null)

// Computed properties for stats
const gridCellCount = computed(() => store.gridSize * store.gridSize)

const avgLoss = computed(() => {
  if (store.filteredDataPoints.length === 0 || store.neurons.length === 0) {
    return null
  }
  return store.computeLoss(store.filteredDataPoints)
})

function setCoordinatePreset(preset: string) {
  switch (preset) {
    case 'standard':
      store.coordinateRanges.xMin = -1
      store.coordinateRanges.xMax = 1
      store.coordinateRanges.yMin = -1
      store.coordinateRanges.yMax = 1
      break
    case 'extended':
      store.coordinateRanges.xMin = -5
      store.coordinateRanges.xMax = 5
      store.coordinateRanges.yMin = -5
      store.coordinateRanges.yMax = 5
      break
    case 'large':
      store.coordinateRanges.xMin = -10
      store.coordinateRanges.xMax = 10
      store.coordinateRanges.yMin = -10
      store.coordinateRanges.yMax = 10
      break
  }
  
  notificationStore.addNotification({
    message: `Range set to ${preset}`,
    type: 'success',
    duration: 2000
  })
}

function autoFitToData() {
  if (store.dataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'No data points available',
      type: 'warning',
      duration: 2000
    })
    return
  }
  
  const xValues = store.dataPoints.map(p => p.x)
  const yValues = store.dataPoints.map(p => p.y)
  
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  
  const xPadding = (xMax - xMin) * 0.1
  const yPadding = (yMax - yMin) * 0.1
  
  store.coordinateRanges.xMin = Math.round((xMin - xPadding) * 100) / 100
  store.coordinateRanges.xMax = Math.round((xMax + xPadding) * 100) / 100
  store.coordinateRanges.yMin = Math.round((yMin - yPadding) * 100) / 100
  store.coordinateRanges.yMax = Math.round((yMax + yPadding) * 100) / 100
  
  notificationStore.addNotification({
    message: 'Auto-fitted to data',
    type: 'success',
    duration: 2000
  })
}

function toggleBoundaries() {
  const wasEnabled = store.showBoundaries
  store.showBoundaries = !store.showBoundaries
  
  if (!wasEnabled && store.showBoundaries) {
    // When turning boundaries ON, show notification about reinitialization
    notificationStore.addNotification({
      message: 'Decision boundaries enabled - Grid will reinitialize automatically',
      type: 'info',
      duration: 3000
    })
  }
}

function toggleDataPoints() {
  store.showDataPoints = !store.showDataPoints
  
  notificationStore.addNotification({
    message: store.showDataPoints ? 'Data points shown' : 'Data points hidden',
    type: 'success',
    duration: 2000
  })
}

function togglePredictedColors() {
  store.showPredictedColors = !store.showPredictedColors
  
  notificationStore.addNotification({
    message: store.showPredictedColors ? 'Showing predicted colors' : 'Showing true colors',
    type: 'success',
    duration: 2000
  })
}

function onGridSizeChange() {
  // Provide feedback when grid size changes
  if (store.showBoundaries) {
    notificationStore.addNotification({
      message: `Grid density: ${store.gridSize}×${store.gridSize} (${store.gridSize * store.gridSize} cells)`,
      type: 'info',
      duration: 2000
    })
  }
}

function reinitializeGrid() {
  if (!store.showBoundaries) {
    notificationStore.addNotification({
      message: 'Enable decision boundaries first to use grid reinitialization',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  // Show processing indicator
  isGridProcessing.value = true
  
  // Force a reinitialization by toggling boundaries twice
  store.showBoundaries = false
  setTimeout(() => {
    store.showBoundaries = true
    notificationStore.addNotification({
      message: 'Grid manually reinitialized',
      type: 'success',
      duration: 2000
    })
    
    // Hide processing indicator after a delay
    setTimeout(() => {
      isGridProcessing.value = false
    }, 1000)
  }, 100)
}

async function runGradientDescent() {
  if (store.neurons.length === 0 || store.filteredDataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'Cannot start optimization: need neurons and data points',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  notificationStore.addNotification({
    message: 'Gradient descent started',
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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  } else if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
    // R key for grid reinitialization
    event.preventDefault()
    reinitializeGrid()
  } else if (event.key.toLowerCase() === 'b' && !event.ctrlKey && !event.metaKey) {
    // B key for boundary toggle
    event.preventDefault()
    toggleBoundaries()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.fullscreen-canvas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* Photoshop-style Toolbar with theme support */
.toolbar {
  background: linear-gradient(to bottom, rgb(var(--bg-primary)), rgb(var(--bg-secondary)));
  border-bottom: 1px solid rgb(var(--border-primary));
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-medium);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgb(var(--bg-secondary) / 0.5);
  border-radius: 6px;
  border: 1px solid rgb(var(--border-secondary));
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgb(var(--border-primary));
  margin: 0 4px;
}

.toolbar-btn {
  background: rgb(var(--bg-secondary) / 0.5);
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  padding: 6px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgb(var(--bg-secondary));
  border-color: rgb(var(--border-primary));
}

.toolbar-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.close-btn {
  background: rgb(var(--color-error));
  border-color: rgb(var(--color-error));
  color: white;
}

.close-btn:hover {
  background: rgb(var(--color-error-hover));
}

.action-btn {
  background: rgb(var(--color-success));
  border-color: rgb(var(--color-success));
  color: white;
}

.action-btn:hover {
  background: rgb(var(--color-success-hover));
}

.reset-btn {
  background: rgb(var(--color-warning));
  border-color: rgb(var(--color-warning));
  color: white;
}

.reset-btn:hover {
  background: rgb(var(--color-warning-hover));
}

.toolbar-label {
  font-size: 11px;
  color: rgb(var(--text-secondary));
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 35px;
}

.toolbar-slider {
  width: 80px;
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.toolbar-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.toolbar-value {
  font-size: 11px;
  color: rgb(var(--text-secondary));
  min-width: 25px;
  text-align: center;
}

.coordinate-inputs {
  display: flex;
  gap: 3px;
}

.toolbar-input {
  width: 45px;
  padding: 2px 4px;
  background: rgb(var(--bg-primary) / 0.8);
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  text-align: center;
}

.toolbar-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  background: rgb(var(--color-primary) / 0.1);
}

.toolbar-select {
  padding: 3px 6px;
  background: rgb(var(--bg-primary) / 0.8);
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  cursor: pointer;
}

.toolbar-select:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
}

.preset-buttons {
  display: flex;
  gap: 2px;
}

.preset-btn {
  padding: 3px 6px;
  background: rgb(var(--bg-secondary) / 0.5);
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgb(var(--bg-secondary));
}

.auto-fit {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: white;
}

.auto-fit:hover {
  background: rgb(var(--color-primary-hover));
}

/* Canvas Container with theme support */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgb(var(--bg-primary));
}

/* Processing Overlay */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgb(0 0 0 / 0.8);
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgb(255 255 255 / 0.3);
  border-top: 3px solid rgb(var(--color-primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

/* Stats Overlay */
.stats-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgb(0 0 0 / 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.stat-label {
  font-size: 12px;
  color: rgb(var(--text-secondary));
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: rgb(var(--text-primary));
  font-weight: 700;
}

/* Help Overlay */
.help-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 16px;
}

.help-item {
  color: rgb(var(--text-secondary));
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  background: rgb(var(--bg-secondary) / 0.1);
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 10px;
  font-family: monospace;
  color: rgb(var(--text-primary));
}
</style> 