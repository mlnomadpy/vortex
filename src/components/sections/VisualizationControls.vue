<template>
  <!-- Compact Visualization Toolbar -->
  <div class="viz-toolbar mb-4">
    <!-- View Controls -->
    <div class="toolbar-section">
      <div class="section-label">
        <EyeIcon class="w-4 h-4" />
        <span>View</span>
      </div>
      <div class="controls-row">
        <button 
          @click="toggleColorMode"
          :class="['compact-btn', store.showPredictedColors ? 'active' : '']"
          title="Toggle Color Mode"
        >
          <EyeIcon class="w-3 h-3" />
          <span class="btn-text">{{ store.showPredictedColors ? 'Predicted' : 'Actual' }}</span>
        </button>
        
        <button 
          @click="toggleBoundaries"
          :class="['compact-btn', store.showBoundaries ? 'active' : '']"
          title="Toggle Decision Boundaries"
        >
          <Square3Stack3DIcon class="w-3 h-3" />
          <span class="btn-text">Boundaries</span>
        </button>
        
        <button 
          @click="toggleDataPoints"
          :class="['compact-btn', store.showDataPoints ? 'active' : '']"
          title="Toggle Data Points"
        >
          <ChartLineIcon class="w-3 h-3" />
          <span class="btn-text">Points</span>
        </button>
        
        <button 
          @click="toggleFullscreen"
          class="compact-btn"
          title="Open Fullscreen"
        >
          <CurveIcon class="w-3 h-3" />
          <span class="btn-text">Fullscreen</span>
        </button>
        
        <button 
          @click="resetView"
          class="compact-btn warning"
          title="Reset View"
        >
          <ArrowPathIcon class="w-3 h-3" />
          <span class="btn-text">Reset</span>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Grid Controls -->
    <div class="toolbar-section">
      <div class="section-label">
        <Square3Stack3DIcon class="w-4 h-4" />
        <span>Grid</span>
      </div>
      <div class="controls-row">
        <div class="slider-control">
          <label class="slider-label">Density</label>
          <input
            v-model.number="store.gridSize"
            type="range"
            min="10"
            max="150"
            step="5"
            class="compact-slider"
            title="Grid Density"
          />
          <span class="slider-value">{{ store.gridSize }}</span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Coordinate Controls -->
    <div class="toolbar-section">
      <div class="section-label">
        <CogIcon class="w-4 h-4" />
        <span>Range</span>
      </div>
      <div class="controls-row">
        <div class="coord-inputs">
          <div class="coord-pair">
            <span class="coord-label">X</span>
            <input
              v-model.number="store.coordinateRanges.xMin"
              type="number"
              step="0.1"
              class="coord-input"
              placeholder="Min"
              title="X Minimum"
              @change="validateRanges"
            />
            <input
              v-model.number="store.coordinateRanges.xMax"
              type="number"
              step="0.1"
              class="coord-input"
              placeholder="Max"
              title="X Maximum"
              @change="validateRanges"
            />
          </div>
          <div class="coord-pair">
            <span class="coord-label">Y</span>
            <input
              v-model.number="store.coordinateRanges.yMin"
              type="number"
              step="0.1"
              class="coord-input"
              placeholder="Min"
              title="Y Minimum"
              @change="validateRanges"
            />
            <input
              v-model.number="store.coordinateRanges.yMax"
              type="number"
              step="0.1"
              class="coord-input"
              placeholder="Max"
              title="Y Maximum"
              @change="validateRanges"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Presets -->
    <div class="toolbar-section">
      <div class="section-label">
        <CogIcon class="w-4 h-4" />
        <span>Presets</span>
      </div>
      <div class="controls-row">
        <button
          @click="setCoordinatePreset('standard')"
          class="preset-btn"
          title="[-1, 1]"
        >
          ±1
        </button>
        <button
          @click="setCoordinatePreset('extended')"
          class="preset-btn"
          title="[-5, 5]"
        >
          ±5
        </button>
        <button
          @click="setCoordinatePreset('large')"
          class="preset-btn"
          title="[-10, 10]"
        >
          ±10
        </button>
        <button
          @click="setCoordinatePreset('positive')"
          class="preset-btn"
          title="[0, 10]"
        >
          0-10
        </button>
        <button
          @click="autoFitToData"
          class="preset-btn auto-fit"
          title="Auto-fit to Data"
        >
          Auto
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, Square3Stack3DIcon, ArrowPathIcon, ChartLineIcon, CurveIcon, CogIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

function toggleColorMode() {
  store.showPredictedColors = !store.showPredictedColors
}

function toggleBoundaries() {
  store.showBoundaries = !store.showBoundaries
}

function toggleDataPoints() {
  store.showDataPoints = !store.showDataPoints
  
  notificationStore.addNotification({
    message: store.showDataPoints ? 'Data points shown' : 'Data points hidden',
    type: 'success',
    duration: 2000
  })
}

