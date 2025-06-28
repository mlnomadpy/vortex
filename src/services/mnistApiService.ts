import type { NDDataPoint, NDNeuron, NDSimilarityMetric, ActivationFunction } from '@/types'

export interface APIForwardResult {
  scores: number[]
  activations: number[]
  predicted_class: number
  confidence: number
}

export interface APIGradientResult {
  weight_gradients: number[][]
  bias_gradients: number[]
  loss: number
}

export interface APITrainStepResult {
  new_weights: number[][]
  new_biases: number[]
  loss: number
  weight_gradients: number[][]
  bias_gradients: number[]
}

class MNISTApiService {
  private baseUrl: string
  private isConnected: boolean = false

  constructor() {
    // Try localhost first, fallback to production URL if needed
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  }

  /**
   * Check if the API is available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        this.isConnected = data.status === 'healthy'
        console.log('API Health:', data)
        return this.isConnected
      }
      
      this.isConnected = false
      return false
      
    } catch (error) {
      console.warn('API not available:', error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Alias for checkConnection() - used by UI components
   */
  async healthCheck(): Promise<boolean> {
    return this.checkConnection()
  }

  /**
   * Perform forward pass for a single sample
   */
  async forwardPass(
    weights: number[][],
    biases: number[],
    features: number[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<APIForwardResult> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
        features,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Forward pass failed')
    }

    return data.result
  }

  /**
   * Compute gradients for a batch
   */
  async computeGradients(
    weights: number[][],
    biases: number[],
    batchFeatures: number[][],
    batchLabels: number[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<APIGradientResult> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/gradients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
        batch_features: batchFeatures,
        batch_labels: batchLabels,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Gradient computation failed')
    }

    return data.result
  }

  /**
   * Perform a complete training step
   */
  async trainStep(
    weights: number[][],
    biases: number[],
    batchFeatures: number[][],
    batchLabels: number[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction,
    learningRate: number = 0.01
  ): Promise<APITrainStepResult> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/train_step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
        batch_features: batchFeatures,
        batch_labels: batchLabels,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
        learning_rate: learningRate,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Training step failed')
    }

