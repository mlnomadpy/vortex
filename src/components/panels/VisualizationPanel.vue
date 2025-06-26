<template>
  <FloatingPanel 
    title="Visualization" 
    :icon="EyeIcon"
    :width="260"
    :initial-position="{ x: 320, y: 80 }"
  >
    <!-- View Controls -->
    <div class="panel-section">
      <div class="section-header">
        <EyeIcon class="section-icon" />
        <span class="section-title">Display</span>
      </div>
      
      <div class="view-controls">
        <!-- Toggle Buttons -->
        <div class="toggle-grid">
          <button 
            :class="['toggle-btn', { 'is-active': store.showPredictedColors }]"
            @click="toggleColorMode"
          >
            <component :is="PaletteIcon" class="toggle-icon" />
            <span class="toggle-label">Predicted Colors</span>
          </button>
          
          <button 
            :class="['toggle-btn', { 'is-active': store.showBoundaries }]"
            @click="toggleBoundaries"
          >
            <Square3Stack3DIcon class="toggle-icon" />
            <span class="toggle-label">Boundaries</span>
          </button>
          
          <button 
            :class="['toggle-btn', { 'is-active': store.showDataPoints }]"
            @click="toggleDataPoints"
          >
            <ChartLineIcon class="toggle-icon" />
            <span class="toggle-label">Data Points</span>
          </button>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-row">
          <Button 
            @click="toggleFullscreen"
            variant="outline"
            size="sm"
            class="action-btn"
          >
            <CurveIcon class="btn-icon" />
            Fullscreen
          </Button>
          
          <Button 
            @click="resetView"
            variant="destructive"
            size="sm"
            class="action-btn"
          >
            <ArrowPathIcon class="btn-icon" />
            Reset
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="panel-divider"></div>
    
    <!-- Grid Settings -->
    <div class="panel-section">
      <div class="section-header">
        <Square3Stack3DIcon class="section-icon" />
        <span class="section-title">Grid</span>
        <span class="grid-value">{{ store.gridSize }}</span>
      </div>
      
      <div class="grid-controls">
        <div class="slider-control">
          <div class="slider-header">
            <span class="slider-label">Density</span>
            <span class="slider-value">{{ store.gridSize }}</span>
          </div>
          <input
            v-model.number="store.gridSize"
            type="range"
            min="10"
            max="150"
            step="5"
            class="slider"
          />
          <div class="slider-marks">
            <span>10</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="panel-divider"></div>
    
    <!-- Coordinate System -->
    <div class="panel-section">
      <div class="section-header">
        <CogIcon class="section-icon" />
        <span class="section-title">Coordinate System</span>
      </div>
      
      <div class="coordinate-controls">
        <!-- Preset Buttons -->
        <div class="preset-row">
          <Button
            @click="setCoordinatePreset('standard')"
            variant="outline"
            size="xs"
            class="preset-btn"
          >
            ±1
          </Button>
          <Button
            @click="setCoordinatePreset('extended')"
            variant="outline"
            size="xs"
            class="preset-btn"
          >
            ±5
          </Button>
          <Button
            @click="setCoordinatePreset('large')"
            variant="outline"
            size="xs"
            class="preset-btn"
          >
            ±10
          </Button>
          <Button
            @click="setCoordinatePreset('positive')"
            variant="outline"
            size="xs"
            class="preset-btn"
          >
            0-10
          </Button>
        </div>
        
        <!-- Manual Input -->
        <div class="coord-inputs">
          <div class="coord-group">
            <label class="coord-label">X Range</label>
            <div class="coord-pair">
              <input
                v-model.number="store.coordinateRanges.xMin"
                type="number"
                step="0.1"
                class="coord-input"
                placeholder="Min"
                @change="validateRanges"
              />
              <span class="coord-separator">to</span>
              <input
                v-model.number="store.coordinateRanges.xMax"
                type="number"
                step="0.1"
                class="coord-input"
                placeholder="Max"
                @change="validateRanges"
              />
            </div>
          </div>
          
          <div class="coord-group">
            <label class="coord-label">Y Range</label>
            <div class="coord-pair">
              <input
                v-model.number="store.coordinateRanges.yMin"
                type="number"
                step="0.1"
                class="coord-input"
                placeholder="Min"
                @change="validateRanges"
              />
              <span class="coord-separator">to</span>
              <input
                v-model.number="store.coordinateRanges.yMax"
                type="number"
                step="0.1"
                class="coord-input"
                placeholder="Max"
                @change="validateRanges"
              />
            </div>
          </div>
        </div>
        
        <!-- Auto Fit Button -->
        <Button
          @click="autoFitToData"
          variant="default"
          size="sm"
          class="auto-fit-btn"
        >
          <component :is="MagicWandIcon" class="btn-icon" />
          Auto Fit to Data
        </Button>
      </div>
    </div>
  </FloatingPanel>
