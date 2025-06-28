import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  NDDataPoint, 
  NDNeuron, 
  NDOptimizationHistory, 
  NDSimilarityMetric, 
  ActivationFunction
} from '@/types'
import { getNeuronColor } from '@/utils/colors'
import {
  computeNDCategoricalCrossEntropyLoss,
  calculateNDNeuronGradient,
  calculateNDAccuracy,
  initializeNDNeuronWeights,
  createTrainingBatches,
  getNDPrediction
} from '@/utils/ndMathCore'
import { mnistLoader } from '@/utils/mnistLoader'
import { mnistApiService } from '@/services/mnistApiService'

// Create a simple event emitter for visualization updates
class VisualizationEventEmitter {
  private listeners: Array<() => void> = []
  
  on(callback: () => void) {
    this.listeners.push(callback)
  }
  
  off(callback: () => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }
  
  emit() {
    console.log('🎆 Emitting visualization update event to', this.listeners.length, 'listeners')
    this.listeners.forEach(callback => callback())
  }
}

export const visualizationEvents = new VisualizationEventEmitter()

export const useMNISTClassifierStore = defineStore('mnistClassifier', () => {
  // State
  const neurons = ref<NDNeuron[]>([])
  const trainData = ref<NDDataPoint[]>([])
  const testData = ref<NDDataPoint[]>([])
  const currentBatch = ref<NDDataPoint[]>([])
  const activeClasses = ref<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const allClasses = ref<number[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  
  // Network configuration
  const similarityMetric = ref<NDSimilarityMetric>('dotProduct')
  const activationFunction = ref<ActivationFunction>('softmax')
  
  // Visualization settings
  const visualizationMode = ref<'weights' | 'activations' | 'gradients'>('weights')
  const selectedNeuron = ref<NDNeuron | null>(null)
  
  // API settings
  const useApiCompute = ref(true)
  const apiConnected = ref(false)
  
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
  
  // Visualization trigger counter
  const visualizationUpdateTrigger = ref(0)
  
  // Reactive accuracy values (updated by API)
  const computedTrainAccuracy = ref(0)
  const computedTestAccuracy = ref(0)
  
  // API weight synchronization
  const lastWeightUpdate = ref<number>(0)
  const weightUpdateInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const autoSyncWeights = ref(true)
  
  // Ternary weights configuration
  const useTernaryWeights = ref(true)
  const ternarySparsityRatio = ref(0.7)
  const ternaryStats = ref<{
    is_ternary: boolean
    unique_values: number[]
    overall_distribution: {
      negative_one_ratio: number
      zero_ratio: number
      positive_one_ratio: number
      total_weights: number
    }
    per_class_stats: Array<{
      class_id: number
      distribution: any
      weight_norm: number
      unique_values: number[]
    }>
    total_parameters: number
    use_ternary_weights: boolean
  } | null>(null)
  
  // Computed properties
  const filteredTrainData = computed(() => {
    return trainData.value.filter(point => activeClasses.value.includes(point.label))
  })
  
  const filteredTestData = computed(() => {
    return testData.value.filter(point => activeClasses.value.includes(point.label))
  })
  
  const trainAccuracy = computed(() => {
    if (neurons.value.length === 0 || filteredTrainData.value.length === 0) return 0
    if (useApiCompute.value && apiConnected.value) {
      return computedTrainAccuracy.value
    }
    return calculateNDAccuracy(filteredTrainData.value, neurons.value, similarityMetric.value, activationFunction.value) * 100
  })
  
  const testAccuracy = computed(() => {
    if (neurons.value.length === 0 || filteredTestData.value.length === 0) return 0
    if (useApiCompute.value && apiConnected.value) {
      return computedTestAccuracy.value
    }
    return calculateNDAccuracy(filteredTestData.value, neurons.value, similarityMetric.value, activationFunction.value) * 100
  })
  
  const currentLoss = computed(() => {
    const steps = optimizationHistory.value.steps
    if (steps.length === 0) return computeLossSync(filteredTrainData.value)
    return steps[steps.length - 1].loss
  })
  
  const isTraining = computed(() => optimizationHistory.value.isRunning)
  
  // State for dataset selection
  const selectedDataset = ref<string>('mnist')
  const availableDatasets = ref<{[key: string]: { classes: number[], class_names: string[], description: string }}>({})
  
  // Helper functions
  function computeLossSync(data: NDDataPoint[]): number {
    return computeNDCategoricalCrossEntropyLoss(data, neurons.value, similarityMetric.value, activationFunction.value)
  }

  async function computeLoss(data: NDDataPoint[]): Promise<number> {
    if (useApiCompute.value && apiConnected.value && data.length > 0) {
      try {
        const { weights, biases } = mnistApiService.extractNetworkParams(neurons.value)
        const { features, labels } = mnistApiService.extractBatchData(data)
        
        const gradResult = await mnistApiService.computeGradients(
          weights, biases, features, labels, similarityMetric.value, activationFunction.value
        )
        return gradResult.loss
      } catch (error) {
        console.warn('API loss computation failed, falling back to local:', error)
      }
    }
    
    return computeNDCategoricalCrossEntropyLoss(data, neurons.value, similarityMetric.value, activationFunction.value)
  }

  // Actions
  async function initializeApiConnection(): Promise<void> {
    try {
      console.log('🔌 Checking API connection...')
      apiConnected.value = await mnistApiService.checkConnection()
      
      if (apiConnected.value) {
        console.log('✅ API connected successfully!')
        console.log(`🌐 API URL: ${mnistApiService.apiUrl}`)
        
        // Load available datasets when API is connected
        await loadAvailableDatasets()
        
        // Start weight synchronization if enabled
        if (autoSyncWeights.value) {
          startWeightSync()
        }
      } else {
        console.warn('⚠️ API not available, falling back to local computation')
        useApiCompute.value = false
        // Still load the fallback dataset info
        await loadAvailableDatasets()
      }
    } catch (error) {
      console.error('❌ Failed to connect to API:', error)
      apiConnected.value = false
      useApiCompute.value = false
      // Load fallback dataset info
      await loadAvailableDatasets()
    }
  }
  
  async function initializeClassifier(initStrategy: 'random' | 'xavier' | 'he' = 'xavier') {
    console.log('Initializing MNIST classifier with 10 neurons...')
    
    await initializeApiConnection()
    
    neurons.value = []
    
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
    
    if (apiConnected.value) {
      console.log('🚀 Using JAX API for high-performance computation')
    } else {
      console.log('⚠️ Using local computation')
    }
    
    selectedNeuron.value = neurons.value[0]
  }
  
  async function loadDataset(maxSamples: { train: number; test: number } = { train: 1000, test: 200 }): Promise<void> {
    try {
      console.log(`Loading ${selectedDataset.value} dataset...`)
      
      // Check if API is available for dataset loading
      if (!apiConnected.value) {
        console.warn('API not connected, falling back to synthetic data')
        const dataset = await mnistLoader.loadMNIST(maxSamples)
        
        trainData.value = dataset.trainImages
        testData.value = dataset.testImages
        
        datasetInfo.value = {
          trainSize: dataset.trainImages.length,
          testSize: dataset.testImages.length,
          numFeatures: dataset.trainImages[0]?.features.length || 784,
          numClasses: dataset.numClasses
        }
        
        console.log('Synthetic dataset loaded successfully:', datasetInfo.value)
        
        if (neurons.value.length === 0) {
          await initializeClassifier()
        }
        return
      }

      // Load real dataset from API
      console.log('Loading real dataset from API...')
      
      // First, load dataset metadata
      const trainInfo = await mnistApiService.loadDataset(selectedDataset.value, 'train', maxSamples.train)
      const testInfo = await mnistApiService.loadDataset(selectedDataset.value, 'test', maxSamples.test)
      
      console.log('Dataset metadata loaded:', { trainInfo, testInfo })
      
      // Load actual training data
      const trainSample = await mnistApiService.getDatasetSample(
        selectedDataset.value, 
        'train', 
        0, 
        maxSamples.train
      )
      
      // Load actual test data
      const testSample = await mnistApiService.getDatasetSample(
        selectedDataset.value, 
        'test', 
        0, 
        maxSamples.test
      )
      
      console.log('Dataset samples loaded:', {
        trainSamples: trainSample.features.length,
        testSamples: testSample.features.length
      })
      
      // Convert to our internal format
      trainData.value = trainSample.features.map((features, i) => ({
        features,
        label: trainSample.labels[i],
        originalLabel: trainSample.labels[i]
      }))
      
      testData.value = testSample.features.map((features, i) => ({
        features,
        label: testSample.labels[i],
        originalLabel: testSample.labels[i]
      }))
      
      // Update dataset info with real metadata
      datasetInfo.value = {
        trainSize: trainData.value.length,
        testSize: testData.value.length,
        numFeatures: trainInfo.feature_shape[1], // Should be 784 for MNIST
        numClasses: trainInfo.num_classes
      }
      
      // Update class information
      allClasses.value = Array.from({length: trainInfo.num_classes}, (_, i) => i)
      activeClasses.value = [...allClasses.value]
      
      console.log('Real dataset loaded successfully:', datasetInfo.value)
      console.log('Available classes:', trainInfo.class_names)
      
      if (neurons.value.length === 0) {
        await initializeClassifier()
      }
      
    } catch (error) {
      console.error('Failed to load dataset:', error)
      
      // Fallback to synthetic data if API fails
      console.warn('Falling back to synthetic dataset generation...')
      try {
        const dataset = await mnistLoader.loadMNIST(maxSamples)
        
        trainData.value = dataset.trainImages
        testData.value = dataset.testImages
        
        datasetInfo.value = {
          trainSize: dataset.trainImages.length,
          testSize: dataset.testImages.length,
          numFeatures: dataset.trainImages[0]?.features.length || 784,
          numClasses: dataset.numClasses
        }
        
        console.log('Fallback synthetic dataset loaded:', datasetInfo.value)
        
        if (neurons.value.length === 0) {
          await initializeClassifier()
        }
      } catch (fallbackError) {
        console.error('Even fallback dataset loading failed:', fallbackError)
        throw fallbackError
      }
    }
  }

  async function loadAvailableDatasets(): Promise<void> {
    try {
      if (apiConnected.value) {
        availableDatasets.value = await mnistApiService.getAvailableDatasets()
        console.log('Available datasets:', availableDatasets.value)
      } else {
        // Provide default info when API is not available
        availableDatasets.value = {
          'synthetic_mnist': {
            classes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            class_names: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            description: 'Synthetic MNIST-like dataset (local generation)'
          }
        }
      }
    } catch (error) {
      console.error('Failed to load available datasets:', error)
      availableDatasets.value = {}
    }
  }

  function setSelectedDataset(datasetName: string): void {
    selectedDataset.value = datasetName
    console.log(`Selected dataset changed to: ${datasetName}`)
  }

  async function getTrainingBatch(batchSize: number = 32): Promise<NDDataPoint[]> {
    try {
      if (apiConnected.value && trainData.value.length === 0) {
        // Get a fresh batch directly from API
        const batch = await mnistApiService.getTrainingBatch(
          selectedDataset.value,
          'train',
          batchSize,
          activeClasses.value.length < allClasses.value.length ? activeClasses.value : undefined
        )
        
        return batch.features.map((features, i) => ({
          features,
          label: batch.labels[i],
          originalLabel: batch.labels[i]
        }))
      } else {
        // Use local data
        const availableData = filteredTrainData.value
        if (availableData.length === 0) return []
        
        const batchData: NDDataPoint[] = []
        for (let i = 0; i < batchSize && i < availableData.length; i++) {
          const randomIndex = Math.floor(Math.random() * availableData.length)
          batchData.push(availableData[randomIndex])
        }
        return batchData
      }
    } catch (error) {
      console.warn('Failed to get training batch from API, using local data:', error)
      
      // Fallback to local data
      const availableData = filteredTrainData.value
      if (availableData.length === 0) return []
      
      const batchData: NDDataPoint[] = []
      for (let i = 0; i < batchSize && i < availableData.length; i++) {
        const randomIndex = Math.floor(Math.random() * availableData.length)
        batchData.push(availableData[randomIndex])
      }
      return batchData
    }
  }

  function toggleClass(classLabel: number) {
    if (activeClasses.value.includes(classLabel)) {
      activeClasses.value = activeClasses.value.filter(c => c !== classLabel)
    } else {
      activeClasses.value = [...activeClasses.value, classLabel]
    }
  }
  
  async function getPrediction(features: number[]): Promise<number | null> {
    if (useApiCompute.value && apiConnected.value) {
      try {
        const { weights, biases } = mnistApiService.extractNetworkParams(neurons.value)
        const result = await mnistApiService.forwardPass(
          weights, biases, features, similarityMetric.value, activationFunction.value
        )
        return result.predicted_class
      } catch (error) {
        console.warn('API prediction failed, falling back to local:', error)
      }
    }
    
    const prediction = getNDPrediction(features, neurons.value, similarityMetric.value, activationFunction.value)
    return prediction.winningNeuron?.id ?? null
  }

  function getPredictionSync(features: number[]): number | null {
    const prediction = getNDPrediction(features, neurons.value, similarityMetric.value, activationFunction.value)
    return prediction.winningNeuron?.id ?? null
  }

  async function updateAccuracyMetrics(): Promise<void> {
    if (useApiCompute.value && apiConnected.value) {
      try {
        const { weights, biases } = mnistApiService.extractNetworkParams(neurons.value)
        
        if (filteredTrainData.value.length > 0) {
          const { features: trainFeatures, labels: trainLabels } = mnistApiService.extractBatchData(filteredTrainData.value)
          const trainAcc = await mnistApiService.computeAccuracy(
            weights, biases, trainFeatures, trainLabels, similarityMetric.value, activationFunction.value
          )
          computedTrainAccuracy.value = trainAcc * 100
        }
        
        if (filteredTestData.value.length > 0) {
          const { features: testFeatures, labels: testLabels } = mnistApiService.extractBatchData(filteredTestData.value)
          const testAcc = await mnistApiService.computeAccuracy(
            weights, biases, testFeatures, testLabels, similarityMetric.value, activationFunction.value
          )
          computedTestAccuracy.value = testAcc * 100
        }
      } catch (error) {
        console.warn('Failed to update accuracy metrics via API:', error)
      }
    }
  }

  async function runTraining(): Promise<void> {
    console.log('🎯 Starting training')
    console.log(`🔧 Training mode: ${useApiCompute.value && apiConnected.value ? 'API (JAX)' : 'Local (JS)'}`)
    
    if (neurons.value.length === 0 || (filteredTrainData.value.length === 0 && (!apiConnected.value || !useApiCompute.value))) {
      console.warn('Cannot start training: no neurons or training data')
      return
    }
    
    const config = optimizationHistory.value.config
    console.log('Starting training with config:', config)
    
    optimizationHistory.value = {
      steps: [],
      isRunning: true,
      currentStep: 0,
      totalSteps: config.epochs,
      config
    }

    try {
      // Determine training strategy based on API availability
      if (useApiCompute.value && apiConnected.value) {
        console.log('🚀 Using API-based training with dynamic batch loading')
        await runApiTraining(config)
      } else {
        console.log('💻 Using local training with pre-loaded batches')
        await runLocalTraining(config)
      }
      
      // Final accuracy update
      await updateAccuracyMetrics()
      
    } catch (error) {
      console.error('❌ Training failed:', error)
      throw error
    } finally {
      optimizationHistory.value.isRunning = false
      currentBatch.value = []
      console.log('Training completed')
    }
  }

  async function runApiTraining(config: any): Promise<void> {
    console.log('🔧 API Training Mode - Dynamic batch loading')
    
    for (let epoch = 1; epoch <= config.epochs && optimizationHistory.value.isRunning; epoch++) {
      console.log(`📊 API Epoch ${epoch}/${config.epochs}`)
      optimizationHistory.value.currentStep = epoch
      
      // Calculate number of batches needed for this epoch
      const totalSamples = Math.max(filteredTrainData.value.length, 1000) // Minimum 1000 samples
      const batchesPerEpoch = Math.ceil(totalSamples / config.batchSize)
      
      console.log(`Processing ${batchesPerEpoch} batches for epoch ${epoch}`)
      
      for (let batchIdx = 0; batchIdx < batchesPerEpoch && optimizationHistory.value.isRunning; batchIdx++) {
        try {
          // Get fresh batch from API or local data
          const batchData = await getTrainingBatch(config.batchSize)
          
          if (batchData.length === 0) {
            console.warn('Empty batch received, skipping...')
            continue
          }
          
          currentBatch.value = batchData
          
          console.log(`🔄 Processing batch ${batchIdx + 1}/${batchesPerEpoch} (${batchData.length} samples)`)
          
          // Train on this batch using API
          await updateNeuronsWithBatch(batchData, config.learningRate)
          
          // Compute current metrics for this batch
          const currentLoss = await computeLoss(batchData)
          const currentAccuracy = calculateNDAccuracy(batchData, neurons.value, similarityMetric.value, activationFunction.value) * 100
          
          // Update optimization history
          optimizationHistory.value.steps.push({
            step: optimizationHistory.value.steps.length,
            loss: currentLoss,
            accuracy: currentAccuracy,
            trainAccuracy: currentAccuracy,
            testAccuracy: 0,
            timestamp: Date.now(),
            neurons: neurons.value.map(n => ({
              id: n.id,
              weights: [...n.weights],
              bias: n.bias
            })),
            learningMetrics: {
              convergence: Math.abs(currentLoss - (optimizationHistory.value.steps[optimizationHistory.value.steps.length - 1]?.loss || currentLoss)),
              weightDiversity: calculateWeightDiversity(),
              activationSparsity: 0
            }
          })
          
          // Force reactivity update
          neurons.value = neurons.value.map(n => ({
            ...n,
            weights: [...n.weights]
          }))
          visualizationUpdateTrigger.value++
          
          console.log(`✅ API Batch processed - Loss: ${currentLoss.toFixed(4)}, Accuracy: ${currentAccuracy.toFixed(1)}%`)
          
          // Add batch delay for visualization
          const batchDelay = Math.max(10, 100 / config.speed)
          await new Promise(resolve => setTimeout(resolve, batchDelay))
          
        } catch (error) {
          console.error(`❌ Failed to process batch ${batchIdx + 1}:`, error)
          // Continue with next batch instead of failing completely
        }
      }
      
      // Epoch delay
      const epochDelay = Math.max(50, 500 / config.speed)
      await new Promise(resolve => setTimeout(resolve, epochDelay))
    }
  }

  async function runLocalTraining(config: any): Promise<void> {
    console.log('💻 Local Training Mode - Pre-loaded batches')
    
    // Create all batches upfront for local training
    const batches = createTrainingBatches(filteredTrainData.value, config.batchSize)
    console.log(`Created ${batches.length} training batches`)
    
    for (let epoch = 1; epoch <= config.epochs && optimizationHistory.value.isRunning; epoch++) {
      console.log(`📊 Local Epoch ${epoch}/${config.epochs}`)
      optimizationHistory.value.currentStep = epoch
      
      const shuffledBatches = [...batches].sort(() => Math.random() - 0.5)
      
      for (const batch of shuffledBatches) {
        if (!optimizationHistory.value.isRunning) break
        
        const batchData: NDDataPoint[] = batch.features.map((features, i) => ({
          features,
          label: batch.labels[i]
        }))
        
        currentBatch.value = batchData
        
        try {
          await updateNeuronsWithBatch(batchData, config.learningRate)
        } catch (error) {
          console.error('❌ Batch update failed:', error)
          throw error
        }
        
        const currentLoss = computeLossSync(batchData)
        const currentAccuracy = calculateNDAccuracy(batchData, neurons.value, similarityMetric.value, activationFunction.value) * 100
        
        optimizationHistory.value.steps.push({
          step: optimizationHistory.value.steps.length,
          loss: currentLoss,
          accuracy: currentAccuracy,
          trainAccuracy: currentAccuracy,
          testAccuracy: 0,
          timestamp: Date.now(),
          neurons: neurons.value.map(n => ({
            id: n.id,
            weights: [...n.weights],
            bias: n.bias
          })),
          learningMetrics: {
            convergence: Math.abs(currentLoss - (optimizationHistory.value.steps[optimizationHistory.value.steps.length - 1]?.loss || currentLoss)),
            weightDiversity: calculateWeightDiversity(),
            activationSparsity: 0
          }
        })
        
        neurons.value = neurons.value.map(n => ({
          ...n,
          weights: [...n.weights]
        }))
        visualizationUpdateTrigger.value++
        
        console.log(`✅ Local Batch processed - Loss: ${currentLoss.toFixed(4)}, Accuracy: ${currentAccuracy.toFixed(1)}%`)
        
        const batchDelay = Math.max(10, 100 / config.speed)
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
      
      const delay = Math.max(50, 500 / config.speed)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  function calculateWeightDiversity(): number {
    if (neurons.value.length === 0) return 0
    
    // Calculate diversity as variance in weight magnitudes across neurons
    const weightNorms = neurons.value.map(neuron => 
      Math.sqrt(neuron.weights.reduce((sum, w) => sum + w * w, 0))
    )
    
    const mean = weightNorms.reduce((sum, norm) => sum + norm, 0) / weightNorms.length
    const variance = weightNorms.reduce((sum, norm) => sum + (norm - mean) ** 2, 0) / weightNorms.length
    
    return Math.sqrt(variance)
  }

  async function updateNeuronsWithBatch(batchData: NDDataPoint[], learningRate: number): Promise<void> {
    if (useApiCompute.value && apiConnected.value) {
      try {
        const { weights, biases } = mnistApiService.extractNetworkParams(neurons.value)
        const { features, labels } = mnistApiService.extractBatchData(batchData)
        
        console.log('🔧 API Training Step - Input:', {
          weightsShape: weights.map(w => w.length),
          biasesLength: biases.length,
          featuresShape: features.map(f => f.length),
          labelsLength: labels.length
        })
        
        const result = await mnistApiService.trainStep(
          weights, biases, features, labels, similarityMetric.value, activationFunction.value, learningRate
        )
        
        console.log('🔧 API Training Step - Result:', {
          newWeightsShape: result.new_weights.map(w => w.length),
          newBiasesLength: result.new_biases.length,
          resultKeys: Object.keys(result)
        })
        
        // Force reactivity by creating completely new neuron objects with new weight arrays
        neurons.value = neurons.value.map((n, i) => ({
          ...n,
          weights: [...result.new_weights[i]], // Use the new weights directly
          bias: result.new_biases[i]
        }));
        
        // Trigger visualization update
        visualizationUpdateTrigger.value++;
        
        // Emit visualization event for immediate canvas updates
        setTimeout(() => {
          visualizationEvents.emit()
        }, 0)
        
        return
      } catch (error) {
        console.warn('API training step failed, falling back to local:', error)
      }
    }
    
    // Local computation fallback
    const gradients = neurons.value.map(neuron => 
      calculateNDNeuronGradient(neuron, batchData, neurons.value, similarityMetric.value, activationFunction.value)
    )
    
    neurons.value.forEach((neuron, i) => {
      const gradient = gradients[i]
      
      neuron.weights = neuron.weights.map((weight, j) => {
        return weight - learningRate * gradient.weights[j]
      })
      
      neuron.bias -= learningRate * gradient.bias
    })
    
    // Force reactivity by creating completely new neuron objects with updated weights
    neurons.value = neurons.value.map((n) => ({
      ...n,
      weights: [...n.weights], // Ensure new array reference
      bias: n.bias
    }));
    
    // Trigger visualization update
    visualizationUpdateTrigger.value++;
    
    // Emit visualization event for immediate canvas updates
    setTimeout(() => {
      visualizationEvents.emit()
    }, 0)
  }

  function stopTraining(): void {
    optimizationHistory.value.isRunning = false
    currentBatch.value = []
  }

  function pauseTraining(): void {
    optimizationHistory.value.isRunning = false
    console.log('Training paused by user')
  }

  function resumeTraining(): void {
    optimizationHistory.value.isRunning = true
    console.log('Training resumed by user')
  }

  function clearHistory(): void {
    optimizationHistory.value.steps = []
    optimizationHistory.value.currentStep = 0
    currentBatch.value = []
  }

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

  function reset(): void {
    neurons.value = []
    trainData.value = []
    testData.value = []
    currentBatch.value = []
    selectedNeuron.value = null
    activeClasses.value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    similarityMetric.value = 'dotProduct'
    activationFunction.value = 'softmax'
    visualizationMode.value = 'weights'
    
    clearHistory()
    
    datasetInfo.value = {
      trainSize: 0,
      testSize: 0,
      numFeatures: 784,
      numClasses: 10
    }
  }

  async function quickTest(numSamples: number = 50): Promise<void> {
    try {
      console.log(`Loading quick test with ${numSamples} samples...`)
      await loadDataset({ train: numSamples, test: Math.floor(numSamples * 0.2) })
      
      if (neurons.value.length === 0) {
        await initializeClassifier()
      }
      
      console.log(`Quick test setup completed with ${numSamples} samples`)
    } catch (error) {
      console.error('Quick test failed:', error)
      throw error
    }
  }

  /**
   * Sync weights from API to local store
   */
  async function syncWeightsFromApi(): Promise<void> {
    if (!apiConnected.value || !useApiCompute.value) {
      return
    }

    try {
      const weightData = await mnistApiService.getModelWeights()
      
      // Update neurons with API weights
      if (weightData.weights.length === neurons.value.length) {
        for (let i = 0; i < neurons.value.length; i++) {
          if (weightData.weights[i] && weightData.weights[i].length === neurons.value[i].weights.length) {
            neurons.value[i].weights = [...weightData.weights[i]]
            neurons.value[i].bias = weightData.biases[i] || neurons.value[i].bias
          }
        }
        
        lastWeightUpdate.value = Date.now()
        visualizationUpdateTrigger.value++
        visualizationEvents.emit()
        
        console.log('🔄 Weights synced from API:', {
          neuronsUpdated: neurons.value.length,
          timestamp: new Date(lastWeightUpdate.value).toISOString()
        })
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync weights from API:', error)
    }
  }

  /**
   * Sync weights to API from local store
   */
  async function syncWeightsToApi(): Promise<void> {
    if (!apiConnected.value || !useApiCompute.value || neurons.value.length === 0) {
      return
    }

    try {
      const { weights, biases } = mnistApiService.extractNetworkParams(neurons.value)
      await mnistApiService.updateModelWeights(weights, biases)
      
      lastWeightUpdate.value = Date.now()
      console.log('📤 Weights synced to API:', {
        neuronsUpdated: neurons.value.length,
        timestamp: new Date(lastWeightUpdate.value).toISOString()
      })
    } catch (error) {
      console.warn('⚠️ Failed to sync weights to API:', error)
    }
  }

  /**
   * Start automatic weight synchronization
   */
  function startWeightSync(): void {
    if (weightUpdateInterval.value) {
      clearInterval(weightUpdateInterval.value)
    }

    // Sync every 2 seconds during training, every 10 seconds when idle
    const syncInterval = isTraining.value ? 2000 : 10000
    
    weightUpdateInterval.value = setInterval(async () => {
      if (apiConnected.value && autoSyncWeights.value) {
        await syncWeightsFromApi()
      }
    }, syncInterval)

    console.log('🔄 Started weight synchronization:', { interval: syncInterval })
  }

  /**
   * Stop automatic weight synchronization
   */
  function stopWeightSync(): void {
    if (weightUpdateInterval.value) {
      clearInterval(weightUpdateInterval.value)
      weightUpdateInterval.value = null
      console.log('⏹️ Stopped weight synchronization')
    }
  }

  /**
   * Force immediate weight sync
   */
  async function forceWeightSync(): Promise<void> {
    console.log('🔄 Force syncing weights...')
    await syncWeightsFromApi()
  }

  /**
   * Get real-time activations for visualization
   */
  async function getActivationsForVisualization(features: number[]): Promise<{
    raw_similarities: number[]
    activations: number[]
    predicted_class: number
    confidence: number
    similarity_breakdown: Array<{
      class_id: number
      similarity_score: number
      activation_value: number
    }>
  } | null> {
    if (!apiConnected.value || !useApiCompute.value) {
      return null
    }

    try {
      return await mnistApiService.getModelActivations(
        features,
        undefined, // Use current API weights
        undefined, // Use current API biases
        similarityMetric.value,
        activationFunction.value
      )
    } catch (error) {
      console.warn('⚠️ Failed to get activations from API:', error)
      return null
    }
  }

  /**
   * Get weight visualization data from API
   */
  async function getWeightVisualizationData(classId?: number, colormap: string = 'diverging'): Promise<any> {
    if (!apiConnected.value || !useApiCompute.value) {
      return null
    }

    try {
      return await mnistApiService.getWeightVisualization(classId, colormap)
    } catch (error) {
      console.warn('⚠️ Failed to get weight visualization from API:', error)
      return null
    }
  }

  // Ternary weights actions
  async function initializeTernaryWeights(
    numClasses: number = 10,
    numFeatures: number = 784,
    sparsityRatio: number = ternarySparsityRatio.value
  ): Promise<void> {
    try {
      if (apiConnected.value) {
        console.log('🔧 Initializing ternary weights via API...')
        const result = await mnistApiService.initializeTernaryModel(numClasses, numFeatures, sparsityRatio)
        
        // Convert API weights to neurons
        neurons.value = result.weights.map((weights, id) => ({
          id,
          weights,
          bias: result.biases[id],
          color: `hsl(${(id * 36) % 360}, 70%, 50%)`
        }))
        
        // Update ternary configuration
        useTernaryWeights.value = result.model_info.use_ternary_weights
        ternarySparsityRatio.value = result.model_info.sparsity_ratio
        
        console.log('✅ Ternary weights initialized:', result.weight_distribution)
        
        // Refresh ternary stats
        await refreshTernaryStats()
        
      } else {
        // Local ternary initialization (simplified)
        console.log('🔧 Initializing ternary weights locally...')
        neurons.value = Array.from({ length: numClasses }, (_, id) => ({
          id,
          weights: Array.from({ length: numFeatures }, () => {
            const rand = Math.random()
            if (rand < sparsityRatio) return 0
            return rand > 0.5 + sparsityRatio/2 ? 1 : -1
          }),
          bias: (Math.random() - 0.5) * 0.1,
          color: `hsl(${(id * 36) % 360}, 70%, 50%)`
        }))
        
        console.log('✅ Local ternary weights initialized')
      }
      
      visualizationEvents.emit()
      
    } catch (error) {
      console.error('❌ Failed to initialize ternary weights:', error)
      throw error
    }
  }

  async function quantizeWeightsToTernary(): Promise<void> {
    try {
      if (!apiConnected.value) {
        console.warn('⚠️ API not connected, cannot quantize weights')
        return
      }
      
      console.log('🔧 Quantizing weights to ternary...')
      const result = await mnistApiService.quantizeWeights()
      
      // Update neurons with quantized weights
      neurons.value = result.quantized_weights.map((weights, id) => ({
        ...neurons.value[id],
        weights
      }))
      
      console.log('✅ Weights quantized to ternary:', result.quantized_distribution)
      
      // Refresh ternary stats
      await refreshTernaryStats()
      visualizationEvents.emit()
      
    } catch (error) {
      console.error('❌ Failed to quantize weights:', error)
      throw error
    }
  }

  async function refreshTernaryStats(): Promise<void> {
    try {
      if (!apiConnected.value) {
        console.warn('⚠️ API not connected, cannot get ternary stats')
        return
      }
      
      const stats = await mnistApiService.getTernaryStats()
      ternaryStats.value = stats
      
      console.log('📊 Ternary stats updated:', {
        is_ternary: stats.is_ternary,
        unique_values: stats.unique_values,
        distribution: stats.overall_distribution
      })
      
    } catch (error) {
      console.warn('⚠️ Failed to refresh ternary stats:', error)
      ternaryStats.value = null
    }
  }

  function setTernarySparsity(sparsity: number): void {
    ternarySparsityRatio.value = Math.max(0, Math.min(1, sparsity))
    console.log('🔧 Ternary sparsity ratio set to:', ternarySparsityRatio.value)
  }

  function toggleTernaryWeights(): void {
    useTernaryWeights.value = !useTernaryWeights.value
    console.log('🔧 Ternary weights', useTernaryWeights.value ? 'enabled' : 'disabled')
    
    // Sync with API if connected
    if (apiConnected.value) {
      mnistApiService.toggleTernaryWeights(useTernaryWeights.value)
        .then(result => {
          console.log('✅ API ternary weights updated:', result.message)
        })
        .catch(error => {
          console.warn('⚠️ Failed to sync ternary weights with API:', error)
        })
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
    selectedDataset,
    availableDatasets,
    similarityMetric,
    activationFunction,
    visualizationMode,
    selectedNeuron,
    datasetInfo,
    optimizationHistory,
    visualizationUpdateTrigger,
    useApiCompute,
    apiConnected,
    
    // Computed
    filteredTrainData,
    filteredTestData,
    trainAccuracy,
    testAccuracy,
    currentLoss,
    isTraining,
    
    // API weight synchronization
    lastWeightUpdate,
    weightUpdateInterval,
    autoSyncWeights,
    
    // Ternary weights
    useTernaryWeights,
    ternarySparsityRatio,
    ternaryStats,
    
    // Actions
    initializeApiConnection,
    initializeClassifier,
    loadDataset,
    toggleClass,
    getPrediction,
    getPredictionSync,
    updateAccuracyMetrics,
    runTraining,
    stopTraining,
    pauseTraining,
    resumeTraining,
    clearHistory,
    updateOptimizationConfig,
    reset,
    quickTest,
    loadAvailableDatasets,
    setSelectedDataset,
    getTrainingBatch,
    syncWeightsFromApi,
    syncWeightsToApi,
    startWeightSync,
    stopWeightSync,
    forceWeightSync,
    getActivationsForVisualization,
    getWeightVisualizationData,
    
    // Ternary weights actions
    initializeTernaryWeights,
    quantizeWeightsToTernary,
    refreshTernaryStats,
    setTernarySparsity,
    toggleTernaryWeights
  }
}) 