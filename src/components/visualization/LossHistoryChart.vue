<template>
  <div class="training-history-panel">
    <!-- Enhanced Header with Status -->
    <div class="panel-header">
      <div class="header-left">
        <div class="panel-icon">
          <ChartBarIcon class="w-5 h-5" />
        </div>
        <div class="panel-title">
          <h3>Training History</h3>
          <div class="panel-subtitle">
            {{ store.optimizationHistory.steps.length }} steps recorded
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="status-indicator" :class="{ active: store.optimizationHistory.isRunning }">
          <div class="status-dot"></div>
          <span>{{ store.optimizationHistory.isRunning ? 'Training' : 'Idle' }}</span>
        </div>
        
        <div class="header-actions">
          <Button
            v-if="store.optimizationHistory.steps.length > 0"
            @click="exportHistory"
            variant="ghost"
            size="xs"
            title="Export History"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
          </Button>
          
          <Button
            v-if="store.optimizationHistory.steps.length > 0"
            @click="clearHistory"
            variant="ghost"
            size="xs"
            title="Clear History"
          >
            <TrashIcon class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Content Area -->
    <div class="panel-content">
      <!-- Empty State -->
      <div v-if="store.optimizationHistory.steps.length === 0" class="empty-state">
        <div class="empty-icon">
          <ChartBarIcon class="w-12 h-12 opacity-40" />
        </div>
        <h4>No Training History</h4>
        <p>Start optimization to see training progress and metrics</p>
        <Button @click="$emit('start-training')" variant="default" size="sm">
          Start Training
        </Button>
      </div>
      
      <!-- History Content -->
      <div v-else class="history-content">
        <!-- Key Metrics Summary -->
        <div class="metrics-summary">
          <div class="metric-card best">
            <div class="metric-label">Best Accuracy</div>
            <div class="metric-value">{{ bestAccuracy.toFixed(1) }}%</div>
            <div class="metric-step">Step {{ bestAccuracyStep }}</div>
          </div>
          
          <div class="metric-card current">
            <div class="metric-label">Current Loss</div>
            <div class="metric-value">{{ latestLoss.toFixed(4) }}</div>
            <div class="metric-change" :class="lossChangeClass">
              {{ lossChangeText }}
            </div>
          </div>
          
          <div class="metric-card progress">
            <div class="metric-label">Progress</div>
            <div class="metric-value">{{ progressPercentage }}%</div>
            <div class="metric-detail">
              {{ store.optimizationHistory.currentStep }}/{{ store.optimizationHistory.totalSteps }}
            </div>
          </div>
        </div>
        
        <!-- Chart Controls -->
        <div class="chart-controls">
          <div class="view-options">
            <button 
              v-for="view in chartViews"
              :key="view.id"
              @click="activeView = view.id"
              :class="['view-tab', { active: activeView === view.id }]"
            >
              <component :is="view.icon" class="w-4 h-4" />
              <span>{{ view.label }}</span>
            </button>
          </div>
          
          <div class="chart-options">
            <label class="option-toggle">
              <input v-model="showGrid" type="checkbox" />
              <span>Grid</span>
            </label>
            <label class="option-toggle">
              <input v-model="showSmoothing" type="checkbox" />
              <span>Smooth</span>
            </label>
            <label class="option-toggle">
              <input v-model="showMovingAverage" type="checkbox" />
              <span>Avg</span>
            </label>
          </div>
        </div>
        
        <!-- Enhanced SVG Chart -->
        <div class="chart-container">
          <svg
            ref="chartRef"
            class="training-chart"
            :width="chartConfig.width"
            :height="chartConfig.height"
            @mousemove="handleMouseMove"
            @mouseleave="hideTooltip"
          >
            <!-- Chart content will be rendered by D3 -->
          </svg>
          
          <!-- Enhanced Tooltip -->
          <div
            v-if="tooltip.visible"
            class="chart-tooltip"
            :style="{ 
              left: tooltip.x + 'px', 
              top: tooltip.y + 'px',
              transform: `translate(${tooltip.x > chartConfig.width / 2 ? '-100%' : '0'}, -100%)`
            }"
          >
            <div class="tooltip-header">
              <strong>Step {{ tooltip.data?.step }}</strong>
              <span class="tooltip-time">{{ formatTime(tooltip.data?.timestamp) }}</span>
            </div>
            <div class="tooltip-metrics">
              <div class="tooltip-metric loss">
                <span class="metric-dot"></span>
                <span>Loss: {{ tooltip.data?.loss?.toFixed(4) }}</span>
              </div>
              <div class="tooltip-metric accuracy">
                <span class="metric-dot"></span>
                <span>Accuracy: {{ tooltip.data?.accuracy?.toFixed(1) }}%</span>
              </div>
              <div v-if="tooltip.data?.learningRate" class="tooltip-metric rate">
                <span class="metric-dot"></span>
                <span>LR: {{ tooltip.data.learningRate.toFixed(4) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Training Statistics -->
        <div class="training-stats">
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Training Time</span>
              <span class="stat-value">{{ trainingDuration }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Avg Steps/sec</span>
              <span class="stat-value">{{ avgStepsPerSecond.toFixed(1) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Improvement</span>
              <span class="stat-value" :class="improvementClass">{{ improvementText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ChartBarIcon, TrashIcon, ArrowDownTrayIcon, ChartLineIcon, CalculatorIcon, MapIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import * as d3 from 'd3'
import type { OptimizationStep } from '@/types'

interface Emits {
  (e: 'start-training'): void
}

defineEmits<Emits>()

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const chartRef = ref<SVGElement>()
const activeView = ref('both')
const showGrid = ref(true)
const showSmoothing = ref(false)
const showMovingAverage = ref(false)

const chartViews = [
  { id: 'both', label: 'Both', icon: ChartLineIcon },
  { id: 'loss', label: 'Loss', icon: ChartBarIcon },
  { id: 'accuracy', label: 'Accuracy', icon: CalculatorIcon },
  { id: 'landscape', label: 'Landscape', icon: MapIcon }
]

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as OptimizationStep | null
})

const chartConfig = {
  width: 400,
  height: 280,
  margin: { top: 20, right: 40, bottom: 40, left: 40 }
}

const chartWidth = chartConfig.width - chartConfig.margin.left - chartConfig.margin.right
const chartHeight = chartConfig.height - chartConfig.margin.top - chartConfig.margin.bottom

// Enhanced computed properties
const chartData = computed(() => {
  return store.optimizationHistory.steps.slice()
})

const latestLoss = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].loss : 0
})

const latestAccuracy = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? steps[steps.length - 1].accuracy : 0
})

