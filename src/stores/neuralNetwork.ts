import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataPoint, Neuron, OptimizationHistory, OptimizationStep, NeuronMovement } from '@/types'
import { getNeuronColor } from '@/utils/colors'
import { CONFIG } from '@/config'
import {
  calculateSimilarityScore,
  applyActivationFunction,
  getPrediction as mathGetPrediction,
  computeCategoricalCrossEntropyLoss,
  calculateNeuronGradient,
  calculateAccuracy as mathCalculateAccuracy,
  getActivationDerivative as mathGetActivationDerivative,
  clamp
} from '@/utils/mathCore'

export const useNeuralNetworkStore = defineStore('neuralNetwork', () => {
  // State
  const neurons = ref<Neuron[]>([])
  const dataPoints = ref<DataPoint[]>([])
  const activeClasses = ref<number[]>([])
  const allClasses = ref<number[]>([])
  const similarityMetric = ref<'dotProduct' | 'euclidean' | 'myProduct'>('dotProduct')
  const activationFunction = ref<'none' | 'softmax' | 'softermax' | 'sigmoid' | 'relu' | 'gelu'>('none')
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
    if (steps.length === 0) return computeLoss(filteredDataPoints.value)
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
  
  function computeLoss(data: DataPoint[]): number {
    return computeCategoricalCrossEntropyLoss(data, neurons.value, similarityMetric.value, activationFunction.value)
  }
  
  // Calculate gradient for a neuron
  function calculateGradient(neuron: Neuron, data: DataPoint[]): { x: number; y: number } {
    return calculateNeuronGradient(neuron, data, neurons.value, similarityMetric.value, activationFunction.value)
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
        
        // Update neuron position (gradient descent: subtract gradient)
        const newX = neuron.x - config.learningRate * gradient.x
        const newY = neuron.y - config.learningRate * gradient.y
        
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
    const loss = computeLoss(filteredDataPoints.value)
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
  
  function reset() {
    neurons.value = []
    dataPoints.value = []
    activeClasses.value = []
    allClasses.value = []
    selectedNeuronForLandscape.value = null
    similarityMetric.value = 'dotProduct'
    activationFunction.value = 'none'
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
    showPredictedColors,
    showBoundaries,
    showDataPoints,
    gridSize,
    coordinateRanges,
    selectedNeuronForLandscape,
    optimizationHistory,
    neuronMovements,
    
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
    computeLoss,
    calculateGradient,
    getActivationDerivative,
    runGradientDescent,
    stopOptimization,
    clearOptimizationHistory,
    updateOptimizationConfig,
    reset
  }
})
