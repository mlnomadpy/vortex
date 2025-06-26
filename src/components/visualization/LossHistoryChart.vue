<template>
  <div class="loss-history-chart" data-tour="loss-chart">
    <div class="chart-header">
      <div class="chart-title">
        <ChartBarIcon class="w-4 h-4" />
        <span>Training History</span>
      </div>
      <div class="chart-controls">
        <Button
          v-if="store.optimizationHistory.steps.length > 0"
          @click="clearHistory"
          variant="ghost"
          size="icon-sm"
          title="Clear History"
        >
          <TrashIcon class="w-3 h-3" />
        </Button>
      </div>
    </div>
    
    <div v-if="store.optimizationHistory.steps.length === 0" class="empty-state">
      <p>No training history yet</p>
      <p class="text-xs text-theme-tertiary">Run optimization to see progress</p>
    </div>
    
    <div v-else class="chart-container">
      <!-- Current Stats -->
      <div class="current-stats">
        <div class="stat-item">
          <span class="stat-label">Step</span>
          <span class="stat-value">{{ store.optimizationHistory.currentStep }}/{{ store.optimizationHistory.totalSteps }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Loss</span>
          <span class="stat-value loss">{{ latestLoss.toFixed(4) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Accuracy</span>
          <span class="stat-value accuracy">{{ latestAccuracy.toFixed(1) }}%</span>
        </div>
      </div>
      
      <!-- SVG Chart -->
      <svg
        ref="chartRef"
        class="loss-chart"
        :width="chartConfig.width"
        :height="chartConfig.height"
        @mousemove="handleMouseMove"
        @mouseleave="hideTooltip"
      >
        <!-- Chart content rendered by D3 -->
      </svg>
      
      <!-- Chart Tooltip -->
      <div
        v-if="tooltip.visible"
        class="chart-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        v-html="tooltip.content"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ChartBarIcon, TrashIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import * as d3 from 'd3'
import type { OptimizationStep } from '@/types'

const store = useNeuralNetworkStore()

const chartRef = ref<SVGElement>()
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  content: ''
})

const chartConfig = {
  width: 300,
  height: 180,
  margin: { top: 20, right: 20, bottom: 30, left: 40 }
}

const chartWidth = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right
const chartHeight = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom

// Computed values
const latestLoss = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].loss : 0
})

const latestAccuracy = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].accuracy : 0
})

const chartData = computed(() => {
  return store.optimizationHistory.steps.slice() // Create a copy to avoid mutation
})

// D3 scales
const xScale = computed(() => {
  if (chartData.value.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, chartWidth])
  
  return d3.scaleLinear()
    .domain(d3.extent(chartData.value, d => d.step) as [number, number])
    .range([0, chartWidth])
})

const lossYScale = computed(() => {
  if (chartData.value.length === 0) return d3.scaleLinear().domain([0, 1]).range([chartHeight, 0])
  
  const lossExtent = d3.extent(chartData.value, d => d.loss) as [number, number]
  return d3.scaleLinear()
    .domain([0, Math.max(lossExtent[1], 0.1)]) // Ensure minimum domain
    .range([chartHeight, 0])
})

const accuracyYScale = computed(() => {
  return d3.scaleLinear()
    .domain([0, 100])
    .range([chartHeight, 0])
})

// Line generators
const lossLine = computed(() => {
  return d3.line<OptimizationStep>()
    .x(d => xScale.value(d.step))
    .y(d => lossYScale.value(d.loss))
    .curve(d3.curveMonotoneX)
})

const accuracyLine = computed(() => {
  return d3.line<OptimizationStep>()
    .x(d => xScale.value(d.step))
    .y(d => accuracyYScale.value(d.accuracy))
    .curve(d3.curveMonotoneX)
})

