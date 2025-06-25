import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataPoint, Neuron, OptimizationHistory, OptimizationStep, NeuronMovement } from '@/types'
import { getNeuronColor } from '@/utils/colors'
import { CONFIG } from '@/config'

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
    if (filteredDataPoints.value.length === 0 || neurons.value.length === 0) return 0
    
    let correctCount = 0
    filteredDataPoints.value.forEach(point => {
      const prediction = getPrediction(point.x, point.y)
      if (prediction.winningNeuron && prediction.winningNeuron.id === point.label) {
        correctCount++
      }
    })
    
    return (correctCount / filteredDataPoints.value.length) * 100
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
    const dx = x - neuron.x
    const dy = y - neuron.y
    const distSq = dx * dx + dy * dy
    
    switch (similarityMetric.value) {
      case 'dotProduct':
        return x * neuron.x + y * neuron.y
      case 'euclidean':
        return -Math.sqrt(distSq)
      case 'myProduct':
        const dotProd = x * neuron.x + y * neuron.y
        const rawScore = (dotProd * dotProd) / (distSq + 1e-6)
        // Clamp the score to prevent softmax overflow
        return Math.min(rawScore, 50) // Cap at 50 to prevent exp() overflow
      default:
        return 0
    }
  }
  
  function applyActivation(scores: number[]): number[] {
    if (activationFunction.value === 'none' || scores.length === 0) return scores
    
    switch (activationFunction.value) {
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
        return scores
    }
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
    if (neurons.value.length === 0 || data.length === 0) return 0
    
    let totalLoss = 0
    const numSamples = data.length
    
    data.forEach(point => {
      // Get scores for all neurons
      const scores = neurons.value.map(n => calculateScore(n, point.x, point.y))
      
      // Apply activation function to get probabilities
      // For categorical cross-entropy, we need proper probability distribution
      let probabilities: number[]
      
      if (activationFunction.value === 'none') {
        // For no activation, use softmax to get proper probabilities
        const maxScore = Math.max(...scores)
        const exps = scores.map(s => Math.exp(s - maxScore))
        const sumExps = exps.reduce((a, b) => a + b, 0)
        probabilities = exps.map(e => e / (sumExps + 1e-8)) // Add epsilon for stability
      } else {
        probabilities = applyActivation(scores)
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
      const correctClassIndex = neurons.value.findIndex(n => n.id === point.label)
      
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
  
  // Calculate gradient for a neuron
  function calculateGradient(neuron: Neuron, data: DataPoint[]): { x: number; y: number } {
    if (data.length === 0) return { x: 0, y: 0 }
    
    let gradX = 0
    let gradY = 0
    const numSamples = data.length
    
    data.forEach(point => {
      const scores = neurons.value.map(n => calculateScore(n, point.x, point.y))
      
      // Get probabilities using the same logic as loss computation
      let probabilities: number[]
      
      if (activationFunction.value === 'none') {
        // For no activation, use softmax to get proper probabilities
        const maxScore = Math.max(...scores)
        const exps = scores.map(s => Math.exp(s - maxScore))
        const sumExps = exps.reduce((a, b) => a + b, 0)
        probabilities = exps.map(e => e / (sumExps + 1e-8))
      } else {
        probabilities = applyActivation(scores)
      }
      
      // Ensure probabilities sum to 1
      const probSum = probabilities.reduce((a, b) => a + b, 0)
      if (probSum > 0) {
        probabilities = probabilities.map(p => p / probSum)
      }
      
      const correctClassIndex = neurons.value.findIndex(n => n.id === point.label)
      const neuronIndex = neurons.value.findIndex(n => n.id === neuron.id)
      
      if (correctClassIndex !== -1 && neuronIndex !== -1) {
        // For categorical cross-entropy with softmax:
        // gradient = (predicted_probability - target) for the correct class
        // where target is 1 for correct class, 0 for others
        const target = correctClassIndex === neuronIndex ? 1 : 0
        const predicted = probabilities[neuronIndex]
        
        // The gradient of categorical cross-entropy w.r.t. the logits (scores)
        // when using softmax is simply: predicted - target
        const error = predicted - target
        
        // Apply chain rule for different similarity metrics
        switch (similarityMetric.value) {
          case 'dotProduct':
            gradX += error * point.x
            gradY += error * point.y
            break
          case 'euclidean':
            const dx = point.x - neuron.x
            const dy = point.y - neuron.y
            const dist = Math.sqrt(dx * dx + dy * dy) + 1e-6
            gradX += error * dx / dist
            gradY += error * dy / dist
            break
          case 'myProduct':
            const dx2 = point.x - neuron.x
            const dy2 = point.y - neuron.y
            const distSq = dx2 * dx2 + dy2 * dy2 + 1e-6
            const dotProd = point.x * neuron.x + point.y * neuron.y
            // Gradient for f = (dotProd)² / distSq
            // Using quotient rule: ∂f/∂neuron.x = (distSq * ∂(dotProd²)/∂neuron.x - dotProd² * ∂(distSq)/∂neuron.x) / distSq²
            // ∂(dotProd²)/∂neuron.x = 2 * dotProd * point.x
            // ∂(distSq)/∂neuron.x = 2 * (neuron.x - point.x)
            const numeratorX = distSq * 2 * dotProd * point.x - dotProd * dotProd * 2 * (neuron.x - point.x)
            const gradientX = numeratorX / (distSq * distSq)
            gradX += error * gradientX
            
            const numeratorY = distSq * 2 * dotProd * point.y - dotProd * dotProd * 2 * (neuron.y - point.y)
            const gradientY = numeratorY / (distSq * distSq)
            gradY += error * gradientY
            break
        }
      }
    })
    
    return { x: gradX / numSamples, y: gradY / numSamples }
  }
  
  // Get derivative of activation function at given index
  function getActivationDerivative(scores: number[], neuronIndex: number): number {
    if (activationFunction.value === 'none' || scores.length === 0) return 1
    
    const score = scores[neuronIndex]
    const activatedScores = applyActivation(scores)
    const activatedScore = activatedScores[neuronIndex]
    
    switch (activationFunction.value) {
      case 'softmax':
        // For softmax: derivative is p_i * (1 - p_i) for diagonal terms
        // and -p_i * p_j for off-diagonal terms
        // Simplified to just use p_i * (1 - p_i) for the target neuron
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
        // For GELU: derivative is more complex
        const tanh_term = Math.tanh(Math.sqrt(2 / Math.PI) * (score + 0.044715 * Math.pow(score, 3)))
        const sech2_term = 1 - tanh_term * tanh_term // sech^2 = 1 - tanh^2
        const inner_derivative = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * score * score)
        return 0.5 * (1 + tanh_term) + 0.5 * score * sech2_term * inner_derivative
      default:
        return 1
    }
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
        neuron.x = Math.max(coordinateRanges.value.xMin, 
                   Math.min(coordinateRanges.value.xMax, newX))
        neuron.y = Math.max(coordinateRanges.value.yMin, 
                   Math.min(coordinateRanges.value.yMax, newY))
        
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
