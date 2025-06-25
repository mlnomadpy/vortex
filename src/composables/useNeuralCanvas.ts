import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import { D3Grid, createD3Grid, gridUtils, type GridConfig, type DecisionBoundaryConfig } from '@/utils/d3Grid'
import { D3SvgRenderer, createD3SvgRenderer, renderUtils, type RenderConfig } from '@/utils/d3SvgRenderer'
import type { DataPoint, Neuron } from '@/types'

export interface NeuralCanvasConfig {
  width: number
  height: number
  fullscreen?: boolean
}

/**
 * Vue composable for neural network canvas visualization
 * Integrates D3Grid and D3SvgRenderer with Vue reactivity
 */
export function useNeuralCanvas(config: NeuralCanvasConfig) {
  const store = useNeuralNetworkStore()
  const notificationStore = useNotificationStore()

  // Reactive refs
  const canvasRef = ref<SVGSVGElement>()
  const selectedNeuron = ref<Neuron | null>(null)
  const tooltip = ref({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  })

  // D3 instances
  let d3Grid: D3Grid | null = null
  let d3Renderer: D3SvgRenderer | null = null
  let throttledRender: (...args: any[]) => void = () => {}

  // Computed canvas dimensions
  const canvasConfig = computed(() => ({
    width: config.fullscreen ? Math.min(window.innerWidth - 200, 1200) : config.width,
    height: config.fullscreen ? Math.min(window.innerHeight - 200, 800) : config.height
  }))

  // Computed cell size with performance optimization
  const cellSize = computed(() => {
    const { width, height } = canvasConfig.value
    return gridUtils.calculateOptimalCellSize(width, height, 2500)
  })

  // Grid configuration
  const gridConfig = computed((): GridConfig => ({
    width: canvasConfig.value.width,
    height: canvasConfig.value.height,
    cellSize: cellSize.value,
    xDomain: [store.coordinateRanges.xMin, store.coordinateRanges.xMax],
    yDomain: [store.coordinateRanges.yMin, store.coordinateRanges.yMax]
  }))

  // Decision boundary configuration
  const boundaryConfig = computed((): DecisionBoundaryConfig => ({
    ...gridConfig.value,
    neurons: store.neurons,
    calculateScore: store.calculateScore,
    applyActivation: store.applyActivation
  }))

  // Render configuration
  const renderConfig = computed((): RenderConfig => ({
    width: canvasConfig.value.width,
    height: canvasConfig.value.height
  }))

  /**
   * Initialize D3 instances
   */
  function initializeD3(): void {
    if (!canvasRef.value) return

    // Create D3 instances
    d3Grid = createD3Grid(gridConfig.value)
    d3Renderer = createD3SvgRenderer(canvasRef.value, renderConfig.value)

    // Create throttled render function
    throttledRender = renderUtils.createDebouncedRender(render, 50)

    // Initial render
    render()
  }

  /**
   * Main render function
   */
  function render(): void {
    if (!d3Grid || !d3Renderer) return

    const { xScale, yScale } = d3Grid.getScales()

    // Render axes
    d3Renderer.renderAxes(xScale, yScale, {
      showAxes: true,
      tickCount: 5
    })

    // Render grid with decision boundaries
    if (store.showBoundaries && store.neurons.length > 0) {
      const gridCells = d3Grid.generateDecisionBoundaryGrid(boundaryConfig.value)
      d3Renderer.renderGrid(gridCells, cellSize.value, {
        showGrid: true,
        animated: false // Disable animation for grid for performance
      })
    } else {
      // Clear grid when boundaries are disabled
      d3Renderer.renderGrid([], cellSize.value, { showGrid: false })
    }

    // Render data points
    if (store.showDataPoints && store.filteredDataPoints.length > 0) {
      d3Renderer.renderDataPoints(
        store.filteredDataPoints.slice(0, 2000), // Limit for performance
        xScale,
        yScale,
        {
          radius: 6,
          getColor: getDataPointColor,
          getStroke: getDataPointStroke,
          animated: true,
          onHover: handleDataPointHover,
          onClick: handleDataPointClick
        }
      )
    }

    // Render neurons
    if (store.neurons.length > 0) {
      d3Renderer.renderNeurons(
        store.neurons,
        xScale,
        yScale,
        {
          animated: true,
          onHover: handleNeuronHover,
          onClick: handleNeuronClick
        }
      )
    }

    // Add debug information if needed
    if (store.filteredDataPoints.length === 0 && store.dataPoints.length > 0) {
      d3Renderer.addDebugText(
        `No data points visible (${store.dataPoints.length} total, ${store.filteredDataPoints.length} filtered)`,
        10,
        30
      )
    }

    if (store.neurons.length > 0 && !store.showBoundaries) {
      d3Renderer.addDebugText(
        'Enable "Show Boundaries" to see decision boundaries',
        10,
        50
      )
    }
  }

  /**
   * Handle canvas click to add neurons
   */
  function handleCanvasClick(event: MouseEvent): void {
    if (!d3Grid || !canvasRef.value) return

    // Check if clicked on interactive elements
    const target = event.target as Element
    if (target.classList.contains('neuron') || target.classList.contains('data-point')) {
      return
    }

    // Get canvas coordinates
    const rect = canvasRef.value.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    // Convert to world coordinates
    const worldCoords = d3Grid.canvasToWorld(canvasX, canvasY)

    // Clamp to valid range
    const clampedX = Math.max(
      store.coordinateRanges.xMin,
      Math.min(store.coordinateRanges.xMax, worldCoords.x)
    )
    const clampedY = Math.max(
      store.coordinateRanges.yMin,
      Math.min(store.coordinateRanges.yMax, worldCoords.y)
    )

    // Add neuron
    const newNeuron = store.addNeuron(clampedX, clampedY)

    // Clear grid cache and re-render
    d3Grid.clearCache()
    nextTick(() => {
      throttledRender()
    })

    notificationStore.addNotification({
      message: `Neuron ${newNeuron.id} added at (${clampedX.toFixed(2)}, ${clampedY.toFixed(2)})`,
      type: 'success',
      duration: 2000
    })
  }

  /**
   * Event handlers
   */
  function handleDataPointClick(event: MouseEvent, point: DataPoint): void {
    event.stopPropagation()
    notificationStore.addNotification({
      message: `Data point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) - Label: ${point.label}`,
      type: 'info',
      duration: 2000
    })
  }

  function handleDataPointHover(event: MouseEvent, point: DataPoint): void {
    const prediction = store.getPrediction(point.x, point.y)
    const predictedClass = prediction.winningNeuron ? prediction.winningNeuron.id : 'None'

    showTooltip(event, `
      <div>Position: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})</div>
      <div>Actual Label: ${point.label}</div>
      <div>Predicted: ${predictedClass}</div>
    `)
  }

  function handleNeuronClick(event: MouseEvent, neuron: Neuron): void {
    event.stopPropagation()
    selectedNeuron.value = neuron
    store.selectedNeuronForLandscape = neuron

    notificationStore.addNotification({
      message: `Neuron ${neuron.id} selected`,
      type: 'info',
      duration: 2000
    })
  }

  function handleNeuronHover(event: MouseEvent, neuron: Neuron): void {
    showTooltip(event, `
      <div>Neuron ${neuron.id}</div>
      <div>Position: (${neuron.x.toFixed(2)}, ${neuron.y.toFixed(2)})</div>
    `)
  }

  /**
   * Utility functions
   */
  function getDataPointColor(point: DataPoint): string {
    if (store.showPredictedColors && store.neurons.length > 0) {
      const prediction = store.getPrediction(point.x, point.y)
      return prediction.winningNeuron ? prediction.winningNeuron.color : '#999999'
    } else {
      return `hsl(${(point.label * 360 / 10) % 360}, 70%, 60%)`
    }
  }

  function getDataPointStroke(point: DataPoint): string {
    return `hsl(${(point.label * 360 / 10) % 360}, 70%, 40%)`
  }

  function showTooltip(event: MouseEvent, content: string): void {
    tooltip.value = {
      visible: true,
      x: event.clientX + 15,
      y: event.clientY - 30,
      content
    }
  }

  function hideTooltip(): void {
    tooltip.value.visible = false
  }

  /**
   * Neuron management functions
   */
  function updateNeuronPosition(): void {
    if (!selectedNeuron.value || !d3Grid) return

    // Clamp values to valid range
    selectedNeuron.value.x = Math.max(
      store.coordinateRanges.xMin,
      Math.min(store.coordinateRanges.xMax, selectedNeuron.value.x)
    )
    selectedNeuron.value.y = Math.max(
      store.coordinateRanges.yMin,
      Math.min(store.coordinateRanges.yMax, selectedNeuron.value.y)
    )

    // Clear cache and re-render
    d3Grid.clearCache()
    throttledRender()

    notificationStore.addNotification({
      message: `Neuron ${selectedNeuron.value.id} position updated`,
      type: 'success',
      duration: 2000
    })
  }

  function updateNeuronColor(): void {
    if (!selectedNeuron.value || !d3Grid) return

    // Clear cache and re-render
    d3Grid.clearCache()
    throttledRender()

    notificationStore.addNotification({
      message: `Neuron ${selectedNeuron.value.id} color updated`,
      type: 'success',
      duration: 2000
    })
  }

  function removeNeuron(neuronId: number): void {
    const index = store.neurons.findIndex(n => n.id === neuronId)
    if (index !== -1) {
      store.neurons.splice(index, 1)
      selectedNeuron.value = null

      // Clear cache and re-render
      if (d3Grid) {
        d3Grid.clearCache()
        throttledRender()
      }

      notificationStore.addNotification({
        message: `Neuron ${neuronId} removed`,
        type: 'success',
        duration: 2000
      })
    }
  }

  function getControlledArea(neuron: Neuron): number {
    if (store.neurons.length === 0) return 0

    let controlledCells = 0
    const numCells = 50
    const totalCells = numCells * numCells

    for (let i = 0; i < numCells; i++) {
      for (let j = 0; j < numCells; j++) {
        const x = (i / numCells) * 2 - 1
        const y = (j / numCells) * 2 - 1

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

  /**
   * Update configurations when reactive data changes
   */
  function updateConfigurations(): void {
    if (!d3Grid || !d3Renderer) return

    d3Grid.updateConfig(gridConfig.value)
    d3Renderer.updateConfig(renderConfig.value)
    throttledRender()
  }

  // Watchers for reactive updates
  watch(
    () => [
      store.neurons.length,
      store.showBoundaries,
      store.similarityMetric,
      store.activationFunction,
      store.gridSize,
      store.coordinateRanges,
      canvasConfig.value.width,
      canvasConfig.value.height
    ],
    () => {
      updateConfigurations()
    },
    { deep: true }
  )

  // Watch neurons array for deep changes
  watch(
    () => store.neurons,
    () => {
      if (d3Grid) {
        d3Grid.clearCache()
        throttledRender()
      }
    },
    { deep: true }
  )

  // Watch filtered data points
  watch(
    () => store.filteredDataPoints.length,
    () => {
      if (d3Grid) {
        d3Grid.clearCache()
        throttledRender()
      }
    }
  )

  // Lifecycle
  onMounted(() => {
    nextTick(() => {
      initializeD3()
    })

    // Keyboard shortcuts
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip()
        selectedNeuron.value = null
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  })

  onUnmounted(() => {
    // Cleanup
    if (d3Renderer) {
      d3Renderer.clear()
    }
  })

  return {
    // Refs
    canvasRef,
    selectedNeuron,
    tooltip,
    canvasConfig,
    cellSize,

    // Event handlers
    handleCanvasClick,
    handleDataPointClick,
    handleNeuronClick,
    hideTooltip,

    // Neuron management
    updateNeuronPosition,
    updateNeuronColor,
    removeNeuron,
    getControlledArea,
    getAverageScore,

    // Utilities
    render: throttledRender
  }
} 