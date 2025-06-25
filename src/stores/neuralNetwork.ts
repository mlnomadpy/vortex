import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataPoint, Neuron } from '@/types'

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
  
  // Actions
  function addNeuron(x: number, y: number) {
    const neuron: Neuron = {
      id: neurons.value.length,
      x,
      y,
      color: `hsl(${(neurons.value.length * 360 / 10) % 360}, 70%, 60%)`
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
        return (x * neuron.x + y * neuron.y) / (Math.sqrt(distSq) + 1e-6)
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
    data.forEach(point => {
      const scores = neurons.value.map(n => calculateScore(n, point.x, point.y))
      const probabilities = applyActivation(scores.length > 1 ? scores : [scores[0], -scores[0]])
      
      const correctClassIndex = neurons.value.findIndex(n => n.id === point.label)
      if (correctClassIndex !== -1 && probabilities[correctClassIndex] > 0) {
        totalLoss -= Math.log(probabilities[correctClassIndex])
      } else {
        totalLoss -= Math.log(1e-9)
      }
    })
    
    return totalLoss / data.length
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
    
    // Computed
    filteredDataPoints,
    accuracy,
    
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
    reset
  }
})
