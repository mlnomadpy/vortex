// GPU Compute Worker - Runs GPU.js computations off the main thread
// This prevents blocking the UI during heavy computations

let GPU;
let gpu;
let kernels = {};
let isInitialized = false;

// Import GPU.js in worker context
importScripts('https://unpkg.com/gpu.js@latest/dist/gpu-browser.min.js');

// Initialize GPU acceleration in worker
function initializeGPU() {
  try {
    GPU = self.GPU;
    gpu = new GPU({
      mode: 'gpu', // Try GPU first, fallback to CPU in worker
    });
    
    // Test GPU availability
    const testKernel = gpu.createKernel(function() {
      return 1;
    }).setOutput([1]);
    
    testKernel();
    
    // Create all similarity kernels
    kernels = createAllKernels();
    isInitialized = true;
    
    return {
      success: true,
      backend: gpu.mode,
      message: 'GPU initialized successfully in worker'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'GPU initialization failed in worker'
    };
  }
}

// Create all GPU kernels with dynamic output
function createAllKernels() {
  const similarity = {
    // Dot product similarity
    dotProduct: gpu.createKernel(function(dataPoint, neurons, neuronCount, dimensions) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        sum += dataPoint[i] * neurons[this.thread.x][i];
      }
      return sum;
    }, { dynamicOutput: true }),
    
    // Euclidean distance
    euclidean: gpu.createKernel(function(dataPoint, neurons, neuronCount, dimensions) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        const diff = dataPoint[i] - neurons[this.thread.x][i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    }, { dynamicOutput: true }),
    
    // Cosine similarity
    cosine: gpu.createKernel(function(dataPoint, neurons, neuronCount, dimensions) {
      let dotProd = 0;
      let magA = 0;
      let magB = 0;
      
      for (let i = 0; i < dimensions; i++) {
        const a = dataPoint[i];
        const b = neurons[this.thread.x][i];
        dotProd += a * b;
        magA += a * a;
        magB += b * b;
      }
      
      const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
      return magnitude > 0 ? dotProd / magnitude : 0;
    }, { dynamicOutput: true })
  };
  
  const batch = {
    // Batch dot product for multiple data points
    batchDotProduct: gpu.createKernel(function(batch, neurons, dimensions) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        sum += batch[this.thread.y][i] * neurons[this.thread.x][i];
      }
      return sum;
    }, { dynamicOutput: true })
  };
  
  return { similarity, batch };
}

// Process single similarity computation
function computeSimilarity(dataPoint, neurons, metric, neuronCount) {
  if (!isInitialized) {
    throw new Error('GPU not initialized in worker');
  }
  
  const kernel = kernels.similarity[metric];
  if (!kernel) {
    throw new Error(`Unknown similarity metric: ${metric}`);
  }
  
  const configuredKernel = kernel.setOutput([neuronCount]);
  return Array.from(configuredKernel(dataPoint, neurons, neuronCount, dataPoint.length));
}

// Process batch similarity computation
function computeBatchSimilarity(batchData, neurons, metric, neuronCount) {
  if (!isInitialized) {
    throw new Error('GPU not initialized in worker');
  }
  
  const batchSize = batchData.length;
  
  // Use batch kernel for better performance
  if (kernels.batch.batchDotProduct && metric === 'dotProduct') {
    const batchKernel = kernels.batch.batchDotProduct.setOutput([neuronCount, batchSize]);
    const result = batchKernel(batchData, neurons, batchData[0].length);
    
    // Convert 2D result to array of arrays
    const batchResults = [];
    for (let i = 0; i < batchSize; i++) {
      const sampleResults = [];
      for (let j = 0; j < neuronCount; j++) {
        sampleResults.push(result[i][j]);
      }
      batchResults.push(sampleResults);
    }
    return batchResults;
  } else {
    // Fall back to individual processing
    const results = [];
    for (const dataPoint of batchData) {
      results.push(computeSimilarity(dataPoint, neurons, metric, neuronCount));
    }
    return results;
  }
}

// Benchmark GPU vs CPU performance
async function runBenchmark() {
  if (!isInitialized) {
    throw new Error('GPU not initialized in worker');
  }
  
  const testSizes = [1000, 5000, 10000];
  const results = [];
  
  for (const testSize of testSizes) {
    // Create test data
    const dataPoints = Array.from({ length: testSize }, () => 
      Array.from({ length: 784 }, () => Math.random())
    );
    const neurons = Array.from({ length: 10 }, () => 
      Array.from({ length: 784 }, () => Math.random())
    );
    const iterations = Math.max(10, Math.floor(1000 / testSize));
    
    // GPU benchmark
    const gpuKernel = kernels.similarity.dotProduct.setOutput([10]);
    
    // Warmup
    for (let i = 0; i < 3; i++) {
      gpuKernel(dataPoints[0], neurons, 10, 784);
    }
    
    const gpuStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < Math.min(100, testSize); i++) {
        gpuKernel(dataPoints[i], neurons, 10, 784);
      }
    }
    const gpuTime = (performance.now() - gpuStart) / iterations;
    
    // CPU benchmark
    const cpuStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < Math.min(100, testSize); i++) {
        const scores = new Array(10);
        for (let neuronIdx = 0; neuronIdx < 10; neuronIdx++) {
          let sum = 0;
          for (let dim = 0; dim < 784; dim++) {
            sum += dataPoints[i][dim] * neurons[neuronIdx][dim];
          }
          scores[neuronIdx] = sum;
        }
      }
    }
    const cpuTime = (performance.now() - cpuStart) / iterations;
    
    const speedup = cpuTime / gpuTime;
    results.push({
      testSize,
      gpuTime: Math.round(gpuTime * 100) / 100,
      cpuTime: Math.round(cpuTime * 100) / 100,
      speedup: Math.round(speedup * 100) / 100,
      iterations
    });
  }
  
  const bestResult = results.reduce((best, current) => 
    current.speedup > best.speedup ? current : best
  );
  
  const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
  
  return {
    gpuTime: bestResult.gpuTime,
    cpuTime: bestResult.cpuTime,
    speedup: bestResult.speedup,
    opsPerSecond: Math.round((bestResult.testSize * 784 * 10 * 1000) / bestResult.gpuTime),
    backend: gpu.mode,
    testSize: bestResult.testSize,
    iterations: bestResult.iterations,
    avgSpeedup: Math.round(avgSpeedup * 100) / 100,
    allResults: results
  };
}

// Message handler
self.onmessage = async function(e) {
  const { id, type, data } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'initialize':
        result = initializeGPU();
        break;
        
      case 'computeSimilarity':
        result = computeSimilarity(
          data.dataPoint, 
          data.neurons, 
          data.metric, 
          data.neuronCount
        );
        break;
        
      case 'computeBatchSimilarity':
        result = computeBatchSimilarity(
          data.batchData, 
          data.neurons, 
          data.metric, 
          data.neuronCount
        );
        break;
        
      case 'benchmark':
        result = await runBenchmark();
        break;
        
      case 'getStatus':
        result = {
          initialized: isInitialized,
          backend: gpu?.mode || 'unknown',
          kernelCount: Object.keys(kernels.similarity || {}).length
        };
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    // Send success response
    self.postMessage({
      id,
      success: true,
      result
    });
    
  } catch (error) {
    // Send error response
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
};

// Signal that worker is ready
self.postMessage({
  type: 'ready',
  message: 'GPU worker is ready'
}); 