const bestAccuracy = computed(() => {
  const steps = store.optimizationHistory.steps
  return steps.length > 0 ? Math.max(...steps.map(s => s.accuracy)) : 0
})

const bestAccuracyStep = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length === 0) return 0
  
  const maxAccuracy = bestAccuracy.value
  const stepWithMaxAccuracy = steps.find(s => s.accuracy === maxAccuracy)
  return stepWithMaxAccuracy?.step || 0
})

const lossChangeClass = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return ''
  
  const current = steps[steps.length - 1].loss
  const previous = steps[steps.length - 2].loss
  
  if (current < previous) return 'improving'
  if (current > previous) return 'degrading'
  return 'stable'
})

const lossChangeText = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 'No change'
  
  const current = steps[steps.length - 1].loss
  const previous = steps[steps.length - 2].loss
  const change = ((current - previous) / previous * 100)
  
  if (Math.abs(change) < 0.01) return 'Stable'
  return change < 0 ? `↓ ${Math.abs(change).toFixed(1)}%` : `↑ ${change.toFixed(1)}%`
})

const progressPercentage = computed(() => {
  const total = store.optimizationHistory.totalSteps
  const current = store.optimizationHistory.currentStep
  return total > 0 ? Math.round((current / total) * 100) : 0
})

const trainingDuration = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return '0s'
  
  const start = steps[0].timestamp
  const end = steps[steps.length - 1].timestamp
  const duration = (end - start) / 1000
  
  if (duration < 60) return `${duration.toFixed(1)}s`
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${(duration % 60).toFixed(0)}s`
  return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
})

const avgStepsPerSecond = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 0
  
  const duration = (steps[steps.length - 1].timestamp - steps[0].timestamp) / 1000
  return duration > 0 ? (steps.length - 1) / duration : 0
})

const improvementClass = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return ''
  
  const initial = steps[0].accuracy
  const current = steps[steps.length - 1].accuracy
  const improvement = current - initial
  
  if (improvement > 5) return 'great'
  if (improvement > 0) return 'good'
  if (improvement < -5) return 'poor'
  return 'neutral'
})

const improvementText = computed(() => {
  const steps = store.optimizationHistory.steps
  if (steps.length < 2) return 'N/A'
  
  const initial = steps[0].accuracy
  const current = steps[steps.length - 1].accuracy
  const improvement = current - initial
  
  return improvement >= 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`
})