function renderChart() {
  if (!chartRef.value || chartData.value.length === 0) return

  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove() // Clear previous content

  // Create main group
  const g = svg.append('g')
    .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`)

  // Add axes
  const xAxis = d3.axisBottom(xScale.value).ticks(5)
  const lossYAxis = d3.axisLeft(lossYScale.value).ticks(5)
  const accuracyYAxis = d3.axisRight(accuracyYScale.value).ticks(5).tickFormat(d => `${d}%`)

  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)

  g.append('g')
    .attr('class', 'y-axis-loss')
    .call(lossYAxis)

  g.append('g')
    .attr('class', 'y-axis-accuracy')
    .attr('transform', `translate(${chartWidth},0)`)
    .call(accuracyYAxis)

  // Add axis labels
  g.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - chartConfig.margin.left)
    .attr('x', 0 - (chartHeight / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('fill', 'rgb(var(--text-secondary))')
    .text('Loss')

  g.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(90)')
    .attr('y', 0 - chartWidth - chartConfig.margin.right)
    .attr('x', chartHeight / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('fill', 'rgb(var(--text-secondary))')
    .text('Accuracy (%)')

  g.append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + chartConfig.margin.bottom)
    .attr('dy', '-0.5em')
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('fill', 'rgb(var(--text-secondary))')
    .text('Training Step')

  // Add loss line
  g.append('path')
    .datum(chartData.value)
    .attr('class', 'loss-line')
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 2)
    .attr('d', lossLine.value)

  // Add accuracy line
  g.append('path')
    .datum(chartData.value)
    .attr('class', 'accuracy-line')
    .attr('fill', 'none')
    .attr('stroke', '#22c55e')
    .attr('stroke-width', 2)
    .attr('d', accuracyLine.value)

  // Add data points for interaction
  g.selectAll('.loss-point')
    .data(chartData.value)
    .enter()
    .append('circle')
    .attr('class', 'loss-point')
    .attr('cx', d => xScale.value(d.step))
    .attr('cy', d => lossYScale.value(d.loss))
    .attr('r', 3)
    .attr('fill', '#ef4444')
    .style('cursor', 'pointer')

  g.selectAll('.accuracy-point')
    .data(chartData.value)
    .enter()
    .append('circle')
    .attr('class', 'accuracy-point')
    .attr('cx', d => xScale.value(d.step))
    .attr('cy', d => accuracyYScale.value(d.accuracy))
    .attr('r', 3)
    .attr('fill', '#22c55e')
    .style('cursor', 'pointer')

  // Add legend
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${chartWidth - 80}, 20)`)

  legend.append('rect')
    .attr('width', 75)
    .attr('height', 35)
    .attr('fill', 'rgb(var(--bg-secondary))')
    .attr('stroke', 'rgb(var(--border-primary))')
    .attr('rx', 3)

  legend.append('line')
    .attr('x1', 5)
    .attr('x2', 15)
    .attr('y1', 10)
    .attr('y2', 10)
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 2)

  legend.append('text')
    .attr('x', 20)
    .attr('y', 10)
    .attr('dy', '0.35em')
    .style('font-size', '8px')
    .style('fill', 'rgb(var(--text-primary))')
    .text('Loss')

  legend.append('line')
    .attr('x1', 5)
    .attr('x2', 15)
    .attr('y1', 25)
    .attr('y2', 25)
    .attr('stroke', '#22c55e')
    .attr('stroke-width', 2)

  legend.append('text')
    .attr('x', 20)
    .attr('y', 25)
    .attr('dy', '0.35em')
    .style('font-size', '8px')
    .style('fill', 'rgb(var(--text-primary))')
    .text('Accuracy')
}

function handleMouseMove(event: MouseEvent) {
  if (!chartRef.value || chartData.value.length === 0) return

  const rect = chartRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left - chartConfig.margin.left
  const mouseY = event.clientY - rect.top - chartConfig.margin.top

  if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight) {
    hideTooltip()
    return
  }

  // Find closest data point
  const stepValue = xScale.value.invert(mouseX)
  const closestPoint = chartData.value.reduce((prev, curr) => 
    Math.abs(curr.step - stepValue) < Math.abs(prev.step - stepValue) ? curr : prev
  )

  if (closestPoint) {
    tooltip.value = {
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      content: `
        <div class="tooltip-content">
          <div><strong>Step ${closestPoint.step}</strong></div>
          <div>Loss: ${closestPoint.loss.toFixed(4)}</div>
          <div>Accuracy: ${closestPoint.accuracy.toFixed(1)}%</div>
        </div>
      `
    }
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function clearHistory() {
  store.clearOptimizationHistory()
}

// Watch for data changes and re-render
watch(chartData, () => {
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})
</script>

<style scoped>
.loss-history-chart {
  width: 100%;
  background: rgb(var(--bg-secondary));
  border-radius: 6px;
  overflow: hidden;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-primary));
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.chart-controls {
  display: flex;
  gap: 4px;
}

.clear-btn {
  padding: 4px;
  background: rgb(var(--color-error));
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s;
}

.clear-btn:hover {
  background: rgb(var(--color-error-hover));
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: rgb(var(--text-secondary));
  font-size: 12px;
}

.chart-container {
  padding: 12px;
}

.current-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgb(var(--bg-primary));
  border-radius: 4px;
  border: 1px solid rgb(var(--border-secondary));
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.stat-label {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.stat-value.loss {
  color: #ef4444;
}

.stat-value.accuracy {
  color: #22c55e;
}

.loss-chart {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
}

.chart-tooltip {
  position: fixed;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 8px;
  font-size: 10px;
  color: rgb(var(--text-primary));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1000;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* D3 Chart Styling */
:deep(.x-axis) text,
:deep(.y-axis-loss) text,
:deep(.y-axis-accuracy) text {
  font-size: 8px;
  fill: rgb(var(--text-secondary));
}

:deep(.x-axis) path,
:deep(.y-axis-loss) path,
:deep(.y-axis-accuracy) path,
:deep(.x-axis) line,
:deep(.y-axis-loss) line,
:deep(.y-axis-accuracy) line {
  stroke: rgb(var(--border-secondary));
}

:deep(.loss-point:hover),
:deep(.accuracy-point:hover) {
  r: 4;
  filter: brightness(1.2);
}
</style> 