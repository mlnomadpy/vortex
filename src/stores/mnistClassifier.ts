import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  NDDataPoint, 
  NDNeuron, 
  NDOptimizationHistory, 
  NDOptimizationStep, 
  NDSimilarityMetric, 
  ActivationFunction,
  MNISTDataset,
  TrainingBatch
} from '@/types'
import { getNeuronColor } from '@/utils/colors'
import { CONFIG } from '@/config'
import {
  calculateNDSimilarityScore,
  applyNDActivationFunction,
  computeNDCategoricalCrossEntropyLoss,
  calculateNDNeuronGradient,
  calculateNDAccuracy,
  initializeNDNeuronWeights,
  createTrainingBatches,
  clamp,
  getNDPrediction
} from '@/utils/ndMathCore'
import { mnistLoader } from '@/utils/mnistLoader'
import gpuAcceleration from '@/utils/gpuAcceleration'
import { mnistWorkerManager } from '@/utils/workerManager'
import multiThreadManager from '@/utils/multiThreadManager'

export const useMNISTClassifierStore = defineStore('mnistClassifier', () => {
  // State
  const neurons = ref<NDNeuron[]>([])
  const trainData = ref<NDDataPoint[]>([])
  const testData = ref<NDDataPoint[]>([])
  const currentBatch = ref<NDDataPoint[]>([])
  const activeClasses = ref<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const allClasses = ref<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  
  // Network configuration - supports all original similarity metrics and activation functions
  const similarityMetric = ref<NDSimilarityMetric>('dotProduct')
  const activationFunction = ref<ActivationFunction>('softmax')
  
  // Visualization settings
  const visualizationMode = ref<'weights' | 'activations' | 'gradients'>('weights')
  const selectedNeuron = ref<NDNeuron | null>(null)
  
  // Dataset info
  const datasetInfo = ref<{
    trainSize: number
    testSize: number
    numFeatures: number
    numClasses: number
  }>({
    trainSize: 0,
    testSize: 0,
    numFeatures: 784, // MNIST has 28x28 = 784 features
    numClasses: 10
  })
  
  // Optimization state
  const optimizationHistory = ref<NDOptimizationHistory>({
    steps: [],
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    config: {
      learningRate: 0.01,
      epochs: 100,
      batchSize: 32,
      speed: 1,
      regularization: {
        l1: 0,
        l2: 0.001
      }
    }
  })

  // GPU acceleration settings
  const useGpuAcceleration = ref(true)
  const gpuAvailable = ref(false)
  
  // Worker settings
  const useWorkers = ref(true)
  const workerAvailable = ref(false)
  
  // Visualization trigger counter (increments on every neuron update)
  const visualizationUpdateTrigger = ref(0)
  
  // Computed properties
  const filteredTrainData = computed(() => {
    return trainData.value.filter(point => activeClasses.value.includes(point.label))
  })
  
  const filteredTestData = computed(() => {
    return testData.value.filter(point => activeClasses.value.includes(point.label))
  })
  
  const trainAccuracy = computed(() => {
    if (neurons.value.length === 0 || filteredTrainData.value.length === 0) return 0
    return calculateNDAccuracy(filteredTrainData.value, neurons.value, similarityMetric.value, activationFunction.value) * 100
  })
  
  const testAccuracy = computed(() => {
    if (neurons.value.length === 0 || filteredTestData.value.length === 0) return 0
    return calculateNDAccuracy(filteredTestData.value, neurons.value, similarityMetric.value, activationFunction.value) * 100
  })
  
  const currentLoss = computed(() => {
    const steps = optimizationHistory.value.steps
    if (steps.length === 0) return computeLoss(filteredTrainData.value)
    return steps[steps.length - 1].loss
  })
  
  const isTraining = computed(() => optimizationHistory.value.isRunning)
  
  // Actions
  
  /**
   * Initialize MNIST classifier with 10 neurons (one for each digit)
   */
  function initializeClassifier(initStrategy: 'random' | 'xavier' | 'he' = 'xavier') {
    console.log('Initializing MNIST classifier with 10 neurons...')
    
    // Check GPU and Worker availability
    checkGpuSupport()
    checkWorkerSupport()
    
    // Clear existing neurons
    neurons.value = []
    
    // Create 10 neurons (one for each digit 0-9)
    for (let i = 0; i < 10; i++) {
      const weights = initializeNDNeuronWeights(datasetInfo.value.numFeatures, initStrategy)
      
      const neuron: NDNeuron = {
        id: i,
        weights,
        bias: 0,
        color: getNeuronColor(i),
        label: `Digit ${i}`
      }
      
      neurons.value.push(neuron)
    }
    
    console.log(`Initialized ${neurons.value.length} neurons with ${initStrategy} strategy`)
    console.log(`GPU acceleration: ${gpuAvailable.value ? 'available' : 'not available'}`)
    selectedNeuron.value = neurons.value[0]
    
    // Initialize GPU.js kernels if GPU is available
    if (gpuAvailable.value && useGpuAcceleration.value) {
      try {
        // GPU.js kernels are already initialized in the acceleration manager
        console.log('GPU.js kernels ready for acceleration')
      } catch (error) {
        console.warn('Failed to initialize GPU.js kernels:', error)
        useGpuAcceleration.value = false
      }
    }
  }

  /**
   * Check GPU support and availability
   */
  function checkGpuSupport() {
    try {
      // Force initialization of GPU acceleration to test it
      gpuAcceleration.ensureInitialized()
      
      gpuAvailable.value = gpuAcceleration.checkAvailability()
      console.log(`🔍 GPU acceleration check - Available: ${gpuAvailable.value}`)
      
      if (gpuAvailable.value) {
        console.log('🚀 GPU.js backend mode:', gpuAcceleration.gpu?.mode || 'unknown')
        console.log('💪 GPU acceleration is ready for use!')
      } else {
        console.warn('⚠️ GPU acceleration not available, will use CPU fallback')
      }
    } catch (error) {
      console.warn('❌ Error checking GPU support:', error)
      gpuAvailable.value = false
      useGpuAcceleration.value = false
    }
  }

  /**
   * Check Web Worker support and availability
   */
  function checkWorkerSupport() {
    try {
      workerAvailable.value = mnistWorkerManager.isWorkerReady()
      console.log(`Web Workers available: ${workerAvailable.value}`)
    } catch (error) {
      console.warn('Error checking Worker support:', error)
      workerAvailable.value = false
      useWorkers.value = false
    }
  }
  
  /**
   * Load MNIST dataset
   */
  async function loadDataset(maxSamples: { train: number; test: number } = { train: 1000, test: 200 }): Promise<void> {
    try {
      console.log('Loading MNIST dataset...')
      const dataset = await mnistLoader.loadMNIST(maxSamples)
      
      trainData.value = dataset.trainImages
      testData.value = dataset.testImages
      
      // Update dataset info
      datasetInfo.value = {
        trainSize: dataset.trainImages.length,
        testSize: dataset.testImages.length,
        numFeatures: dataset.trainImages[0]?.features.length || 784,
        numClasses: dataset.numClasses
      }
      
      console.log('Dataset loaded successfully:', datasetInfo.value)
      
      // Initialize classifier if not already done
      if (neurons.value.length === 0) {
        initializeClassifier()
      }
      
    } catch (error) {
      console.error('Failed to load dataset:', error)
      throw error
    }
  }
  
  /**
   * Toggle class visibility
   */
  function toggleClass(classLabel: number) {
    if (activeClasses.value.includes(classLabel)) {
      activeClasses.value = activeClasses.value.filter(c => c !== classLabel)
    } else {
      activeClasses.value = [...activeClasses.value, classLabel]
    }
  }
  
  /**
   * Get prediction for a single input
   */
  function getPrediction(features: number[]) {
    const prediction = getNDPrediction(features, neurons.value, similarityMetric.value, activationFunction.value)
    return prediction.winningNeuron?.id ?? null
  }

  /**
   * Get prediction using multi-threaded computation (for heavy workloads)
   */
  async function getPredictionAsync(features: number[]): Promise<number | null> {
    if (neurons.value.length === 0) return null
    
    try {
      const allNeuronWeights = neurons.value.map(n => n.weights)
      
      // Use multi-threaded manager for similarity computation
      const scores = await multiThreadManager.computeSimilarity(
        features,
        allNeuronWeights,
        similarityMetric.value,
        gpuAvailable.value && useGpuAcceleration.value
      )
      
      const predictions = applyNDActivationFunction(scores, activationFunction.value)
      return predictions.indexOf(Math.max(...predictions))
      
    } catch (error) {
      console.warn('Async prediction failed, falling back to sync:', error)
      return getPrediction(features)
    }
  }
  
  /**
   * Compute loss for current data
   */
  function computeLoss(data: NDDataPoint[]): number {
    return computeNDCategoricalCrossEntropyLoss(data, neurons.value, similarityMetric.value, activationFunction.value)
  }

  /**
   * Compute loss using worker (async version)
   */
  async function computeLossAsync(data: NDDataPoint[]): Promise<number> {
    if (workerAvailable.value && useWorkers.value) {
      try {
        return await mnistWorkerManager.computeLoss(data, neurons.value, similarityMetric.value, activationFunction.value)
      } catch (error) {
        console.warn('Worker loss computation failed, falling back to main thread:', error)
      }
    }
    
    // Fallback to main thread computation
    return computeLoss(data)
  }
  
  /**
   * Calculate gradient for a specific neuron
   */
  function calculateGradient(neuron: NDNeuron, data: NDDataPoint[]): { weights: number[]; bias: number } {
    return calculateNDNeuronGradient(neuron, data, neurons.value, similarityMetric.value, activationFunction.value)
  }
  
  /**
   * Run gradient descent training
   */
  async function runTraining(): Promise<void> {
    console.log('🎯 Store runTraining called')
    console.log('Neurons:', neurons.value.length)
    console.log('Filtered train data:', filteredTrainData.value.length)
    
    if (neurons.value.length === 0 || filteredTrainData.value.length === 0) {
      console.warn('Cannot start training: no neurons or training data')
      return
    }
    
    const config = optimizationHistory.value.config
    console.log('Starting training with config:', config)
    
    // Initialize optimization
    optimizationHistory.value = {
      steps: [],
      isRunning: true,
      currentStep: 0,
      totalSteps: config.epochs,
      config
    }
    
    // Create training batches
    const batches = createTrainingBatches(filteredTrainData.value, config.batchSize)
    console.log(`Created ${batches.length} training batches`)
    
    // Record initial state
    await recordOptimizationStep(0)
    
    // Training loop
    console.log('🔄 Starting training loop with', config.epochs, 'epochs')
    for (let epoch = 1; epoch <= config.epochs && optimizationHistory.value.isRunning; epoch++) {
      console.log(`📊 Epoch ${epoch}/${config.epochs}`)
      optimizationHistory.value.currentStep = epoch
      
      // Shuffle batches for each epoch
      const shuffledBatches = [...batches].sort(() => Math.random() - 0.5)
      
      // Process each batch
      for (const batch of shuffledBatches) {
        if (!optimizationHistory.value.isRunning) {
          console.log('⏹️ Training stopped by user')
          break
        }
        
        const batchData: NDDataPoint[] = batch.features.map((features, i) => ({
          features,
          label: batch.labels[i]
        }))
        
        // Update current batch for visualization
        currentBatch.value = batchData
        
        try {
          // Calculate gradients and update neurons
          await updateNeuronsWithBatch(batchData, config.learningRate)
        } catch (error) {
          console.error('❌ Batch update failed:', error)
          throw error
        }
        
        // Calculate real-time metrics after each batch
        const currentLoss = computeLoss(batchData)
        const currentAccuracy = calculateNDAccuracy(batchData, neurons.value, similarityMetric.value, activationFunction.value) * 100
        
        // Update optimization history with batch-level metrics
        const currentStep = optimizationHistory.value.steps.length
        optimizationHistory.value.steps.push({
          step: currentStep,
          loss: currentLoss,
          accuracy: currentAccuracy,
          trainAccuracy: currentAccuracy,
          testAccuracy: 0, // We'll calculate this less frequently
          timestamp: Date.now(),
          neurons: neurons.value.map(n => ({
            id: n.id,
            weights: [...n.weights],
            bias: n.bias
          })),
          learningMetrics: {
            convergence: 0,
            weightDiversity: 0,
            activationSparsity: 0
          }
        })
        
        // Force reactivity update after each batch for real-time visualization
        neurons.value = neurons.value.map(n => ({
          ...n,
          weights: [...n.weights] // Ensure weights array is also fresh
        }))
        visualizationUpdateTrigger.value++ // Trigger visualization updates
        
        console.log(`✅ Batch processed - Loss: ${currentLoss.toFixed(4)}, Accuracy: ${currentAccuracy.toFixed(1)}%`)
        
        // Small delay between batches for visualization (based on speed)
        const batchDelay = Math.max(10, 100 / config.speed)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
      
      // Record optimization step
      await recordOptimizationStep(epoch)
      
      // Force reactivity update
      neurons.value = neurons.value.map(n => ({
        ...n,
        weights: [...n.weights] // Ensure weights array is also fresh
      }))
      visualizationUpdateTrigger.value++ // Trigger visualization updates
      console.log('📈 Optimization step recorded, reactivity triggered')
      
      // Wait for animation based on speed setting
      const delay = Math.max(50, 500 / config.speed)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // Finish training
    optimizationHistory.value.isRunning = false
    currentBatch.value = []
    console.log('Training completed')
  }
  
  /**
   * Update neurons using batch gradient descent (always off-main-thread)
   */
  async function updateNeuronsWithBatch(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    console.log('🎯 updateNeuronsWithBatch called with', batchData.length, 'samples')
    
    // For now, use CPU computation for reliability
    // TODO: Fix multi-threading issues
    console.log('🔄 Using CPU computation for reliability...')
    await updateNeuronsWithBatchCPU(batchData, learningRate)
    console.log('✅ CPU computation successful')
    
    // Original multi-threaded approach (temporarily disabled for debugging)
    // try {
    //   // Always use multi-threaded manager to keep UI responsive
    //   console.log('🔄 Trying multi-threaded computation...')
    //   await updateNeuronsWithBatchMultiThread(batchData, learningRate)
    //   console.log('✅ Multi-threaded computation successful')
    // } catch (error) {
    //   console.warn('❌ Multi-threaded computation failed, falling back to workers:', error)
    //   
    //   // Fallback to original worker system
    //   if (workerAvailable.value && useWorkers.value) {
    //     console.log('🔄 Falling back to workers...')
    //     await updateNeuronsWithBatchWorker(batchData, learningRate)
    //     console.log('✅ Worker computation successful')
    //   } else if (gpuAvailable.value && useGpuAcceleration.value && batchData.length > 10) {
    //     console.log('🔄 Falling back to GPU...')
    //     await updateNeuronsWithBatchGPU(batchData, learningRate)
    //     console.log('✅ GPU computation successful')
    //   } else {
    //     console.log('🔄 Falling back to CPU...')
    //     await updateNeuronsWithBatchCPU(batchData, learningRate)
    //     console.log('✅ CPU computation successful')
    //   }
    // }
  }

  /**
   * Multi-threaded batch gradient descent (preferred method - keeps UI responsive)
   */
  async function updateNeuronsWithBatchMultiThread(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    try {
      console.log('🔧 Starting multi-threaded batch update...')
      
      // Convert features to the format expected by workers
      const batchFeatures = batchData.map(dp => dp.features)
      const allNeuronWeights = neurons.value.map(n => n.weights)
      
      console.log('📊 Data prepared:', {
        batchFeatures: batchFeatures.length,
        neurons: allNeuronWeights.length,
        metric: similarityMetric.value,
        useGpu: gpuAvailable.value && useGpuAcceleration.value
      })
      
      // Use multi-threaded manager for similarity computation (this runs off-main-thread)
      console.log('🚀 Calling multiThreadManager.computeBatchSimilarity...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Multi-thread computation timeout')), 5000)
      )
      
      const similarities = await Promise.race([
        multiThreadManager.computeBatchSimilarity(
          batchFeatures,
          allNeuronWeights,
          similarityMetric.value,
          gpuAvailable.value && useGpuAcceleration.value
        ),
        timeoutPromise
      ]) as number[][]
      
      console.log('✅ Similarity computation completed, got', similarities.length, 'results')
      
      // Process gradients for each neuron (this runs on main thread but is fast)
      const promises = neurons.value.map(async (neuron, neuronIndex) => {
        const weightGradients = new Array(neuron.weights.length).fill(0)
        let biasGradient = 0
        
        for (let i = 0; i < batchData.length; i++) {
          const dataPoint = batchData[i]
          const neuronSimilarities = similarities[i]
          
          // Apply activation function
          const activatedScores = applyNDActivationFunction(neuronSimilarities, activationFunction.value)
          const prediction = activatedScores[neuronIndex]
          const target = dataPoint.label === neuronIndex ? 1 : 0
          const error = prediction - target
          
          // Accumulate gradients
          for (let j = 0; j < neuron.weights.length; j++) {
            weightGradients[j] += error * dataPoint.features[j]
          }
          biasGradient += error
        }
        
        // Apply gradients with regularization
        const batchSize = batchData.length
        const l1Reg = optimizationHistory.value.config.regularization?.l1 || 0
        const l2Reg = optimizationHistory.value.config.regularization?.l2 || 0
        
        for (let j = 0; j < neuron.weights.length; j++) {
          const gradient = weightGradients[j] / batchSize
          let newWeight = neuron.weights[j] - learningRate * gradient
          
          // Apply L1 regularization (sparsity)
          if (l1Reg > 0) {
            newWeight -= learningRate * l1Reg * Math.sign(neuron.weights[j])
          }
          
          // Apply L2 regularization (weight decay)
          if (l2Reg > 0) {
            newWeight -= learningRate * l2Reg * neuron.weights[j]
          }
          
          neuron.weights[j] = clamp(newWeight, -10, 10)
        }
        
        neuron.bias -= learningRate * (biasGradient / batchSize)
      })
      
      await Promise.all(promises)
      console.log(`✅ Multi-threaded batch processing completed (${batchData.length} samples)`)
      
    } catch (error) {
      console.error('Multi-threaded computation failed:', error)
      throw error
    }
  }

  /**
   * CPU-based batch gradient descent (original implementation)
   */
  async function updateNeuronsWithBatchCPU(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    console.log('🖥️ Starting CPU batch processing...')
    
    // Calculate gradients for all neurons
    console.log('🧮 Calculating gradients for', neurons.value.length, 'neurons')
    const gradients = neurons.value.map(neuron => 
      calculateGradient(neuron, batchData)
    )
    console.log('✅ Gradients calculated')
    
    // Apply gradients to update neuron parameters
    console.log('⚙️ Applying gradients to neurons...')
    neurons.value.forEach((neuron, i) => {
      const gradient = gradients[i]
      const l1Reg = optimizationHistory.value.config.regularization?.l1 || 0
      const l2Reg = optimizationHistory.value.config.regularization?.l2 || 0
      
      // Update weights with regularization
      neuron.weights = neuron.weights.map((weight, j) => {
        let newWeight = weight - learningRate * gradient.weights[j]
        
        // Apply L1 regularization (sparsity)
        if (l1Reg > 0) {
          newWeight -= learningRate * l1Reg * Math.sign(weight)
        }
        
        // Apply L2 regularization (weight decay)
        if (l2Reg > 0) {
          newWeight -= learningRate * l2Reg * weight
        }
        
        return newWeight
      })
      
      // Update bias
      neuron.bias -= learningRate * gradient.bias
    })
    console.log('✅ CPU batch processing completed')
  }

  /**
   * Worker-based batch gradient descent (keeps UI responsive)
   */
  async function updateNeuronsWithBatchWorker(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    try {
      // Compute gradients using Web Worker
      const result = await mnistWorkerManager.computeBatchGradients(
        neurons.value,
        batchData,
        similarityMetric.value,
        activationFunction.value,
        useGpuAcceleration.value
      )
      
      console.log(`[Worker] Gradients computed using ${result.usedGpu ? 'GPU' : 'CPU'}`)
      
      // Apply gradients to update neuron parameters
      result.gradients.forEach((gradient) => {
        const neuron = neurons.value.find(n => n.id === gradient.neuronId)
        if (!neuron) return
        
        const l1Reg = optimizationHistory.value.config.regularization?.l1 || 0
        const l2Reg = optimizationHistory.value.config.regularization?.l2 || 0
        
        // Update weights with regularization
        neuron.weights = neuron.weights.map((weight, j) => {
          let newWeight = weight - learningRate * gradient.weights[j]
          
          // Apply L1 regularization (sparsity)
          if (l1Reg > 0) {
            newWeight -= learningRate * l1Reg * Math.sign(weight)
          }
          
          // Apply L2 regularization (weight decay)
          if (l2Reg > 0) {
            newWeight -= learningRate * l2Reg * weight
          }
          
          return newWeight
        })
        
        // Update bias
        neuron.bias -= learningRate * gradient.bias
      })
      
    } catch (error) {
      console.warn('Worker gradient computation failed, falling back to CPU:', error)
      await updateNeuronsWithBatchCPU(batchData, learningRate)
    }
  }

  /**
   * GPU-accelerated batch gradient descent using GPU.js
   */
  async function updateNeuronsWithBatchGPU(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    try {
      if (!gpuAcceleration.checkAvailability()) {
        await updateNeuronsWithBatchCPU(batchData, learningRate)
        return
      }

      // Prepare data for GPU processing
      const weights = neurons.value.map(n => n.weights)
      const batchFeatures = batchData.map(d => d.features)
      const batchLabels = batchData.map(d => d.label)
      
      // Ensure GPU acceleration is initialized and get kernels
      gpuAcceleration.ensureInitialized()
      const kernels = gpuAcceleration.getKernels()
      const similarityKernel = kernels.similarity[similarityMetric.value]
      
      if (similarityKernel) {
        console.log(`🚀 Processing batch of ${batchData.length} samples with GPU acceleration`)
        
        // Try to use batch processing for better GPU performance
        const batchKernel = gpuAcceleration.createBatchSimilarityKernel(similarityMetric.value, batchData.length)
        
        if (batchKernel && batchData.length > 1) {
          // Process entire batch at once using GPU
          try {
            const batchResults = batchKernel(batchFeatures, weights, neurons.value.length, batchFeatures[0].length)
            
            // Process results for each sample in the batch
            batchData.forEach((point, batchIndex) => {
              // Extract similarity scores for this sample
              const scores = Array.from(batchResults[batchIndex] || []) as number[]
              
              // Apply activation function
              const activations = applyNDActivationFunction(scores, activationFunction.value)
              
              // Compute gradients and update weights
              neurons.value.forEach((neuron, neuronIndex) => {
                const gradient = calculateNDNeuronGradient(neuron, [point], neurons.value, similarityMetric.value, activationFunction.value)
                const l1Reg = optimizationHistory.value.config.regularization?.l1 || 0
                const l2Reg = optimizationHistory.value.config.regularization?.l2 || 0
                
                // Update weights with regularization
                neuron.weights = neuron.weights.map((weight, j) => {
                  let newWeight = weight - learningRate * gradient.weights[j]
                  
                  // Apply L1 regularization (sparsity)
                  if (l1Reg > 0) {
                    newWeight -= learningRate * l1Reg * Math.sign(weight)
                  }
                  
                  // Apply L2 regularization (weight decay)
                  if (l2Reg > 0) {
                    newWeight -= learningRate * l2Reg * weight
                  }
                  
                  return clamp(newWeight, -10, 10) // Prevent exploding gradients
                })
                
                // Update bias
                neuron.bias -= learningRate * gradient.bias
              })
            })
            
            console.log('✅ GPU batch processing completed successfully')
          } catch (batchError) {
            console.warn('Batch kernel failed, falling back to individual processing:', batchError)
            // Fall back to individual processing
            throw batchError
          }
        } else {
          // Process each data point individually using GPU kernels
          for (const [batchIndex, point] of batchData.entries()) {
            // Configure kernel for correct output dimensions
            const configuredKernel = similarityKernel.setOutput([neurons.value.length])
            
            // Compute similarity scores using GPU
            const scores = configuredKernel(point.features, weights, neurons.value.length, point.features.length)
            
            // Apply activation function
            const activations = applyNDActivationFunction(Array.from(scores), activationFunction.value)
            
            // Compute gradients and update weights
            neurons.value.forEach((neuron, neuronIndex) => {
              const gradient = calculateNDNeuronGradient(neuron, [point], neurons.value, similarityMetric.value, activationFunction.value)
              const l1Reg = optimizationHistory.value.config.regularization?.l1 || 0
              const l2Reg = optimizationHistory.value.config.regularization?.l2 || 0
              
              // Update weights with regularization
              neuron.weights = neuron.weights.map((weight, j) => {
                let newWeight = weight - learningRate * gradient.weights[j]
                
                // Apply L1 regularization (sparsity)
                if (l1Reg > 0) {
                  newWeight -= learningRate * l1Reg * Math.sign(weight)
                }
                
                // Apply L2 regularization (weight decay)
                if (l2Reg > 0) {
                  newWeight -= learningRate * l2Reg * weight
                }
                
                return clamp(newWeight, -10, 10) // Prevent exploding gradients
              })
              
              // Update bias
              neuron.bias -= learningRate * gradient.bias
            })
          }
          
          console.log(`✅ GPU individual processing completed for ${batchData.length} samples`)
        }
      } else {
        // Fallback to CPU if kernel not available
        await updateNeuronsWithBatchCPU(batchData, learningRate)
      }
      
    } catch (error) {
      console.warn('GPU.js computation failed, falling back to CPU:', error)
      await updateNeuronsWithBatchCPU(batchData, learningRate)
    }
  }
  
  /**
   * Record optimization step
   */
  async function recordOptimizationStep(step: number): Promise<void> {
    const trainAcc = trainAccuracy.value
    const testAcc = testAccuracy.value
    const loss = await computeLossAsync(filteredTrainData.value)
    
    const optimizationStep: NDOptimizationStep = {
      step,
      loss,
      accuracy: trainAcc,
      trainAccuracy: trainAcc,
      testAccuracy: testAcc,
      timestamp: Date.now(),
      neurons: neurons.value.map(n => ({
        id: n.id,
        weights: [...n.weights],
        bias: n.bias,
        weightNorm: Math.sqrt(n.weights.reduce((sum, w) => sum + w * w, 0)),
        gradientNorm: 0 // Could be calculated if needed
      })),
      learningMetrics: {
        convergence: step > 5 ? calculateConvergence() : 0,
        weightDiversity: calculateWeightDiversity(),
        activationSparsity: calculateActivationSparsity()
      }
    }
    
    optimizationHistory.value.steps.push(optimizationStep)
  }
  
  /**
   * Calculate convergence metric
   */
  function calculateConvergence(): number {
    const recentSteps = optimizationHistory.value.steps.slice(-5)
    if (recentSteps.length < 2) return 0
    
    const losses = recentSteps.map(s => s.loss)
    const variance = losses.reduce((acc, loss) => acc + Math.pow(loss - losses[0], 2), 0) / losses.length
    return Math.exp(-variance) // Higher values mean more converged
  }
  
  /**
   * Calculate weight diversity across neurons
   */
  function calculateWeightDiversity(): number {
    if (neurons.value.length < 2) return 0
    
    let totalDiversity = 0
    let comparisons = 0
    
    for (let i = 0; i < neurons.value.length; i++) {
      for (let j = i + 1; j < neurons.value.length; j++) {
        const neuronA = neurons.value[i]
        const neuronB = neurons.value[j]
        
        // Calculate cosine similarity between weight vectors
        const dotProduct = neuronA.weights.reduce((sum, w, k) => sum + w * neuronB.weights[k], 0)
        const normA = Math.sqrt(neuronA.weights.reduce((sum, w) => sum + w * w, 0))
        const normB = Math.sqrt(neuronB.weights.reduce((sum, w) => sum + w * w, 0))
        
        if (normA > 0 && normB > 0) {
          const similarity = dotProduct / (normA * normB)
          totalDiversity += (1 - Math.abs(similarity)) // Higher diversity for lower similarity
        }
        
        comparisons++
      }
    }
    
    return comparisons > 0 ? totalDiversity / comparisons : 0
  }
  
  /**
   * Calculate activation sparsity
   */
  function calculateActivationSparsity(): number {
    if (filteredTrainData.value.length === 0) return 0
    
    let totalSparsity = 0
    const sampleSize = Math.min(100, filteredTrainData.value.length)
    
    for (let i = 0; i < sampleSize; i++) {
      const point = filteredTrainData.value[i]
      const scores = neurons.value.map(n => calculateNDSimilarityScore(n, point.features, similarityMetric.value))
      const activations = applyNDActivationFunction(scores, activationFunction.value)
      
      // Calculate sparsity (percentage of near-zero activations)
      const nearZero = activations.filter(a => Math.abs(a) < 0.01).length
      totalSparsity += nearZero / activations.length
    }
    
    return totalSparsity / sampleSize
  }
  
  /**
   * Stop training
   */
  function stopTraining(): void {
    optimizationHistory.value.isRunning = false
    currentBatch.value = []
  }
  
  /**
   * Pause training (can be resumed)
   */
  function pauseTraining(): void {
    optimizationHistory.value.isRunning = false
    console.log('Training paused by user')
  }
  
  /**
   * Resume training (continues from current state)
   */
  function resumeTraining(): void {
    optimizationHistory.value.isRunning = true
    console.log('Training resumed by user')
  }
  
  /**
   * Clear training history
   */
  function clearHistory(): void {
    optimizationHistory.value.steps = []
    optimizationHistory.value.currentStep = 0
    currentBatch.value = []
  }
  
  /**
   * Update optimization configuration
   */
  function updateOptimizationConfig(config: {
    learningRate?: number
    epochs?: number
    batchSize?: number
    speed?: number
    regularization?: { l1?: number; l2?: number }
  }): void {
    if (config.learningRate !== undefined) {
      optimizationHistory.value.config.learningRate = config.learningRate
    }
    if (config.epochs !== undefined) {
      optimizationHistory.value.config.epochs = config.epochs
    }
    if (config.batchSize !== undefined) {
      optimizationHistory.value.config.batchSize = config.batchSize
    }
    if (config.speed !== undefined) {
      optimizationHistory.value.config.speed = config.speed
    }
    if (config.regularization) {
      optimizationHistory.value.config.regularization = {
        ...optimizationHistory.value.config.regularization!,
        ...config.regularization
      }
    }
  }
  
  /**
   * Reset the entire classifier
   */
  function reset(): void {
    neurons.value = []
    trainData.value = []
    testData.value = []
    currentBatch.value = []
    selectedNeuron.value = null
    activeClasses.value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    // Reset configuration to defaults
    similarityMetric.value = 'dotProduct'
    activationFunction.value = 'softmax'
    visualizationMode.value = 'weights'
    
    // Clear optimization history
    clearHistory()
    
    // Reset dataset info
    datasetInfo.value = {
      trainSize: 0,
      testSize: 0,
      numFeatures: 784,
      numClasses: 10
    }
  }
  
  /**
   * Quick test with a few samples
   */
  async function quickTest(numSamples: number = 50): Promise<void> {
    const testSamples = await mnistLoader.getQuickSample(numSamples)
    trainData.value = testSamples
    testData.value = testSamples.slice(0, Math.floor(numSamples * 0.2))
    
    datasetInfo.value = {
      trainSize: trainData.value.length,
      testSize: testData.value.length,
      numFeatures: 784,
      numClasses: 10
    }
    
    if (neurons.value.length === 0) {
      initializeClassifier()
    }
    
    console.log(`Quick test setup with ${numSamples} samples`)
  }
  
  /**
   * Force GPU acceleration initialization (for diagnostics)
   */
  function forceGpuInitialization() {
    try {
      gpuAcceleration.ensureInitialized()
      checkGpuSupport()
      return { success: true, message: 'GPU acceleration initialized successfully' }
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to initialize GPU acceleration' }
    }
  }

  /**
   * Get detailed GPU status for diagnostics
   */
  function getGpuStatus() {
    return {
      available: gpuAvailable.value,
      enabled: useGpuAcceleration.value,
      backend: gpuAcceleration.gpu?.mode || 'unknown',
      initialized: gpuAcceleration.checkAvailability(),
      kernelCount: (() => {
        try {
          const kernels = gpuAcceleration.getKernels()
          return Object.keys(kernels.similarity || {}).length + 
                 Object.keys(kernels.matrixOps || {}).length + 
                 Object.keys(kernels.activations || {}).length
        } catch {
          return 0
        }
      })()
    }
  }

  return {
    // State
    neurons,
    trainData,
    testData,
    currentBatch,
    activeClasses,
    allClasses,
    similarityMetric,
    activationFunction,
    visualizationMode,
    selectedNeuron,
    datasetInfo,
    optimizationHistory,
    useGpuAcceleration,
    gpuAvailable,
    useWorkers,
    workerAvailable,
    visualizationUpdateTrigger,
    
    // Computed
    filteredTrainData,
    filteredTestData,
    trainAccuracy,
    testAccuracy,
    currentLoss,
    isTraining,
    
    // Actions
    initializeClassifier,
    loadDataset,
    toggleClass,
    getPrediction,
    getPredictionAsync,
    computeLoss,
    computeLossAsync,
    calculateGradient,
    runTraining,
    stopTraining,
    pauseTraining,
    resumeTraining,
    clearHistory,
    updateOptimizationConfig,
    reset,
    quickTest,
    checkGpuSupport,
    forceGpuInitialization,
    getGpuStatus
  }
}) 