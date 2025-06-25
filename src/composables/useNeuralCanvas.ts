import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import { D3Grid, createD3Grid, gridUtils, type GridConfig, type DecisionBoundaryConfig } from '@/utils/d3Grid'
import { D3SvgRenderer, createD3SvgRenderer, renderUtils, type RenderConfig } from '@/utils/d3SvgRenderer'
import { gridUpdateService, gridUpdates } from '@/services/gridUpdateService'
import type { DataPoint, Neuron } from '@/types'
import { getClassColor } from '@/utils/colors'

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
  
  // Grid update service integration
  const gridId = `neural-canvas-${Date.now()}`

  // Computed canvas dimensions
  const canvasConfig = computed(() => ({
    width: config.fullscreen ? Math.min(window.innerWidth - 200, 1200) : config.width,
    height: config.fullscreen ? Math.min(window.innerHeight - 200, 800) : config.height
  }))

  // Computed cell size using store's gridSize setting
  const cellSize = computed(() => {
    // gridSize represents the number of cells per dimension (25 = 25x25 grid)
    // Calculate actual cell size by dividing canvas dimensions by number of cells
    const gridCellCount = store.gridSize
    const { width, height } = canvasConfig.value
    
    // Calculate cell size for each dimension (cells will be rectangular if canvas isn't square)
    const cellWidth = width / gridCellCount
    const cellHeight = height / gridCellCount
    
    // Return the smaller dimension to ensure all cells fit within the canvas
    // This will be used by the renderer for consistent sizing
    return Math.min(cellWidth, cellHeight)
  })

  // Grid configuration
  const gridConfig = computed((): GridConfig => ({
    width: canvasConfig.value.width,
    height: canvasConfig.value.height,
    cellSize: cellSize.value,
    gridSize: store.gridSize, // Pass the actual grid size (number of cells per dimension)
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

    // Register with grid update service
    gridUpdateService.registerGrid(gridId, d3Grid, throttledRender)

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
          onClick: handleNeuronClick,
          // onHover: handleNeuronHover, // Removed hover functionality
          disableTransitions: store.optimizationHistory.isRunning
        }
      )
    }

    // Render neuron movements during optimization
    if (store.neuronMovements.length > 0) {
      d3Renderer.renderNeuronMovements(
        store.neuronMovements,
        xScale,
        yScale,
        {
          maxTrailLength: 15,
          showGradients: true,
          fadeOlderMovements: true,
          neurons: store.neurons
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

    // Use grid update service for neuron addition
    gridUpdates.neuronAdded(newNeuron.id)

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

  // Neuron hover functionality removed

  /**
   * Utility functions
   */
  function getDataPointColor(point: DataPoint): string {
    if (store.showPredictedColors && store.neurons.length > 0) {
      const prediction = store.getPrediction(point.x, point.y)
      return prediction.winningNeuron ? prediction.winningNeuron.color : '#999999'
    } else {
      return getClassColor(point.label, 70, 60)
    }
  }

  function getDataPointStroke(point: DataPoint): string {
    return getClassColor(point.label, 70, 40)
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

    const oldPos = { x: selectedNeuron.value.x, y: selectedNeuron.value.y }

    // Clamp values to valid range
    selectedNeuron.value.x = Math.max(
      store.coordinateRanges.xMin,
      Math.min(store.coordinateRanges.xMax, selectedNeuron.value.x)
    )
    selectedNeuron.value.y = Math.max(
      store.coordinateRanges.yMin,
      Math.min(store.coordinateRanges.yMax, selectedNeuron.value.y)
    )

    const newPos = { x: selectedNeuron.value.x, y: selectedNeuron.value.y }

    // Use grid update service for position changes
    gridUpdates.neuronMoved(selectedNeuron.value.id, oldPos, newPos)

    notificationStore.addNotification({
      message: `Neuron ${selectedNeuron.value.id} position updated`,
      type: 'success',
      duration: 2000
    })
  }

  function updateNeuronColor(): void {
    if (!selectedNeuron.value || !d3Grid) return

    const oldColor = selectedNeuron.value.color

    // Color will be updated by the component, so we need to get the new color
    // Use nextTick to ensure the color has been updated
    nextTick(() => {
      if (selectedNeuron.value) {
        gridUpdates.neuronColorChanged(selectedNeuron.value.id, oldColor, selectedNeuron.value.color)
      }
    })

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

      // Use grid update service for neuron removal
      gridUpdates.neuronRemoved(neuronId)

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
    
    // Clear cache when fundamental configuration changes
    d3Grid.clearCache()
    throttledRender()
  }

  /**
   * Completely reinitialize the grid system from scratch
   */
  function reinitializeGrid(): void {
    if (!canvasRef.value) return

    console.log('Performing complete grid reinitialization')
    
    // Notify user of reinitialization
    notificationStore.addNotification({
      message: 'Reinitializing grid and recalculating decision boundaries...',
      type: 'info',
      duration: 2000
    })
    
    // Clear all existing state
    if (d3Renderer) {
      d3Renderer.clear()
    }
    
    // Unregister from grid update service temporarily
    gridUpdateService.unregisterGrid(gridId)
    
    // Create fresh D3 instances
    d3Grid = createD3Grid(gridConfig.value)
    d3Renderer = createD3SvgRenderer(canvasRef.value, renderConfig.value)
    
    // Create new throttled render function
    throttledRender = renderUtils.createDebouncedRender(render, 50)
    
    // Re-register with grid update service
    gridUpdateService.registerGrid(gridId, d3Grid, throttledRender)
    
    // Force immediate render with fresh state
    render()
    
    console.log('Grid reinitialization complete')
    
    // Notify completion
    setTimeout(() => {
      notificationStore.addNotification({
        message: 'Grid reinitialization complete!',
        type: 'success',
        duration: 1500
      })
    }, 100)
  }

  // Watchers for reactive updates using grid update service
  watch(
    () => store.showBoundaries,
    (newValue, oldValue) => {
      if (newValue !== oldValue) {
        if (newValue) {
          // When boundaries are turned ON, completely reinitialize the grid
          reinitializeGrid()
        } else {
          // When boundaries are turned OFF, just use the normal toggle
          gridUpdates.boundariesToggled(newValue)
        }
      }
    }
  )

  watch(
    () => store.similarityMetric,
    (newValue, oldValue) => {
      if (newValue !== oldValue) {
        gridUpdates.metricChanged(oldValue, newValue)
      }
    }
  )

  watch(
    () => store.activationFunction,
    (newValue, oldValue) => {
      if (newValue !== oldValue) {
        gridUpdates.metricChanged(oldValue, newValue)
      }
    }
  )

  watch(
    () => store.gridSize,
    (newSize, oldSize) => {
      if (oldSize !== undefined && newSize !== oldSize) {
        // Grid size changes require immediate update as they affect visual density
        gridUpdates.gridSizeChanged(oldSize, newSize)
      }
    }
  )

  watch(
    () => store.coordinateRanges,
    () => {
      updateConfigurations()
    },
    { deep: true }
  )

  watch(
    () => [canvasConfig.value.width, canvasConfig.value.height],
    (newSize, oldSize) => {
      if (oldSize && (newSize[0] !== oldSize[0] || newSize[1] !== oldSize[1])) {
        gridUpdates.canvasResized(
          { width: oldSize[0], height: oldSize[1] },
          { width: newSize[0], height: newSize[1] }
        )
      }
    }
  )

  // Watch filtered data points
  watch(
    () => store.filteredDataPoints.length,
    () => {
      gridUpdates.dataChanged('filter')
    }
  )

  // Watch for class filtering changes
  watch(
    () => store.activeClasses,
    () => {
      gridUpdates.dataChanged('filter', { activeClasses: store.activeClasses })
    },
    { deep: true }
  )

  // Watch for predicted colors toggle
  watch(
    () => store.showPredictedColors,
    () => {
      // Only re-render data points, not grid
      if (d3Renderer) {
        throttledRender()
      }
    }
  )

  // Watch for optimization running state
  watch(
    () => store.optimizationHistory.isRunning,
    (isRunning) => {
      if (isRunning) {
        // During optimization, force more frequent renders
        if (d3Renderer) {
          render() // Immediate render without throttling
        }
      } else {
        // When optimization stops, do a final render
        if (d3Renderer) {
          throttledRender()
        }
      }
    }
  )

  // Watch for neuron movement updates during optimization
  watch(
    () => store.neuronMovements.length,
    () => {
      if (store.optimizationHistory.isRunning && d3Renderer) {
        render() // Immediate render for movement updates
      }
    }
  )

  // Watch for neuron position changes during optimization
  watch(
    () => store.neurons.map(n => `${n.id}-${n.x.toFixed(3)}-${n.y.toFixed(3)}`),
    () => {
      if (store.optimizationHistory.isRunning && d3Renderer) {
        render() // Immediate render for position updates
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
    // Unregister from grid update service
    gridUpdateService.unregisterGrid(gridId)
    
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