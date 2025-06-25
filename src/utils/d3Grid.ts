import * as d3 from 'd3'
import type { Neuron } from '@/types'

export interface GridConfig {
  width: number
  height: number
  cellSize: number
  gridSize?: number // Number of cells per dimension (optional, takes precedence over cellSize)
  xDomain: [number, number]
  yDomain: [number, number]
}

export interface GridCell {
  x: number
  y: number
  worldX: number
  worldY: number
  value?: number
  color?: string
  neuronId?: number
}

export interface DecisionBoundaryConfig extends GridConfig {
  neurons: Neuron[]
  calculateScore: (neuron: Neuron, x: number, y: number) => number
  applyActivation: (scores: number[]) => number[]
}

/**
 * D3-based grid generator for neural network visualization
 * Follows D3 patterns for data binding and efficient updates
 */
export class D3Grid {
  private xScale: d3.ScaleLinear<number, number>
  private yScale: d3.ScaleLinear<number, number>
  private colorCache = new Map<string, string>()
  private readonly maxCacheSize = 2000

  constructor(private config: GridConfig) {
    this.xScale = d3.scaleLinear()
      .domain(config.xDomain)
      .range([0, config.width])

    this.yScale = d3.scaleLinear()
      .domain(config.yDomain)
      .range([config.height, 0])
  }

  /**
   * Update grid configuration and rebuild scales
   */
  updateConfig(newConfig: Partial<GridConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.xDomain) {
      this.xScale.domain(newConfig.xDomain)
    }
    if (newConfig.yDomain) {
      this.yScale.domain(newConfig.yDomain)
    }
    if (newConfig.width) {
      this.xScale.range([0, newConfig.width])
    }
    if (newConfig.height) {
      this.yScale.range([newConfig.height, 0])
    }

