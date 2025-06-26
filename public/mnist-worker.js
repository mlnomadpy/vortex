/**
 * MNIST Training Web Worker
 * Handles heavy computations off the main thread to prevent UI blocking
 */

// Import GPU.js in worker context
// For now, disable GPU in worker until we set up proper bundling
// importScripts('/node_modules/gpu.js/dist/gpu-browser.min.js');

let isInitialized = false;
let gpu = null;
let gpuEnabled = false;

// Initialize worker (GPU disabled for now)
async function initializeGPU() {
  try {
    console.log('[Worker] Initializing worker (GPU acceleration disabled)');
    
    // For now, just initialize without GPU until we set up proper bundling
    gpu = null;
    gpuEnabled = false;
    isInitialized = true;
    
    console.log('[Worker] Worker initialized successfully (CPU mode)');
    return { success: true, backend: 'cpu', gpuEnabled: false };
    
  } catch (error) {
    console.warn('[Worker] Failed to initialize worker:', error);
    gpuEnabled = false;
    isInitialized = true;
    return { success: false, error: error.message };
  }
}

// Similarity metric implementations
function calculateSimilarityScore(neuron, features, metric) {
  switch (metric) {
    case 'dotProduct':
      return neuron.weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
    
    case 'euclidean':
      const euclideanDist = Math.sqrt(
        neuron.weights.reduce((sum, weight, i) => sum + Math.pow(weight - features[i], 2), 0)
      );
      return -euclideanDist; // Negative distance as similarity
    
    case 'cosine':
      const dotProduct = neuron.weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
      const neuronNorm = Math.sqrt(neuron.weights.reduce((sum, weight) => sum + weight * weight, 0));
      const featuresNorm = Math.sqrt(features.reduce((sum, feature) => sum + feature * feature, 0));
      return dotProduct / (neuronNorm * featuresNorm + 1e-8);
    
    case 'manhattan':
      const manhattanDist = neuron.weights.reduce((sum, weight, i) => sum + Math.abs(weight - features[i]), 0);
      return -manhattanDist;
    
    case 'rbf':
      const rbfDist = neuron.weights.reduce((sum, weight, i) => sum + Math.pow(weight - features[i], 2), 0);
      return Math.exp(-rbfDist / 2);
    
    case 'yatProduct':
      const yatScore = neuron.weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
      const yatNorm = Math.sqrt(neuron.weights.reduce((sum, weight) => sum + weight * weight, 0));
      return yatScore / (yatNorm + 1e-8);
    
    default:
      return neuron.weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
  }
}

// Activation functions
function applyActivationFunction(scores, activationFunction) {
  switch (activationFunction) {
    case 'softmax':
      const maxScore = Math.max(...scores);
      const expScores = scores.map(score => Math.exp(score - maxScore));
      const sumExp = expScores.reduce((sum, exp) => sum + exp, 0);
      return expScores.map(exp => exp / sumExp);
    
    case 'softermax':
      const beta = 0.5;
      const maxSofter = Math.max(...scores);
      const expSofterScores = scores.map(score => Math.exp(beta * (score - maxSofter)));
      const sumSofterExp = expSofterScores.reduce((sum, exp) => sum + exp, 0);
      return expSofterScores.map(exp => exp / sumSofterExp);
    
    case 'sigmoid':
      return scores.map(score => 1 / (1 + Math.exp(-score)));
    
    case 'relu':
      return scores.map(score => Math.max(0, score));
    
    case 'gelu':
      return scores.map(score => 
        0.5 * score * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (score + 0.044715 * Math.pow(score, 3))))
      );
    
    case 'none':
    default:
      return scores;
  }
}