// D3 scales with enhanced features
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
    .domain([0, Math.max(lossExtent[1] * 1.1, 0.1)])
    .range([chartHeight, 0])
    .nice()
})

const accuracyYScale = computed(() => {
  if (chartData.value.length === 0) return d3.scaleLinear().domain([0, 100]).range([chartHeight, 0])
  
  const accuracyExtent = d3.extent(chartData.value, d => d.accuracy) as [number, number]
  const minAccuracy = Math.max(0, accuracyExtent[0] - 5)
  const maxAccuracy = Math.min(100, accuracyExtent[1] + 5)
  
  return d3.scaleLinear()
    .domain([minAccuracy, maxAccuracy])
    .range([chartHeight, 0])
    .nice()
})

// Enhanced line generators
const lossLine = computed(() => {
  return d3.line<OptimizationStep>()
    .x(d => xScale.value(d.step))
    .y(d => lossYScale.value(d.loss))
    .curve(showSmoothing.value ? d3.curveCardinal : d3.curveLinear)
})

const accuracyLine = computed(() => {
  return d3.line<OptimizationStep>()
    .x(d => xScale.value(d.step))
    .y(d => accuracyYScale.value(d.accuracy))
    .curve(showSmoothing.value ? d3.curveCardinal : d3.curveLinear)
})

