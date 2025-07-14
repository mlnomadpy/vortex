import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataPoint, Neuron, OptimizationHistory, OptimizationStep, NeuronMovement, LossFunction } from '@/types'
import { getNeuronColor } from '@/utils/colors'
import { CONFIG } from '@/config'
import {
  calculateSimilarityScore,
  applyActivationFunction,
  computeLoss,
  calculateNeuronGradient,
  calculateNeuronGradientWithLoss,
  calculateAccuracy as mathCalculateAccuracy,
  getActivationDerivative as mathGetActivationDerivative,
  clamp,
  initializeOptimizer,
  applyOptimizerUpdate,
  type OptimizerState
} from '@/utils/mathCore'

export const useNeuralNetworkStore = defineStore('neuralNetwork', () => {
  // State
  const neurons = ref<Neuron[]>([])
  const dataPoints = ref<DataPoint[]>([])
  const activeClasses = ref<number[]>([])
  const allClasses = ref<number[]>([])
  const similarityMetric = ref<'dotProduct' | 'euclidean' | 'yatProduct'>('dotProduct')
  const activationFunction = ref<'none' | 'softmax' | 'softermax' | 'sigmoid' | 'relu' | 'gelu'>('none')
  const lossFunction = ref<LossFunction>('categoricalCrossEntropy')
  const showPredictedColors = ref(true)
  const showBoundaries = ref(false)
  const showDataPoints = ref(true)
  const gridSize = ref(30)
  const coordinateRanges = ref({
    xMin: -1,
    xMax: 1,
    yMin: -1,
    yMax: 1
  })
  const selectedNeuronForLandscape = ref<Neuron | null>(null)
  
  // Optimization state
  const optimizationHistory = ref<OptimizationHistory>({
    steps: [],
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    config: {
      learningRate: CONFIG.gradientDescent.learningRate,
      epochs: CONFIG.gradientDescent.epochs,
      speed: CONFIG.gradientDescent.speed
    }
  })
  
  const neuronMovements = ref<NeuronMovement[]>([])
  
  // Optimizer state
  const optimizerState = ref<OptimizerState | null>(null)
  
  // Computed - optimized with memoization
  const filteredDataPoints = computed(() => {
    return dataPoints.value.filter(point => activeClasses.value.includes(point.label))
  })
  
  const accuracy = computed(() => {
    return mathCalculateAccuracy(filteredDataPoints.value, neurons.value, similarityMetric.value, activationFunction.value) * 100
  })
  
  // Get the latest loss from optimization history
  const currentLoss = computed(() => {
    const steps = optimizationHistory.value.steps
    if (steps.length === 0) return computeLossWithFunction(filteredDataPoints.value)
    return steps[steps.length - 1].loss
  })
  
  // Actions
  function addNeuron(x: number, y: number) {
    const neuron: Neuron = {
      id: neurons.value.length,
      x,
      y,
      color: getNeuronColor(neurons.value.length)
    }
    neurons.value.push(neuron)
    selectedNeuronForLandscape.value = neuron
    return neuron
  }
  
  function removeLastNeuron() {
    if (neurons.value.length > 0) {
      neurons.value.pop()
      selectedNeuronForLandscape.value = neurons.value.length > 0 
        ? neurons.value[neurons.value.length - 1] 
        : null
    }
  }
  
  function clearNeurons() {
    neurons.value = []
    selectedNeuronForLandscape.value = null
  }
  
  function setDataPoints(points: DataPoint[]) {
    dataPoints.value = points
    
    // Update class arrays efficiently
    const uniqueLabels = new Set<number>()
    points.forEach(point => uniqueLabels.add(point.label))
    allClasses.value = Array.from(uniqueLabels).sort((a, b) => a - b)
    
    // Activate all classes by default
    activeClasses.value = [...allClasses.value]
  }
  
  function toggleClass(classLabel: number) {
    if (activeClasses.value.includes(classLabel)) {
      activeClasses.value = activeClasses.value.filter(c => c !== classLabel)
    } else {
      activeClasses.value = [...activeClasses.value, classLabel]
    }
  }
  
  function calculateScore(neuron: Neuron, x: number, y: number): number {
    return calculateSimilarityScore(neuron, x, y, similarityMetric.value)
  }
  
  function applyActivation(scores: number[]): number[] {
    return applyActivationFunction(scores, activationFunction.value)
  }
  
  function getPrediction(x: number, y: number): { winningNeuron: Neuron | null, scores: number[] } {
    if (neurons.value.length === 0) return { winningNeuron: null, scores: [] }
    
    const scores = neurons.value.map(n => calculateScore(n, x, y))
    const activatedScores = applyActivation(scores)
    
    let maxScore = -Infinity
    let winningNeuron: Neuron | null = null
    
    activatedScores.forEach((score, i) => {
      if (score > maxScore) {
        maxScore = score
        winningNeuron = neurons.value[i]
      }
    })
    
    return { winningNeuron, scores: activatedScores }
  }
  
  function computeLossWithFunction(data: DataPoint[]): number {
    return computeLoss(data, neurons.value, similarityMetric.value, activationFunction.value, lossFunction.value)
  }
  
  // Calculate gradient for a neuron
  function calculateGradient(neuron: Neuron, data: DataPoint[]): { x: number; y: number } {
    return calculateNeuronGradientWithLoss(neuron, data, neurons.value, similarityMetric.value, activationFunction.value, lossFunction.value)
  }
  
  // Get derivative of activation function at given index
  function getActivationDerivative(scores: number[], neuronIndex: number): number {
    return mathGetActivationDerivative(scores, neuronIndex, activationFunction.value)
  }
  
  // Gradient descent optimization
  async function runGradientDescent(): Promise<void> {
    if (neurons.value.length === 0 || filteredDataPoints.value.length === 0) {
      return
    }
    
    const config = optimizationHistory.value.config
    const totalSteps = config.epochs
    
    // Initialize optimization
    optimizationHistory.value = {
      steps: [],
      isRunning: true,
      currentStep: 0,
      totalSteps,
      config
    }
    
    neuronMovements.value = []
    
    // Record initial state
    recordOptimizationStep(0)
    
    // Run optimization steps
    for (let step = 1; step <= totalSteps && optimizationHistory.value.isRunning; step++) {
      optimizationHistory.value.currentStep = step
      
      // Calculate gradients and update neuron positions
      const movements: NeuronMovement[] = []
      
      neurons.value.forEach(neuron => {
        const gradient = calculateGradient(neuron, filteredDataPoints.value)
        const oldPosition = { x: neuron.x, y: neuron.y }
        
        // Apply optimizer update
        let update: { x: number; y: number }
        if (optimizerState.value) {
          update = applyOptimizerUpdate(neuron, gradient, optimizerState.value)
        } else {
          // Fallback to basic gradient descent
          update = {
            x: -config.learningRate * gradient.x,
            y: -config.learningRate * gradient.y
          }
        }
        
        // Update neuron position
        const newX = neuron.x + update.x
        const newY = neuron.y + update.y
        
        // Clamp to coordinate ranges
        neuron.x = clamp(newX, coordinateRanges.value.xMin, coordinateRanges.value.xMax)
        neuron.y = clamp(newY, coordinateRanges.value.yMin, coordinateRanges.value.yMax)
        
        const newPosition = { x: neuron.x, y: neuron.y }
        
        movements.push({
          neuronId: neuron.id,
          oldPosition,
          newPosition,
          step,
          gradient
        })
      })
      
      neuronMovements.value.push(...movements)
      recordOptimizationStep(step)
      
      // Force reactivity update to trigger watchers and re-renders
      // This ensures the UI updates during optimization
      neurons.value = [...neurons.value]
      
      // Wait for animation based on speed setting
      const delay = Math.max(50, 500 / config.speed)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // Finish optimization
    optimizationHistory.value.isRunning = false
  }
  
  function recordOptimizationStep(step: number): void {
    const loss = computeLossWithFunction(filteredDataPoints.value)
    const acc = accuracy.value
    
    const optimizationStep: OptimizationStep = {
      step,
      loss,
      accuracy: acc,
      timestamp: Date.now(),
      neurons: neurons.value.map(n => ({
        id: n.id,
        x: n.x,
        y: n.y
      }))
    }
    
    optimizationHistory.value.steps.push(optimizationStep)
  }
  
  function stopOptimization(): void {
    optimizationHistory.value.isRunning = false
  }
  
  function clearOptimizationHistory(): void {
    optimizationHistory.value.steps = []
    neuronMovements.value = []
    optimizationHistory.value.currentStep = 0
  }
  
  function updateOptimizationConfig(config: { learningRate?: number; epochs?: number; speed?: number }): void {
    Object.assign(optimizationHistory.value.config, config)
  }
  
  function initializeOptimizerState(
    type: 'sgd' | 'sgd_momentum' | 'adam' | 'adamw' | 'rmsprop' | 'adagrad' | 'adadelta',
    learningRate: number,
    momentum: number = 0.9,
    weightDecay: number = 0.0001,
    beta1: number = 0.9,
    beta2: number = 0.999,
    epsilon: number = 1e-8,
    rho: number = 0.9
  ): void {
    optimizerState.value = initializeOptimizer(type, learningRate, momentum, weightDecay, beta1, beta2, epsilon, rho)
  }

  function reset() {
    neurons.value = []
    dataPoints.value = []
    activeClasses.value = []
    allClasses.value = []
    selectedNeuronForLandscape.value = null
    similarityMetric.value = 'dotProduct'
    activationFunction.value = 'none'
    lossFunction.value = 'categoricalCrossEntropy'
    showPredictedColors.value = true
    showBoundaries.value = false
    showDataPoints.value = true
    gridSize.value = 30
    coordinateRanges.value = {
      xMin: -1,
      xMax: 1,
      yMin: -1,
      yMax: 1
    }
    optimizerState.value = null
    clearOptimizationHistory()
  }
  
  return {
    // State
    neurons,
    dataPoints,
    activeClasses,
    allClasses,
    similarityMetric,
    activationFunction,
    lossFunction,
    showPredictedColors,
    showBoundaries,
    showDataPoints,
    gridSize,
    coordinateRanges,
    selectedNeuronForLandscape,
    optimizationHistory,
    neuronMovements,
    optimizerState,
    
    // Computed
    filteredDataPoints,
    accuracy,
    currentLoss,
    
    // Actions
    addNeuron,
    removeLastNeuron,
    clearNeurons,
    setDataPoints,
    toggleClass,
    calculateScore,
    applyActivation,
    getPrediction,
    computeLoss: computeLossWithFunction,
    calculateGradient,
    getActivationDerivative,
    runGradientDescent,
    stopOptimization,
    clearOptimizationHistory,
    updateOptimizationConfig,
    initializeOptimizerState,
    reset
  }
})
