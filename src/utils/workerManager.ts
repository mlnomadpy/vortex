/**
 * Web Worker Manager for MNIST Training
 * Handles communication with the training worker to keep the main thread responsive
 */

import type { NDDataPoint, NDNeuron, NDSimilarityMetric, ActivationFunction } from '@/types'

export interface WorkerMessage {
  type: string
  data: any
  id: string
}

export interface WorkerResponse {
  type: string
  data: any
  id: string
}

export interface GradientResult {
  neuronId: number
  weights: number[]
  bias: number
}

export interface BatchGradientResult {
  gradients: GradientResult[]
  usedGpu: boolean
}

export class MNISTWorkerManager {
  private worker: Worker | null = null
  private messageId = 0
  private pendingMessages = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>()
  private isInitialized = false

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker(): void {
    try {
      // Create worker from public directory
      this.worker = new Worker('/mnist-worker.js')
      
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, data, id } = e.data
        
        if (id && this.pendingMessages.has(id)) {
          const { resolve, reject } = this.pendingMessages.get(id)!
          this.pendingMessages.delete(id)
          
          if (type === 'ERROR') {
            reject(new Error(data.message))
          } else {
            resolve(data)
          }
        }
        
        // Handle specific message types
        switch (type) {
          case 'INITIALIZE_COMPLETE':
            this.isInitialized = data.success
            console.log('[WorkerManager] Worker initialized:', data)
            break
          case 'ERROR':
            console.error('[WorkerManager] Worker error:', data)
            break
        }
      }
      
      this.worker.onerror = (error) => {
        console.error('[WorkerManager] Worker error:', error)
        this.isInitialized = false
        
        // Reject all pending messages
        this.pendingMessages.forEach(({ reject }) => {
          reject(new Error('Worker error: ' + error.message))
        })
        this.pendingMessages.clear()
      }
      
      // Initialize the worker
      this.initialize()
      
    } catch (error) {
      console.error('[WorkerManager] Failed to create worker:', error)
      this.isInitialized = false
    }
  }

  private generateId(): string {
    return `msg_${++this.messageId}_${Date.now()}`
  }

  private sanitizeDataForWorker(data: any): any {
    try {
      // Convert to plain objects/arrays by serializing and parsing
      // This removes any methods, prototypes, or circular references
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      console.error('Data sanitization failed:', error)
      throw new Error('Cannot serialize data for worker transfer')
    }
  }

  private sendMessage<T>(type: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'))
        return
      }

      const id = this.generateId()
      this.pendingMessages.set(id, { resolve, reject })

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id)
          reject(new Error(`Worker message timeout: ${type}`))
        }
      }, 30000) // 30 second timeout

      // Sanitize data to ensure it's cloneable
      const sanitizedData = this.sanitizeDataForWorker(data)
      this.worker.postMessage({ type, data: sanitizedData, id })
    })
  }

  /**
   * Initialize the worker
   */
  async initialize(): Promise<{ success: boolean; backend: string; gpuEnabled: boolean }> {
    try {
      const result = await this.sendMessage<{ success: boolean; backend: string; gpuEnabled: boolean }>('INITIALIZE', {})
      this.isInitialized = result.success
      return result
    } catch (error) {
      console.error('[WorkerManager] Failed to initialize worker:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * Compute batch gradients using the worker
   */
  async computeBatchGradients(
    neurons: NDNeuron[],
    batchData: NDDataPoint[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction,
    useGpu: boolean = true
  ): Promise<BatchGradientResult> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized')
    }

    return this.sendMessage<BatchGradientResult>('COMPUTE_BATCH_GRADIENTS', {
      neurons: neurons.map(n => ({
        id: n.id,
        weights: n.weights,
        bias: n.bias,
        label: n.label
      })),
      batchData: batchData.map(d => ({
        features: d.features,
        label: d.label
      })),
      similarityMetric,
      activationFunction,
      useGpu
    })
  }

  /**
   * Compute similarity scores using the worker
   */
  async computeSimilarityScores(
    features: number[],
    neurons: NDNeuron[],
    metric: NDSimilarityMetric
  ): Promise<{ neuronId: number; score: number }[]> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized')
    }

    return this.sendMessage('COMPUTE_SIMILARITY_SCORES', {
      features,
      neurons: neurons.map(n => ({
        id: n.id,
        weights: n.weights,
        bias: n.bias
      })),
      metric
    })
  }

  /**
   * Compute loss using the worker
   */
  async computeLoss(
    dataPoints: NDDataPoint[],
    neurons: NDNeuron[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized')
    }

    return this.sendMessage<number>('COMPUTE_LOSS', {
      dataPoints: dataPoints.map(d => ({
        features: d.features,
        label: d.label
      })),
      lossNeurons: neurons.map(n => ({
        id: n.id,
        weights: n.weights,
        bias: n.bias
      })),
      lossSimilarityMetric: similarityMetric,
      lossActivationFunction: activationFunction
    })
  }

  /**
   * Compute accuracy using the worker
   */
  async computeAccuracy(
    testData: NDDataPoint[],
    neurons: NDNeuron[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Worker not initialized')
    }

    return this.sendMessage<number>('COMPUTE_ACCURACY', {
      testData: testData.map(d => ({
        features: d.features,
        label: d.label
      })),
      accNeurons: neurons.map(n => ({
        id: n.id,
        weights: n.weights,
        bias: n.bias
      })),
      accSimilarityMetric: similarityMetric,
      accActivationFunction: activationFunction
    })
  }

  /**
   * Get memory info from the worker
   */
  async getMemoryInfo(): Promise<any> {
    if (!this.isInitialized) {
      return null
    }

    try {
      return await this.sendMessage('GET_MEMORY_INFO', {})
    } catch (error) {
      console.warn('[WorkerManager] Failed to get memory info:', error)
      return null
    }
  }

  /**
   * Clean up worker resources
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      await this.sendMessage('CLEANUP', {})
    } catch (error) {
      console.warn('[WorkerManager] Failed to cleanup worker:', error)
    }
  }

  /**
   * Check if worker is available and initialized
   */
  isWorkerReady(): boolean {
    return this.isInitialized && this.worker !== null
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.isInitialized = false
    
    // Reject all pending messages
    this.pendingMessages.forEach(({ reject }) => {
      reject(new Error('Worker terminated'))
    })
    this.pendingMessages.clear()
  }

  /**
   * Restart the worker
   */
  async restart(): Promise<void> {
    this.terminate()
    this.initializeWorker()
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

// Export singleton instance
export const mnistWorkerManager = new MNISTWorkerManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mnistWorkerManager.terminate()
  })
} 