import type { Neuron, DataPoint, SimilarityMetric, ActivationFunction, LossFunction } from '@/types'

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

// ===== LOSS FUNCTIONS =====

export interface LossFunctionConfig {
  name: LossFunction
  description: string
  formula: string
  useFor: string
}

export const LOSS_FUNCTIONS: Record<LossFunction, LossFunctionConfig> = {
  categoricalCrossEntropy: {
    name: 'categoricalCrossEntropy',
    description: 'Categorical Cross-Entropy: standard for multi-class classification',
    formula: 'L = -Σ(y_true * log(y_pred))',
    useFor: 'Multi-class classification'
  },
  binaryCrossEntropy: {
    name: 'binaryCrossEntropy',
    description: 'Binary Cross-Entropy: for binary classification',
    formula: 'L = -(y*log(p) + (1-y)*log(1-p))',
    useFor: 'Binary classification'
  },
  meanSquaredError: {
    name: 'meanSquaredError',
    description: 'Mean Squared Error: measures squared differences',
    formula: 'L = Σ(y_true - y_pred)² / n',
    useFor: 'Regression, continuous targets'
  },
  huberLoss: {
    name: 'huberLoss',
    description: 'Huber Loss: robust to outliers',
    formula: 'L = 0.5*(y_true - y_pred)² if |error| ≤ δ, else δ*|error| - 0.5*δ²',
    useFor: 'Regression with outliers'
  },
  hingeLoss: {
    name: 'hingeLoss',
    description: 'Hinge Loss: for support vector machines',
    formula: 'L = max(0, 1 - y_true * y_pred)',
    useFor: 'Binary classification (SVM)'
  },
  focalLoss: {
    name: 'focalLoss',
    description: 'Focal Loss: addresses class imbalance',
    formula: 'L = -α(1-p)^γ * log(p)',
    useFor: 'Imbalanced classification'
  }
}

/**
 * Compute loss using the specified loss function
 */
export function computeLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  lossFunction: LossFunction
): number {
  if (neurons.length === 0 || data.length === 0) {
    return 0
  }
  
  switch (lossFunction) {
    case 'categoricalCrossEntropy':
      return computeCategoricalCrossEntropyLoss(data, neurons, similarityMetric, activationFunction)
    
    case 'binaryCrossEntropy':
      return computeBinaryCrossEntropyLoss(data, neurons, similarityMetric, activationFunction)
    
    case 'meanSquaredError':
      return computeMeanSquaredErrorLoss(data, neurons, similarityMetric, activationFunction)
    
    case 'huberLoss':
      return computeHuberLoss(data, neurons, similarityMetric, activationFunction)
    
    case 'hingeLoss':
      return computeHingeLoss(data, neurons, similarityMetric, activationFunction)
    
    case 'focalLoss':
      return computeFocalLoss(data, neurons, similarityMetric, activationFunction)
    
    default:
      throw new Error(`Unknown loss function: ${lossFunction}`)
  }
}

/**
 * Compute binary cross-entropy loss
 */
export function computeBinaryCrossEntropyLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): number {
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    let probabilities = applyActivationFunction(scores, activationFunction)
    
    // For binary classification, use sigmoid on the first neuron's output
    if (activationFunction === 'none') {
      probabilities = [1 / (1 + Math.exp(-scores[0]))]
    }
    
    const predicted = Math.max(Math.min(probabilities[0] || 0.5, 1 - 1e-8), 1e-8)
    const target = point.label
    
    totalLoss += -(target * Math.log(predicted) + (1 - target) * Math.log(1 - predicted))
  })
  
  return totalLoss / numSamples
}

/**
 * Compute mean squared error loss
 */
export function computeMeanSquaredErrorLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): number {
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    // For MSE, treat as regression problem
    const predicted = probabilities[0] || 0
    const target = point.label
    const error = target - predicted
    
    totalLoss += error * error
  })
  
  return totalLoss / numSamples
}

/**
 * Compute Huber loss (robust to outliers)
 */
export function computeHuberLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  delta: number = 1.0
): number {
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    const predicted = probabilities[0] || 0
    const target = point.label
    const error = Math.abs(target - predicted)
    
    if (error <= delta) {
      totalLoss += 0.5 * error * error
    } else {
      totalLoss += delta * error - 0.5 * delta * delta
    }
  })
  
  return totalLoss / numSamples
}

/**
 * Compute hinge loss (for SVM-style classification)
 */
export function computeHingeLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): number {
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    const predicted = probabilities[0] || 0
    const target = point.label === 1 ? 1 : -1 // Convert to {-1, 1} for hinge loss
    
    const loss = Math.max(0, 1 - target * predicted)
    totalLoss += loss
  })
  
  return totalLoss / numSamples
}

