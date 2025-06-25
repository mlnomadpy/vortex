import * as d3 from 'd3'
import type { GridCell } from './d3Grid'
import type { DataPoint, Neuron } from '@/types'
import { getClassColor } from '@/utils/colors'

export interface RenderConfig {
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
}

/**
 * D3-based SVG renderer for neural network visualization
 * Handles efficient data binding, enter/update/exit patterns, and transitions
 */
export class D3SvgRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private gridGroup!: d3.Selection<SVGGElement, unknown, null, undefined>
  private axesGroup!: d3.Selection<SVGGElement, unknown, null, undefined>
  private dataPointsGroup!: d3.Selection<SVGGElement, unknown, null, undefined>
  private neuronsGroup!: d3.Selection<SVGGElement, unknown, null, undefined>

  constructor(
    svgElement: SVGSVGElement,
    private config: RenderConfig
  ) {
    this.svg = d3.select(svgElement)
    this.initializeGroups()
    this.setupClipPath()
  }

  /**
   * Initialize SVG groups for different layers
   */
  private initializeGroups(): void {
    // Clear existing content
    this.svg.selectAll('*').remove()

    // Create groups in render order (back to front)
    this.gridGroup = this.svg.append('g').attr('class', 'grid-group')
    this.axesGroup = this.svg.append('g').attr('class', 'axes-group')
    this.dataPointsGroup = this.svg.append('g').attr('class', 'data-points-group')
    this.neuronsGroup = this.svg.append('g').attr('class', 'neurons-group')
  }

  /**
   * Setup clipping path for grid boundaries
   */
  private setupClipPath(): void {
    const defs = this.svg.append('defs')
    defs.append('clipPath')
      .attr('id', 'canvas-clip')
      .append('rect')
      .attr('width', this.config.width)
      .attr('height', this.config.height)

    this.gridGroup.attr('clip-path', 'url(#canvas-clip)')
  }

  /**
   * Render grid cells using D3 data binding
   */
  renderGrid(
    cells: GridCell[],
    cellSize: number,
    options: {
      showGrid: boolean
      animated?: boolean
      transitionDuration?: number
    } = { showGrid: true }
  ): void {
    if (!options.showGrid) {
      this.gridGroup.selectAll('.grid-cell').remove()
      return
    }

    // Data binding with key function for stable updates
    const selection = this.gridGroup
      .selectAll('.grid-cell')
      .data(cells, (d: any) => `${d.x}-${d.y}`)

    // Enter selection
    const enterSelection = selection
      .enter()
      .append('rect')
      .attr('class', 'grid-cell')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('stroke', 'rgba(200, 200, 200, 0.3)')
      .attr('stroke-width', 0.5)

    // Update selection (enter + existing)
    const updateSelection = enterSelection.merge(selection as any)

    if (options.animated && options.transitionDuration) {
      updateSelection
        .transition()
        .duration(options.transitionDuration)
        .attr('fill', d => d.color || '#f8fafc')
        .attr('width', cellSize)
        .attr('height', cellSize)
    } else {
      updateSelection
        .attr('fill', d => d.color || '#f8fafc')
        .attr('width', cellSize)
        .attr('height', cellSize)
    }

    // Exit selection
    selection
      .exit()
      .transition()
      .duration(options.transitionDuration || 200)
      .style('opacity', 0)
      .remove()
  }

  /**
   * Render coordinate axes
   */
  renderAxes(
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
      showAxes?: boolean
      tickCount?: number
      axisColor?: string
    } = {}
  ): void {
    const {
      showAxes = true,
      tickCount = 5,
      axisColor = '#6b7280'
    } = options

    // Clear existing axes
    this.axesGroup.selectAll('*').remove()

    if (!showAxes) return

    // X-axis
    this.axesGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', this.config.height)
      .attr('x2', this.config.width)
      .attr('y2', this.config.height)
      .attr('stroke', axisColor)
      .attr('stroke-width', 1)

    // Y-axis
    this.axesGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.config.height)
      .attr('stroke', axisColor)
      .attr('stroke-width', 1)

    // Optional: Add tick marks and labels
    if (tickCount > 0) {
      this.renderAxisTicks(xScale, yScale, tickCount, axisColor)
    }
  }

  /**
   * Render axis ticks and labels
   */
  private renderAxisTicks(
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    tickCount: number,
    color: string
  ): void {
    // X-axis ticks
    const xTicks = xScale.ticks(tickCount)
    const xTickGroup = this.axesGroup.append('g').attr('class', 'x-ticks')

    xTickGroup
      .selectAll('.x-tick')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'x-tick')
      .attr('x1', d => xScale(d))
      .attr('y1', this.config.height)
      .attr('x2', d => xScale(d))
      .attr('y2', this.config.height + 5)
      .attr('stroke', color)
      .attr('stroke-width', 1)

    // Y-axis ticks
    const yTicks = yScale.ticks(tickCount)
    const yTickGroup = this.axesGroup.append('g').attr('class', 'y-ticks')

    yTickGroup
      .selectAll('.y-tick')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'y-tick')
      .attr('x1', 0)
      .attr('y1', d => yScale(d))
      .attr('x2', -5)
      .attr('y2', d => yScale(d))
      .attr('stroke', color)
      .attr('stroke-width', 1)
  }

  /**
   * Render data points with D3 data binding
   */
  renderDataPoints(
    points: DataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
      radius?: number
      getColor?: (point: DataPoint) => string
      getStroke?: (point: DataPoint) => string
      animated?: boolean
      onHover?: (event: MouseEvent, point: DataPoint) => void
      onClick?: (event: MouseEvent, point: DataPoint) => void
    } = {}
  ): void {
    const {
      radius = 6,
      getColor = (d) => getClassColor(d.label, 70, 60),
      getStroke = (d) => getClassColor(d.label, 70, 40),
      animated = true,
      onHover,
      onClick
    } = options

    // Data binding
    const selection = this.dataPointsGroup
      .selectAll('.data-point')
      .data(points, (d: any) => `${d.x}-${d.y}-${d.label}`)

    // Enter selection
    const enterSelection = selection
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 0) // Start with 0 radius for animation
      .attr('fill-opacity', 0.9)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Add event handlers
    if (onHover) {
      enterSelection.on('mouseenter', onHover)
    }
    if (onClick) {
      enterSelection.on('click', onClick)
    }

    // Update selection
    const updateSelection = enterSelection.merge(selection as any)

    if (animated) {
      updateSelection
        .transition()
        .duration(300)
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', radius)
        .attr('fill', getColor)
        .attr('stroke', getStroke)
    } else {
      updateSelection
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', radius)
        .attr('fill', getColor)
        .attr('stroke', getStroke)
    }

    // Exit selection
    selection
      .exit()
      .transition()
      .duration(200)
      .attr('r', 0)
      .style('opacity', 0)
      .remove()
  }

  /**
   * Render neurons with star shapes
   */
  renderNeurons(
    neurons: Neuron[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
      starGenerator?: (x: number, y: number) => string
      animated?: boolean
      onHover?: (event: MouseEvent, neuron: Neuron) => void
      onClick?: (event: MouseEvent, neuron: Neuron) => void
    } = {}
  ): void {
    const {
      starGenerator = this.generateStarPath,
      animated = true,
      onHover,
      onClick
    } = options

    // Data binding
    const selection = this.neuronsGroup
      .selectAll('.neuron')
      .data(neurons, (d: any) => d.id)

    // Enter selection
    const enterSelection = selection
      .enter()
      .append('path')
      .attr('class', 'neuron')
      .attr('d', d => starGenerator(xScale(d.x), yScale(d.y)))
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0) // Start invisible for animation

    // Add event handlers
    if (onHover) {
      enterSelection.on('mouseenter', onHover)
    }
    if (onClick) {
      enterSelection.on('click', onClick)
    }

    // Update selection
    const updateSelection = enterSelection.merge(selection as any)

    if (animated) {
      updateSelection
        .transition()
        .duration(300)
        .attr('d', d => starGenerator(xScale(d.x), yScale(d.y)))
        .attr('fill', d => d.color)
        .style('opacity', 1)
    } else {
      updateSelection
        .attr('d', d => starGenerator(xScale(d.x), yScale(d.y)))
        .attr('fill', d => d.color)
        .style('opacity', 1)
    }

    // Exit selection
    selection
      .exit()
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove()
  }

  /**
   * Generate star path for neurons
   */
  private generateStarPath(
    centerX: number,
    centerY: number,
    outerRadius: number = 12,
    innerRadius: number = 5,
    points: number = 5
  ): string {
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

  /**
   * Update renderer configuration
   */
  updateConfig(newConfig: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Update SVG dimensions
    if (newConfig.width) {
      this.svg.attr('width', newConfig.width)
    }
    if (newConfig.height) {
      this.svg.attr('height', newConfig.height)
    }

    // Update clip path
    this.svg.select('#canvas-clip rect')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
  }

  /**
   * Clear all rendered elements
   */
  clear(): void {
    this.gridGroup.selectAll('*').remove()
    this.axesGroup.selectAll('*').remove()
    this.dataPointsGroup.selectAll('*').remove()
    this.neuronsGroup.selectAll('*').remove()
  }

  /**
   * Add debug text to the SVG
   */
  addDebugText(text: string, x: number = 10, y: number = 30): void {
    this.svg.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('fill', 'red')
      .attr('font-size', '12')
      .attr('font-weight', 'bold')
      .text(text)
  }

  /**
   * Get SVG selection for custom rendering
   */
  getSvgSelection(): d3.Selection<SVGSVGElement, unknown, null, undefined> {
    return this.svg
  }

  /**
   * Get group selections for direct manipulation
   */
  getGroups() {
    return {
      grid: this.gridGroup,
      axes: this.axesGroup,
      dataPoints: this.dataPointsGroup,
      neurons: this.neuronsGroup
    }
  }
}