    // Clear cache when configuration changes
    this.clearCache()
  }

  /**
   * Generate grid cells using D3 patterns
   * Returns an array of grid cells with world coordinates
   */
  generateGrid(): GridCell[] {
    const { width, height, cellSize, gridSize } = this.config
    const cells: GridCell[] = []

    let numCellsX: number
    let numCellsY: number

    if (gridSize !== undefined) {
      // Use explicit grid size (number of cells per dimension)
      numCellsX = gridSize
      numCellsY = gridSize
    } else {
      // Fallback to calculating based on cell size
      numCellsX = Math.ceil(width / cellSize)
      numCellsY = Math.ceil(height / cellSize)
    }

    // Calculate actual cell size to fit exactly in the canvas
    const actualCellWidth = width / numCellsX
    const actualCellHeight = height / numCellsY

    for (let i = 0; i < numCellsX; i++) {
      for (let j = 0; j < numCellsY; j++) {
        const x = i * actualCellWidth
        const y = j * actualCellHeight
        
        // Convert to world coordinates for the center of the cell
        const worldX = this.xScale.invert(x + actualCellWidth / 2)
        const worldY = this.yScale.invert(y + actualCellHeight / 2)

        cells.push({
          x,
          y,
          worldX,
          worldY
        })
      }
    }

    return cells
  }

  /**
   * Generate grid with decision boundary colors
   * Uses memoization for performance
   */
  generateDecisionBoundaryGrid(boundaryConfig: DecisionBoundaryConfig): GridCell[] {
    const cells = this.generateGrid()
    const { neurons, calculateScore, applyActivation } = boundaryConfig

    if (neurons.length === 0) {
      return cells.map(cell => ({
        ...cell,
        color: '#f8fafc',
        value: 0
      }))
    }

    return cells.map(cell => {
      const cacheKey = this.getCacheKey(cell.worldX, cell.worldY, neurons)
      
      if (this.colorCache.has(cacheKey)) {
        const cachedValue = this.colorCache.get(cacheKey)
        if (cachedValue) {
          const cachedData = JSON.parse(cachedValue)
          return { ...cell, ...cachedData }
        }
      }

      // Manage cache size
      if (this.colorCache.size > this.maxCacheSize) {
        const firstKey = this.colorCache.keys().next().value
        if (firstKey) {
          this.colorCache.delete(firstKey)
        }
      }

      // Calculate scores for all neurons at this position
      const rawScores = neurons.map(neuron => 
        calculateScore(neuron, cell.worldX, cell.worldY)
      )

      // Apply activation function
      const activatedScores = applyActivation(rawScores)

      // Find winning neuron
      const maxIndex = d3.maxIndex(activatedScores)
      const maxScore = activatedScores[maxIndex]
      const winningNeuron = maxIndex !== undefined ? neurons[maxIndex] : null

      let color = '#f8fafc'
      let opacity = 0.05

      if (winningNeuron && maxScore > 0) {
        // Calculate dynamic opacity based on confidence
        opacity = Math.max(0.3, Math.min(0.8, Math.abs(maxScore) * 0.4 + 0.3))
        color = this.applyOpacityToColor(winningNeuron.color, opacity)
      }

      const cellData = {
        color,
        value: maxScore,
        neuronId: winningNeuron?.id
      }

      // Cache the result
      this.colorCache.set(cacheKey, JSON.stringify(cellData))

      return {
        ...cell,
        ...cellData
      }
    })
  }

  /**
   * Convert canvas coordinates to world coordinates
   */
  canvasToWorld(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: this.xScale.invert(canvasX),
      y: this.yScale.invert(canvasY)
    }
  }

  /**
   * Convert world coordinates to canvas coordinates
   */
  worldToCanvas(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: this.xScale(worldX),
      y: this.yScale(worldY)
    }
  }

  /**
   * Get scales for external use
   */
  getScales(): { xScale: d3.ScaleLinear<number, number>; yScale: d3.ScaleLinear<number, number> } {
    return { xScale: this.xScale, yScale: this.yScale }
  }

  /**
   * Clear the color cache
   */
  clearCache(): void {
    this.colorCache.clear()
  }

  /**
   * Partial cache clear for specific regions or conditions
   */
  clearCacheForRegion(xMin: number, xMax: number, yMin: number, yMax: number): void {
    const keysToDelete: string[] = []
    
    for (const key of this.colorCache.keys()) {
      const [x, y] = key.split('-').map(parseFloat)
      if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.colorCache.delete(key))
  }

  /**
   * Clear cache for specific neuron changes
   */
  clearCacheForNeuron(neuronId: number): void {
    const keysToDelete: string[] = []
    
    for (const key of this.colorCache.keys()) {
      if (key.includes(`-${neuronId}-`)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.colorCache.delete(key))
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.colorCache.size,
      maxSize: this.maxCacheSize
    }
  }

  /**
   * Precompute grid for better performance
   */
  precomputeGrid(boundaryConfig: DecisionBoundaryConfig, priority: 'fast' | 'quality' = 'fast'): void {
    if (boundaryConfig.neurons.length === 0) return

    const cells = this.generateGrid()
    const batchSize = priority === 'fast' ? 50 : 20
    
    // Process in batches to avoid blocking the main thread
    const processBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, cells.length)
      
      for (let i = startIndex; i < endIndex; i++) {
        const cell = cells[i]
        const cacheKey = this.getCacheKey(cell.worldX, cell.worldY, boundaryConfig.neurons)
        
        if (!this.colorCache.has(cacheKey)) {
          // Compute and cache the result
          const rawScores = boundaryConfig.neurons.map(neuron => 
            boundaryConfig.calculateScore(neuron, cell.worldX, cell.worldY)
          )
          const activatedScores = boundaryConfig.applyActivation(rawScores)
          const maxIndex = d3.maxIndex(activatedScores)
          const maxScore = activatedScores[maxIndex]
          const winningNeuron = maxIndex !== undefined ? boundaryConfig.neurons[maxIndex] : null

          let color = '#f8fafc'
          let opacity = 0.05

          if (winningNeuron && maxScore > 0) {
            opacity = Math.max(0.3, Math.min(0.8, Math.abs(maxScore) * 0.4 + 0.3))
            color = this.applyOpacityToColor(winningNeuron.color, opacity)
          }

          const cellData = {
            color,
            value: maxScore,
            neuronId: winningNeuron?.id
          }

          this.colorCache.set(cacheKey, JSON.stringify(cellData))
        }
      }

      // Continue with next batch if there are more cells
      if (endIndex < cells.length) {
        requestAnimationFrame(() => processBatch(endIndex))
      }
    }

    // Start processing
    requestAnimationFrame(() => processBatch(0))
  }

  /**
   * Generate cache key for memoization
   */
  private getCacheKey(x: number, y: number, neurons: Neuron[]): string {
    // Include neuron positions and colors in cache key
    const neuronHash = neurons
      .map(n => `${n.id}-${n.x.toFixed(3)}-${n.y.toFixed(3)}-${n.color}`)
      .join('|')
    
    return `${x.toFixed(3)}-${y.toFixed(3)}-${this.config.cellSize}-${neuronHash}`
  }

  /**
   * Apply opacity to color (supports hex, hsl, and rgb)
   */
  private applyOpacityToColor(color: string, opacity: number): string {
    if (color.startsWith('#') && color.length === 7) {
      // Convert hex to rgba
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    } else if (color.startsWith('hsl')) {
      // Convert HSL to HSLA
      const hslMatch = color.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
      if (hslMatch) {
        const h = parseFloat(hslMatch[1])
        const s = parseFloat(hslMatch[2])
        const l = parseFloat(hslMatch[3])
        return `hsla(${h}, ${s}%, ${l}%, ${opacity})`
      }
    }
    
    // Fallback - return original color
    return color
  }
}

/**
 * Factory function to create a D3Grid instance
 */
export function createD3Grid(config: GridConfig): D3Grid {
  return new D3Grid(config)
}

/**
 * Utility functions for grid operations
 */
export const gridUtils = {
  /**
   * Calculate optimal cell size based on canvas dimensions and performance constraints
   */
  calculateOptimalCellSize(width: number, height: number, maxCells: number = 2500): number {
    const totalArea = width * height
    const cellArea = totalArea / maxCells
    return Math.max(8, Math.sqrt(cellArea)) // Minimum 8px cells
  },

  /**
   * Create a throttled version of grid update function
   */
  createThrottledUpdate<T extends any[]>(
    updateFn: (...args: T) => void,
    delay: number = 16
  ): (...args: T) => void {
    let timeoutId: NodeJS.Timeout | null = null
    
    return (...args: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        updateFn(...args)
        timeoutId = null
      }, delay)
    }
  },

  /**
   * Batch process grid cells for better performance
   */
  batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => R[],
    batchSize: number = 100
  ): R[] {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      results.push(...processor(batch))
    }
    
    return results
  }
} 