import { ref } from 'vue'
import type { D3Grid } from '@/utils/d3Grid'

export type UpdatePriority = 'immediate' | 'high' | 'normal' | 'low'
export type UpdateType = 'neuron-add' | 'neuron-remove' | 'neuron-move' | 'neuron-color' | 'boundary-toggle' | 'metric-change' | 'data-change' | 'resize' | 'grid-size'

export interface GridUpdateRequest {
  id: string
  type: UpdateType
  priority: UpdatePriority
  timestamp: number
  metadata?: any
}

/**
 * Centralized grid update service
 * Manages update scheduling, batching, and prioritization
 */
export class GridUpdateService {
  private static instance: GridUpdateService | null = null
  
  private updateQueue: Map<string, GridUpdateRequest> = new Map()
  private isProcessing = false
  private lastUpdateTime = 0
  private readonly minUpdateInterval = 100
  private readonly maxBatchSize = 5
  
  // Priority order (lower number = higher priority)
  private readonly priorityOrder: Record<UpdatePriority, number> = {
    immediate: 0,
    high: 1,
    normal: 2,
    low: 3
  }

  // Update type configurations
  private readonly updateConfigs: Record<UpdateType, { priority: UpdatePriority; batchable: boolean }> = {
    'neuron-add': { priority: 'immediate', batchable: false },
    'neuron-remove': { priority: 'immediate', batchable: false },
    'neuron-move': { priority: 'high', batchable: true },
    'neuron-color': { priority: 'high', batchable: true },
    'boundary-toggle': { priority: 'immediate', batchable: false },
    'metric-change': { priority: 'immediate', batchable: false },
    'data-change': { priority: 'normal', batchable: true },
    'resize': { priority: 'immediate', batchable: false },
    'grid-size': { priority: 'immediate', batchable: false }
  }

  private registeredGrids: Map<string, D3Grid> = new Map()
  private updateCallbacks: Map<string, () => void> = new Map()

  static getInstance(): GridUpdateService {
    if (!GridUpdateService.instance) {
      GridUpdateService.instance = new GridUpdateService()
    }
    return GridUpdateService.instance
  }

  /**
   * Register a grid instance for updates
   */
  registerGrid(id: string, grid: D3Grid, updateCallback: () => void): void {
    this.registeredGrids.set(id, grid)
    this.updateCallbacks.set(id, updateCallback)
  }

  /**
   * Unregister a grid instance
   */
  unregisterGrid(id: string): void {
    this.registeredGrids.delete(id)
    this.updateCallbacks.delete(id)
  }

  /**
   * Schedule a grid update
   */
  scheduleUpdate(
    type: UpdateType,
    metadata?: any,
    customPriority?: UpdatePriority,
    gridId?: string
  ): string {
    const config = this.updateConfigs[type]
    const priority = customPriority || config.priority
    const id = gridId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const request: GridUpdateRequest = {
      id,
      type,
      priority,
      timestamp: Date.now(),
      metadata
    }

    // For immediate updates, process right away
    if (priority === 'immediate') {
      this.processUpdate(request)
      return id
    }

    // Add to queue
    this.updateQueue.set(id, request)

    // Schedule processing
    if (!this.isProcessing) {
      this.scheduleProcessing()
    }

    return id
  }

  /**
   * Cancel a scheduled update
   */
  cancelUpdate(id: string): boolean {
    return this.updateQueue.delete(id)
  }

  /**
   * Force immediate processing of all queued updates
   */
  flushUpdates(): void {
    this.processQueue()
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueSize: number
    isProcessing: boolean
    lastUpdateTime: number
    registeredGrids: number
  } {
    return {
      queueSize: this.updateQueue.size,
      isProcessing: this.isProcessing,
      lastUpdateTime: this.lastUpdateTime,
      registeredGrids: this.registeredGrids.size
    }
  }

