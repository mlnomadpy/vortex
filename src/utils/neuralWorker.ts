import type { DataPoint, Neuron } from '@/types'

class NeuralWorkerManager {
  private worker: Worker | null = null
  private pendingCallbacks = new Map<string, (result: any) => void>()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      this.worker = new Worker('/neural-worker.js')
      this.worker.onmessage = (e) => {
        const { type, data } = e.data
        
        if (this.pendingCallbacks.has(type)) {
          const callback = this.pendingCallbacks.get(type)
          if (callback) {
            callback(data)
            this.pendingCallbacks.delete(type)
          }
        }
      }
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
      }
    } catch (error) {
      console.warn('Web Workers not supported, falling back to main thread')
      this.worker = null
    }
  }

  async calculatePredictions(
    neurons: Neuron[],
    points: DataPoint[],
    similarityMetric: string,
    activationFunction: string
  ): Promise<any[]> {
    if (!this.worker) {
      // Fallback to main thread calculation
      return this.calculatePredictionsMainThread(neurons, points, similarityMetric, activationFunction)
    }

    return new Promise((resolve) => {
      this.pendingCallbacks.set('PREDICTIONS_RESULT', resolve)
      this.worker!.postMessage({
        type: 'CALCULATE_PREDICTIONS',
        data: { neurons, points, similarityMetric, activationFunction }
      })
    })
  }

  async calculateLoss(
    neurons: Neuron[],
    dataPoints: DataPoint[],
    similarityMetric: string,
    activationFunction: string
  ): Promise<number> {
    if (!this.worker) {
      // Fallback to main thread calculation
      return this.calculateLossMainThread(neurons, dataPoints, similarityMetric, activationFunction)
    }

    return new Promise((resolve) => {
      this.pendingCallbacks.set('LOSS_RESULT', resolve)
      this.worker!.postMessage({
        type: 'CALCULATE_LOSS',
        data: { neurons, dataPoints, similarityMetric, activationFunction }
      })
    })
  }

  private calculatePredictionsMainThread(
    neurons: Neuron[],
    points: DataPoint[],
    similarityMetric: string,
    activationFunction: string
  ): any[] {
    // Main thread fallback implementation
    const results = []
    for (let point of points) {
      const scores = neurons.map(n => this.calculateScore(n, point.x, point.y, similarityMetric))
      const activatedScores = this.applyActivation(scores, activationFunction)
      
      let maxScore = -Infinity
      let winningNeuronId = null
      
      activatedScores.forEach((score, i) => {
        if (score > maxScore) {
          maxScore = score
          winningNeuronId = neurons[i].id
        }
      })
      
      results.push({
        point,
        winningNeuronId,
        scores: activatedScores
      })
    }
    return results
  }

  private calculateLossMainThread(
    neurons: Neuron[],
    dataPoints: DataPoint[],
    similarityMetric: string,
    activationFunction: string
  ): number {
    if (neurons.length === 0 || dataPoints.length === 0) return 0
    
    let totalLoss = 0
    const numSamples = dataPoints.length
    
    for (let point of dataPoints) {
      // Get scores for all neurons
      const scores = neurons.map(n => this.calculateScore(n, point.x, point.y, similarityMetric))
      
      // Apply activation function to get probabilities
      // For categorical cross-entropy, we need proper probability distribution
      let probabilities: number[]
      
      if (activationFunction === 'none') {
        // For no activation, use softmax to get proper probabilities
        const maxScore = Math.max(...scores)
        const exps = scores.map(s => Math.exp(s - maxScore))
        const sumExps = exps.reduce((a, b) => a + b, 0)
        probabilities = exps.map(e => e / (sumExps + 1e-8)) // Add epsilon for stability
      } else {
        probabilities = this.applyActivation(scores, activationFunction)
      }
      
      // Ensure probabilities sum to 1 and are positive (numerical stability)
      const probSum = probabilities.reduce((a, b) => a + b, 0)
      if (probSum > 0) {
        probabilities = probabilities.map(p => Math.max(p / probSum, 1e-8))
      } else {
        // Fallback to uniform distribution if all probabilities are 0
        probabilities = probabilities.map(() => 1 / probabilities.length)
      }
      
      // Find the neuron index that corresponds to the correct class
      const correctClassIndex = neurons.findIndex(n => n.id === point.label)
      
      if (correctClassIndex !== -1) {
        // Standard categorical cross-entropy: -log(p_correct_class)
        const correctClassProbability = Math.max(probabilities[correctClassIndex], 1e-8)
        totalLoss += -Math.log(correctClassProbability)
      } else {
        // If no neuron matches the class, add maximum penalty
        totalLoss += -Math.log(1e-8)
      }
    }
    
    return totalLoss / numSamples
  }

  private calculateScore(neuron: Neuron, x: number, y: number, metric: string): number {
    const dx = x - neuron.x
    const dy = y - neuron.y
    const distSq = dx * dx + dy * dy
    
    switch (metric) {
      case 'dotProduct':
        return x * neuron.x + y * neuron.y
      case 'euclidean':
        return -Math.sqrt(distSq)
      case 'myProduct':
        const dotProd = x * neuron.x + y * neuron.y
        const rawScore = (dotProd * dotProd) / (distSq + 1e-6)
        // Clamp to prevent softmax overflow
        return Math.min(rawScore, 50)
      default:
        throw new Error(`Unknown similarity metric: ${metric}`)
    }
  }

  private applyActivation(scores: number[], activationFunction: string): number[] {
    if (activationFunction === 'none' || scores.length === 0) return scores
    
    switch (activationFunction) {
      case 'softmax':
        const max = Math.max(...scores)
        const exps = scores.map(s => Math.exp(s - max))
        const sum = exps.reduce((a, b) => a + b, 0)
        return exps.map(e => e / sum)
      case 'softermax':
        const transformed = scores.map(s => 1 + s)
        const sum2 = transformed.reduce((a, b) => a + b, 0)
        return transformed.map(s => s / sum2)
      case 'sigmoid':
        return scores.map(s => 1 / (1 + Math.exp(-s)))
      case 'relu':
        return scores.map(s => Math.max(0, s))
      case 'gelu':
        return scores.map(s => 0.5 * s * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (s + 0.044715 * Math.pow(s, 3)))))
      default:
        throw new Error(`Unknown activation function: ${activationFunction}`)
    }
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingCallbacks.clear()
  }
}

export const neuralWorker = new NeuralWorkerManager() 