/**
 * Factory function to create a D3SvgRenderer instance
 */
export function createD3SvgRenderer(
  svgElement: SVGSVGElement,
  config: RenderConfig
): D3SvgRenderer {
  return new D3SvgRenderer(svgElement, config)
}

/**
 * Utility functions for D3 rendering
 */
export const renderUtils = {
  /**
   * Create a color scale for data points
   */
  createColorScale(domain: number[]): d3.ScaleOrdinal<string, string> {
    return d3.scaleOrdinal(d3.schemeCategory10).domain(domain.map(String))
  },

  /**
   * Create a debounced render function
   */
  createDebouncedRender<T extends any[]>(
    renderFn: (...args: T) => void,
    delay: number = 100
  ): (...args: T) => void {
    let timeoutId: NodeJS.Timeout | null = null
    
    return (...args: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        renderFn(...args)
        timeoutId = null
      }, delay)
    }
  },

  /**
   * Calculate optimal viewport for data
   */
  calculateViewport(
    points: Array<{ x: number; y: number }>,
    padding: number = 0.1
  ): { xDomain: [number, number]; yDomain: [number, number] } {
    if (points.length === 0) {
      return { xDomain: [-1, 1], yDomain: [-1, 1] }
    }

    const xExtent = d3.extent(points, d => d.x) as [number, number]
    const yExtent = d3.extent(points, d => d.y) as [number, number]

    const xRange = xExtent[1] - xExtent[0]
    const yRange = yExtent[1] - yExtent[0]

    return {
      xDomain: [xExtent[0] - xRange * padding, xExtent[1] + xRange * padding],
      yDomain: [yExtent[0] - yRange * padding, yExtent[1] + yRange * padding]
    }
  }
} 