// Enhanced chart rendering
function renderChart() {
  if (!chartRef.value || chartData.value.length === 0) return

  const svg = d3.select(chartRef.value)
  svg.selectAll('*').remove()

  // Create main group
  const g = svg.append('g')
    .attr('transform', `translate(${chartConfig.margin.left},${chartConfig.margin.top})`)

  // Add grid if enabled
  if (showGrid.value) {
    // Horizontal grid lines
    g.selectAll('.grid-line-horizontal')
      .data(lossYScale.value.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line-horizontal')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => lossYScale.value(d))
      .attr('y2', d => lossYScale.value(d))
      .attr('stroke', 'rgb(var(--border-secondary))')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '2,2')

    // Vertical grid lines
    g.selectAll('.grid-line-vertical')
      .data(xScale.value.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line-vertical')
      .attr('x1', d => xScale.value(d))
      .attr('x2', d => xScale.value(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', 'rgb(var(--border-secondary))')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '2,2')
  }

  // Render based on active view
  if (activeView.value === 'both' || activeView.value === 'loss') {
    renderLossChart(g)
  }
  
  if (activeView.value === 'both' || activeView.value === 'accuracy') {
    renderAccuracyChart(g)
  }
  
  if (activeView.value === 'landscape') {
    renderLandscapeView(g)
  }

  // Add axes
  renderAxes(g)
  
  // Add interactive elements
  addInteractiveElements(g)
}

function renderLossChart(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  // Loss area (optional)
  if (showMovingAverage.value) {
    const area = d3.area<OptimizationStep>()
      .x(d => xScale.value(d.step))
      .y0(chartHeight)
      .y1(d => lossYScale.value(d.loss))
      .curve(d3.curveCardinal)

    g.append('path')
      .datum(chartData.value)
      .attr('class', 'loss-area')
      .attr('fill', 'url(#lossGradient)')
      .attr('opacity', 0.2)
      .attr('d', area)
  }

  // Loss line
  g.append('path')
    .datum(chartData.value)
    .attr('class', 'loss-line')
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 2)
    .attr('d', lossLine.value)

  // Loss points
  g.selectAll('.loss-point')
    .data(chartData.value)
    .enter()
    .append('circle')
    .attr('class', 'loss-point')
    .attr('cx', d => xScale.value(d.step))
    .attr('cy', d => lossYScale.value(d.loss))
    .attr('r', 3)
    .attr('fill', '#ef4444')
    .style('opacity', 0.7)
}

function renderAccuracyChart(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  // Accuracy line
  g.append('path')
    .datum(chartData.value)
    .attr('class', 'accuracy-line')
    .attr('fill', 'none')
    .attr('stroke', '#22c55e')
    .attr('stroke-width', 2)
    .attr('d', accuracyLine.value)

  // Accuracy points
  g.selectAll('.accuracy-point')
    .data(chartData.value)
    .enter()
    .append('circle')
    .attr('class', 'accuracy-point')
    .attr('cx', d => xScale.value(d.step))
    .attr('cy', d => accuracyYScale.value(d.accuracy))
    .attr('r', 3)
    .attr('fill', '#22c55e')
    .style('opacity', 0.7)
}

function renderLandscapeView(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  // This would show a simplified loss landscape evolution
  // For now, we'll show a heatmap of loss over time
  const colorScale = d3.scaleSequential()
    .domain(d3.extent(chartData.value, d => d.loss) as [number, number])
    .interpolator(d3.interpolateViridis)

  g.selectAll('.landscape-rect')
    .data(chartData.value)
    .enter()
    .append('rect')
    .attr('class', 'landscape-rect')
    .attr('x', d => xScale.value(d.step) - 2)
    .attr('y', 0)
    .attr('width', 4)
    .attr('height', chartHeight)
    .attr('fill', d => colorScale(d.loss))
    .attr('opacity', 0.6)
}

function renderAxes(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  // X-axis
  const xAxis = d3.axisBottom(xScale.value).ticks(6).tickFormat(d => `${d}`)
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${chartHeight})`)
    .call(xAxis)

  // Y-axes based on view
  if (activeView.value === 'both' || activeView.value === 'loss') {
    const lossYAxis = d3.axisLeft(lossYScale.value).ticks(5)
    g.append('g')
      .attr('class', 'y-axis-loss')
      .call(lossYAxis)
      
    // Loss axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - chartConfig.margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#ef4444')
      .text('Loss')
  }

  if (activeView.value === 'both' || activeView.value === 'accuracy') {
    const accuracyYAxis = d3.axisRight(accuracyYScale.value).ticks(5).tickFormat(d => `${d}%`)
    g.append('g')
      .attr('class', 'y-axis-accuracy')
      .attr('transform', `translate(${chartWidth},0)`)
      .call(accuracyYAxis)
      
    // Accuracy axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(90)')
      .attr('y', 0 - chartWidth - chartConfig.margin.right)
      .attr('x', chartHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#22c55e')
      .text('Accuracy (%)')
  }

  // X-axis label
  g.append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth / 2)
    .attr('y', chartHeight + chartConfig.margin.bottom)
    .attr('dy', '-0.5em')
    .style('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('fill', 'rgb(var(--text-secondary))')
    .text('Training Step')
}

function addInteractiveElements(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  // Add invisible overlay for mouse interaction
  g.append('rect')
    .attr('class', 'mouse-overlay')
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
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
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      data: closestPoint
    }
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function clearHistory() {
  store.clearOptimizationHistory()
  notificationStore.addNotification({
    message: 'Training history cleared',
    type: 'success'
  })
}

function exportHistory() {
  const data = store.optimizationHistory.steps.map(step => ({
    step: step.step,
    loss: step.loss,
    accuracy: step.accuracy,
    timestamp: new Date(step.timestamp).toISOString()
  }))
  
  const csv = [
    'step,loss,accuracy,timestamp',
    ...data.map(row => `${row.step},${row.loss},${row.accuracy},${row.timestamp}`)
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `training-history-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  
  notificationStore.addNotification({
    message: 'Training history exported',
    type: 'success'
  })
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString()
}

// Watch for data changes and re-render
watch([chartData, activeView, showGrid, showSmoothing, showMovingAverage], () => {
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
.training-history-panel {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-primary));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(var(--color-primary));
  color: white;
  border-radius: 8px;
}

.panel-title h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
}

