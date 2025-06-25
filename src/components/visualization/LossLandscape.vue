<template>
  <div class="loss-landscape-container">
    <div class="landscape-header">
      <div class="flex items-center glass-effect px-3 py-1 rounded-full text-sm font-semibold text-theme-primary">
        <ChartBarSquareIcon class="w-4 h-4 mr-2 text-indigo-500" />
        Loss Landscape
      </div>
    </div>
    
    <div v-if="!store.selectedNeuronForLandscape" class="empty-state">
      <MapIcon class="w-16 h-16 mx-auto mb-3 opacity-40" />
      <p class="text-theme-secondary text-sm">Select a neuron to view its loss landscape</p>
    </div>
    
    <div v-else class="landscape-content">
      <!-- Main SVG Canvas -->
      <svg 
        ref="landscapeRef"
        :width="config.width" 
        :height="config.height" 
        class="loss-landscape-svg"
        @mousemove="handleMouseMove"
        @mouseleave="hideTooltip"
      >
        <!-- Gradient definitions for better colors -->
        <defs>
          <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#440154;stop-opacity:1" />
            <stop offset="25%" style="stop-color:#31688e;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#35b779;stop-opacity:1" />
            <stop offset="75%" style="stop-color:#fde725;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fff5b0;stop-opacity:1" />
          </linearGradient>
          
          <!-- Neuron glow effect -->
          <filter id="neuronGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect 
          x="0" y="0" 
          :width="config.width" 
          :height="config.height" 
          fill="#1a1a1a" 
          rx="8"
        />
        
        <!-- Heatmap cells -->
        <g class="landscape-heatmap">
          <rect
            v-for="(point, index) in displayLandscapeData"
            :key="`cell-${index}`"
            :x="point.screenX"
            :y="point.screenY"
            :width="cellSize"
            :height="cellSize"
            :fill="getLossColor(point.loss)"
            :opacity="0.8"
            class="landscape-cell"
            @mouseenter="(event) => showLossTooltip(event, point)"
          />
        </g>
        
        <!-- Contour lines for better visualization -->
        <g v-if="contourLines.length > 0" class="contour-lines">
          <path
            v-for="(contour, index) in contourLines"
            :key="`contour-${index}`"
            :d="contour.path"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            stroke-width="1"
            class="contour-line"
          />
        </g>
        
        <!-- Optimization trail for selected neuron -->
        <g v-if="optimizationTrail.length > 1" class="optimization-trail">
          <path
            :d="optimizationTrailPath"
            fill="none"
            :stroke="selectedNeuronColor"
            stroke-width="2"
            stroke-opacity="0.7"
            stroke-dasharray="3,3"
            class="trail-path"
          />
          
          <!-- Trail points -->
          <circle
            v-for="(point, index) in optimizationTrail.slice(-10)"
            :key="`trail-${index}`"
            :cx="landscapeXScale(point.x)"
            :cy="landscapeYScale(point.y)"
            :r="2"
            :fill="selectedNeuronColor"
            :opacity="0.3 + (index / 10) * 0.7"
            class="trail-point"
          />
        </g>
        
        <!-- Current neuron position -->
        <g v-if="store.selectedNeuronForLandscape" class="neuron-marker">
          <!-- Neuron shadow -->
          <circle
            :cx="currentNeuronX + 2"
            :cy="currentNeuronY + 2"
            :r="8"
            fill="rgba(0, 0, 0, 0.3)"
            class="neuron-shadow"
          />
          
          <!-- Main neuron circle -->
          <circle
            :cx="currentNeuronX"
            :cy="currentNeuronY"
            :r="8"
            :fill="selectedNeuronColor"
            stroke="white"
            stroke-width="2"
            filter="url(#neuronGlow)"
            class="neuron-position"
          />
          
          <!-- Center dot -->
          <circle
            :cx="currentNeuronX"
            :cy="currentNeuronY"
            :r="2"
            fill="white"
            class="neuron-center"
          />
          
          <!-- Crosshairs -->
          <g class="crosshairs" :opacity="0.5">
            <line
              :x1="0"
              :y1="currentNeuronY"
              :x2="config.width"
              :y2="currentNeuronY"
              stroke="white"
              stroke-width="1"
              stroke-dasharray="2,2"
            />
            <line
              :x1="currentNeuronX"
              :y1="0"
              :x2="currentNeuronX"
              :y2="config.height"
              stroke="white"
              stroke-width="1"
              stroke-dasharray="2,2"
            />
          </g>
        </g>
        
        <!-- Axes labels -->
        <g class="axes-labels">
          <!-- X-axis label -->
          <text
            :x="config.width / 2"
            :y="config.height - 5"
            text-anchor="middle"
            fill="white"
            font-size="10"
            opacity="0.7"
          >
            X Position
          </text>
          
          <!-- Y-axis label -->
          <text
            :x="10"
            :y="config.height / 2"
            text-anchor="middle"
            fill="white"
            font-size="10"
            opacity="0.7"
            transform="rotate(-90, 10, 160)"
          >
            Y Position
          </text>
        </g>
      </svg>
      
      <!-- Color scale legend -->
      <div class="legend">
        <div class="legend-title">Loss</div>
        <div class="legend-bar">
          <div class="legend-gradient"></div>
          <div class="legend-labels">
            <span class="legend-min">{{ minLoss.toFixed(2) }}</span>
            <span class="legend-max">{{ maxLoss.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Statistics panel -->
      <div v-if="currentLossInfo" class="stats-panel">
        <div class="stat-item">
          <span class="stat-label">Current Loss:</span>
          <span class="stat-value">{{ currentLossInfo.loss.toFixed(4) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Position:</span>
          <span class="stat-value">({{ currentLossInfo.x.toFixed(3) }}, {{ currentLossInfo.y.toFixed(3) }})</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Neuron:</span>
          <span class="stat-value" :style="{ color: selectedNeuronColor }">{{ store.selectedNeuronForLandscape.id }}</span>
        </div>
      </div>
    </div>
    
    <!-- Loading overlay -->
    <div v-if="isCalculating" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span class="loading-text">Calculating Loss Landscape...</span>
        <div class="loading-progress">
          <div class="progress-bar" :style="{ width: calculationProgress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      class="landscape-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      v-html="tooltip.content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ChartBarSquareIcon, MapIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import * as d3 from 'd3'
import type { LossLandscapePoint } from '@/types'

const store = useNeuralNetworkStore()

const landscapeRef = ref<SVGElement>()

const config = {
  width: 400,
  height: 400,
  landscapeSize: 40, // Increased resolution from 20 to 40
  range: 0.8 // Increased range for better context
}

const cellSize = config.width / config.landscapeSize

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

const isCalculating = ref(false)
const calculationProgress = ref(0)
const landscapeDataCache = ref<(LossLandscapePoint & { screenX: number; screenY: number })[]>([])

// Stable reference for the selected neuron position
const currentNeuronX = computed(() => {
  return store.selectedNeuronForLandscape ? 
    landscapeXScale.value(store.selectedNeuronForLandscape.x) : 0
})

const currentNeuronY = computed(() => {
  return store.selectedNeuronForLandscape ? 
    landscapeYScale.value(store.selectedNeuronForLandscape.y) : 0
})

// Selected neuron color
const selectedNeuronColor = computed(() => {
  return store.selectedNeuronForLandscape?.color || '#ff6b6b'
})

// Loss range for color scaling
const minLoss = computed(() => {
  if (landscapeDataCache.value.length === 0) return 0
  return Math.min(...landscapeDataCache.value.map(d => d.loss))
})

const maxLoss = computed(() => {
  if (landscapeDataCache.value.length === 0) return 1
  return Math.max(...landscapeDataCache.value.map(d => d.loss))
})

// Current loss information
const currentLossInfo = computed(() => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron || !store.filteredDataPoints.length) return null
  
  // Calculate current loss at neuron position
  const loss = store.computeLoss(store.filteredDataPoints)
  return {
    x: neuron.x,
    y: neuron.y,
    loss
  }
})

// Optimization trail for the selected neuron
const optimizationTrail = computed(() => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron) return []
  
  // Get trail from optimization history
  return store.optimizationHistory.steps
    .map(step => step.neurons.find(n => n.id === neuron.id))
    .filter(n => n !== undefined)
    .slice(-20) // Show last 20 positions
})

