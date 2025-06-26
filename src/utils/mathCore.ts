import type { Neuron, DataPoint, SimilarityMetric, ActivationFunction } from '@/types'

/**
 * Core mathematical functions for neural network calculations
 * All similarity metrics, activation functions, and gradients are defined here
 * to ensure consistency across the entire application.
 */

// ===== SIMILARITY METRICS =====

export interface SimilarityMetricConfig {
  name: SimilarityMetric
  description: string
  formula: string
}

export const SIMILARITY_METRICS: Record<SimilarityMetric, SimilarityMetricConfig> = {
  dotProduct: {
    name: 'dotProduct',
    description: 'Dot Product: measures linear correlation',
    formula: 'x * neuron.x + y * neuron.y'
  },
  euclidean: {
    name: 'euclidean', 
    description: 'Euclidean Distance: measures spatial proximity',
    formula: '-√((x - neuron.x)² + (y - neuron.y)²)'
  },
  yatProduct: {
    name: 'yatProduct',
    description: 'Custom Product: combines correlation and distance',
    formula: '(x * neuron.x + y * neuron.y)² / ((x - neuron.x)² + (y - neuron.y)²)'
  }
}

/**
 * Calculate similarity score between a point and neuron using specified metric
 */
export function calculateSimilarityScore(
  neuron: Neuron, 
  x: number, 
  y: number, 
  metric: SimilarityMetric
): number {
  const dx = x - neuron.x
  const dy = y - neuron.y
  const distSq = dx * dx + dy * dy
  
  switch (metric) {
    case 'dotProduct':
      return x * neuron.x + y * neuron.y
      
    case 'euclidean':
      return -Math.sqrt(distSq)
      
    case 'yatProduct':
      const dotProd = x * neuron.x + y * neuron.y
      const rawScore = (dotProd * dotProd) / (distSq + 1e-6)
      // Clamp to prevent softmax overflow
      return Math.min(rawScore, 50)
      
    default:
      throw new Error(`Unknown similarity metric: ${metric}`)
  }
}

// ===== ACTIVATION FUNCTIONS =====

export interface ActivationFunctionConfig {
  name: ActivationFunction
  description: string
  formula: string
}

export const ACTIVATION_FUNCTIONS: Record<ActivationFunction, ActivationFunctionConfig> = {
  none: {
    name: 'none',
    description: 'No activation (identity)',
    formula: 'f(x) = x'
  },
  softmax: {
    name: 'softmax',
    description: 'Softmax: probability distribution',
    formula: 'f(x_i) = exp(x_i) / Σ(exp(x_j))'
  },
  softermax: {
    name: 'softermax',
    description: 'Softermax: gentler probability distribution',
    formula: 'f(x_i) = (1 + x_i) / Σ(1 + x_j)'
  },
  sigmoid: {
    name: 'sigmoid',
    description: 'Sigmoid: S-shaped curve',
    formula: 'f(x) = 1 / (1 + exp(-x))'
  },
  relu: {
    name: 'relu',
    description: 'ReLU: Rectified Linear Unit',
    formula: 'f(x) = max(0, x)'
  },
  gelu: {
    name: 'gelu',
    description: 'GELU: Gaussian Error Linear Unit',
    formula: 'f(x) = 0.5 * x * (1 + tanh(√(2/π) * (x + 0.044715 * x³)))'
  }
}

/**
 * Apply activation function to an array of scores
 */
export function applyActivationFunction(
  scores: number[], 
  activationFunction: ActivationFunction
): number[] {
  if (activationFunction === 'none' || scores.length === 0) {
    return scores
  }
  
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

/**
 * Get derivative of activation function at a specific index
 */
export function getActivationDerivative(
  scores: number[], 
  neuronIndex: number, 
  activationFunction: ActivationFunction
): number {
  if (activationFunction === 'none' || scores.length === 0) {
    return 1
  }
  
  const score = scores[neuronIndex]
  const activatedScores = applyActivationFunction(scores, activationFunction)
  const activatedScore = activatedScores[neuronIndex]
  
  switch (activationFunction) {
    case 'softmax':
      // For softmax: derivative is p_i * (1 - p_i) for diagonal terms
      return activatedScore * (1 - activatedScore)
      
    case 'softermax':
      // For softermax: derivative of normalized scores
      const sum = scores.map(s => 1 + s).reduce((a, b) => a + b, 0)
      return 1 / sum - (1 + score) / (sum * sum)
      
    case 'sigmoid':
      // For sigmoid: derivative is sigmoid(x) * (1 - sigmoid(x))
      return activatedScore * (1 - activatedScore)
      
    case 'relu':
      // For ReLU: derivative is 1 if x > 0, else 0
      return score > 0 ? 1 : 0
      
    case 'gelu':
      // For GELU: more complex derivative
      const tanh_term = Math.tanh(Math.sqrt(2 / Math.PI) * (score + 0.044715 * Math.pow(score, 3)))
      const sech2_term = 1 - tanh_term * tanh_term // sech^2 = 1 - tanh^2
      const inner_derivative = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * score * score)
      return 0.5 * (1 + tanh_term) + 0.5 * score * sech2_term * inner_derivative
      
    default:
      throw new Error(`Unknown activation function: ${activationFunction}`)
  }
}

// ===== PREDICTION AND LOSS =====

/**
 * Get prediction for a point using current neurons and settings
 */