  private scheduleProcessing(): void {
    const now = Date.now()
    const timeSinceLastUpdate = now - this.lastUpdateTime

    if (timeSinceLastUpdate >= this.minUpdateInterval) {
      // Process immediately
      requestAnimationFrame(() => this.processQueue())
    } else {
      // Schedule for later
      setTimeout(() => {
        if (!this.isProcessing && this.updateQueue.size > 0) {
          this.processQueue()
        }
      }, this.minUpdateInterval - timeSinceLastUpdate)
    }
  }

  private processQueue(): void {
    if (this.isProcessing || this.updateQueue.size === 0) return

    this.isProcessing = true

    try {
      // Sort updates by priority and timestamp
      const sortedUpdates = Array.from(this.updateQueue.values())
        .sort((a, b) => {
          const priorityDiff = this.priorityOrder[a.priority] - this.priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          return a.timestamp - b.timestamp
        })

      // Process batch
      const batch = sortedUpdates.slice(0, this.maxBatchSize)
      batch.forEach(update => {
        this.processUpdate(update)
        this.updateQueue.delete(update.id)
      })

      this.lastUpdateTime = Date.now()

      // Schedule next batch if there are more updates
      if (this.updateQueue.size > 0) {
        requestAnimationFrame(() => {
          this.isProcessing = false
          this.scheduleProcessing()
        })
      } else {
        this.isProcessing = false
      }
    } catch (error) {
      console.error('Error processing grid updates:', error)
      this.isProcessing = false
    }
  }

  private processUpdate(update: GridUpdateRequest): void {
    // Clear caches based on update type
    this.registeredGrids.forEach(grid => {
      switch (update.type) {
        case 'neuron-add':
        case 'neuron-remove':
        case 'metric-change':
        case 'boundary-toggle':
          grid.clearCache()
          break
          
        case 'neuron-move':
        case 'neuron-color':
          if (update.metadata?.neuronId) {
            grid.clearCacheForNeuron(update.metadata.neuronId)
          } else {
            grid.clearCache()
          }
          break
          
        case 'data-change':
          // Partial cache clear might be beneficial here
          grid.clearCache()
          break
          
        case 'resize':
        case 'grid-size':
          grid.clearCache()
          break
      }
    })

    // Trigger re-renders
    this.updateCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in grid update callback:', error)
      }
    })
  }
}

// Create and export singleton instance
export const gridUpdateService = GridUpdateService.getInstance()

// Reactive stats for debugging
export const gridUpdateStats = ref({
  queueSize: 0,
  isProcessing: false,
  lastUpdateTime: 0,
  registeredGrids: 0
})

// Update stats periodically
setInterval(() => {
  const stats = gridUpdateService.getQueueStats()
  gridUpdateStats.value = stats
}, 1000)

// Helper functions for common update patterns
export const gridUpdates = {
  neuronAdded: (neuronId?: number) => 
    gridUpdateService.scheduleUpdate('neuron-add', { neuronId }),
    
  neuronRemoved: (neuronId?: number) => 
    gridUpdateService.scheduleUpdate('neuron-remove', { neuronId }),
    
  neuronMoved: (neuronId: number, oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => 
    gridUpdateService.scheduleUpdate('neuron-move', { neuronId, oldPos, newPos }),
    
  neuronColorChanged: (neuronId: number, oldColor: string, newColor: string) => 
    gridUpdateService.scheduleUpdate('neuron-color', { neuronId, oldColor, newColor }),
    
  boundariesToggled: (enabled: boolean) => 
    gridUpdateService.scheduleUpdate('boundary-toggle', { enabled }),
    
  metricChanged: (oldMetric: string, newMetric: string) => 
    gridUpdateService.scheduleUpdate('metric-change', { oldMetric, newMetric }),
    
  dataChanged: (changeType: 'filter' | 'load' | 'clear', metadata?: any) => 
    gridUpdateService.scheduleUpdate('data-change', { changeType, ...metadata }),
    
  canvasResized: (oldSize: { width: number; height: number }, newSize: { width: number; height: number }) => 
    gridUpdateService.scheduleUpdate('resize', { oldSize, newSize }),
    
  gridSizeChanged: (oldSize: number, newSize: number) => 
    gridUpdateService.scheduleUpdate('grid-size', { oldSize, newSize })
} 