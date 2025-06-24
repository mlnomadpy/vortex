import type { Config } from '@/types'

export const CONFIG: Config = {
  mainCanvas: {
    width: 600,
    height: 600
  },
  metricsCanvas: {
    width: 300,
    barPlotHeight: 150,
    lossLandscapeHeight: 300
  },
  grid: {
    numCells: 100,
    cellSize: 6 // Will be calculated as width/numCells
  },
  gradientDescent: {
    learningRate: 0.01,
    epochs: 100
  }
}

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: '#6b7280'
}

export const ANIMATION = {
  duration: 300,
  easing: 'ease-in-out'
}
