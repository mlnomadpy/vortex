/**
 * TensorFlow.js GPU-accelerated utilities for MNIST classification
 */

declare global {
  interface Window {
    tf: any
    tfBackend: string
    tfGpuEnabled: boolean
  }
}

export class TensorFlowMNIST {
  private model: any = null
  private isGpuEnabled: boolean = false

  constructor() {
    this.checkGpuSupport()
  }

  private checkGpuSupport(): void {
    if (typeof window !== 'undefined' && window.tf) {
      this.isGpuEnabled = window.tfGpuEnabled || window.tf.getBackend() === 'webgl'
      console.log(`TensorFlow.js GPU support: ${this.isGpuEnabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Create a simple neural network model for MNIST classification
   */
  createModel(inputSize: number = 784, numClasses: number = 10): any {
    if (!window.tf) {
      throw new Error('TensorFlow.js not loaded')
    }

    const tf = window.tf

    // Create a simple feedforward model
    this.model = tf.sequential({
      layers: [
        // Input layer - reshape to match our 784 features
        tf.layers.dense({
          inputShape: [inputSize],
          units: numClasses,
          activation: 'linear',
          name: 'output_layer'
        })
      ]
    })

    // Compile with GPU-optimized settings
    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    console.log('TensorFlow.js model created with GPU acceleration:', this.isGpuEnabled)
    return this.model
  }

  /**
   * Convert our custom weights to TensorFlow.js tensors
   */
  weightsToTensor(weights: number[][]): any {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')
    
    const tf = window.tf
    return tf.tensor2d(weights)
  }

  /**
   * Convert data to tensors for GPU processing
   */
  dataToTensor(features: number[][], labels: number[]): { x: any, y: any } {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')
    
    const tf = window.tf
    
    // Convert features to tensor
    const x = tf.tensor2d(features)
    
    // Convert labels to one-hot encoding
    const y = tf.oneHot(tf.tensor1d(labels, 'int32'), 10)
    
    return { x, y }
  }

  /**
   * Perform GPU-accelerated batch gradient computation
   */
  async computeBatchGradients(
    weights: number[][],
    batchFeatures: number[][],
    batchLabels: number[],
    similarityMetric: string = 'dotProduct'
  ): Promise<number[][]> {
    if (!window.tf || !this.model) {
      throw new Error('TensorFlow.js model not initialized')
    }

    const tf = window.tf

    return tf.tidy(() => {
      // Convert to tensors
      const weightTensor = tf.tensor2d(weights)
      const featuresTensor = tf.tensor2d(batchFeatures)
      const labelsTensor = tf.oneHot(tf.tensor1d(batchLabels, 'int32'), 10)

      // Compute forward pass
      let scores: any
      switch (similarityMetric) {
        case 'dotProduct':
          scores = tf.matMul(featuresTensor, weightTensor, false, true)
          break
        case 'euclidean':
          // Negative euclidean distance as similarity
          const expanded = tf.expandDims(featuresTensor, 1) // [batch, 1, features]
          const weightsExpanded = tf.expandDims(weightTensor, 0) // [1, neurons, features]
          const diff = tf.sub(expanded, weightsExpanded)
          const distSq = tf.sum(tf.square(diff), 2)
          scores = tf.neg(tf.sqrt(distSq))
          break
        case 'cosine':
          // Cosine similarity
          const featNorm = tf.norm(featuresTensor, 'euclidean', 1, true)
          const weightNorm = tf.norm(weightTensor, 'euclidean', 1, true)
          const dotProd = tf.matMul(featuresTensor, weightTensor, false, true)
          const norms = tf.matMul(featNorm, weightNorm, false, true)
          scores = tf.div(dotProd, tf.add(norms, 1e-8))
          break
        default:
          scores = tf.matMul(featuresTensor, weightTensor, false, true)
      }

      // Apply softmax
      const probabilities = tf.softmax(scores)

      // Compute gradients using TensorFlow's automatic differentiation
      const gradients = tf.grad((w: any) => {
        const pred = tf.softmax(tf.matMul(featuresTensor, w, false, true))
        return tf.losses.softmaxCrossEntropy(labelsTensor, pred)
      })(weightTensor)

      // Return gradients as JavaScript array
      return gradients.arraySync() as number[][]
    })
  }

  /**
   * GPU-accelerated similarity computation
   */
  computeSimilarityScores(
    features: number[],
    weights: number[][],
    metric: string = 'dotProduct'
  ): Promise<number[]> {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')

    const tf = window.tf

    return tf.tidy(() => {
      const featuresTensor = tf.tensor1d(features)
      const weightsTensor = tf.tensor2d(weights)

      let scores: any
      switch (metric) {
        case 'dotProduct':
          scores = tf.matMul(tf.expandDims(featuresTensor, 0), weightsTensor, false, true)
          break
        case 'euclidean':
          const diff = tf.sub(tf.expandDims(featuresTensor, 0), weightsTensor)
          const distSq = tf.sum(tf.square(diff), 1)
          scores = tf.neg(tf.sqrt(distSq))
          break
        case 'cosine':
          const featNorm = tf.norm(featuresTensor)
          const weightNorms = tf.norm(weightsTensor, 'euclidean', 1)
          const dotProd = tf.matMul(tf.expandDims(featuresTensor, 0), weightsTensor, false, true)
          scores = tf.div(tf.squeeze(dotProd), tf.mul(featNorm, weightNorms))
          break
        default:
          scores = tf.matMul(tf.expandDims(featuresTensor, 0), weightsTensor, false, true)
      }

      return scores.squeeze().arraySync() as number[]
    })
  }

  /**
   * Get GPU memory usage
   */
  getMemoryInfo(): any {
    if (!window.tf) return null
    return window.tf.memory()
  }

  /**
   * Clean up GPU memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    if (window.tf) {
      // Dispose any hanging tensors
      window.tf.disposeVariables()
    }
  }

  /**
   * Check if GPU acceleration is available and working
   */
  isGpuAccelerated(): boolean {
    return this.isGpuEnabled && window.tf && window.tf.getBackend() === 'webgl'
  }

  /**
   * Benchmark GPU vs CPU performance
   */
  async benchmarkPerformance(): Promise<{ gpu: number, cpu: number }> {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')

    const tf = window.tf
    const size = 1000

    // GPU benchmark
    await tf.setBackend('webgl')
    await tf.ready()
    
    const startGpu = performance.now()
    tf.tidy(() => {
      const a = tf.randomNormal([size, size])
      const b = tf.randomNormal([size, size])
      const c = tf.matMul(a, b)
      c.dataSync() // Force execution
    })
    const gpuTime = performance.now() - startGpu

    // CPU benchmark
    await tf.setBackend('cpu')
    await tf.ready()
    
    const startCpu = performance.now()
    tf.tidy(() => {
      const a = tf.randomNormal([size, size])
      const b = tf.randomNormal([size, size])
      const c = tf.matMul(a, b)
      c.dataSync() // Force execution
    })
    const cpuTime = performance.now() - startCpu

    // Restore original backend
    await tf.setBackend(this.isGpuEnabled ? 'webgl' : 'cpu')
    await tf.ready()

    return { gpu: gpuTime, cpu: cpuTime }
  }
}

// Export singleton instance
export const tensorflowMNIST = new TensorFlowMNIST()

// Export utility functions
export const tfUtils = {
  /**
   * Convert regular array to tensor
   */
  arrayToTensor: (arr: number[] | number[][]) => {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')
    return Array.isArray(arr[0]) 
      ? window.tf.tensor2d(arr as number[][])
      : window.tf.tensor1d(arr as number[])
  },

  /**
   * Dispose tensor safely
   */
  disposeTensor: (tensor: any) => {
    if (tensor && typeof tensor.dispose === 'function') {
      tensor.dispose()
    }
  },

  /**
   * Run computation in tidy block to prevent memory leaks
   */
  tidy: <T>(fn: () => T): T => {
    if (!window.tf) throw new Error('TensorFlow.js not loaded')
    return window.tf.tidy(fn)
  }
} 