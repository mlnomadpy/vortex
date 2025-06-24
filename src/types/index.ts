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

export type SimilarityMetric = 'dotProduct' | 'euclidean' | 'myProduct'
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
  }
}

export interface CSVRow {
  [key: string]: string | number
}
