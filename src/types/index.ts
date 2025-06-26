export interface DataPoint {
  x: number
  y: number
  label: number
  originalLabel?: number
}

export interface Neuron {
  id: number
  x: number
  y: number
  color: string
}

export interface Prediction {
  winningNeuron: Neuron | null
  scores: number[]
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
