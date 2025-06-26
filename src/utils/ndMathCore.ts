import type { NDNeuron, NDDataPoint, NDSimilarityMetric, ActivationFunction, NDPrediction, TrainingBatch } from '@/types'

// Declare TensorFlow.js as global
declare global {
  interface Window {
    tf: any
  }
}

// ===== N-DIMENSIONAL SIMILARITY METRICS =====

/**
 * Calculate similarity score between a neuron and input in n-dimensional space
 * Extends existing 2D similarity metrics to work with high-dimensional data
 */
export function calculateNDSimilarityScore(
  neuron: NDNeuron,
  features: number[],
  metric: NDSimilarityMetric
): number {
  const weights = neuron.weights
  
  if (weights.length !== features.length) {
    throw new Error(`Dimension mismatch: neuron has ${weights.length} weights, input has ${features.length} features`)
  }

  switch (metric) {
    case 'dotProduct':
      return dotProduct(weights, features) + neuron.bias

    case 'euclidean':
      // Negative distance (closer = higher score)
      return -euclideanDistance(weights, features) + neuron.bias

    case 'yatProduct':
      // Yet Another Transform product - custom metric from original system
      const dot = dotProduct(weights, features)
      const dist = euclideanDistance(weights, features)
      return (dot / Math.sqrt(dist * dist + 1e-8)) + neuron.bias

    case 'cosine':
      return cosineSimilarity(weights, features) + neuron.bias

    case 'manhattan':
      return -manhattanDistance(weights, features) + neuron.bias

    case 'rbf':
      // Radial Basis Function (Gaussian kernel)
      const gamma = 0.1 // Can be made configurable
      return Math.exp(-gamma * euclideanDistance(weights, features) ** 2) + neuron.bias

    default:
      throw new Error(`Unknown similarity metric: ${metric}`)
  }
}

/**
 * Dot product of two vectors
 */
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

/**
 * Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProd = dotProduct(a, b)
  const normA = Math.sqrt(dotProduct(a, a))
  const normB = Math.sqrt(dotProduct(b, b))
  
  if (normA === 0 || normB === 0) return 0
  return dotProd / (normA * normB)
}

/**
 * Manhattan distance between two vectors
 */
function manhattanDistance(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0)
}

// ===== ACTIVATION FUNCTIONS (Extended from original system) =====

/**
 * Apply activation function to scores - supports all original activation functions
 */
export function applyNDActivationFunction(scores: number[], activationFunction: ActivationFunction): number[] {
  if (activationFunction === 'none' || scores.length === 0) return [...scores]
  
  switch (activationFunction) {
    case 'softmax':
      return softmax(scores)
    
    case 'softermax':
      // Softer version of softmax from original system
      const transformed = scores.map(s => 1 + s)
      const sum = transformed.reduce((a, b) => a + b, 0)
      return transformed.map(s => s / sum)
    
    case 'sigmoid':
      return scores.map(s => 1 / (1 + Math.exp(-s)))
    
    case 'relu':
      return scores.map(s => Math.max(0, s))
    
    case 'gelu':
      // Gaussian Error Linear Unit
      return scores.map(s => 0.5 * s * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (s + 0.044715 * Math.pow(s, 3)))))
    
    default:
      throw new Error(`Unknown activation function: ${activationFunction}`)
  }
}

/**
 * Standard softmax implementation
 */