/**
 * Compute focal loss (for imbalanced classification)
 */
export function computeFocalLoss(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  alpha: number = 1.0,
  gamma: number = 2.0
): number {
  let totalLoss = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    let probabilities: number[]
    
    if (activationFunction === 'none') {
      probabilities = applyActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyActivationFunction(scores, activationFunction)
    }
    
    // Normalize probabilities
    const probSum = probabilities.reduce((a, b) => a + b, 0)
    if (probSum > 0) {
      probabilities = probabilities.map(p => Math.max(p / probSum, 1e-8))
    } else {
      probabilities = probabilities.map(() => 1 / probabilities.length)
    }
    
    const correctClassIndex = neurons.findIndex(n => n.id === point.label)
    
    if (correctClassIndex !== -1) {
      const p = probabilities[correctClassIndex]
      const focusWeight = Math.pow(1 - p, gamma)
      totalLoss += -alpha * focusWeight * Math.log(p)
    } else {
      totalLoss += -alpha * Math.log(1e-8)
    }
  })
  
  return totalLoss / numSamples
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

/**
 * Calculate gradient for a neuron using the specified loss function
 */
export function calculateNeuronGradientWithLoss(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  lossFunction: LossFunction
): { x: number; y: number } {
  if (data.length === 0) {
    return { x: 0, y: 0 }
  }
  
  switch (lossFunction) {
    case 'categoricalCrossEntropy':
      return calculateNeuronGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    case 'binaryCrossEntropy':
      return calculateBinaryCrossEntropyGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    case 'meanSquaredError':
      return calculateMSEGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    case 'huberLoss':
      return calculateHuberGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    case 'hingeLoss':
      return calculateHingeGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    case 'focalLoss':
      return calculateFocalGradient(neuron, data, neurons, similarityMetric, activationFunction)
    
    default:
      throw new Error(`Unknown loss function: ${lossFunction}`)
  }
}

/**
 * Calculate gradient for binary cross-entropy loss
 */
export function calculateBinaryCrossEntropyGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { x: number; y: number } {
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    let probabilities = applyActivationFunction(scores, activationFunction)
    
    if (activationFunction === 'none') {
      probabilities = [1 / (1 + Math.exp(-scores[0]))]
    }
    
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    if (neuronIndex !== -1) {
      const predicted = Math.max(Math.min(probabilities[neuronIndex] || 0.5, 1 - 1e-8), 1e-8)
      const target = point.label
      
      // Binary cross-entropy gradient: (predicted - target) / (predicted * (1 - predicted))
      const error = (predicted - target) / (predicted * (1 - predicted))
      
      const metricGradient = calculateSimilarityGradient(neuron, point.x, point.y, similarityMetric)
      gradX += error * metricGradient.x
      gradY += error * metricGradient.y
    }
  })
  
  return { x: gradX / numSamples, y: gradY / numSamples }
}

/**
 * Calculate gradient for mean squared error loss
 */
export function calculateMSEGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { x: number; y: number } {
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    if (neuronIndex !== -1) {
      const predicted = probabilities[neuronIndex] || 0
      const target = point.label
      
      // MSE gradient: 2 * (predicted - target)
      const error = 2 * (predicted - target)
      
      const metricGradient = calculateSimilarityGradient(neuron, point.x, point.y, similarityMetric)
      gradX += error * metricGradient.x
      gradY += error * metricGradient.y
    }
  })
  
  return { x: gradX / numSamples, y: gradY / numSamples }
}

/**
 * Calculate gradient for Huber loss
 */
export function calculateHuberGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  delta: number = 1.0
): { x: number; y: number } {
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    if (neuronIndex !== -1) {
      const predicted = probabilities[neuronIndex] || 0
      const target = point.label
      const error = predicted - target
      
      // Huber gradient: error if |error| <= delta, else delta * sign(error)
      const gradient = Math.abs(error) <= delta ? error : delta * Math.sign(error)
      
      const metricGradient = calculateSimilarityGradient(neuron, point.x, point.y, similarityMetric)
      gradX += gradient * metricGradient.x
      gradY += gradient * metricGradient.y
    }
  })
  
  return { x: gradX / numSamples, y: gradY / numSamples }
}

/**
 * Calculate gradient for hinge loss
 */