// Compute gradients for a neuron
function computeNeuronGradient(neuron, batchData, allNeurons, similarityMetric, activationFunction) {
  const weightGradients = new Array(neuron.weights.length).fill(0);
  let biasGradient = 0;
  
  for (const dataPoint of batchData) {
    // Forward pass: compute scores for all neurons
    const scores = allNeurons.map(n => calculateSimilarityScore(n, dataPoint.features, similarityMetric));
    const activations = applyActivationFunction(scores, activationFunction);
    
    // Create one-hot target
    const target = new Array(allNeurons.length).fill(0);
    target[dataPoint.label] = 1;
    
    // Compute error for this neuron
    const neuronIndex = allNeurons.findIndex(n => n.id === neuron.id);
    const error = activations[neuronIndex] - target[neuronIndex];
    
    // Compute gradients
    for (let i = 0; i < neuron.weights.length; i++) {
      weightGradients[i] += error * dataPoint.features[i];
    }
    biasGradient += error;
  }
  
  // Average gradients over batch
  const batchSize = batchData.length;
  return {
    weights: weightGradients.map(grad => grad / batchSize),
    bias: biasGradient / batchSize
  };
}

// GPU-accelerated batch similarity computation using GPU.js
async function computeBatchSimilarityGPU(weights, batchFeatures, similarityMetric) {
  if (!isInitialized || !gpuEnabled) {
    throw new Error('GPU.js not initialized or GPU not available');
  }
  
  try {
    // Create GPU kernel based on similarity metric
    let kernel;
    
    switch (similarityMetric) {
      case 'dotProduct':
        kernel = gpu.createKernel(function(features, weights) {
          let sum = 0;
          for (let i = 0; i < 784; i++) {
            sum += features[this.thread.y][i] * weights[this.thread.x][i];
          }
          return sum;
        }).setOutput([weights.length, batchFeatures.length]);
        break;
        
      case 'euclidean':
        kernel = gpu.createKernel(function(features, weights) {
          let sum = 0;
          for (let i = 0; i < 784; i++) {
            const diff = features[this.thread.y][i] - weights[this.thread.x][i];
            sum += diff * diff;
          }
          return -Math.sqrt(sum); // Negative distance as similarity
        }).setOutput([weights.length, batchFeatures.length]);
        break;
        
      case 'cosine':
        kernel = gpu.createKernel(function(features, weights) {
          let dotProd = 0;
          let featNorm = 0;
          let weightNorm = 0;
          
          for (let i = 0; i < 784; i++) {
            const f = features[this.thread.y][i];
            const w = weights[this.thread.x][i];
            dotProd += f * w;
            featNorm += f * f;
            weightNorm += w * w;
          }
          
          const magnitude = Math.sqrt(featNorm) * Math.sqrt(weightNorm);
          return magnitude > 0 ? dotProd / magnitude : 0;
        }).setOutput([weights.length, batchFeatures.length]);
        break;
        
      default:
        // Default to dot product
        kernel = gpu.createKernel(function(features, weights) {
          let sum = 0;
          for (let i = 0; i < 784; i++) {
            sum += features[this.thread.y][i] * weights[this.thread.x][i];
          }
          return sum;
        }).setOutput([weights.length, batchFeatures.length]);
    }
    
    // Compute similarity scores
    const result = kernel(batchFeatures, weights);
    return result;
    
  } catch (error) {
    console.warn('[Worker] GPU computation failed:', error);
    return null;
  }
}