// Path for optimization trail
const optimizationTrailPath = computed((): string => {
  if (optimizationTrail.value.length < 2) return ''
  
  const line = d3.line<{ id: number; x: number; y: number }>()
    .x(d => landscapeXScale.value(d.x))
    .y(d => landscapeYScale.value(d.y))
    .curve(d3.curveCardinal)
  
  const path = line(optimizationTrail.value)
  // @ts-ignore - d3.line can return null but we handle it
  return path || ''
})

// Contour lines for better visualization
const contourLines = computed(() => {
  if (landscapeDataCache.value.length === 0) return []
  
  try {
    // Create contour generator
    const values = landscapeDataCache.value.map(d => d.loss)
    const contourGen = d3.contours()
      .size([config.landscapeSize, config.landscapeSize])
      .thresholds(5) // 5 contour levels
    
    const contours = contourGen(values)
    
    return contours.map(contour => ({
      level: contour.value,
      path: d3.geoPath()(contour) || ''
    }))
  } catch (error) {
    console.warn('Error generating contours:', error)
    return []
  }
})

// Better color function
const getLossColor = (loss: number): string => {
  const min = minLoss.value
  const max = maxLoss.value
  
  if (max === min) return '#440154'
  
  const normalized = (loss - min) / (max - min)
  
  // Use viridis color scale
  const colors = [
    '#440154', '#31688e', '#35b779', '#fde725'
  ]
  
  const index = Math.floor(normalized * (colors.length - 1))
  const t = (normalized * (colors.length - 1)) - index
  
  if (index >= colors.length - 1) return colors[colors.length - 1]
  
  // Simple linear interpolation between colors
  const color1 = d3.color(colors[index])
  const color2 = d3.color(colors[index + 1])
  
  if (!color1 || !color2) return colors[index]
  
  return d3.interpolate(color1, color2)(t)
}

