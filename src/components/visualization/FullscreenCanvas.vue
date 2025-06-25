<template>
  <div v-if="isVisible" class="fullscreen-canvas-overlay">
    <!-- Compact Toolbar -->
    <div class="toolbar">
      <!-- Top Section - Main Controls -->
      <div class="toolbar-section">
        <button
          @click="$emit('close')"
          class="toolbar-btn close-btn"
          title="Exit Fullscreen (Esc)"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button
          @click="store.showBoundaries = !store.showBoundaries"
          :class="['toolbar-btn', { active: store.showBoundaries }]"
          title="Toggle Decision Boundaries"
        >
          <Square3Stack3DIcon class="w-4 h-4" />
        </button>
        
        <button
          @click="store.showDataPoints = !store.showDataPoints"
          :class="['toolbar-btn', { active: store.showDataPoints }]"
          title="Toggle Data Points"
        >
          <ChartLineIcon class="w-4 h-4" />
        </button>
        
        <button
          @click="store.showPredictedColors = !store.showPredictedColors"
          :class="['toolbar-btn', { active: store.showPredictedColors }]"
          title="Toggle Predicted Colors"
        >
          <EyeIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Grid Controls -->
      <div class="toolbar-section">
        <div class="toolbar-label">Grid</div>
        <input
          v-model.number="store.gridSize"
          type="range"
          min="25"
          max="200"
          step="5"
          class="toolbar-slider"
          title="Grid Size"
        />
        <span class="toolbar-value">{{ store.gridSize }}</span>
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
          <button @click="setCoordinatePreset('standard')" class="preset-btn" title="[-1, 1]">±1</button>
          <button @click="setCoordinatePreset('extended')" class="preset-btn" title="[-5, 5]">±5</button>
          <button @click="setCoordinatePreset('large')" class="preset-btn" title="[-10, 10]">±10</button>
          <button @click="autoFitToData" class="preset-btn auto-fit" title="Auto-fit to Data">Auto</button>
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
        <button
          @click="store.removeLastNeuron()"
          :disabled="store.neurons.length === 0"
          class="toolbar-btn action-btn"
          title="Remove Last Neuron"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
        
        <button
          @click="runGradientDescent"
          :disabled="store.neurons.length === 0 || store.filteredDataPoints.length === 0"
          class="toolbar-btn action-btn"
          title="Run Gradient Descent"
        >
          <RocketLaunchIcon class="w-4 h-4" />
        </button>
        
        <button
          @click="store.reset()"
          class="toolbar-btn reset-btn"
          title="Reset Everything"
        >
          <ArrowPathIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main Canvas Area -->
    <div class="canvas-container">
      <NeuralCanvas :fullscreen="true" />
      
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { 
  XMarkIcon, 
  Square3Stack3DIcon, 
  ChartLineIcon, 
  EyeIcon, 
  TrashIcon, 
  RocketLaunchIcon, 
  ArrowPathIcon 
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import NeuralCanvas from './NeuralCanvas.vue'

interface Props {
  isVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

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

function runGradientDescent() {
  notificationStore.addNotification({
    message: 'Gradient descent started',
    type: 'info',
    duration: 2000
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
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
  background: #1a1a1a;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* Photoshop-style Toolbar */
.toolbar {
  background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
  border-bottom: 1px solid #1a1a1a;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 6px;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.toolbar-btn.active {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.close-btn {
  background: #ff4444;
  border-color: #ff4444;
  color: white;
}

.close-btn:hover {
  background: #ff6666;
}

.action-btn {
  background: #00aa44;
  border-color: #00aa44;
  color: white;
}

.action-btn:hover {
  background: #00cc55;
}

.reset-btn {
  background: #ff8800;
  border-color: #ff8800;
  color: white;
}

.reset-btn:hover {
  background: #ffaa33;
}

.toolbar-label {
  font-size: 11px;
  color: #ccc;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 35px;
}

.toolbar-slider {
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.toolbar-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #0066cc;
  border-radius: 50%;
  cursor: pointer;
}

.toolbar-value {
  font-size: 11px;
  color: #ccc;
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  text-align: center;
}

.toolbar-input:focus {
  outline: none;
  border-color: #0066cc;
  background: rgba(0, 102, 204, 0.1);
}

.toolbar-select {
  padding: 3px 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 11px;
  cursor: pointer;
}

.toolbar-select:focus {
  outline: none;
  border-color: #0066cc;
}

.preset-buttons {
  display: flex;
  gap: 2px;
}

.preset-btn {
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: #e0e0e0;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.auto-fit {
  background: #0066cc;
  border-color: #0066cc;
  color: white;
}

.auto-fit:hover {
  background: #0080ff;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #0f0f0f;
}

/* Stats Overlay */
.stats-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #aaa;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #fff;
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
  color: #888;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 10px;
  font-family: monospace;
  color: #ccc;
}
</style> 