</template>

<script setup lang="ts">
import { h } from 'vue'
import FloatingPanel from '@/components/ui/FloatingPanel.vue'
import { Button } from '@/components/ui'
import { 
  EyeIcon, 
  Square3Stack3DIcon, 
  ArrowPathIcon, 
  ChartLineIcon, 
  CurveIcon, 
  CogIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

// Create missing icons
const PaletteIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h4a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2z'
      })
    ])
  }
}

const MagicWandIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'm15.75 6 2.25 2.25-8.25 8.25L7.5 14.25M12 12l-2.25-2.25L12 7.5l2.25 2.25L12 12ZM21 12l-2.25-2.25L21 7.5l2.25 2.25L21 12ZM9 21l-2.25-2.25L9 16.5l2.25 2.25L9 21Z'
      })
    ])
  }
}

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

function toggleFullscreen() {
  // Implementation for fullscreen mode
  notificationStore.addNotification({
    message: 'Fullscreen mode not yet implemented',
    type: 'info'
  })
}

function resetView() {
  store.coordinateRanges.xMin = -1
  store.coordinateRanges.xMax = 1
  store.coordinateRanges.yMin = -1
  store.coordinateRanges.yMax = 1
  store.gridSize = 50
  
  notificationStore.addNotification({
    message: 'View reset to defaults',
    type: 'success'
  })
}

function validateRanges() {
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
    message: `Coordinate preset "${preset}" applied`,
    type: 'success'
  })
}

function autoFitToData() {
  if (store.dataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'No data points to fit to',
      type: 'warning'
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
  
  store.coordinateRanges.xMin = xMin - xPadding
  store.coordinateRanges.xMax = xMax + xPadding
  store.coordinateRanges.yMin = yMin - yPadding
  store.coordinateRanges.yMax = yMax + yPadding
  
  notificationStore.addNotification({
    message: 'View auto-fitted to data',
    type: 'success'
  })
}
</script>

<style scoped>
.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #464647;
}

.section-icon {
  width: 14px;
  height: 14px;
  color: #007acc;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  flex: 1;
}

.grid-value {
  font-size: 10px;
  color: #999999;
  background: #464647;
  padding: 2px 6px;
  border-radius: 8px;
}

.panel-divider {
  height: 1px;
  background: #464647;
  margin: 12px -8px;
}

/* Toggle Buttons */
.toggle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 8px;
}

.toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 9px;
  color: #999999;
}

.toggle-btn:hover {
  background: #404040;
  border-color: #666666;
}

.toggle-btn.is-active {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.toggle-icon {
  width: 14px;
  height: 14px;
}

.toggle-label {
  text-align: center;
  line-height: 1.2;
}

/* Action Buttons */
.action-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.action-btn {
  flex: 1;
  font-size: 10px;
  padding: 6px 8px;
  height: auto;
}

.btn-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
}

/* Slider Control */
.slider-control {
  margin-bottom: 8px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.slider-label {
  font-size: 10px;
  color: #cccccc;
  font-weight: 500;
}

.slider-value {
  font-size: 10px;
  color: #999999;
}

.slider {
  width: 100%;
  height: 4px;
  background: #555555;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin-bottom: 4px;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #007acc;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: #777777;
}

/* Coordinate Controls */
.preset-row {
  display: flex;
  gap: 3px;
  margin-bottom: 8px;
}

.preset-btn {
  flex: 1;
  font-size: 9px;
  padding: 4px 2px;
  height: auto;
}

.coord-inputs {
  margin-bottom: 8px;
}

.coord-group {
  margin-bottom: 6px;
}

.coord-label {
  display: block;
  font-size: 10px;
  color: #cccccc;
  margin-bottom: 3px;
  font-weight: 500;
}

.coord-pair {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coord-input {
  flex: 1;
  padding: 4px 6px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 3px;
  color: #cccccc;
  font-size: 10px;
  text-align: center;
}

.coord-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
}

.coord-separator {
  font-size: 9px;
  color: #777777;
}

.auto-fit-btn {
  width: 100%;
  font-size: 10px;
  padding: 6px 8px;
  height: auto;
}
</style> 