    return data.result
  }

  /**
   * Compute accuracy on test data
   */
  async computeAccuracy(
    weights: number[][],
    biases: number[],
    testFeatures: number[][],
    testLabels: number[],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<number> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/accuracy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
        test_features: testFeatures,
        test_labels: testLabels,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Accuracy computation failed')
    }

    return data.accuracy
  }

  /**
   * Perform batch forward pass for multiple samples
   */
  async batchForward(
    weights: number[][],
    biases: number[],
    batchFeatures: number[][],
    similarityMetric: NDSimilarityMetric,
    activationFunction: ActivationFunction
  ): Promise<APIForwardResult[]> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/batch_forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
        batch_features: batchFeatures,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Batch forward pass failed')
    }

    return data.results
  }

  // ===== DATASET LOADING METHODS =====

  /**
   * Get list of available datasets
   */
  async getAvailableDatasets(): Promise<{[key: string]: { classes: number[], class_names: string[], description: string }}> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/datasets/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get available datasets')
    }

    return data.datasets
  }

  /**
   * Load a dataset (just metadata, not the actual data)
   */
  async loadDataset(
    datasetName: string = 'mnist',
    subset: 'train' | 'test' = 'train',
    maxSamples?: number
  ): Promise<{
    dataset_name: string
    num_samples: number
    num_classes: number
    class_names: string[]
    feature_shape: number[]
    image_shape: number[]
    sample_labels: number[]
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const requestBody: any = {
      dataset_name: datasetName,
      subset: subset
    }

    if (maxSamples !== undefined) {
      requestBody.max_samples = maxSamples
    }

    const response = await fetch(`${this.baseUrl}/datasets/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load dataset')
    }

    return data.dataset_info
  }

  /**
   * Get a sample of data from a loaded dataset
   */
  async getDatasetSample(
    datasetName: string = 'mnist',
    subset: 'train' | 'test' = 'train',
    startIdx: number = 0,
    count: number = 100
  ): Promise<{
    features: number[][]
    labels: number[]
    images: number[][][]
    class_names: string[]
    start_idx: number
    end_idx: number
    total_samples: number
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/datasets/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_name: datasetName,
        subset: subset,
        start_idx: startIdx,
        count: count,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get dataset sample')
    }

    return data.data
  }

  /**
   * Get a training batch from a dataset
   */
  async getTrainingBatch(
    datasetName: string = 'mnist',
    subset: 'train' | 'test' = 'train',
    batchSize: number = 32,
    classFilter?: number[]
  ): Promise<{
    features: number[][]
    labels: number[]
    batch_size: number
    class_names: string[]
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const requestBody: any = {
      dataset_name: datasetName,
      subset: subset,
      batch_size: batchSize
    }

    if (classFilter !== undefined) {
      requestBody.class_filter = classFilter
    }

    const response = await fetch(`${this.baseUrl}/datasets/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get training batch')
    }

    return data.batch
  }

  /**
   * Preprocess a raw image for inference
   */
  async preprocessImage(
    image: number[][] | number[],
    normalize: boolean = true
  ): Promise<{
    processed_features: number[]
    original_shape: number[]
    processed_shape: number[]
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/datasets/preprocess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: image,
        normalize: normalize,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to preprocess image')
    }

    return data
  }

  // ===== UTILITY METHODS =====

  /**
   * Extract network parameters from neurons for API calls
   */
  extractNetworkParams(neurons: NDNeuron[]): { weights: number[][], biases: number[] } {
    return {
      weights: neurons.map(neuron => neuron.weights),
      biases: neurons.map(neuron => neuron.bias)
    }
  }

  /**
   * Extract batch data from data points for API calls
   */
  extractBatchData(dataPoints: NDDataPoint[]): { features: number[][], labels: number[] } {
    return {
      features: dataPoints.map(point => point.features),
      labels: dataPoints.map(point => point.label)
    }
  }

  /**
   * Check if API is connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Get base URL
   */
  get apiUrl(): string {
    return this.baseUrl
  }

  /**
   * Set base URL (useful for switching between local and remote API)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url
    this.isConnected = false // Reset connection status
  }

  /**
   * Get current model weights and biases
   */
  async getModelWeights(): Promise<{
    weights: number[][]
    biases: number[]
    weight_stats: Array<{
      class_id: number
      weight_norm: number
      weight_mean: number
      weight_std: number
      weight_min: number
      weight_max: number
    }>
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/weights`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get model weights')
    }

    return data.result
  }

  /**
   * Get model activations for a specific input
   */
  async getModelActivations(
    features: number[],
    weights?: number[][],
    biases?: number[],
    similarityMetric?: NDSimilarityMetric,
    activationFunction?: ActivationFunction
  ): Promise<{
    raw_similarities: number[]
    activations: number[]
    predicted_class: number
    confidence: number
    similarity_breakdown: Array<{
      class_id: number
      similarity_score: number
      activation_value: number
    }>
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/activations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features,
        weights,
        biases,
        similarity_metric: similarityMetric,
        activation_function: activationFunction,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get model activations')
    }

    return data.result
  }

  /**
   * Get weight visualization data
   */
  async getWeightVisualization(
    classId?: number,
    colormap: string = 'diverging'
  ): Promise<{
    weight_images: Array<{
      class_id: number
      weight_matrix: number[][]
      normalized_matrix: number[][]
      stats: {
        min: number
        max: number
        mean: number
        std: number
        norm: number
      }
    }>
    global_stats: {
      min_weight: number
      max_weight: number
      mean_weight: number
      std_weight: number
    }
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const params = new URLSearchParams()
    if (classId !== undefined) params.append('class_id', classId.toString())
    params.append('colormap', colormap)

    const response = await fetch(`${this.baseUrl}/model/weights/visualization?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get weight visualization')
    }

    return data.result
  }

  /**
   * Update model weights
   */
  async updateModelWeights(
    weights: number[][],
    biases: number[]
  ): Promise<{
    success: boolean
    updated_weights: number[][]
    updated_biases: number[]
    weight_stats: Array<{
      class_id: number
      weight_norm: number
      weight_mean: number
      weight_std: number
    }>
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/weights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weights,
        biases,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update model weights')
    }

    return data.result
  }

  /**
   * Get training metrics and progress
   */
  async getTrainingMetrics(): Promise<{
    current_epoch: number
    total_epochs: number
    current_loss: number
    train_accuracy: number
    test_accuracy: number
    learning_rate: number
    gradient_norm: number
    weight_update_norm: number
    is_training: boolean
    training_history: Array<{
      epoch: number
      loss: number
      train_accuracy: number
      test_accuracy: number
      gradient_norm: number
    }>
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/training/metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get training metrics')
    }

    return data.result
  }

  /**
   * Initialize model with ternary weights
   */
  async initializeTernaryModel(
    numClasses: number = 10,
    numFeatures: number = 784,
    sparsityRatio: number = 0.7
  ): Promise<{
    weights: number[][]
    biases: number[]
    weight_distribution: {
      negative_one_ratio: number
      zero_ratio: number
      positive_one_ratio: number
      total_weights: number
    }
    model_info: {
      num_classes: number
      num_features: number
      sparsity_ratio: number
      use_ternary_weights: boolean
    }
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/initialize_ternary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_classes: numClasses,
        num_features: numFeatures,
        sparsity_ratio: sparsityRatio,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to initialize ternary model')
    }

    return data.result
  }

  /**
   * Force quantization of current weights to ternary values
   */
  async quantizeWeights(): Promise<{
    quantized_weights: number[][]
    original_distribution: {
      negative_one_ratio: number
      zero_ratio: number
      positive_one_ratio: number
      total_weights: number
    }
    quantized_distribution: {
      negative_one_ratio: number
      zero_ratio: number
      positive_one_ratio: number
      total_weights: number
    }
    quantization_applied: boolean
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/quantize_weights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to quantize weights')
    }

    return data.result
  }

  /**
   * Get ternary weight statistics
   */
  async getTernaryStats(): Promise<{
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
      distribution: {
        negative_one_ratio: number
        zero_ratio: number
        positive_one_ratio: number
        total_weights: number
      }
      weight_norm: number
      unique_values: number[]
    }>
    total_parameters: number
    use_ternary_weights: boolean
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/model/ternary_stats`)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get ternary stats')
    }

    return data.result
  }

  async toggleTernaryWeights(useTernaryWeights?: boolean): Promise<{ use_ternary_weights: boolean; message: string }> {
    const payload = useTernaryWeights !== undefined ? { use_ternary_weights: useTernaryWeights } : {}
    const response = await fetch(`${this.baseUrl}/model/toggle_ternary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    return data.result
  }

  // ============ OPTAX OPTIMIZER METHODS ============

  /**
   * Initialize Optax optimizer
   */
  async initializeOptimizer(
    optimizerType: 'sgd' | 'adam' | 'adamw' = 'sgd',
    learningRate: number = 0.01,
    momentum: number = 0.9,
    weightDecay: number = 0.0
  ): Promise<{
    message: string
    config: {
      optimizer_type: string
      learning_rate: number
      momentum?: number
      weight_decay?: number
    }
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/optimizer/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        optimizer_type: optimizerType,
        learning_rate: learningRate,
        momentum: momentum,
        weight_decay: weightDecay,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to initialize optimizer')
    }

    return data
  }

  /**
   * Perform training step using Optax optimizer
   */
  async trainStepOptax(
    batchFeatures: number[][],
    batchLabels: number[],
    similarityMetric: NDSimilarityMetric
  ): Promise<{
    new_weights: number[][]
    new_biases: number[]
    loss: number
    gradient_norms: {
      weight_gradient_norm: number
      bias_gradient_norm: number
    }
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/train_step_optax`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batch_features: batchFeatures,
        batch_labels: batchLabels,
        similarity_metric: similarityMetric,
      }),
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Optax training step failed')
    }

    return data.result
  }

  /**
   * Get optimizer status
   */
  async getOptimizerStatus(): Promise<{
    initialized: boolean
    optimizer_type?: string
    config?: any
    has_state: boolean
    current_epoch: number
  }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/optimizer/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get optimizer status')
    }

    return data.result
  }

  /**
   * Reset optimizer state
   */
  async resetOptimizer(): Promise<{ message: string }> {
    if (!this.isConnected) {
      throw new Error('API not connected')
    }

    const response = await fetch(`${this.baseUrl}/optimizer/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to reset optimizer')
    }

    return data
  }
}

// Export singleton instance
export const mnistApiService = new MNISTApiService() 