.panel-subtitle {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin-top: 0.125rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--color-error));
  transition: background 0.2s;
}

.status-indicator.active .status-dot {
  background: rgb(var(--color-success));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.panel-content {
  padding: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.empty-icon {
  color: rgb(var(--text-tertiary));
}

.empty-state h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
}

.empty-state p {
  color: rgb(var(--text-secondary));
  margin: 0;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metrics-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric-card {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-primary));
}

.metric-card.best {
  border-color: rgb(var(--color-success));
  background: rgba(var(--color-success), 0.05);
}

.metric-card.current {
  border-color: rgb(var(--color-warning));
  background: rgba(var(--color-warning), 0.05);
}

.metric-card.progress {
  border-color: rgb(var(--color-primary));
  background: rgba(var(--color-primary), 0.05);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
  margin-bottom: 0.25rem;
}

.metric-step,
.metric-detail {
  font-size: 0.75rem;
  color: rgb(var(--text-tertiary));
}

.metric-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.metric-change.improving {
  color: rgb(var(--color-success));
}

.metric-change.degrading {
  color: rgb(var(--color-error));
}

.metric-change.stable {
  color: rgb(var(--text-secondary));
}

.chart-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgb(var(--bg-primary));
  border-radius: 8px;
  border: 1px solid rgb(var(--border-secondary));
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.view-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  background: transparent;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-tab:hover {
  background: rgb(var(--bg-tertiary));
  color: rgb(var(--text-primary));
}

.view-tab.active {
  background: rgb(var(--color-primary));
  color: white;
  border-color: rgb(var(--color-primary));
}

.chart-options {
  display: flex;
  gap: 1rem;
}

.option-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
  cursor: pointer;
}

.option-toggle input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: rgb(var(--color-primary));
}

.chart-container {
  position: relative;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  padding: 1rem;
}

.training-chart {
  width: 100%;
  height: auto;
}

.chart-tooltip {
  position: absolute;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: var(--shadow-large);
  pointer-events: none;
  z-index: 1000;
  min-width: 200px;
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.tooltip-header strong {
  color: rgb(var(--text-primary));
  font-weight: 600;
}

.tooltip-time {
  font-size: 0.75rem;
  color: rgb(var(--text-tertiary));
}

.tooltip-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.tooltip-metric {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tooltip-metric.loss .metric-dot {
  background: #ef4444;
}

.tooltip-metric.accuracy .metric-dot {
  background: #22c55e;
}

.tooltip-metric.rate .metric-dot {
  background: rgb(var(--color-primary));
}

.training-stats {
  padding: 1rem;
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.stat-value.great {
  color: rgb(var(--color-success));
}

.stat-value.good {
  color: #22c55e;
}

.stat-value.neutral {
  color: rgb(var(--text-secondary));
}

.stat-value.poor {
  color: rgb(var(--color-error));
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .metrics-summary {
    grid-template-columns: 1fr;
  }
  
  .chart-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
}

/* D3 Chart Styling */
:deep(.x-axis) text,
:deep(.y-axis-loss) text,
:deep(.y-axis-accuracy) text {
  font-size: 10px;
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
  r: 5;
  filter: brightness(1.2);
  cursor: pointer;
}

:deep(.mouse-overlay) {
  cursor: crosshair;
}
</style> 