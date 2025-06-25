<template>
  <div class="control-card p-4 mb-6">
    <div class="flex flex-wrap items-center justify-center gap-4 mb-4">
      <button 
        @click="toggleColorMode"
        class="modern-button px-6 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 flex items-center"
      >
        <EyeIcon class="w-5 h-5 mr-2" />
        {{ store.showPredictedColors ? 'Show Actual' : 'Show Predicted' }}
      </button>
      
      <button 
        @click="toggleBoundaries"
        class="modern-button px-6 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 flex items-center"
      >
        <Square3Stack3DIcon class="w-5 h-5 mr-2" />
        {{ store.showBoundaries ? 'Hide Boundaries' : 'Show Boundaries' }}
      </button>
      
      <button 
        @click="toggleDataPoints"
        class="modern-button px-6 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 flex items-center"
      >
        <ChartLineIcon class="w-5 h-5 mr-2" />
        {{ store.showDataPoints ? 'Hide Data Points' : 'Show Data Points' }}
      </button>
      
      <button 
        @click="toggleFullscreen"
        class="modern-button px-6 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 flex items-center"
      >
        <CurveIcon class="w-5 h-5 mr-2" />
        Fullscreen
      </button>
      
      <button 
        @click="resetView"
        class="modern-button px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 flex items-center"
      >
        <ArrowPathIcon class="w-5 h-5 mr-2" />
        Reset View
      </button>
    </div>
    
    <!-- Grid Size Control -->
    <div class="flex flex-wrap items-center justify-center gap-6 mb-4">
      <div class="flex items-center gap-2">
        <label for="gridSize" class="text-sm font-medium text-gray-700">Grid Size:</label>
        <input
          id="gridSize"
          v-model.number="store.gridSize"
          type="range"
          min="25"
          max="200"
          step="5"
          class="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <span class="text-sm font-medium text-gray-600 min-w-[2rem]">{{ store.gridSize }}</span>
      </div>
    </div>

    <!-- Coordinate Range Controls -->
    <div class="border-t pt-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-3 text-center">Coordinate Ranges</h4>
      <div class="grid grid-cols-2 gap-4">
        <!-- X Range Controls -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-600 uppercase tracking-wide">X-Axis Range</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="xMin" class="block text-xs text-gray-500 mb-1">Min</label>
              <input
                id="xMin"
                v-model.number="store.coordinateRanges.xMin"
                type="number"
                step="0.1"
                class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                @change="validateRanges"
              />
            </div>
            <div>
              <label for="xMax" class="block text-xs text-gray-500 mb-1">Max</label>
              <input
                id="xMax"
                v-model.number="store.coordinateRanges.xMax"
                type="number"
                step="0.1"
                class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                @change="validateRanges"
              />
            </div>
          </div>
        </div>
        
        <!-- Y Range Controls -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-600 uppercase tracking-wide">Y-Axis Range</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="yMin" class="block text-xs text-gray-500 mb-1">Min</label>
              <input
                id="yMin"
                v-model.number="store.coordinateRanges.yMin"
                type="number"
                step="0.1"
                class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                @change="validateRanges"
              />
            </div>
            <div>
              <label for="yMax" class="block text-xs text-gray-500 mb-1">Max</label>
              <input
                id="yMax"
                v-model.number="store.coordinateRanges.yMax"
                type="number"
                step="0.1"
                class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                @change="validateRanges"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Preset Buttons -->
      <div class="flex flex-wrap justify-center gap-2 mt-3">
        <button
          @click="setCoordinatePreset('standard')"
          class="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          [-1, 1]
        </button>
        <button
          @click="setCoordinatePreset('extended')"
          class="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          [-5, 5]
        </button>
        <button
          @click="setCoordinatePreset('large')"
          class="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          [-10, 10]
        </button>
        <button
          @click="setCoordinatePreset('positive')"
          class="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          [0, 10]
        </button>
        <button
          @click="autoFitToData"
          class="px-3 py-1 text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
        >
          Auto-fit to Data
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, Square3Stack3DIcon, ArrowPathIcon, ChartLineIcon, CurveIcon } from '@/components/ui/icons'
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
/* Slider styles */
.slider {
  background: linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%);
}

.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}
</style>