export function getPrediction(
  x: number, 
  y: number, 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { winningNeuron: Neuron | null, scores: number[], probabilities: number[] } {
  if (neurons.length === 0) {
    return { winningNeuron: null, scores: [], probabilities: [] }
  }
  
  const scores = neurons.map(n => calculateSimilarityScore(n, x, y, similarityMetric))
  const probabilities = applyActivationFunction(scores, activationFunction)
  
  let maxProbability = -Infinity
  let winningNeuron: Neuron | null = null
  
  probabilities.forEach((prob, i) => {
    if (prob > maxProbability) {
      maxProbability = prob
      winningNeuron = neurons[i]
    }
  })
  
  return { winningNeuron, scores, probabilities }
}

/**
 * Compute categorical cross-entropy loss
 */
export function computeCategoricalCrossEntropyLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): number {
  if (neurons.length === 0 || data.length === 0) {
    return 0
  }
  
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    // Get scores for all neurons
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    
    // Apply activation function to get probabilities
    // For categorical cross-entropy, we need proper probability distribution
    let probabilities: number[]
    
    if (activationFunction === 'none') {
      // For no activation, use softmax to get proper probabilities
      probabilities = applyActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyActivationFunction(scores, activationFunction)
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
  })
  
  return totalLoss / numSamples
}

// ===== GRADIENT CALCULATIONS =====

/**
 * Calculate gradient of similarity metric with respect to neuron position
 */
export function calculateSimilarityGradient(
  neuron: Neuron, 
  pointX: number, 
  pointY: number, 
  metric: SimilarityMetric
): { x: number; y: number } {
  const dx = pointX - neuron.x
  const dy = pointY - neuron.y
  const distSq = dx * dx + dy * dy + 1e-6
  
  switch (metric) {
    case 'dotProduct':
      return {
        x: pointX,
        y: pointY
      }
      
    case 'euclidean':
      const dist = Math.sqrt(distSq)
      return {
        x: dx / dist,
        y: dy / dist
      }
      
    case 'yatProduct':
      const dotProd = pointX * neuron.x + pointY * neuron.y
      
      // Using quotient rule: ∂f/∂neuron.x = (distSq * ∂(dotProd²)/∂neuron.x - dotProd² * ∂(distSq)/∂neuron.x) / distSq²
      // ∂(dotProd²)/∂neuron.x = 2 * dotProd * pointX
      // ∂(distSq)/∂neuron.x = 2 * (neuron.x - pointX)
      const numeratorX = distSq * 2 * dotProd * pointX - dotProd * dotProd * 2 * (neuron.x - pointX)
      const gradientX = numeratorX / (distSq * distSq)
      
      const numeratorY = distSq * 2 * dotProd * pointY - dotProd * dotProd * 2 * (neuron.y - pointY)
      const gradientY = numeratorY / (distSq * distSq)
      
      return { x: gradientX, y: gradientY }
      
    default:
      throw new Error(`Unknown similarity metric: ${metric}`)
  }
}

/**
 * Calculate gradient for a neuron using categorical cross-entropy loss
 */
export function calculateNeuronGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { x: number; y: number } {
  if (data.length === 0) {
    return { x: 0, y: 0 }
  }
  
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    
    // Get probabilities using the same logic as loss computation
    let probabilities: number[]
    
    if (activationFunction === 'none') {
      probabilities = applyActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyActivationFunction(scores, activationFunction)
    }
    
    // Ensure probabilities sum to 1
    const probSum = probabilities.reduce((a, b) => a + b, 0)
    if (probSum > 0) {
      probabilities = probabilities.map(p => p / probSum)
    }
    
    const correctClassIndex = neurons.findIndex(n => n.id === point.label)
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    
    if (correctClassIndex !== -1 && neuronIndex !== -1) {
      // For categorical cross-entropy with softmax:
      // gradient = (predicted_probability - target) for the correct class
      // where target is 1 for correct class, 0 for others
      const target = correctClassIndex === neuronIndex ? 1 : 0
      const predicted = probabilities[neuronIndex]
      
      // The gradient of categorical cross-entropy w.r.t. the logits (scores)
      // when using softmax is simply: predicted - target
      const error = predicted - target
      
      // Apply chain rule for similarity metric gradients
      const metricGradient = calculateSimilarityGradient(neuron, point.x, point.y, similarityMetric)
      
      gradX += error * metricGradient.x
      gradY += error * metricGradient.y
    }
  })
  
  return { x: gradX / numSamples, y: gradY / numSamples }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculate accuracy given predictions and actual labels
 */
export function calculateAccuracy(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): number {
  if (data.length === 0 || neurons.length === 0) {
    return 0
  }
  
  let correctPredictions = 0
  
  data.forEach(point => {
    const prediction = getPrediction(point.x, point.y, neurons, similarityMetric, activationFunction)
    if (prediction.winningNeuron && prediction.winningNeuron.id === point.label) {
      correctPredictions++
    }
  })
  
  return correctPredictions / data.length
}

/**
 * Get configuration info for display purposes
 */
export function getMetricInfo(metric: SimilarityMetric): SimilarityMetricConfig {
  return SIMILARITY_METRICS[metric]
}

export function getActivationInfo(activation: ActivationFunction): ActivationFunctionConfig {
  return ACTIVATION_FUNCTIONS[activation]
}

 