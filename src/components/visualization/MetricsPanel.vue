<template>
  <div class="compact-metrics-panel" data-tour="visualization-panel">
    <div class="panel-header">
      <ChartBarIcon class="w-4 h-4" />
      <span class="panel-title">Metrics</span>
    </div>
    
    <div v-if="store.neurons.length === 0" class="empty-state">
      <CpuChipIcon class="w-8 h-8 opacity-30" />
      <span class="empty-text">No neurons</span>
    </div>
    
    <div v-else class="metrics-content">
      <!-- Compact chart -->
      <svg 
        ref="chartRef"
        :width="config.width" 
        :height="config.height" 
        class="metrics-chart"
      >
        <!-- Bars -->
        <g class="bars-group">
          <rect
            v-for="metric in metrics"
            :key="`bar-${metric.neuron.id}`"
            :x="barXScale(String(metric.neuron.id)) || 0"
            :y="barYScale(metric.area)"
            :width="barXScale.bandwidth()"
            :height="config.height - barYScale(metric.area)"
            :fill="metric.neuron.color"
            class="metric-bar"
            @mouseover="(event) => showMetricTooltip(event, metric)"
            @mouseleave="hideTooltip"
          />
        </g>
        
        <!-- Y-axis -->
        <g class="y-axis" />
        
        <!-- X-axis -->
        <g class="x-axis" :transform="`translate(0, ${config.height})`" />
      </svg>
      
      <!-- Compact metrics list -->
      <div class="metrics-list">
        <div
          v-for="metric in metrics"
          :key="`metric-${metric.neuron.id}`"
          class="metric-row"
        >
          <div class="metric-neuron">
            <div class="metric-icon" :style="{ backgroundColor: metric.neuron.color }"></div>
            <span class="metric-label">N{{ metric.neuron.id }}</span>
          </div>
          <span class="metric-value">{{ (metric.area * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- Compact tooltip -->
    <div
      v-if="tooltip.visible"
      ref="tooltipRef"
      class="metrics-tooltip"
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
    .domain(metrics.value.map(m => String(m.neuron.id)))
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

<style scoped>
/* Compact Metrics Panel */
.compact-metrics-panel {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 11px;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-primary));
  border-radius: 6px 6px 0 0;
}

.panel-title {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 10px;
  gap: 6px;
}

.empty-text {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.metrics-content {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metrics-chart {
  width: 100%;
  height: auto;
  max-width: 100%;
}

.metric-bar {
  transition: all 0.2s ease;
  cursor: pointer;
}

.metric-bar:hover {
  opacity: 0.8;
  stroke: rgba(0, 0, 0, 0.3);
  stroke-width: 1;
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 120px;
  overflow-y: auto;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  border-radius: 3px;
  transition: all 0.15s ease;
}

.metric-row:hover {
  background: rgb(var(--bg-tertiary));
}

.metric-neuron {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.metric-label {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.metric-value {
  font-size: 9px;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  min-width: 28px;
  text-align: right;
}

.metrics-tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 20;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.3;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* D3 axis styling */
:deep(.y-axis) text,
:deep(.x-axis) text {
  font-size: 8px;
  fill: rgb(var(--text-tertiary));
}

:deep(.y-axis) path,
:deep(.x-axis) path,
:deep(.y-axis) line,
:deep(.x-axis) line {
  stroke: rgb(var(--border-tertiary));
  stroke-width: 1;
}

:deep(.y-axis) .tick text {
  font-size: 7px;
}

:deep(.x-axis) .tick text {
  font-size: 8px;
}

/* Custom scrollbar for metrics list */
.metrics-list::-webkit-scrollbar {
  width: 3px;
}

.metrics-list::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
}

.metrics-list::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 2px;
}

.metrics-list::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}

/* Responsive design */
@media (max-width: 768px) {
  .metrics-content {
    padding: 6px 8px;
    gap: 6px;
  }
  
  .metrics-list {
    max-height: 80px;
  }
  
  .metric-row {
    padding: 2px 4px;
  }
}
</style>