function validateRanges() {
  // Ensure min values are less than max values
  if (store.coordinateRanges.xMin >= store.coordinateRanges.xMax) {
    store.coordinateRanges.xMax = store.coordinateRanges.xMin + 0.1
  }
  if (store.coordinateRanges.yMin >= store.coordinateRanges.yMax) {
    store.coordinateRanges.yMax = store.coordinateRanges.yMin + 0.1
  }
  
  notificationStore.addNotification({
    message: 'Coordinate ranges updated',
    type: 'success',
    duration: 2000
  })
}

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
    case 'positive':
      store.coordinateRanges.xMin = 0
      store.coordinateRanges.xMax = 10
      store.coordinateRanges.yMin = 0
      store.coordinateRanges.yMax = 10
      break
  }
  
  notificationStore.addNotification({
    message: `Coordinate range set to ${preset}`,
    type: 'success',
    duration: 2000
  })
}

function autoFitToData() {
  if (store.dataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'No data points available to fit',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  // Find min/max values in the data
  const xValues = store.dataPoints.map(p => p.x)
  const yValues = store.dataPoints.map(p => p.y)
  
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  
  // Add some padding (10% on each side)
  const xPadding = (xMax - xMin) * 0.1
  const yPadding = (yMax - yMin) * 0.1
  
  store.coordinateRanges.xMin = Math.round((xMin - xPadding) * 100) / 100
  store.coordinateRanges.xMax = Math.round((xMax + xPadding) * 100) / 100
  store.coordinateRanges.yMin = Math.round((yMin - yPadding) * 100) / 100
  store.coordinateRanges.yMax = Math.round((yMax + yPadding) * 100) / 100
  
  notificationStore.addNotification({
    message: 'Coordinate ranges auto-fitted to data',
    type: 'success',
    duration: 3000
  })
}

function toggleFullscreen() {
  // Emit event to parent component to handle fullscreen
  // This will be handled by the parent component
  const event = new CustomEvent('toggle-fullscreen')
  window.dispatchEvent(event)
  
  notificationStore.addNotification({
    message: 'Opening fullscreen view...',
    type: 'info',
    duration: 2000
  })
}

function resetView() {
  store.reset()
  
  notificationStore.addNotification({
    message: 'View reset successfully!',
    type: 'success'
  })
}
</script>

<style scoped>
/* Compact Visualization Toolbar */
.viz-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-height: 28px;
  overflow-x: auto;
  white-space: nowrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  font-size: 8px;
  font-weight: 500;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.1s ease;
  white-space: nowrap;
  min-height: 18px;
  flex-shrink: 0;
}

.compact-btn:hover {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-tertiary));
}

.compact-btn.active {
  background: rgb(var(--color-primary));
  color: white;
  border-color: rgb(var(--color-primary));
}

.compact-btn.warning {
  background: rgb(var(--color-warning));
  color: white;
  border-color: rgb(var(--color-warning));
}

.compact-btn.warning:hover {
  background: rgb(var(--color-warning-hover));
  border-color: rgb(var(--color-warning-hover));
}

.btn-text {
  font-size: 7px;
  font-weight: 500;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.slider-label {
  font-size: 7px;
  font-weight: 500;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.compact-slider {
  width: 50px;
  height: 3px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.compact-slider::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.compact-slider::-webkit-slider-thumb:hover {
  background: rgb(var(--color-primary-hover));
  transform: scale(1.1);
}

.compact-slider::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--color-primary));
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.compact-slider::-moz-range-thumb:hover {
  background: rgb(var(--color-primary-hover));
  transform: scale(1.1);
}

.slider-value {
  font-size: 7px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  min-width: 16px;
  text-align: center;
}

.coord-inputs {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.coord-pair {
  display: flex;
  align-items: center;
  gap: 1px;
}

.coord-label {
  font-size: 7px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  min-width: 6px;
}

.coord-input {
  width: 24px;
  padding: 1px 2px;
  font-size: 7px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  text-align: center;
}

.coord-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 1px rgb(var(--color-primary) / 0.2);
}

.preset-btn {
  padding: 2px 3px;
  font-size: 7px;
  font-weight: 500;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.1s ease;
  min-width: 18px;
  flex-shrink: 0;
}

.preset-btn:hover {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-tertiary));
}

.preset-btn.auto-fit {
  background: rgb(var(--color-success));
  color: white;
  border-color: rgb(var(--color-success));
}

.preset-btn.auto-fit:hover {
  background: rgb(var(--color-success-hover));
  border-color: rgb(var(--color-success-hover));
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: rgb(var(--border-secondary));
  margin: 0 1px;
  flex-shrink: 0;
}

/* Custom scrollbar */
.viz-toolbar::-webkit-scrollbar {
  height: 3px;
}

.viz-toolbar::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
}

.viz-toolbar::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 2px;
}

.viz-toolbar::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}

/* Keep single line on all screen sizes */
@media (max-width: 768px) {
  .viz-toolbar {
    gap: 4px;
    padding: 2px 4px;
    min-height: 24px;
  }
  
  .toolbar-section {
    gap: 2px;
  }
  
  .compact-btn {
    padding: 1px 3px;
    min-height: 16px;
  }
  
  .btn-text {
    font-size: 6px;
  }
  
  .section-label {
    font-size: 7px;
  }
  
  .coord-input {
    width: 20px;
    font-size: 6px;
  }
  
  .compact-slider {
    width: 40px;
  }
  
  .preset-btn {
    min-width: 16px;
    font-size: 6px;
  }
  
  .toolbar-divider {
    height: 12px;
  }
}
</style>
