import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GridUpdateService, gridUpdates } from '@/services/gridUpdateService'

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0)
  return 0
})

// Mock D3Grid
const createMockGrid = () => ({
  clearCache: vi.fn(),
  clearCacheForNeuron: vi.fn()
})

describe('GridUpdateService', () => {
  let service: GridUpdateService
  let mockGrid1: ReturnType<typeof createMockGrid>
  let mockGrid2: ReturnType<typeof createMockGrid>
  let mockCallback1: ReturnType<typeof vi.fn>
  let mockCallback2: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Get a fresh instance
    service = GridUpdateService.getInstance()
    
    // Create mocks
    mockGrid1 = createMockGrid()
    mockGrid2 = createMockGrid()
    mockCallback1 = vi.fn()
    mockCallback2 = vi.fn()
    
    // Clear all timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Flush any pending updates
    service.flushUpdates()
    
    // Unregister grids
    service.unregisterGrid('grid1')
    service.unregisterGrid('grid2')
    
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GridUpdateService.getInstance()
      const instance2 = GridUpdateService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('registerGrid', () => {
    it('should register a grid with callback', () => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      
      const stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(1)
    })

    it('should register multiple grids', () => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      service.registerGrid('grid2', mockGrid2 as any, mockCallback2)
      
      const stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(2)
    })

    it('should replace existing grid with same ID', () => {
      const newMockGrid = createMockGrid()
      const newCallback = vi.fn()
      
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      service.registerGrid('grid1', newMockGrid as any, newCallback)
      
      const stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(1)
    })
  })

  describe('unregisterGrid', () => {
    it('should unregister a grid', () => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      
      let stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(1)
      
      service.unregisterGrid('grid1')
      
      stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(0)
    })

    it('should handle unregistering non-existent grid', () => {
      service.unregisterGrid('non-existent')
      
      const stats = service.getQueueStats()
      expect(stats.registeredGrids).toBe(0)
    })
  })

  describe('scheduleUpdate', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
    })

    it('should process immediate updates right away', () => {
      service.scheduleUpdate('boundary-toggle', { enabled: true })
      
      expect(mockGrid1.clearCache).toHaveBeenCalled()
      expect(mockCallback1).toHaveBeenCalled()
    })

    it('should queue non-immediate updates', () => {
      service.scheduleUpdate('data-change', { changeType: 'filter' })
      
      const stats = service.getQueueStats()
      expect(stats.queueSize).toBe(1)
    })

    it('should return unique ID for update', () => {
      const id1 = service.scheduleUpdate('data-change')
      const id2 = service.scheduleUpdate('data-change')
      
      expect(id1).not.toBe(id2)
    })

    it('should allow custom priority', () => {
      service.scheduleUpdate('data-change', {}, 'immediate')
      
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })
  })

  describe('cancelUpdate', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
    })

    it('should cancel queued update', () => {
      const id = service.scheduleUpdate('data-change')
      
      let stats = service.getQueueStats()
      expect(stats.queueSize).toBe(1)
      
      const cancelled = service.cancelUpdate(id)
      
      expect(cancelled).toBe(true)
      stats = service.getQueueStats()
      expect(stats.queueSize).toBe(0)
    })

    it('should return false for non-existent update', () => {
      const cancelled = service.cancelUpdate('non-existent-id')
      expect(cancelled).toBe(false)
    })
  })

  describe('flushUpdates', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
    })

    it('should process all queued updates', () => {
      service.scheduleUpdate('data-change')
      service.scheduleUpdate('neuron-move', { neuronId: 1 })
      
      let stats = service.getQueueStats()
      expect(stats.queueSize).toBe(2)
      
      service.flushUpdates()
      
      stats = service.getQueueStats()
      expect(stats.queueSize).toBe(0)
      expect(mockCallback1).toHaveBeenCalled()
    })
  })

  describe('update types', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
    })

    it('should clear cache for neuron-add', () => {
      service.scheduleUpdate('neuron-add', { neuronId: 1 })
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('should clear cache for neuron-remove', () => {
      service.scheduleUpdate('neuron-remove', { neuronId: 1 })
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('should clear cache for metric-change', () => {
      service.scheduleUpdate('metric-change', { oldMetric: 'a', newMetric: 'b' })
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('should clear cache for boundary-toggle', () => {
      service.scheduleUpdate('boundary-toggle', { enabled: true })
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('should clear cache for neuron-specific with neuronId', () => {
      service.scheduleUpdate('neuron-move', { neuronId: 5 })
      service.flushUpdates()
      
      expect(mockGrid1.clearCacheForNeuron).toHaveBeenCalledWith(5)
    })

    it('should clear full cache for neuron-move without neuronId', () => {
      service.scheduleUpdate('neuron-move', {})
      service.flushUpdates()
      
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })
  })

  describe('getQueueStats', () => {
    it('should return correct stats', () => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      service.scheduleUpdate('data-change')
      service.scheduleUpdate('neuron-move')
      
      const stats = service.getQueueStats()
      
      expect(stats.queueSize).toBe(2)
      expect(stats.isProcessing).toBe(false)
      expect(stats.registeredGrids).toBe(1)
      expect(stats.lastUpdateTime).toBeDefined()
    })
  })

  describe('helper functions', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
    })

    it('gridUpdates.neuronAdded should schedule neuron-add', () => {
      gridUpdates.neuronAdded(5)
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.neuronRemoved should schedule neuron-remove', () => {
      gridUpdates.neuronRemoved(3)
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.neuronMoved should schedule neuron-move', () => {
      gridUpdates.neuronMoved(1, { x: 0, y: 0 }, { x: 10, y: 10 })
      service.flushUpdates()
      expect(mockGrid1.clearCacheForNeuron).toHaveBeenCalledWith(1)
    })

    it('gridUpdates.boundariesToggled should schedule boundary-toggle', () => {
      gridUpdates.boundariesToggled(true)
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.metricChanged should schedule metric-change', () => {
      gridUpdates.metricChanged('old', 'new')
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.dataChanged should schedule data-change', () => {
      gridUpdates.dataChanged('filter', { count: 100 })
      const stats = service.getQueueStats()
      expect(stats.queueSize).toBe(1)
    })

    it('gridUpdates.canvasResized should schedule resize', () => {
      gridUpdates.canvasResized(
        { width: 800, height: 600 },
        { width: 1024, height: 768 }
      )
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.gridSizeChanged should schedule grid-size', () => {
      gridUpdates.gridSizeChanged(20, 30)
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })

    it('gridUpdates.reinitializeGrid should schedule reinitialize', () => {
      gridUpdates.reinitializeGrid('test reason')
      expect(mockGrid1.clearCache).toHaveBeenCalled()
    })
  })

  describe('multiple grids', () => {
    beforeEach(() => {
      service.registerGrid('grid1', mockGrid1 as any, mockCallback1)
      service.registerGrid('grid2', mockGrid2 as any, mockCallback2)
    })

    it('should update all registered grids', () => {
      service.scheduleUpdate('boundary-toggle', { enabled: true })
      
      expect(mockGrid1.clearCache).toHaveBeenCalled()
      expect(mockGrid2.clearCache).toHaveBeenCalled()
      expect(mockCallback1).toHaveBeenCalled()
      expect(mockCallback2).toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      mockCallback1.mockImplementation(() => {
        throw new Error('Callback error')
      })
      
      // Should not throw
      expect(() => {
        service.scheduleUpdate('boundary-toggle')
      }).not.toThrow()
      
      // Second callback should still be called
      expect(mockCallback2).toHaveBeenCalled()
    })
  })
})
