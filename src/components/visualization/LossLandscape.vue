<template>
  <div class="p-4 relative">
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div class="flex items-center glass-effect px-3 py-1 rounded-full text-sm font-semibold text-theme-primary">
      <ChartBarSquareIcon class="w-4 h-4 mr-2 text-indigo-500" />
        Loss Landscape
      </div>
    </div>
    
    <div v-if="!store.selectedNeuronForLandscape" class="text-center text-theme-secondary py-16">
      <MapIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>Select a neuron to view loss landscape</p>
    </div>
    
    <svg 
      v-else
      ref="landscapeRef"
      :width="config.width" 
      :height="config.height" 
      class="loss-landscape w-full"
      style="max-width: 100%; height: auto;"
    >
      <!-- Heatmap cells -->
      <g class="landscape-group">
        <rect
          v-for="(point, index) in displayLandscapeData"
          :key="`landscape-${index}`"
          :x="point.screenX"
          :y="point.screenY"
          :width="cellSize"
          :height="cellSize"
          :fill="lossColorScale(point.loss)"
          class="landscape-cell transition-colors duration-150"
          @mouseenter="(event) => showLossTooltip(event, point)"
          @mouseleave="hideTooltip"
        />
      </g>
      
      <!-- Current neuron position -->
      <g v-if="store.selectedNeuronForLandscape" class="neuron-marker">
        <circle
          :cx="landscapeXScale(store.selectedNeuronForLandscape.x)"
          :cy="landscapeYScale(store.selectedNeuronForLandscape.y)"
          :r="5"
          fill="red"
          stroke="white"
          stroke-width="2"
          class="animate-pulse-slow"
        />
      </g>
    </svg>
    
    <!-- Loading indicator -->
    <div 
      v-if="isCalculating"
      class="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="flex items-center space-x-2 text-theme-secondary">
        <div class="loading-spinner w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
        <span>Calculating...</span>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      ref="tooltipRef"
      class="absolute pointer-events-none z-20 bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-150"
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
const tooltipRef = ref<HTMLElement>()

const config = {
  width: 300,
  height: 300,
  landscapeSize: 20, // Reduced from 30 to 20 for better performance
  range: 0.5
}

const cellSize = config.width / config.landscapeSize

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

const isCalculating = ref(false)
const landscapeDataCache = ref<(LossLandscapePoint & { screenX: number; screenY: number })[]>([])

// Throttled landscape data computation
const displayLandscapeData = computed(() => {
  return landscapeDataCache.value
})

// Debounced calculation function
let calculationTimeout: NodeJS.Timeout | null = null

const calculateLandscape = async () => {
  const neuron = store.selectedNeuronForLandscape
  if (!neuron || store.filteredDataPoints.length === 0 || isCalculating.value) return
  
  isCalculating.value = true
  
  // Use requestAnimationFrame for non-blocking calculation
  await new Promise(resolve => requestAnimationFrame(resolve))
  
  try {
    const data: (LossLandscapePoint & { screenX: number; screenY: number })[] = []
    const originalX = neuron.x
    const originalY = neuron.y
    
    // Calculate in smaller batches for better performance
    const batchSize = Math.ceil(config.landscapeSize / 4)
    
    for (let batchStart = 0; batchStart < config.landscapeSize; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, config.landscapeSize)
      
      for (let i = batchStart; i < batchEnd; i++) {
        for (let j = 0; j < config.landscapeSize; j++) {
          const testX = originalX + (i / config.landscapeSize - 0.5) * 2 * config.range
          const testY = originalY + (j / config.landscapeSize - 0.5) * 2 * config.range
          
          // Temporarily move neuron to test position
          const tempNeuron = { ...neuron, x: testX, y: testY }
          const tempNeurons = store.neurons.map(n => n.id === neuron.id ? tempNeuron : n)
          
          // Calculate loss at this position (using a subset of data for performance)
          const sampleSize = Math.min(100, store.filteredDataPoints.length)
          const samplePoints = store.filteredDataPoints.slice(0, sampleSize)
          
          let totalLoss = 0
          samplePoints.forEach(point => {
            const scores = tempNeurons.map(n => store.calculateScore(n, point.x, point.y))
            const probabilities = store.applyActivation(scores.length > 1 ? scores : [scores[0], -scores[0]])
            
            const correctClassIndex = tempNeurons.findIndex(n => n.id === point.label)
            if (correctClassIndex !== -1 && probabilities[correctClassIndex] > 0) {
              totalLoss -= Math.log(Math.max(probabilities[correctClassIndex], 1e-9))
            } else {
              totalLoss -= Math.log(1e-9)
            }
          })
          
          const avgLoss = totalLoss / samplePoints.length
          
          data.push({
            x: testX,
            y: testY,
            loss: avgLoss,
            screenX: i * cellSize,
            screenY: j * cellSize
          })
        }
      }
      
      // Allow UI updates between batches
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    
    landscapeDataCache.value = data
  } finally {
    isCalculating.value = false
  }
}

// Color scale for loss values
const lossColorScale = computed(() => {
  if (landscapeDataCache.value.length === 0) {
    return d3.scaleSequential(d3.interpolateViridis).domain([0, 1])
  }
  
  const lossDomain = d3.extent(landscapeDataCache.value, d => d.loss) as [number, number]
  return d3.scaleSequential(d3.interpolateViridis).domain(lossDomain)
})

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

function showLossTooltip(event: MouseEvent, point: LossLandscapePoint & { screenX: number; screenY: number }) {
  tooltip.value = {
    visible: true,
    x: event.clientX + 15,
    y: event.clientY - 30,
    content: `
      <div><strong>Loss Landscape</strong></div>
      <div>Position: (${point.x.toFixed(3)}, ${point.y.toFixed(3)})</div>
      <div>Loss: ${point.loss.toFixed(4)}</div>
    `
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

// Watch for neuron selection changes with debouncing
watch(() => store.selectedNeuronForLandscape, (newNeuron) => {
  if (calculationTimeout) {
    clearTimeout(calculationTimeout)
  }
  
  if (newNeuron) {
    calculationTimeout = setTimeout(calculateLandscape, 300) // 300ms debounce
  } else {
    landscapeDataCache.value = []
  }
})

// Watch for data changes with debouncing
watch(() => store.filteredDataPoints.length, () => {
  if (calculationTimeout) {
    clearTimeout(calculationTimeout)
  }
  
  if (store.selectedNeuronForLandscape) {
    calculationTimeout = setTimeout(calculateLandscape, 500) // 500ms debounce for data changes
  }
})
</script>

<style scoped>
.loss-landscape {
  contain: layout style;
  transform: translateZ(0);
}

.landscape-group {
  contain: paint;
}

.landscape-cell {
  will-change: auto;
}

.neuron-marker circle {
  transform: translateZ(0);
}

.loading-spinner {
  animation: spin 1s linear infinite;
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
  
  .neuron-marker circle {
    animation: none !important;
  }
}
</style>
