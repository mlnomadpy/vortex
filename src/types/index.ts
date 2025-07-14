export interface DataPoint {
  x: number
  y: number
  label: number
  originalLabel?: number
}

// New: N-dimensional data point for MNIST
export interface NDDataPoint {
  features: number[]  // 784 features for MNIST (28x28 pixels)
  label: number      // Class label (0-9 for MNIST)
  originalLabel?: number
}

// New: N-dimensional neuron for high-dimensional classification
export interface NDNeuron {
  id: number
  weights: number[]  // Weight vector matching input dimensions
  bias: number
  color: string
  label?: string     // e.g., "Digit 0", "Digit 1", etc.
}

export interface Neuron {
  id: number
  x: number
  y: number
  color: string
}

// New: MNIST dataset structure
export interface MNISTDataset {
  trainImages: NDDataPoint[]
  testImages: NDDataPoint[]
  imageShape: { width: number; height: number }
  numClasses: number
}

// New: Training batch for efficient processing
export interface TrainingBatch {
  features: number[][]
  labels: number[]
  batchSize: number
}

// New: MNIST-specific optimization step
export interface NDOptimizationStep {
  step: number
  loss: number
  accuracy: number
  trainAccuracy: number
  testAccuracy: number
  timestamp: number
  neurons: Array<{
    id: number
    weights: number[]
    bias: number
    weightNorm?: number
    gradientNorm?: number
  }>
  learningMetrics?: {
    convergence: number
    weightDiversity: number
    activationSparsity: number
  }
}

// New: MNIST optimization history
export interface NDOptimizationHistory {
  steps: NDOptimizationStep[]
  isRunning: boolean
  currentStep: number
  totalSteps: number
  config: {
    learningRate: number
    epochs: number
    batchSize: number
    speed: number
    regularization?: {
      l1: number
      l2: number
    }
  }
}

export interface Prediction {
  winningNeuron: Neuron | null
  scores: number[]
}

// New: N-dimensional prediction
export interface NDPrediction {
  winningNeuron: NDNeuron | null
  scores: number[]
  probabilities: number[]
  confidence: number
}

export interface LossLandscapePoint {
  x: number
  y: number
  loss: number
}

export interface Metric {
  neuron: Neuron
  area: number
}

// New types for optimization tracking
export interface OptimizationStep {
  step: number
  loss: number
  accuracy: number
  timestamp: number
  neurons: Array<{
    id: number
    x: number
    y: number
    deltaX?: number
    deltaY?: number
  }>
}

export interface OptimizationHistory {
  steps: OptimizationStep[]
  isRunning: boolean
  currentStep: number
  totalSteps: number
  config: {
    learningRate: number
    epochs: number
    speed: number // Speed multiplier for animation
  }
}

export interface NeuronMovement {
  neuronId: number
  oldPosition: { x: number; y: number }
  newPosition: { x: number; y: number }
  step: number
  gradient: { x: number; y: number }
}

export type SimilarityMetric = 'dotProduct' | 'euclidean' | 'yatProduct'
export type ActivationFunction = 'none' | 'softmax' | 'softermax' | 'sigmoid' | 'relu' | 'gelu'
export type LossFunction = 'categoricalCrossEntropy' | 'meanSquaredError' | 'huberLoss' | 'hingeLoss' | 'binaryCrossEntropy' | 'focalLoss'
export type OptimizerType = 'sgd' | 'sgd_momentum' | 'adam' | 'adamw' | 'rmsprop' | 'adagrad' | 'adadelta'

// New: Extended similarity metrics for n-dimensional space
export type NDSimilarityMetric = SimilarityMetric | 'cosine' | 'manhattan' | 'rbf'

// New: Visualization modes for MNIST
export type MNISTVisualizationMode = 'weights' | 'activations' | 'gradients' | 'filters'

export interface NotificationItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export interface Config {
  mainCanvas: {
    width: number
    height: number
  }
  metricsCanvas: {
    width: number
    barPlotHeight: number
    lossLandscapeHeight: number
  }
  grid: {
    numCells: number
    cellSize: number
  }
  gradientDescent: {
    learningRate: number
    epochs: number
    speed: number
  }
}

export interface CSVRow {
  [key: string]: string | number
}