function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exps = scores.map(s => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

// ===== PREDICTION AND LOSS =====

/**
 * Get prediction for n-dimensional input
 */
export function getNDPrediction(
  features: number[],
  neurons: NDNeuron[],
  similarityMetric: NDSimilarityMetric,
  activationFunction: ActivationFunction
): NDPrediction {
  if (neurons.length === 0) {
    return { winningNeuron: null, scores: [], probabilities: [], confidence: 0 }
  }

  const scores = neurons.map(n => calculateNDSimilarityScore(n, features, similarityMetric))
  const probabilities = applyNDActivationFunction(scores, activationFunction)
  
  let maxProbability = -Infinity
  let winningNeuron: NDNeuron | null = null
  
  probabilities.forEach((prob, i) => {
    if (prob > maxProbability) {
      maxProbability = prob
      winningNeuron = neurons[i]
    }
  })

  const confidence = maxProbability / (probabilities.reduce((a, b) => a + b, 0) || 1)

  return { winningNeuron, scores, probabilities, confidence }
}

/**
 * Compute categorical cross-entropy loss for n-dimensional data
 */
export function computeNDCategoricalCrossEntropyLoss(
  data: NDDataPoint[],
  neurons: NDNeuron[],
  similarityMetric: NDSimilarityMetric,
  activationFunction: ActivationFunction
): number {
  if (neurons.length === 0 || data.length === 0) return 0

  let totalLoss = 0
  const numSamples = data.length

  for (const point of data) {
    const scores = neurons.map(n => calculateNDSimilarityScore(n, point.features, similarityMetric))
    
    // Get probabilities using the same logic as 2D system
    let probabilities: number[]
    
    if (activationFunction === 'none') {
      probabilities = applyNDActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyNDActivationFunction(scores, activationFunction)
    }

    // Ensure probabilities sum to 1 and are positive (numerical stability)
    const probSum = probabilities.reduce((a, b) => a + b, 0)
    if (probSum > 0) {
      probabilities = probabilities.map(p => Math.max(p / probSum, 1e-8))
    } else {
      probabilities = probabilities.map(() => 1 / probabilities.length)
    }

    // Find neuron index corresponding to correct class
    const correctClassIndex = neurons.findIndex(n => n.id === point.label)
    
    if (correctClassIndex !== -1) {
      const correctClassProbability = Math.max(probabilities[correctClassIndex], 1e-8)
      totalLoss += -Math.log(correctClassProbability)
    } else {
      totalLoss += -Math.log(1e-8) // Maximum penalty
    }
  }

  return totalLoss / numSamples
}

/**
 * Calculate accuracy for n-dimensional classification
 */
export function calculateNDAccuracy(
  data: NDDataPoint[],
  neurons: NDNeuron[],
  similarityMetric: NDSimilarityMetric,
  activationFunction: ActivationFunction
): number {
  if (neurons.length === 0 || data.length === 0) return 0

  let correct = 0

  for (const point of data) {
    const prediction = getNDPrediction(point.features, neurons, similarityMetric, activationFunction)
    if (prediction.winningNeuron && prediction.winningNeuron.id === point.label) {
      correct++
    }
  }

  return correct / data.length
}

// ===== GRADIENT COMPUTATION =====

/**
 * Calculate gradient for n-dimensional neuron using categorical cross-entropy loss
 */
export function calculateNDNeuronGradient(
  neuron: NDNeuron,
  data: NDDataPoint[],
  neurons: NDNeuron[],
  similarityMetric: NDSimilarityMetric,
  activationFunction: ActivationFunction
): { weights: number[]; bias: number } {
  if (data.length === 0) {
    return { weights: new Array(neuron.weights.length).fill(0), bias: 0 }
  }

  const weightGrads = new Array(neuron.weights.length).fill(0)
  let biasGrad = 0
  const numSamples = data.length

  for (const point of data) {
    const scores = neurons.map(n => calculateNDSimilarityScore(n, point.features, similarityMetric))
    
    // Get probabilities
    let probabilities: number[]
    if (activationFunction === 'none') {
      probabilities = applyNDActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyNDActivationFunction(scores, activationFunction)
    }

    // Normalize probabilities
    const probSum = probabilities.reduce((a, b) => a + b, 0)
    if (probSum > 0) {
      probabilities = probabilities.map(p => p / probSum)
    }

    const correctClassIndex = neurons.findIndex(n => n.id === point.label)
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)

    if (correctClassIndex !== -1 && neuronIndex !== -1) {
      const target = correctClassIndex === neuronIndex ? 1 : 0
      const predicted = probabilities[neuronIndex]
      const error = predicted - target

      // Calculate similarity gradient based on metric
      const simGradient = calculateNDSimilarityGradient(neuron, point.features, similarityMetric)

      // Update weight gradients
      for (let i = 0; i < weightGrads.length; i++) {
        weightGrads[i] += error * simGradient.weights[i]
      }
      
      // Update bias gradient
      biasGrad += error * simGradient.bias
    }
  }

  return {
    weights: weightGrads.map(g => g / numSamples),
    bias: biasGrad / numSamples
  }
}

/**
 * Calculate gradient of similarity metric w.r.t. neuron parameters
 */
