<template>
  <div class="control-card p-6">
    <div class="flex items-center justify-center mb-4">
      <ChartBarIcon class="w-6 h-6 text-blue-600 mr-3" />
      <h3 class="text-xl font-bold text-gray-800">Neuron Metrics</h3>
    </div>
    
    <div v-if="store.neurons.length === 0" class="text-center text-gray-500 py-8">
      <CpuChipIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>Add neurons to see metrics</p>
    </div>
    
    <svg 
      v-else
      ref="chartRef"
      :width="config.width" 
      :height="config.height" 
      class="w-full"
      style="max-width: 100%; height: auto;"
    >
      <!-- Bars -->
      <g class="bars-group">
        <rect
          v-for="(metric, index) in metrics"
          :key="`bar-${metric.neuron.id}`"
          :x="barXScale(metric.neuron.id)"
          :y="barYScale(metric.area)"
          :width="barXScale.bandwidth()"
          :height="config.height - barYScale(metric.area)"
          :fill="metric.neuron.color"
          class="transition-all duration-300 hover:brightness-110"
          @mouseover="(event) => showMetricTooltip(event, metric)"
          @mouseleave="hideTooltip"
        />
      </g>
      
      <!-- Y-axis -->
      <g class="y-axis" />
      
      <!-- X-axis -->
      <g class="x-axis" :transform="`translate(0, ${config.height})`" />
    </svg>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      ref="tooltipRef"
      class="absolute pointer-events-none z-20 bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      v-html="tooltip.content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ChartBarIcon, CpuChipIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import * as d3 from 'd3'
import type { Metric } from '@/types'

const store = useNeuralNetworkStore()

const chartRef = ref<SVGElement>()
const tooltipRef = ref<HTMLElement>()

const config = {
  width: 300,
  height: 150
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

// Computed metrics
const metrics = computed(() => {
  if (store.neurons.length === 0) return []
  
  return store.neurons.map(neuron => {
    let controlledCells = 0
    const numCells = 100
    const totalCells = numCells * numCells
    
    // Calculate controlled area for each neuron
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
    
    return {
      neuron,
      area: controlledCells / totalCells
    }
  })
})

// D3 scales
const barXScale = computed(() => 
  d3.scaleBand()
    .domain(metrics.value.map(m => m.neuron.id))
    .range([0, config.width])
    .padding(0.1)
)

const barYScale = computed(() =>
  d3.scaleLinear()
    .domain([0, 1])
    .range([config.height, 0])
)

function showMetricTooltip(event: MouseEvent, metric: Metric) {
  tooltip.value = {
    visible: true,
    x: event.clientX + 15,
    y: event.clientY - 30,
    content: `
      <div><strong>Neuron ${metric.neuron.id}</strong></div>
      <div>Controlled Area: ${(metric.area * 100).toFixed(1)}%</div>
      <div>Position: (${metric.neuron.x.toFixed(2)}, ${metric.neuron.y.toFixed(2)})</div>
    `
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function updateAxes() {
  if (!chartRef.value || metrics.value.length === 0) return
  
  const svg = d3.select(chartRef.value)
  
  // Update Y-axis
  const yAxis = d3.axisLeft(barYScale.value).ticks(5)
  svg.select('.y-axis')
    .transition()
    .duration(300)
    .call(yAxis as any)
  
  // Update X-axis
  const xAxis = d3.axisBottom(barXScale.value)
  svg.select('.x-axis')
    .transition()
    .duration(300)
    .call(xAxis as any)
}

// Watch for changes and update axes
watch(metrics, () => {
  nextTick(() => {
    updateAxes()
  })
}, { deep: true })

onMounted(() => {
  updateAxes()
})
</script>