// Message handler
self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'INITIALIZE':
        const initResult = await initializeGPU();
        self.postMessage({ type: 'INITIALIZE_COMPLETE', data: initResult, id });
        break;
      
      case 'COMPUTE_BATCH_GRADIENTS':
        const { neurons, batchData, similarityMetric, activationFunction, useGpu } = data;
        
        let gradients;
        if (useGpu && gpuEnabled && isInitialized) {
          try {
            // Prepare data for GPU computation
            const weights = neurons.map(n => n.weights);
            const batchFeatures = batchData.map(d => d.features);
            
            // Use GPU.js for similarity computation only
            const similarityScores = await computeBatchSimilarityGPU(weights, batchFeatures, similarityMetric);
            
            if (similarityScores) {
              // Compute gradients on CPU using GPU similarity scores
              gradients = neurons.map((neuron, i) => {
                const grad = computeNeuronGradient(neuron, batchData, neurons, similarityMetric, activationFunction);
                return {
                  neuronId: neuron.id,
                  weights: grad.weights,
                  bias: grad.bias
                };
              });
            } else {
              useGpu = false;
            }
          } catch (error) {
            console.warn('[Worker] GPU similarity computation failed, falling back to CPU:', error);
            useGpu = false;
          }
        }
        
        if (!useGpu || !gpuEnabled) {
          // CPU computation
          gradients = neurons.map(neuron => {
            const grad = computeNeuronGradient(neuron, batchData, neurons, similarityMetric, activationFunction);
            return {
              neuronId: neuron.id,
              weights: grad.weights,
              bias: grad.bias
            };
          });
        }
        
        self.postMessage({ 
          type: 'BATCH_GRADIENTS_COMPLETE', 
          data: { gradients, usedGpu: useGpu && gpuEnabled }, 
          id 
        });
        break;
      
      case 'COMPUTE_SIMILARITY_SCORES':
        const { features, neurons: scoreNeurons, metric } = data;
        const scores = scoreNeurons.map(neuron => ({
          neuronId: neuron.id,
          score: calculateSimilarityScore(neuron, features, metric)
        }));
        
        self.postMessage({ 
          type: 'SIMILARITY_SCORES_COMPLETE', 
          data: scores, 
          id 
        });
        break;
      
      case 'COMPUTE_LOSS':
        const { dataPoints, lossNeurons, lossSimilarityMetric, lossActivationFunction } = data;
        let totalLoss = 0;
        
        for (const dataPoint of dataPoints) {
          const scores = lossNeurons.map(n => calculateSimilarityScore(n, dataPoint.features, lossSimilarityMetric));
          const activations = applyActivationFunction(scores, lossActivationFunction);
          
          // Cross-entropy loss
          const targetActivation = activations[dataPoint.label] || 1e-15;
          totalLoss += -Math.log(Math.max(targetActivation, 1e-15));
        }
        
        const avgLoss = totalLoss / dataPoints.length;
        self.postMessage({ 
          type: 'LOSS_COMPLETE', 
          data: avgLoss, 
          id 
        });
        break;
      
      case 'COMPUTE_ACCURACY':
        const { testData, accNeurons, accSimilarityMetric, accActivationFunction } = data;
        let correct = 0;
        
        for (const dataPoint of testData) {
          const scores = accNeurons.map(n => calculateSimilarityScore(n, dataPoint.features, accSimilarityMetric));
          const activations = applyActivationFunction(scores, accActivationFunction);
          
          const predictedClass = activations.indexOf(Math.max(...activations));
          if (predictedClass === dataPoint.label) {
            correct++;
          }
        }
        
        const accuracy = correct / testData.length;
        self.postMessage({ 
          type: 'ACCURACY_COMPLETE', 
          data: accuracy, 
          id 
        });
        break;
      
      case 'GET_MEMORY_INFO':
        const memoryInfo = isInitialized && gpu ? { backend: gpu.mode, gpuEnabled } : null;
        self.postMessage({ 
          type: 'MEMORY_INFO_COMPLETE', 
          data: memoryInfo, 
          id 
        });
        break;
      
      case 'CLEANUP':
        if (isInitialized && gpu) {
          // GPU.js handles cleanup automatically
          console.log('[Worker] GPU.js cleanup completed');
        }
        self.postMessage({ 
          type: 'CLEANUP_COMPLETE', 
          data: null, 
          id 
        });
        break;
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      data: { message: error.message, stack: error.stack }, 
      id 
    });
  }
};

// Handle uncaught errors
self.onerror = function(error) {
  self.postMessage({ 
    type: 'ERROR', 
    data: { message: error.message, stack: error.stack } 
  });
};

console.log('[Worker] MNIST Training Worker initialized'); 