function calculateNDSimilarityGradient(
  neuron: NDNeuron,
  features: number[],
  metric: NDSimilarityMetric
): { weights: number[]; bias: number } {
  const weights = neuron.weights
  
  switch (metric) {
    case 'dotProduct':
      return {
        weights: [...features], // d/dw (w·x + b) = x
        bias: 1 // d/db (w·x + b) = 1
      }

    case 'euclidean':
      // d/dw (-||w - x||) = (w - x) / ||w - x||
      const diff = weights.map((w, i) => w - features[i])
      const dist = Math.sqrt(diff.reduce((sum, d) => sum + d * d, 0))
      if (dist === 0) {
        return { weights: new Array(weights.length).fill(0), bias: 1 }
      }
      return {
        weights: diff.map(d => d / dist),
        bias: 1
      }

    case 'yatProduct':
      // Complex gradient for custom YAT product
      const dot = dotProduct(weights, features)
      const eucDist = euclideanDistance(weights, features)
      const denominator = Math.sqrt(eucDist * eucDist + 1e-8)
      
      const dotGrad = features
      const distGrad = weights.map((w, i) => (w - features[i]) / (eucDist + 1e-8))
      
      return {
        weights: weights.map((_, i) => 
          (dotGrad[i] * denominator - dot * distGrad[i] * eucDist / denominator) / (denominator * denominator)
        ),
        bias: 1
      }

    case 'cosine':
      // Gradient of cosine similarity
      const normA = Math.sqrt(dotProduct(weights, weights))
      const normB = Math.sqrt(dotProduct(features, features))
      
      if (normA === 0 || normB === 0) {
        return { weights: new Array(weights.length).fill(0), bias: 1 }
      }

      const dot_cos = dotProduct(weights, features)
      return {
        weights: weights.map((w, i) => 
          (features[i] * normA - w * dot_cos / normA) / (normA * normB)
        ),
        bias: 1
      }

    case 'manhattan':
      // d/dw (-|w - x|) = -sign(w - x)
      return {
        weights: weights.map((w, i) => w > features[i] ? -1 : (w < features[i] ? 1 : 0)),
        bias: 1
      }

    case 'rbf':
      // Gradient of RBF kernel
      const gamma = 0.1
      const eucDist_rbf = euclideanDistance(weights, features)
      const rbfValue = Math.exp(-gamma * eucDist_rbf * eucDist_rbf)
      
      return {
        weights: weights.map((w, i) => 
          -2 * gamma * (w - features[i]) * rbfValue
        ),
        bias: 1
      }

    default:
      throw new Error(`Unknown similarity metric: ${metric}`)
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create training batches from dataset
 */
export function createTrainingBatches(data: NDDataPoint[], batchSize: number): TrainingBatch[] {
  const batches: TrainingBatch[] = []
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batchData = data.slice(i, i + batchSize)
    batches.push({
      features: batchData.map(d => d.features),
      labels: batchData.map(d => d.label),
      batchSize: Math.min(batchSize, data.length - i)
    })
  }
  
  return batches
}

/**
 * Initialize neuron weights using different strategies
 */
export function initializeNDNeuronWeights(
  numFeatures: number,
  strategy: 'random' | 'xavier' | 'he' | 'zeros' = 'xavier'
): number[] {
  switch (strategy) {
    case 'random':
      return Array.from({ length: numFeatures }, () => (Math.random() - 0.5) * 0.1)
    
    case 'xavier':
      const limit = Math.sqrt(6 / numFeatures)
      return Array.from({ length: numFeatures }, () => (Math.random() - 0.5) * 2 * limit)
    
    case 'he':
      const heStd = Math.sqrt(2 / numFeatures)
      return Array.from({ length: numFeatures }, () => 
        heStd * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
      )
    
    case 'zeros':
      return new Array(numFeatures).fill(0)
    
    default:
      throw new Error(`Unknown initialization strategy: ${strategy}`)
  }
}

/**
 * Clamp value to range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Normalize features to [0, 1] range
 */
export function normalizeFeatures(features: number[]): number[] {
  const max = Math.max(...features)
  const min = Math.min(...features)
  const range = max - min
  
  if (range === 0) return features.map(() => 0)
  return features.map(f => (f - min) / range)
}

/**
 * Convert neuron weights to image for visualization (reshape to 28x28 for MNIST)
 */
export function weightsToImage(weights: number[], width: number = 28, height: number = 28): number[][] {
  if (weights.length !== width * height) {
    throw new Error(`Weight vector length ${weights.length} doesn't match image dimensions ${width}x${height}`)
  }

  const image: number[][] = []
  for (let i = 0; i < height; i++) {
    const row: number[] = []
    for (let j = 0; j < width; j++) {
      row.push(weights[i * width + j])
    }
    image.push(row)
  }
  
  return image
} 