// Optimized landscape data computation
const displayLandscapeData = computed(() => {
  return landscapeDataCache.value
})

// Debounced calculation function
let calculationTimeout: NodeJS.Timeout | null = null

const calculateLandscape = async () => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron || store.filteredDataPoints.length === 0 || isCalculating.value) return
  
  isCalculating.value = true
  calculationProgress.value = 0
  
  try {
    const data: (LossLandscapePoint & { screenX: number; screenY: number })[] = []
    const originalX = neuron.x
    const originalY = neuron.y
    
    const totalCells = config.landscapeSize * config.landscapeSize
    let completedCells = 0
    
    // Calculate in batches for better performance and progress tracking
    const batchSize = Math.ceil(config.landscapeSize / 8)
    
    for (let batchStart = 0; batchStart < config.landscapeSize; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, config.landscapeSize)
      
      for (let i = batchStart; i < batchEnd; i++) {
        for (let j = 0; j < config.landscapeSize; j++) {
          const testX = originalX + (i / config.landscapeSize - 0.5) * 2 * config.range
          const testY = originalY + (j / config.landscapeSize - 0.5) * 2 * config.range
          
          // Calculate loss at this position using optimized approach
          const loss = calculateLossAtPosition(testX, testY, neuron)
          
          data.push({
            x: testX,
            y: testY,
            loss,
            screenX: i * cellSize,
            screenY: j * cellSize
          })
          
          completedCells++
          calculationProgress.value = (completedCells / totalCells) * 100
        }
      }
      
      // Allow UI updates between batches
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    
    landscapeDataCache.value = data
  } finally {
    isCalculating.value = false
    calculationProgress.value = 100
  }
}

// Optimized loss calculation at a specific position
const calculateLossAtPosition = (testX: number, testY: number, neuron: any): number => {
  // Use a smaller sample of data points for faster calculation
  const sampleSize = Math.min(50, store.filteredDataPoints.length)
  const samplePoints = store.filteredDataPoints.slice(0, sampleSize)
  
  // Temporarily move neuron to test position
  const tempNeuron = { ...neuron, x: testX, y: testY }
  const tempNeurons = store.neurons.map(n => n.id === neuron.id ? tempNeuron : n)
  
  let totalLoss = 0
  
  for (const point of samplePoints) {
    // Get scores for all neurons
    const scores = tempNeurons.map(n => store.calculateScore(n, point.x, point.y))
    
    // Apply softmax for probability normalization
    const maxScore = Math.max(...scores)
    const exps = scores.map(s => Math.exp(s - maxScore))
    const sumExps = exps.reduce((a, b) => a + b, 0)
    const probabilities = exps.map(e => Math.max(e / (sumExps + 1e-8), 1e-8))
    
    // Find correct class index
    const correctClassIndex = tempNeurons.findIndex(n => n.id === point.label)
    
    if (correctClassIndex !== -1) {
      totalLoss += -Math.log(probabilities[correctClassIndex])
    } else {
      totalLoss += -Math.log(1e-8) // Penalty for missing class
    }
  }
  
  return totalLoss / samplePoints.length
}

// Landscape coordinate scales
const landscapeXScale = computed(() => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron) return d3.scaleLinear().domain([0, 1]).range([0, config.width])
  
  return d3.scaleLinear()
    .domain([neuron.x - config.range, neuron.x + config.range])
    .range([0, config.width])
})

const landscapeYScale = computed(() => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron) return d3.scaleLinear().domain([0, 1]).range([0, config.height])
  
  return d3.scaleLinear()
    .domain([neuron.y - config.range, neuron.y + config.range])
    .range([config.height, 0])
})

