<template>
  <div class="control-card p-6 relative overflow-hidden">
    <div class="absolute top-4 right-4 z-10">
      <div class="flex items-center space-x-2 text-sm text-gray-600 bg-white/90 px-3 py-1 rounded-full">
        <CursorArrowRaysIcon class="w-4 h-4" />
        <span>Click to add neurons</span>
      </div>
    </div>
    
    <!-- SVG Canvas -->
    <svg
      ref="canvasRef"
      :width="config.width"
      :height="config.height"
      class="neural-canvas border border-gray-200 rounded-lg cursor-crosshair"
      style="max-width: 100%; height: auto;"
      @click="handleCanvasClick"
    >
      <!-- Define clipping path for grid -->
      <defs>
        <clipPath id="canvas-clip">
          <rect :width="config.width" :height="config.height" />
        </clipPath>
      </defs>
      
      <!-- Grid - Only render when needed and with reduced density -->
      <g v-if="shouldShowGrid && gridCells.length > 0" class="grid-group" clip-path="url(#canvas-clip)">
        <rect
          v-for="(cell, index) in visibleGridCells"
          :key="`grid-${index}`"
          :x="cell.x"
          :y="cell.y"
          :width="cellSize"
          :height="cellSize"
          :fill="getCellColor(cell)"
          stroke="rgba(200, 200, 200, 0.3)"
          stroke-width="0.5"
          class="cell grid-cell"
        />
      </g>
      
      <!-- Debug text when boundaries are disabled -->
      <text v-if="store.neurons.length > 0 && !store.showBoundaries" x="10" y="50" fill="orange" font-size="12" font-weight="bold">
        Enable "Show Boundaries" to see decision boundaries
      </text>
      
      <!-- Axes -->
      <g class="axes-group">
        <!-- X-axis -->
        <line :x1="0" :y1="config.height" :x2="config.width" :y2="config.height" stroke="#6b7280" stroke-width="1" />
        <!-- Y-axis -->
        <line :x1="0" :y1="0" :x2="0" :y2="config.height" stroke="#6b7280" stroke-width="1" />
      </g>
      
      <!-- Data Points - Rendered with higher z-index -->
      <g v-if="store.showDataPoints" class="data-points-group" style="z-index: 10;">
        <!-- Debug info -->
        <text v-if="store.filteredDataPoints.length === 0" x="10" y="30" fill="red" font-size="14" font-weight="bold">
          No data points visible ({{ store.dataPoints.length }} total, {{ store.filteredDataPoints.length }} filtered)
        </text>
        
        <!-- Render data points with better visibility -->
        <circle
          v-for="(point, index) in visibleDataPoints"
          :key="`point-${index}-${point.label}`"
          :cx="xScale(point.x)"
          :cy="yScale(point.y)"
          :r="6"
          :fill="getDataPointColor(point)"
          :stroke="getDataPointStroke(point)"
          stroke-width="2"
          fill-opacity="0.9"
          class="data-point"
          style="cursor: pointer; pointer-events: all;"
          @click="(event) => handleDataPointClick(event, point)"

        />
        
        <!-- Debug: Show count -->
        <text v-if="store.filteredDataPoints.length > 0" x="10" y="580" fill="blue" font-size="12" font-weight="bold">
          {{ store.filteredDataPoints.length }} data points loaded
        </text>
      </g>
      
      <!-- Neurons -->
      <g class="neurons-group">
        <path
          v-for="neuron in store.neurons"
          :key="`neuron-${neuron.id}`"
          :d="generateStarPath(xScale(neuron.x), yScale(neuron.y))"
          :fill="neuron.color"
          stroke="black"
          stroke-width="2"
          class="neuron"
          @click="(event) => handleNeuronClick(event, neuron)"
        />
      </g>
    </svg>
    
    <!-- Stats Card -->
    <div class="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[200px]">
      <div class="grid grid-cols-1 gap-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">Accuracy</span>
          <span class="metric-value">{{ store.accuracy.toFixed(1) }}%</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">Data Points</span>
          <span class="metric-value">{{ store.filteredDataPoints.length }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">Neurons</span>
          <span class="metric-value">{{ store.neurons.length }}</span>
        </div>
      </div>
    </div>

    <!-- Neuron Details Panel -->
    <div v-if="selectedNeuron" class="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[280px] max-w-[350px]">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-lg text-gray-800 flex items-center">
          <div class="w-4 h-4 mr-2 relative">
            <svg class="w-full h-full" viewBox="0 0 24 24">
              <path 
                :d="generateStarPath(12, 12, 8, 3)"
                :fill="selectedNeuron.color"
                stroke="black"
                stroke-width="1"
              />
            </svg>
          </div>
          Neuron {{ selectedNeuron.id }}
        </h3>
        <button @click="selectedNeuron = null" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3">
        <!-- Position Controls -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">X</label>
              <input
                v-model.number="selectedNeuron.x"
                type="number"
                step="0.01"
                :min="store.coordinateRanges.xMin"
                :max="store.coordinateRanges.xMax"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @change="updateNeuronPosition"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Y</label>
              <input
                v-model.number="selectedNeuron.y"
                type="number"
                step="0.01"
                :min="store.coordinateRanges.yMin"
                :max="store.coordinateRanges.yMax"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                @change="updateNeuronPosition"
              />
            </div>
          </div>
        </div>

        <!-- Color Control -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            v-model="selectedNeuron.color"
            type="color"
            class="w-full h-8 border border-gray-300 rounded cursor-pointer"
            @change="updateNeuronColor"
          />
        </div>

        <!-- Neuron Stats -->
        <div class="border-t pt-3">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">Controlled Area:</span>
              <span class="font-medium">{{ getControlledArea(selectedNeuron).toFixed(1) }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Avg. Score:</span>
              <span class="font-medium">{{ getAverageScore(selectedNeuron).toFixed(3) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="border-t pt-3">
          <button
            @click="removeNeuron(selectedNeuron.id)"
            class="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Remove Neuron
          </button>
        </div>
      </div>
    </div>

    <!-- Neurons List Panel -->
    <div v-if="store.neurons.length > 0 && !selectedNeuron" class="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[250px]">
      <h3 class="font-bold text-lg text-gray-800 mb-3">Neurons ({{ store.neurons.length }})</h3>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="neuron in store.neurons"
          :key="neuron.id"
          class="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          @click="selectNeuron(neuron)"
        >
          <div class="flex items-center">
            <div class="w-3 h-3 mr-2 relative">
              <svg class="w-full h-full" viewBox="0 0 24 24">
                <path 
                  :d="generateStarPath(12, 12, 8, 3)"
                  :fill="neuron.color"
                  stroke="black"
                  stroke-width="1"
                />
              </svg>
            </div>
            <span class="text-sm font-medium">Neuron {{ neuron.id }}</span>
          </div>
          <div class="text-xs text-gray-500">
            ({{ neuron.x.toFixed(2) }}, {{ neuron.y.toFixed(2) }})
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      ref="tooltipRef"
      class="absolute pointer-events-none z-20 bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm max-w-xs transition-opacity duration-150"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      v-html="tooltip.content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { CursorArrowRaysIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import * as d3 from 'd3'
import type { DataPoint, Neuron } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const canvasRef = ref<SVGElement>()
const tooltipRef = ref<HTMLElement>()
interface Props {
  fullscreen?: boolean
}

const props = defineProps<Props>()
const selectedNeuron = ref<Neuron | null>(null)

const config = computed(() => ({
  width: props.fullscreen ? Math.min(window.innerWidth - 200, 1200) : 600,
  height: props.fullscreen ? Math.min(window.innerHeight - 200, 800) : 600
}))

const cellSize = computed(() => {
  // Grid size now represents the desired size of each cell in pixels
  // Scale it based on canvas size for consistency
  const baseSize = 600 // Base canvas size
  const scaleFactor = config.value.width / baseSize
  return (store.gridSize / 5) * scaleFactor // Divide by 5 to make the slider values more intuitive
})

// Star path generator function
function generateStarPath(centerX: number, centerY: number, outerRadius: number = 12, innerRadius: number = 5, points: number = 5): string {
  const angleIncrement = (Math.PI * 2) / points
  const halfAngleIncrement = angleIncrement / 2
  
  let path = ''
  
  for (let i = 0; i < points; i++) {
    // Outer point
    const outerAngle = i * angleIncrement - Math.PI / 2 // Start from top
    const outerX = centerX + Math.cos(outerAngle) * outerRadius
    const outerY = centerY + Math.sin(outerAngle) * outerRadius
    
    // Inner point
    const innerAngle = outerAngle + halfAngleIncrement
    const innerX = centerX + Math.cos(innerAngle) * innerRadius
    const innerY = centerY + Math.sin(innerAngle) * innerRadius
    
    if (i === 0) {
      path += `M ${outerX} ${outerY}`
    } else {
      path += ` L ${outerX} ${outerY}`
    }
    
    path += ` L ${innerX} ${innerY}`
  }
  
  path += ' Z' // Close the path
  return path
}

// Scales - now dynamic based on coordinate ranges
const xScale = computed(() => d3.scaleLinear()
  .domain([store.coordinateRanges.xMin, store.coordinateRanges.xMax])
  .range([0, config.value.width]))

const yScale = computed(() => d3.scaleLinear()
  .domain([store.coordinateRanges.yMin, store.coordinateRanges.yMax])
  .range([config.value.height, 0]))

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

// Performance optimizations
const shouldShowGrid = computed(() => {
  // Show grid when boundaries are enabled and there are neurons
  return store.showBoundaries && store.neurons.length > 0
})

// Grid cells - memoized and only computed when needed
const gridCells = computed(() => {
  if (!shouldShowGrid.value) return []
  
  const cells = []
  const currentCellSize = cellSize.value
  const canvasWidth = config.value.width
  const canvasHeight = config.value.height
  
  // Calculate how many cells fit in each dimension
  const cellsX = Math.ceil(canvasWidth / currentCellSize)
  const cellsY = Math.ceil(canvasHeight / currentCellSize)
  
  for (let i = 0; i < cellsX; i++) {
    for (let j = 0; j < cellsY; j++) {
      const x = i * currentCellSize
      const y = j * currentCellSize
      
      // Add all cells - SVG will clip them naturally at canvas bounds
      // This ensures full coverage even if cells extend slightly beyond
      cells.push({
        x,
        y,
        gridX: i,
        gridY: j
      })
    }
  }
  return cells
})

// Only render visible grid cells (performance optimization)
const visibleGridCells = computed(() => {
  return gridCells.value.slice(0, Math.min(900, gridCells.value.length)) // Max 900 cells
})

// Only render visible data points (performance optimization)
const visibleDataPoints = computed(() => {
  return store.filteredDataPoints.slice(0, Math.min(2000, store.filteredDataPoints.length)) // Max 2000 points
})

function handleCanvasClick(event: MouseEvent) {
  // Check if the click was on an interactive element that should prevent neuron addition
  const target = event.target as Element
  
  // Don't add neuron if clicking on existing neurons or data points
  if (target.classList.contains('neuron') || target.classList.contains('data-point')) {
    return
  }
  
  // Use the canvas ref to get the correct bounding rectangle
  const coords = coordinateUtils.getCanvasCoordinates(event)
  if (!coords) return
  
  // Convert to normalized coordinates
  const normalized = coordinateUtils.toNormalizedCoordinates(coords.canvasX, coords.canvasY)
  
  // Ensure coordinates are within valid range
  const clampedX = Math.max(store.coordinateRanges.xMin, Math.min(store.coordinateRanges.xMax, normalized.x))
  const clampedY = Math.max(store.coordinateRanges.yMin, Math.min(store.coordinateRanges.yMax, normalized.y))
  
  // Add neuron using the coordinate utilities
  const newNeuron = neuronUtils.addNeuron(clampedX, clampedY)
  
  // Force cache clear and trigger re-render
  cellColorCache.clear()
  nextTick(() => {
    // Force another cache clear after Vue has updated
    cellColorCache.clear()
  })
  
  notificationStore.addNotification({
    message: `Neuron ${newNeuron.id} added at (${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`,
    type: 'success',
    duration: 2000
  })
}

// Coordinate utilities - following D3.js best practices
const coordinateUtils = {
  getCanvasCoordinates(event: MouseEvent): { canvasX: number; canvasY: number } | null {
    if (!canvasRef.value) return null
    
    const rect = canvasRef.value.getBoundingClientRect()
    return {
      canvasX: event.clientX - rect.left,
      canvasY: event.clientY - rect.top
    }
  },
  
  toNormalizedCoordinates(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: xScale.value.invert(canvasX),
      y: yScale.value.invert(canvasY)
    }
  },
  
  toCanvasCoordinates(normalizedX: number, normalizedY: number): { x: number; y: number } {
    return {
      x: xScale.value(normalizedX),
      y: yScale.value(normalizedY)
    }
  }
}

// Tooltip utilities - modular tooltip management
const tooltipUtils = {
  show(event: MouseEvent, content: string) {
    tooltip.value = {
      visible: true,
      x: event.clientX + 15,
      y: event.clientY - 30,
      content
    }
  },
  
  hide() {
    tooltip.value.visible = false
  }
}

// Neuron utilities - modular neuron management
const neuronUtils = {
  addNeuron(x: number, y: number): Neuron {
    return store.addNeuron(x, y)
  },
  
  removeNeuron(neuronId: number) {
    // Implementation for removing specific neuron
    const index = store.neurons.findIndex(n => n.id === neuronId)
    if (index !== -1) {
      store.neurons.splice(index, 1)
    }
  }
}

// Memoized cell color calculation with LRU cache
const cellColorCache = new Map()
const maxCacheSize = 1000

function getCellColor(cell: any) {
  // Include cell size and position in cache key to handle dynamic grid sizing
  const currentCellSize = cellSize.value
  const cacheKey = `${cell.x}-${cell.y}-${currentCellSize.toFixed(2)}`
  
  if (cellColorCache.has(cacheKey)) {
    return cellColorCache.get(cacheKey)
  }

  // Clear cache if it gets too large
  if (cellColorCache.size > maxCacheSize) {
    const firstKey = cellColorCache.keys().next().value
    cellColorCache.delete(firstKey)
  }
  
  // Convert grid position to world coordinates
  const worldX = xScale.value.invert(cell.x + currentCellSize/2)
  const worldY = yScale.value.invert(cell.y + currentCellSize/2)
  
  if (store.neurons.length === 0) {
    const color = '#f8fafc'
    cellColorCache.set(cacheKey, color)
    return color
  }
  
  // Calculate similarity scores for each neuron at this position
  const rawScores = store.neurons.map(neuron => store.calculateScore(neuron, worldX, worldY))
  
  // Apply activation function to the raw scores
  const activatedScores = store.applyActivation(rawScores)
  
  // Find the neuron with the highest activated similarity score
  let maxScore = -Infinity
  let winningNeuronIndex = -1
  
  activatedScores.forEach((score, index) => {
    if (score > maxScore) {
      maxScore = score
      winningNeuronIndex = index
    }
  })
  
  // Use the winning neuron's color
  let baseColor = '#f8fafc'
  let opacity = 0.05
  
  if (winningNeuronIndex >= 0 && store.neurons[winningNeuronIndex]) {
    baseColor = store.neurons[winningNeuronIndex].color
    // Make it much more visible with higher opacity
    opacity = Math.max(0.4, Math.min(0.8, Math.abs(maxScore) * 0.3 + 0.4)) // Better dynamic opacity
  }
  
  // Convert color to rgba format with better opacity
  let color = baseColor
  
  if (baseColor.startsWith('#') && baseColor.length === 7) {
    // Convert hex to rgba
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    color = `rgba(${r}, ${g}, ${b}, ${opacity})`
  } else if (baseColor.startsWith('hsl')) {
    // Convert HSL to HSLA by extracting values and applying opacity
    const hslMatch = baseColor.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
    if (hslMatch) {
      const h = parseFloat(hslMatch[1])
      const s = parseFloat(hslMatch[2])
      const l = parseFloat(hslMatch[3])
      color = `hsla(${h}, ${s}%, ${l}%, ${opacity})`
    }
  } else {
    // Fallback for any other color formats - use the base color with opacity
    color = baseColor // Keep original color if we can't parse it
  }
  
  cellColorCache.set(cacheKey, color)
  return color
}

function getDataPointColor(point: DataPoint) {
  if (store.showPredictedColors && store.neurons.length > 0) {
    const prediction = store.getPrediction(point.x, point.y)
    return prediction.winningNeuron ? prediction.winningNeuron.color : '#999999'
  } else {
    return `hsl(${(point.label * 360 / 10) % 360}, 70%, 60%)`
  }
}

function getDataPointStroke(point: DataPoint) {
  const baseColor = `hsl(${(point.label * 360 / 10) % 360}, 70%, 40%)`
  return baseColor
}

function handleDataPointClick(event: MouseEvent, point: DataPoint) {
  event.stopPropagation()
  
  notificationStore.addNotification({
    message: `Data point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) - Label: ${point.label}`,
    type: 'info',
    duration: 2000
  })
}

function handleNeuronClick(event: MouseEvent, neuron: Neuron) {
  event.stopPropagation()
  
  // Select neuron for detailed view
  selectedNeuron.value = neuron
  
  // Also set for loss landscape
  store.selectedNeuronForLandscape = neuron
  
  notificationStore.addNotification({
    message: `Neuron ${neuron.id} selected`,
    type: 'info',
    duration: 2000
  })
}

function showTooltip(event: MouseEvent, cell: any) {
  const currentCellSize = cellSize.value
  const centerCoords = coordinateUtils.toNormalizedCoordinates(cell.x + currentCellSize / 2, cell.y + currentCellSize / 2)
  const centerX = centerCoords.x
  const centerY = centerCoords.y
  
  if (store.neurons.length === 0) return
  
  const rawScores = store.neurons.map(neuron => store.calculateScore(neuron, centerX, centerY))
  const activatedScores = store.applyActivation(rawScores)
  
  const sortedScores = store.neurons.map((neuron, idx) => ({
    neuron,
    raw: rawScores[idx],
    activated: activatedScores[idx]
  })).sort((a, b) => b.activated - a.activated)
  
  const scoreText = sortedScores.map(s => 
    `<span style="color: ${s.neuron.color}">Neuron ${s.neuron.id}: ${s.activated.toFixed(3)} (raw: ${s.raw.toFixed(3)})</span>`
  ).join('<br>')
  
  tooltipUtils.show(event, `X: ${centerX.toFixed(2)}, Y: ${centerY.toFixed(2)}<br>${scoreText}`)
}

function showDataPointTooltip(event: MouseEvent, point: DataPoint) {
  const prediction = store.getPrediction(point.x, point.y)
  const predictedClass = prediction.winningNeuron ? prediction.winningNeuron.id : 'None'
  
  const content = `
    <div>Position: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})</div>
    <div>Actual Label: ${point.label}</div>
    <div>Predicted: ${predictedClass}</div>
  `
  
  tooltipUtils.show(event, content)
}

function showNeuronTooltip(event: MouseEvent, neuron: Neuron) {
  const content = `
    <div>Neuron ${neuron.id}</div>
    <div>Position: (${neuron.x.toFixed(2)}, ${neuron.y.toFixed(2)})</div>
  `
  
  tooltipUtils.show(event, content)
}

function hideTooltip() {
  tooltipUtils.hide()
}

// Neuron management functions
function selectNeuron(neuron: Neuron) {
  selectedNeuron.value = neuron
}

function updateNeuronPosition() {
  if (!selectedNeuron.value) return
  
  // Clamp values to valid range
  selectedNeuron.value.x = Math.max(store.coordinateRanges.xMin, Math.min(store.coordinateRanges.xMax, selectedNeuron.value.x))
  selectedNeuron.value.y = Math.max(store.coordinateRanges.yMin, Math.min(store.coordinateRanges.yMax, selectedNeuron.value.y))
  
  // Clear cache when neuron position changes
  cellColorCache.clear()
  
  notificationStore.addNotification({
    message: `Neuron ${selectedNeuron.value.id} position updated`,
    type: 'success',
    duration: 2000
  })
}

function updateNeuronColor() {
  if (!selectedNeuron.value) return
  
  // Clear cache when neuron color changes
  cellColorCache.clear()
  
  notificationStore.addNotification({
    message: `Neuron ${selectedNeuron.value.id} color updated`,
    type: 'success',
    duration: 2000
  })
}

function removeNeuron(neuronId: number) {
  neuronUtils.removeNeuron(neuronId)
  selectedNeuron.value = null
  
  // Force cache clear and trigger re-render
  cellColorCache.clear()
  nextTick(() => {
    cellColorCache.clear()
  })
  
  notificationStore.addNotification({
    message: `Neuron ${neuronId} removed`,
    type: 'success',
    duration: 2000
  })
}

function getControlledArea(neuron: Neuron): number {
  if (store.neurons.length === 0) return 0
  
  let controlledCells = 0
  const numCells = 50
  const totalCells = numCells * numCells
  
  // Calculate controlled area for the neuron
  for (let i = 0; i < numCells; i++) {
    for (let j = 0; j < numCells; j++) {
      const x = (i / numCells) * 2 - 1  // Scale to [-1, 1]
      const y = (j / numCells) * 2 - 1  // Scale to [-1, 1]
      
      const prediction = store.getPrediction(x, y)
      if (prediction.winningNeuron && prediction.winningNeuron.id === neuron.id) {
        controlledCells++
      }
    }
  }
  
  return (controlledCells / totalCells) * 100
}

function getAverageScore(neuron: Neuron): number {
  if (store.filteredDataPoints.length === 0) return 0
  
  const scores = store.filteredDataPoints.map(point => 
    store.calculateScore(neuron, point.x, point.y)
  )
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

onMounted(() => {
  // Initialize canvas with optimized settings
  cellColorCache.clear()
  
  // Add keyboard shortcuts for better UX
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      tooltipUtils.hide()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // Cleanup on unmount
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Clear cache when neurons or settings change
watch(() => [store.neurons.length, store.showBoundaries, store.similarityMetric, store.activationFunction, store.gridSize, store.coordinateRanges], () => {
  cellColorCache.clear()
}, { deep: true })

// Clear cache specifically when cell size changes (grid size or canvas dimensions)
watch(() => cellSize.value, () => {
  cellColorCache.clear()
})

// Clear cache when neurons themselves change (not just length)
watch(() => store.neurons, () => {
  cellColorCache.clear()
}, { deep: true })

// Clear cache when data changes for performance
watch(() => store.filteredDataPoints.length, () => {
  cellColorCache.clear()
})
</script>

<style scoped>
.neural-canvas {
  transition: all 0.2s ease;
}

.neural-canvas:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cell {
  transition: fill 0.2s ease;
}

.cell:hover {
  filter: brightness(1.1);
}

.neuron {
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.data-point {
  transition: all 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.data-point:hover {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) brightness(1.1);
  transform: scale(1.2);
}

.metric-value {
  @apply text-lg font-bold text-blue-600;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

/* Component-specific styles moved from global CSS */
.data-point {
  opacity: 0.85;
  stroke-width: 2;
  cursor: pointer;
  transition: stroke-width 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              filter 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: transform;
}

.data-point:hover {
  stroke-width: 4;
  filter: brightness(1.1);
  transform: scale(1.05) translateZ(0);
}

.neuron {
  cursor: pointer;
  transform: translateZ(0);
  will-change: transform;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.cell {
  stroke: rgb(209 213 219);
  stroke-width: 1;
  transition: stroke 0.1s ease-out,
              stroke-width 0.1s ease-out;
  will-change: transform;
}

.cell:hover {
  stroke: rgb(156 163 175);
  stroke-width: 2;
}

.neural-canvas {
  contain: layout style;
  transform: translateZ(0);
}

.grid-group {
  contain: paint;
}
</style>