export function calculateHingeGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { x: number; y: number } {
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    const probabilities = applyActivationFunction(scores, activationFunction)
    
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    if (neuronIndex !== -1) {
      const predicted = probabilities[neuronIndex] || 0
      const target = point.label === 1 ? 1 : -1
      
      // Hinge gradient: -target if margin < 1, else 0
      const margin = target * predicted
      const gradient = margin < 1 ? -target : 0
      
      const metricGradient = calculateSimilarityGradient(neuron, point.x, point.y, similarityMetric)
      gradX += gradient * metricGradient.x
      gradY += gradient * metricGradient.y
    }
  })
  
  return { x: gradX / numSamples, y: gradY / numSamples }
}

/**
 * Calculate gradient for focal loss
 */
export function calculateFocalGradient(
  neuron: Neuron, 
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction,
  alpha: number = 1.0,
  gamma: number = 2.0
): { x: number; y: number } {
  let gradX = 0
  let gradY = 0
  const numSamples = data.length
  
  data.forEach(point => {
    const scores = neurons.map(n => calculateSimilarityScore(n, point.x, point.y, similarityMetric))
    let probabilities: number[]
    
    if (activationFunction === 'none') {
      probabilities = applyActivationFunction(scores, 'softmax')
    } else {
      probabilities = applyActivationFunction(scores, activationFunction)
    }
    
    // Normalize probabilities
    const probSum = probabilities.reduce((a, b) => a + b, 0)
    if (probSum > 0) {
      probabilities = probabilities.map(p => Math.max(p / probSum, 1e-8))
    }
    
    const correctClassIndex = neurons.findIndex(n => n.id === point.label)
    const neuronIndex = neurons.findIndex(n => n.id === neuron.id)
    
    if (correctClassIndex !== -1 && neuronIndex !== -1) {
      const p = probabilities[correctClassIndex]
      const target = correctClassIndex === neuronIndex ? 1 : 0
      const predicted = probabilities[neuronIndex]
      
      // Focal loss gradient is complex, simplified version:
      const focusWeight = Math.pow(1 - p, gamma)
      const error = alpha * focusWeight * (predicted - target)
      
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
 * Calculate confusion matrix for binary or multi-class classification
 */
export function calculateConfusionMatrix(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { matrix: number[][], classes: number[] } {
  if (data.length === 0 || neurons.length === 0) {
    return { matrix: [], classes: [] }
  }
  
  // Get unique classes from both data and neurons
  const dataClasses = [...new Set(data.map(p => p.label))].sort()
  const neuronClasses = neurons.map(n => n.id).sort()
  const allClasses = [...new Set([...dataClasses, ...neuronClasses])].sort()
  
  // Initialize confusion matrix
  const matrix = Array(allClasses.length).fill(0).map(() => Array(allClasses.length).fill(0))
  
  // Calculate predictions and populate matrix
  data.forEach(point => {
    const prediction = getPrediction(point.x, point.y, neurons, similarityMetric, activationFunction)
    const actualClassIndex = allClasses.indexOf(point.label)
    
    if (prediction.winningNeuron) {
      const predictedClassIndex = allClasses.indexOf(prediction.winningNeuron.id)
      if (actualClassIndex !== -1 && predictedClassIndex !== -1) {
        matrix[actualClassIndex][predictedClassIndex]++
      }
    }
  })
  
  return { matrix, classes: allClasses }
}

/**
 * Calculate precision, recall, and F1 score for multi-class classification
 */
export function calculateClassificationMetrics(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { 
  precision: number, 
  recall: number, 
  f1Score: number,
  perClass: { 
    [key: number]: { precision: number, recall: number, f1Score: number } 
  }
} {
  const { matrix, classes } = calculateConfusionMatrix(data, neurons, similarityMetric, activationFunction)
  
  if (matrix.length === 0 || classes.length === 0) {
    return { precision: 0, recall: 0, f1Score: 0, perClass: {} }
  }
  
  const perClass: { [key: number]: { precision: number, recall: number, f1Score: number } } = {}
  let totalPrecision = 0
  let totalRecall = 0
  let totalF1 = 0
  let validClasses = 0
  
  classes.forEach((classId, i) => {
    // True positives for this class
    const tp = matrix[i][i]
    
    // False positives: sum of column i, excluding diagonal
    const fp = matrix.reduce((sum, row, rowIndex) => 
      rowIndex !== i ? sum + row[i] : sum, 0)
    
    // False negatives: sum of row i, excluding diagonal
    const fn = matrix[i].reduce((sum, val, colIndex) => 
      colIndex !== i ? sum + val : sum, 0)
    
    // Calculate metrics for this class
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
    
    perClass[classId] = { precision, recall, f1Score }
    
    // Add to averages if this class has any samples
    if (tp + fn > 0) {
      totalPrecision += precision
      totalRecall += recall
      totalF1 += f1Score
      validClasses++
    }
  })
  
  // Calculate macro-averaged metrics
  const avgPrecision = validClasses > 0 ? totalPrecision / validClasses : 0
  const avgRecall = validClasses > 0 ? totalRecall / validClasses : 0
  const avgF1 = validClasses > 0 ? totalF1 / validClasses : 0
  
  return {
    precision: avgPrecision,
    recall: avgRecall,
    f1Score: avgF1,
    perClass
  }
}

/**
 * Get binary confusion matrix metrics (for 2-class problems)
 */
export function getBinaryConfusionMatrixMetrics(
  data: DataPoint[], 
  neurons: Neuron[], 
  similarityMetric: SimilarityMetric, 
  activationFunction: ActivationFunction
): { tp: number, tn: number, fp: number, fn: number } {
  const { matrix, classes } = calculateConfusionMatrix(data, neurons, similarityMetric, activationFunction)
  
  if (matrix.length === 0 || classes.length !== 2) {
    // For non-binary cases, return simplified metrics
    if (matrix.length > 2) {
      // Multi-class: sum diagonal vs off-diagonal
      const correctPredictions = matrix.reduce((sum, row, i) => sum + row[i], 0)
      const totalPredictions = matrix.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val, 0), 0)
      const incorrectPredictions = totalPredictions - correctPredictions
      
      return {
        tp: correctPredictions,
        tn: 0,
        fp: incorrectPredictions,
        fn: 0
      }
    }
    return { tp: 0, tn: 0, fp: 0, fn: 0 }
  }
  
  // Binary classification case
  const tp = matrix[1][1] // True positives (class 1 predicted as class 1)
  const tn = matrix[0][0] // True negatives (class 0 predicted as class 0)
  const fp = matrix[0][1] // False positives (class 0 predicted as class 1)
  const fn = matrix[1][0] // False negatives (class 1 predicted as class 0)
  
  return { tp, tn, fp, fn }
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

export function getLossFunctionInfo(lossFunction: LossFunction): LossFunctionConfig {
  return LOSS_FUNCTIONS[lossFunction]
}

// ===== LOCAL OPTIMIZERS (IMPLEMENTED FROM SCRATCH) =====

export type OptimizerType = 'sgd' | 'sgd_momentum' | 'adam' | 'adamw' | 'rmsprop' | 'adagrad' | 'adadelta'

export interface OptimizerState {
  type: OptimizerType
  learningRate: number
  momentum?: number
  weightDecay?: number
  beta1?: number
  beta2?: number
  epsilon?: number
  rho?: number  // For RMSprop and Adadelta
  velocities?: Map<number, { x: number; y: number }>
  moments?: Map<number, { x: number; y: number }>
  secondMoments?: Map<number, { x: number; y: number }>
  squaredGradients?: Map<number, { x: number; y: number }>  // For Adagrad and RMSprop
  squaredDeltas?: Map<number, { x: number; y: number }>     // For Adadelta
  step?: number
  // Diagnostics
  gradientNorm?: number
  updateNorm?: number
  learningRateScale?: number
}

export interface OptimizerConfig {
  name: OptimizerType
  description: string
  formula: string
  hyperparameters: {
    learningRate: { default: number; min: number; max: number; description: string }
    momentum?: { default: number; min: number; max: number; description: string }
    weightDecay?: { default: number; min: number; max: number; description: string }
    beta1?: { default: number; min: number; max: number; description: string }
    beta2?: { default: number; min: number; max: number; description: string }
    epsilon?: { default: number; min: number; max: number; description: string }
    rho?: { default: number; min: number; max: number; description: string }
  }
  advantages: string[]
  disadvantages: string[]
  bestFor: string[]
}

/**
 * Optimizer configurations with detailed information
 */
export const OPTIMIZER_CONFIGS: Record<OptimizerType, OptimizerConfig> = {
  sgd: {
    name: 'sgd',
    description: 'Stochastic Gradient Descent - the classic optimization algorithm',
    formula: 'θ = θ - α∇J(θ)',
    hyperparameters: {
      learningRate: { default: 0.01, min: 0.0001, max: 1, description: 'Step size for parameter updates' }
    },
    advantages: ['Simple and fast', 'Low memory usage', 'Good for convex problems'],
    disadvantages: ['Can get stuck in local minima', 'Slow convergence', 'Sensitive to learning rate'],
    bestFor: ['Simple problems', 'Large datasets', 'When memory is limited']
  },
  sgd_momentum: {
    name: 'sgd_momentum',
    description: 'SGD with momentum - accelerates SGD in relevant directions',
    formula: 'v = βv - α∇J(θ); θ = θ + v',
    hyperparameters: {
      learningRate: { default: 0.01, min: 0.0001, max: 1, description: 'Step size for parameter updates' },
      momentum: { default: 0.9, min: 0, max: 0.99, description: 'Momentum factor for velocity' }
    },
    advantages: ['Faster convergence', 'Better navigation of ravines', 'Reduces oscillations'],
    disadvantages: ['Additional hyperparameter to tune', 'Can overshoot minima'],
    bestFor: ['Problems with consistent gradients', 'Non-convex optimization']
  },
  adam: {
    name: 'adam',
    description: 'Adaptive Moment Estimation - combines momentum with adaptive learning rates',
    formula: 'm = β₁m + (1-β₁)∇J; v = β₂v + (1-β₂)∇J²; θ = θ - α(m̂/(√v̂ + ε))',
    hyperparameters: {
      learningRate: { default: 0.001, min: 0.0001, max: 0.1, description: 'Base learning rate' },
      beta1: { default: 0.9, min: 0, max: 0.99, description: 'Exponential decay rate for first moment' },
      beta2: { default: 0.999, min: 0, max: 0.999, description: 'Exponential decay rate for second moment' },
      epsilon: { default: 1e-8, min: 1e-10, max: 1e-4, description: 'Small constant for numerical stability' }
    },
    advantages: ['Adaptive learning rates', 'Works well in practice', 'Efficient'],
    disadvantages: ['Can converge to suboptimal solutions', 'Memory intensive'],
    bestFor: ['Deep learning', 'Sparse gradients', 'Non-stationary objectives']
  },
  adamw: {
    name: 'adamw',
    description: 'Adam with decoupled weight decay - fixes weight decay in Adam',
    formula: 'Adam update + θ = θ - α·λ·θ',
    hyperparameters: {
      learningRate: { default: 0.001, min: 0.0001, max: 0.1, description: 'Base learning rate' },
      beta1: { default: 0.9, min: 0, max: 0.99, description: 'Exponential decay rate for first moment' },
      beta2: { default: 0.999, min: 0, max: 0.999, description: 'Exponential decay rate for second moment' },
      epsilon: { default: 1e-8, min: 1e-10, max: 1e-4, description: 'Small constant for numerical stability' },
      weightDecay: { default: 0.0001, min: 0, max: 0.1, description: 'Weight decay coefficient' }
    },
    advantages: ['Better generalization than Adam', 'Proper weight decay', 'State-of-the-art performance'],
    disadvantages: ['Additional hyperparameter', 'Memory intensive'],
    bestFor: ['Deep learning', 'When regularization is important', 'Transformer models']
  },
  rmsprop: {
    name: 'rmsprop',
    description: 'Root Mean Square Propagation - adaptive learning rate method',
    formula: 'v = ρv + (1-ρ)∇J²; θ = θ - α∇J/√(v + ε)',
    hyperparameters: {
      learningRate: { default: 0.001, min: 0.0001, max: 0.1, description: 'Base learning rate' },
      rho: { default: 0.9, min: 0, max: 0.99, description: 'Decay rate for squared gradients' },
      epsilon: { default: 1e-8, min: 1e-10, max: 1e-4, description: 'Small constant for numerical stability' }
    },
    advantages: ['Adaptive learning rates', 'Good for RNNs', 'Handles sparse gradients well'],
    disadvantages: ['Can be unstable', 'Learning rate still needs tuning'],
    bestFor: ['Recurrent neural networks', 'Non-stationary problems', 'Online learning']
  },
  adagrad: {
    name: 'adagrad',
    description: 'Adaptive Gradient Algorithm - adapts learning rate based on historical gradients',
    formula: 'G = G + ∇J²; θ = θ - α∇J/√(G + ε)',
    hyperparameters: {
      learningRate: { default: 0.01, min: 0.0001, max: 1, description: 'Initial learning rate' },
      epsilon: { default: 1e-8, min: 1e-10, max: 1e-4, description: 'Small constant for numerical stability' }
    },
    advantages: ['No manual learning rate tuning', 'Good for sparse features', 'Theoretical guarantees'],
    disadvantages: ['Learning rate decreases too aggressively', 'Can stop learning too early'],
    bestFor: ['Sparse data', 'NLP tasks', 'When features have different scales']
  },
  adadelta: {
    name: 'adadelta',
    description: 'Adaptive Delta - extension of Adagrad that addresses learning rate decay',
    formula: 'E[∇²] = ρE[∇²] + (1-ρ)∇²; Δθ = -√(E[Δθ²] + ε)/√(E[∇²] + ε)·∇',
    hyperparameters: {
      learningRate: { default: 1.0, min: 0.1, max: 10, description: 'Learning rate scaling factor (usually 1.0)' },
      rho: { default: 0.95, min: 0, max: 0.99, description: 'Decay rate for squared gradients and deltas' },
      epsilon: { default: 1e-6, min: 1e-10, max: 1e-4, description: 'Small constant for numerical stability' }
    },
    advantages: ['No learning rate parameter', 'Robust to hyperparameters', 'Continues learning'],
    disadvantages: ['Slow convergence', 'Complex to understand', 'May not work well for all problems'],
    bestFor: ['When you want to avoid tuning learning rate', 'Long training runs', 'Robust optimization']
  }
}

/**
 * Get optimizer configuration information
 */
export function getOptimizerInfo(optimizerType: OptimizerType): OptimizerConfig {
  return OPTIMIZER_CONFIGS[optimizerType]
}

/**
 * Initialize optimizer state with enhanced diagnostics
 */
export function initializeOptimizer(
  type: OptimizerType,
  learningRate: number,
  momentum: number = 0.9,
  weightDecay: number = 0.0001,
  beta1: number = 0.9,
  beta2: number = 0.999,
  epsilon: number = 1e-8,
  rho: number = 0.9
): OptimizerState {
  const config = OPTIMIZER_CONFIGS[type]
  
  const state: OptimizerState = {
    type,
    learningRate: Math.max(config.hyperparameters.learningRate.min, 
                          Math.min(config.hyperparameters.learningRate.max, learningRate)),
    momentum,
    weightDecay,
    beta1,
    beta2,
    epsilon,
    rho,
    step: 0,
    gradientNorm: 0,
    updateNorm: 0,
    learningRateScale: 1
  }
  
  // Initialize state variables based on optimizer type
  if (type === 'sgd_momentum') {
    state.velocities = new Map()
  }
  
  if (type === 'adam' || type === 'adamw') {
    state.moments = new Map()
    state.secondMoments = new Map()
  }
  
  if (type === 'rmsprop' || type === 'adagrad') {
    state.squaredGradients = new Map()
  }
  
  if (type === 'adadelta') {
    state.squaredGradients = new Map()
    state.squaredDeltas = new Map()
  }
  
  return state
}

/**
 * Apply optimizer update to neuron position with enhanced diagnostics
 */
export function applyOptimizerUpdate(
  neuron: Neuron,
  gradient: { x: number; y: number },
  optimizerState: OptimizerState
): { x: number; y: number } {
  const neuronId = neuron.id
  optimizerState.step = (optimizerState.step || 0) + 1
  
  // Calculate gradient norm for diagnostics
  optimizerState.gradientNorm = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y)
  
  let update: { x: number; y: number }
  
  switch (optimizerState.type) {
    case 'sgd':
      update = applySGD(gradient, optimizerState)
      break
    
    case 'sgd_momentum':
      update = applySGDMomentum(neuronId, gradient, optimizerState)
      break
    
    case 'adam':
      update = applyAdam(neuronId, gradient, optimizerState)
      break
    
    case 'adamw':
      update = applyAdamW(neuronId, gradient, optimizerState, neuron)
      break
    
    case 'rmsprop':
      update = applyRMSprop(neuronId, gradient, optimizerState)
      break
    
    case 'adagrad':
      update = applyAdagrad(neuronId, gradient, optimizerState)
      break
    
    case 'adadelta':
      update = applyAdadelta(neuronId, gradient, optimizerState)
      break
    
    default:
      throw new Error(`Unknown optimizer type: ${optimizerState.type}`)
  }
  
  // Calculate update norm for diagnostics
  optimizerState.updateNorm = Math.sqrt(update.x * update.x + update.y * update.y)
  
  // Calculate effective learning rate scale
  if (optimizerState.gradientNorm > 0) {
    optimizerState.learningRateScale = optimizerState.updateNorm / (optimizerState.gradientNorm * optimizerState.learningRate)
  }
  
  return update
}

/**
 * Standard SGD update
 */
function applySGD(gradient: { x: number; y: number }, state: OptimizerState): { x: number; y: number } {
  return {
    x: -state.learningRate * gradient.x,
    y: -state.learningRate * gradient.y
  }
}

/**
 * SGD with momentum update
 */
function applySGDMomentum(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState
): { x: number; y: number } {
  if (!state.velocities) {
    state.velocities = new Map()
  }
  
  const velocity = state.velocities.get(neuronId) || { x: 0, y: 0 }
  const momentum = state.momentum || 0.9
  
  // Update velocity: v = momentum * v - learning_rate * gradient
  const newVelocity = {
    x: momentum * velocity.x - state.learningRate * gradient.x,
    y: momentum * velocity.y - state.learningRate * gradient.y
  }
  
  state.velocities.set(neuronId, newVelocity)
  
  return newVelocity
}

/**
 * Adam optimizer update
 */
function applyAdam(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState
): { x: number; y: number } {
  if (!state.moments) state.moments = new Map()
  if (!state.secondMoments) state.secondMoments = new Map()
  
  const moment = state.moments.get(neuronId) || { x: 0, y: 0 }
  const secondMoment = state.secondMoments.get(neuronId) || { x: 0, y: 0 }
  
  const beta1 = state.beta1 || 0.9
  const beta2 = state.beta2 || 0.999
  const epsilon = state.epsilon || 1e-8
  const step = state.step || 1
  
  // Update biased first moment estimate
  const newMoment = {
    x: beta1 * moment.x + (1 - beta1) * gradient.x,
    y: beta1 * moment.y + (1 - beta1) * gradient.y
  }
  
  // Update biased second raw moment estimate
  const newSecondMoment = {
    x: beta2 * secondMoment.x + (1 - beta2) * gradient.x * gradient.x,
    y: beta2 * secondMoment.y + (1 - beta2) * gradient.y * gradient.y
  }
  
  state.moments.set(neuronId, newMoment)
  state.secondMoments.set(neuronId, newSecondMoment)
  
  // Compute bias-corrected first moment estimate
  const correctedMoment = {
    x: newMoment.x / (1 - Math.pow(beta1, step)),
    y: newMoment.y / (1 - Math.pow(beta1, step))
  }
  
  // Compute bias-corrected second raw moment estimate
  const correctedSecondMoment = {
    x: newSecondMoment.x / (1 - Math.pow(beta2, step)),
    y: newSecondMoment.y / (1 - Math.pow(beta2, step))
  }
  
  // Update parameters
  return {
    x: -state.learningRate * correctedMoment.x / (Math.sqrt(correctedSecondMoment.x) + epsilon),
    y: -state.learningRate * correctedMoment.y / (Math.sqrt(correctedSecondMoment.y) + epsilon)
  }
}

/**
 * AdamW optimizer update (Adam with weight decay)
 */
function applyAdamW(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState,
  neuron: Neuron
): { x: number; y: number } {
  // First apply Adam update
  const adamUpdate = applyAdam(neuronId, gradient, state)
  
  // Then apply weight decay directly to parameters
  const weightDecay = state.weightDecay || 0.0001
  const weightDecayUpdate = {
    x: -state.learningRate * weightDecay * neuron.x,
    y: -state.learningRate * weightDecay * neuron.y
  }
  
  return {
    x: adamUpdate.x + weightDecayUpdate.x,
    y: adamUpdate.y + weightDecayUpdate.y
  }
}

/**
 * RMSprop optimizer update
 * Root Mean Square Propagation - adaptive learning rate method
 */
function applyRMSprop(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState
): { x: number; y: number } {
  if (!state.squaredGradients) {
    state.squaredGradients = new Map()
  }
  
  const squaredGradient = state.squaredGradients.get(neuronId) || { x: 0, y: 0 }
  const rho = state.rho || 0.9
  const epsilon = state.epsilon || 1e-8
  
  // Update squared gradient moving average
  const newSquaredGradient = {
    x: rho * squaredGradient.x + (1 - rho) * gradient.x * gradient.x,
    y: rho * squaredGradient.y + (1 - rho) * gradient.y * gradient.y
  }
  
  state.squaredGradients.set(neuronId, newSquaredGradient)
  
  // Update parameters
  return {
    x: -state.learningRate * gradient.x / (Math.sqrt(newSquaredGradient.x) + epsilon),
    y: -state.learningRate * gradient.y / (Math.sqrt(newSquaredGradient.y) + epsilon)
  }
}

/**
 * Adagrad optimizer update
 * Adaptive Gradient Algorithm - adapts learning rate based on historical gradients
 */
function applyAdagrad(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState
): { x: number; y: number } {
  if (!state.squaredGradients) {
    state.squaredGradients = new Map()
  }
  
  const squaredGradient = state.squaredGradients.get(neuronId) || { x: 0, y: 0 }
  const epsilon = state.epsilon || 1e-8
  
  // Accumulate squared gradients
  const newSquaredGradient = {
    x: squaredGradient.x + gradient.x * gradient.x,
    y: squaredGradient.y + gradient.y * gradient.y
  }
  
  state.squaredGradients.set(neuronId, newSquaredGradient)
  
  // Update parameters
  return {
    x: -state.learningRate * gradient.x / (Math.sqrt(newSquaredGradient.x) + epsilon),
    y: -state.learningRate * gradient.y / (Math.sqrt(newSquaredGradient.y) + epsilon)
  }
}

/**
 * Adadelta optimizer update
 * Adaptive Delta - extension of Adagrad that addresses learning rate decay
 */
function applyAdadelta(
  neuronId: number,
  gradient: { x: number; y: number },
  state: OptimizerState
): { x: number; y: number } {
  if (!state.squaredGradients) {
    state.squaredGradients = new Map()
  }
  if (!state.squaredDeltas) {
    state.squaredDeltas = new Map()
  }
  
  const squaredGradient = state.squaredGradients.get(neuronId) || { x: 0, y: 0 }
  const squaredDelta = state.squaredDeltas.get(neuronId) || { x: 0, y: 0 }
  const rho = state.rho || 0.95
  const epsilon = state.epsilon || 1e-6
  
  // Update squared gradient moving average
  const newSquaredGradient = {
    x: rho * squaredGradient.x + (1 - rho) * gradient.x * gradient.x,
    y: rho * squaredGradient.y + (1 - rho) * gradient.y * gradient.y
  }
  
  state.squaredGradients.set(neuronId, newSquaredGradient)
  
  // Compute update
  const update = {
    x: -Math.sqrt(squaredDelta.x + epsilon) / Math.sqrt(newSquaredGradient.x + epsilon) * gradient.x,
    y: -Math.sqrt(squaredDelta.y + epsilon) / Math.sqrt(newSquaredGradient.y + epsilon) * gradient.y
  }
  
  // Update squared delta moving average
  const newSquaredDelta = {
    x: rho * squaredDelta.x + (1 - rho) * update.x * update.x,
    y: rho * squaredDelta.y + (1 - rho) * update.y * update.y
  }
  
  state.squaredDeltas.set(neuronId, newSquaredDelta)
  
  // Apply learning rate scaling
  return {
    x: state.learningRate * update.x,
    y: state.learningRate * update.y
  }
}

/**
 * Get optimizer diagnostics for monitoring and debugging
 */
export function getOptimizerDiagnostics(state: OptimizerState): {
  gradientNorm: number
  updateNorm: number
  learningRateScale: number
  step: number
  effectiveLearningRate: number
} {
  return {
    gradientNorm: state.gradientNorm || 0,
    updateNorm: state.updateNorm || 0,
    learningRateScale: state.learningRateScale || 1,
    step: state.step || 0,
    effectiveLearningRate: state.learningRate * (state.learningRateScale || 1)
  }
}

/**
 * Reset optimizer state (useful for restarting training)
 */
export function resetOptimizerState(state: OptimizerState): void {
  state.step = 0
  state.gradientNorm = 0
  state.updateNorm = 0
  state.learningRateScale = 1
  
  // Clear all accumulated state
  if (state.velocities) {
    state.velocities.clear()
  }
  if (state.moments) {
    state.moments.clear()
  }
  if (state.secondMoments) {
    state.secondMoments.clear()
  }
  if (state.squaredGradients) {
    state.squaredGradients.clear()
  }
  if (state.squaredDeltas) {
    state.squaredDeltas.clear()
  }
}

/**
 * Get recommended hyperparameters for a given optimizer
 */
export function getRecommendedHyperparameters(optimizerType: OptimizerType): {
  learningRate: number
  momentum?: number
  weightDecay?: number
  beta1?: number
  beta2?: number
  epsilon?: number
  rho?: number
} {
  const config = OPTIMIZER_CONFIGS[optimizerType]
  
  const params: any = {
    learningRate: config.hyperparameters.learningRate.default
  }
  
  if (config.hyperparameters.momentum) {
    params.momentum = config.hyperparameters.momentum.default
  }
  if (config.hyperparameters.weightDecay) {
    params.weightDecay = config.hyperparameters.weightDecay.default
  }
  if (config.hyperparameters.beta1) {
    params.beta1 = config.hyperparameters.beta1.default
  }
  if (config.hyperparameters.beta2) {
    params.beta2 = config.hyperparameters.beta2.default
  }
  if (config.hyperparameters.epsilon) {
    params.epsilon = config.hyperparameters.epsilon.default
  }
  if (config.hyperparameters.rho) {
    params.rho = config.hyperparameters.rho.default
  }
  
  return params
}

 