/**
 * Application-wide constants and enums
 * This file centralizes magic strings and configuration values
 */

// ============ NOTIFICATION TYPES ============
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// ============ ERROR CODES ============
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  FILE_PARSE_ERROR: 'FILE_PARSE_ERROR',
  MATHJAX_ERROR: 'MATHJAX_ERROR',
  OPTIMIZATION_ERROR: 'OPTIMIZATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// ============ ERROR MESSAGES ============
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_CODES.FILE_PARSE_ERROR]: 'Unable to read the file. Please ensure it\'s a valid CSV with x, y, and label columns.',
  [ERROR_CODES.MATHJAX_ERROR]: 'Mathematical formulas failed to load. The app will continue to work normally.',
  [ERROR_CODES.OPTIMIZATION_ERROR]: 'An error occurred during optimization. Try adjusting the learning rate or dataset.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
}

// ============ THEMES ============
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
} as const

export type Theme = typeof THEMES[keyof typeof THEMES]

// ============ STORAGE KEYS ============
export const STORAGE_KEYS = {
  THEME: 'vortex-theme',
  USER_PREFERENCES: 'vortex-user-preferences',
  LAST_SESSION: 'vortex-last-session'
} as const

// ============ GRID UPDATE PRIORITIES ============
export const UPDATE_PRIORITIES = {
  IMMEDIATE: 'immediate',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
} as const

export type UpdatePriority = typeof UPDATE_PRIORITIES[keyof typeof UPDATE_PRIORITIES]

// ============ GRID UPDATE TYPES ============
export const UPDATE_TYPES = {
  NEURON_ADD: 'neuron-add',
  NEURON_REMOVE: 'neuron-remove',
  NEURON_MOVE: 'neuron-move',
  NEURON_COLOR: 'neuron-color',
  BOUNDARY_TOGGLE: 'boundary-toggle',
  METRIC_CHANGE: 'metric-change',
  DATA_CHANGE: 'data-change',
  RESIZE: 'resize',
  GRID_SIZE: 'grid-size',
  REINITIALIZE: 'reinitialize'
} as const

export type UpdateType = typeof UPDATE_TYPES[keyof typeof UPDATE_TYPES]

// ============ DEFAULT VALUES ============
export const DEFAULTS = {
  NOTIFICATION_DURATION: 3000,
  GRID_UPDATE_INTERVAL: 100,
  MAX_BATCH_SIZE: 5,
  LOADING_DELAY: 500,
  DEBOUNCE_DELAY: 300
} as const

// ============ VALIDATION PATTERNS ============
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  HSL_COLOR: /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/
} as const

// ============ SIMILARITY METRICS ============
export const SIMILARITY_METRICS = {
  DOT_PRODUCT: 'dotProduct',
  COSINE: 'cosine',
  EUCLIDEAN: 'euclidean',
  MANHATTAN: 'manhattan'
} as const

export type SimilarityMetric = typeof SIMILARITY_METRICS[keyof typeof SIMILARITY_METRICS]

// ============ ACTIVATION FUNCTIONS ============
export const ACTIVATION_FUNCTIONS = {
  NONE: 'none',
  RELU: 'relu',
  SIGMOID: 'sigmoid',
  TANH: 'tanh',
  SOFTMAX: 'softmax',
  LEAKY_RELU: 'leakyRelu',
  ELU: 'elu',
  SWISH: 'swish'
} as const

export type ActivationFunction = typeof ACTIVATION_FUNCTIONS[keyof typeof ACTIVATION_FUNCTIONS]

// ============ API ENDPOINTS (if needed) ============
export const API_ENDPOINTS = {
  HEALTH: '/health',
  FORWARD: '/forward',
  GRADIENTS: '/gradients',
  TRAIN_STEP: '/train_step',
  ACCURACY: '/accuracy',
  BATCH_FORWARD: '/batch_forward'
} as const

// ============ DATASET TYPES ============
export const DATASET_TYPES = {
  MNIST: 'mnist',
  FASHION_MNIST: 'fashion_mnist',
  CIFAR10: 'cifar10'
} as const

export type DatasetType = typeof DATASET_TYPES[keyof typeof DATASET_TYPES]

// ============ DATASET SUBSETS ============
export const DATASET_SUBSETS = {
  TRAIN: 'train',
  TEST: 'test'
} as const

export type DatasetSubset = typeof DATASET_SUBSETS[keyof typeof DATASET_SUBSETS]