// Mouse handling
const handleMouseMove = (event: MouseEvent) => {
  const rect = (event.target as Element).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Find the cell at this position
  const cellX = Math.floor(x / cellSize)
  const cellY = Math.floor(y / cellSize)
  
  const point = landscapeDataCache.value.find(p => 
    p.screenX === cellX * cellSize && p.screenY === cellY * cellSize
  )
  
  if (point) {
    showLossTooltip(event, point)
  }
}

const showLossTooltip = (event: MouseEvent, point: LossLandscapePoint & { screenX: number; screenY: number }) => {
  tooltip.value = {
    visible: true,
    x: event.clientX + 15,
    y: event.clientY - 30,
    content: `
      <div class="tooltip-content">
        <div class="tooltip-title">Loss Landscape</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Position:</span>
          <span class="tooltip-value">(${point.x.toFixed(3)}, ${point.y.toFixed(3)})</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Loss:</span>
          <span class="tooltip-value">${point.loss.toFixed(4)}</span>
        </div>
      </div>
    `
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

// Watchers with improved debouncing
watch(() => store.selectedNeuronForLandscape, (newNeuron) => {
  if (calculationTimeout) {
    clearTimeout(calculationTimeout)
  }
  
  if (newNeuron) {
    // Clear old data immediately for responsiveness
    landscapeDataCache.value = []
    calculationTimeout = setTimeout(calculateLandscape, 200)
  } else {
    landscapeDataCache.value = []
  }
})

watch(() => store.filteredDataPoints.length, () => {
  if (calculationTimeout) {
    clearTimeout(calculationTimeout)
  }
  
  if (store.selectedNeuronForLandscape) {
    calculationTimeout = setTimeout(calculateLandscape, 300)
  }
})

// Reduced frequency updates during optimization
watch(() => store.selectedNeuronForLandscape ? 
  [store.selectedNeuronForLandscape.x, store.selectedNeuronForLandscape.y] : null, 
  () => {
    if (calculationTimeout) {
      clearTimeout(calculationTimeout)
    }
    
    if (store.selectedNeuronForLandscape) {
      // Much longer debounce during optimization to reduce computational load
      const debounceTime = store.optimizationHistory.isRunning ? 500 : 200
      calculationTimeout = setTimeout(calculateLandscape, debounceTime)
    }
  }, 
  { deep: true }
)

// Final update when optimization stops
watch(() => store.optimizationHistory.isRunning, (isRunning) => {
  if (!isRunning && store.selectedNeuronForLandscape) {
    if (calculationTimeout) {
      clearTimeout(calculationTimeout)
    }
    calculationTimeout = setTimeout(calculateLandscape, 100)
  }
})
</script>

<style scoped>
.loss-landscape-container {
  position: relative;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.landscape-header {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  min-height: 300px;
}

.landscape-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.loss-landscape-svg {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0a0a0a;
  cursor: crosshair;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}

.landscape-heatmap {
  contain: paint;
}

.landscape-cell {
  cursor: pointer;
  transition: opacity 0.1s ease;
}

.landscape-cell:hover {
  opacity: 1 !important;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
}

.contour-lines {
  pointer-events: none;
}

.contour-line {
  opacity: 0.4;
}

.optimization-trail {
  pointer-events: none;
}

.trail-path {
  filter: drop-shadow(0 0 3px currentColor);
}

.trail-point {
  filter: drop-shadow(0 0 2px currentColor);
}

.neuron-marker {
  pointer-events: none;
}

.neuron-shadow {
  opacity: 0.3;
}

.neuron-position {
  transition: all 0.2s ease;
}

.neuron-center {
  opacity: 0.9;
}

.crosshairs {
  pointer-events: none;
}

.axes-labels {
  pointer-events: none;
  font-family: 'Inter', sans-serif;
}

/* Legend */
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.legend-bar {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.legend-gradient {
  height: 8px;
  background: linear-gradient(to right, #440154, #31688e, #35b779, #fde725);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Statistics Panel */
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.stat-value {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 20;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Tooltip */
.landscape-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 30;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltip-title {
  font-weight: 600;
  color: #60a5fa;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.25rem;
  margin-bottom: 0.25rem;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.tooltip-label {
  color: rgba(255, 255, 255, 0.7);
}

.tooltip-value {
  color: rgba(255, 255, 255, 0.95);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Performance optimizations */
@media (prefers-reduced-motion: reduce) {
  .landscape-cell {
    transition: none !important;
  }
  
  .neuron-position {
    transition: none !important;
  }
  
  .loading-spinner {
    animation: none !important;
  }
  
  .progress-bar {
    transition: none !important;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .loss-landscape-container {
    padding: 0.5rem;
  }
  
  .landscape-content {
    gap: 0.5rem;
  }
  
  .legend,
  .stats-panel {
    padding: 0.5rem;
  }
  
  .stat-item {
    font-size: 0.7rem;
  }
}
</style>
