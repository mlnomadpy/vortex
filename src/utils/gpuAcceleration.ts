// GPU.js-based acceleration utility - much lighter than TensorFlow.js
// Provides custom kernels for similarity metrics and neural network operations

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */

import { GPU } from 'gpu.js';

interface SimilarityMetrics {
  dotProduct: any;
  euclidean: any;
  cosine: any;
  manhattan: any;
  rbf: any;
  yatProduct: any;
}

interface GPUAcceleration {
  isAvailable: boolean;
  gpu: any;
  kernels: {
    similarity: SimilarityMetrics;
    matrixOps: any;
    activations: any;
  };
  createCustomKernel: (func: Function, output: number[]) => any;
  benchmarkPerformance: () => Promise<any>;
}

class GPUAccelerationManager implements GPUAcceleration {
  public isAvailable: boolean = false;
  public gpu: any = null;
  public kernels: any = {};
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for first use
  }

  public ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
  }

  private initialize(): void {
    try {
      // Initialize GPU.js using proper import
      this.gpu = new GPU({
        mode: 'gpu', // Try GPU first, fallback to CPU
      });
      
      // Test GPU availability
      const testKernel = this.gpu.createKernel(function() {
        return 1;
      }).setOutput([1]);
      
      testKernel();
      this.isAvailable = true;
      this.initializeKernels();
      
      console.log('🚀 GPU.js acceleration initialized successfully');
      console.log('📊 Backend:', this.gpu.mode);
      
      // Test kernel execution
      this.testKernels();
    } catch (error) {
      console.warn('⚠️ GPU.js not available, falling back to CPU:', error);
      this.isAvailable = false;
    }
  }

  private initializeKernels(): void {
    this.kernels = {
      similarity: this.createSimilarityKernels(),
      matrixOps: this.createMatrixOperationKernels(),
      activations: this.createActivationKernels(),
    };
  }

  private testKernels(): void {
    try {
      // Test dot product kernel with proper output configuration
      const testPoint = Array.from({ length: 784 }, () => Math.random());
      const testNeurons = Array.from({ length: 10 }, () => 
        Array.from({ length: 784 }, () => Math.random())
      );
      
      // Configure kernel for 10 neurons output
      const configuredKernel = this.kernels.similarity.dotProduct.setOutput([10]);
      const result = configuredKernel(testPoint, testNeurons, 10, 784);
      
      console.log('✅ GPU kernels test successful - result shape:', result.length);
      console.log('🎯 Sample result:', Array.from(result).slice(0, 3));
      console.log('💪 GPU acceleration is working!');
    } catch (error) {
      console.warn('⚠️ GPU kernel test failed:', error);
      console.warn('📋 Error details:', error.message);
    }
  }

  private createSimilarityKernels(): SimilarityMetrics {
    // Dot product similarity kernel
    const dotProduct = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number
    ) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        sum += dataPoint[i] * neurons[this.thread.x][i];
      }
      return sum;
    }, {
      dynamicOutput: true
    });

    // Euclidean distance kernel
    const euclidean = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number
    ) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        const diff = dataPoint[i] - neurons[this.thread.x][i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    }, {
      dynamicOutput: true
    });

    // Cosine similarity kernel
    const cosine = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number
    ) {
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
    }, {
      dynamicOutput: true
    });

    // Manhattan distance kernel
    const manhattan = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number
    ) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        sum += Math.abs(dataPoint[i] - neurons[this.thread.x][i]);
      }
      return sum;
    }, {
      dynamicOutput: true
    });

    // RBF (Radial Basis Function) kernel
    const rbf = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number,
      gamma: number
    ) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        const diff = dataPoint[i] - neurons[this.thread.x][i];
        sum += diff * diff;
      }
      return Math.exp(-gamma * sum);
    }, {
      dynamicOutput: true
    });

    // Yat product kernel (custom similarity metric)
    const yatProduct = this.gpu.createKernel(function(
      dataPoint: number[], 
      neurons: number[][], 
      neuronCount: number,
      dimensions: number
    ) {
      let sum = 0;
      for (let i = 0; i < dimensions; i++) {
        const product = dataPoint[i] * neurons[this.thread.x][i];
        sum += product > 0 ? Math.sqrt(product) : 0;
      }
      return sum;
    }, {
      dynamicOutput: true
    });

    return {
      dotProduct,
      euclidean,
      cosine,
      manhattan,
      rbf,
      yatProduct
    };
  }

  private createMatrixOperationKernels(): any {
    // Matrix multiplication kernel
    const matrixMultiply = this.gpu.createKernel(function(
      a: number[][], 
      b: number[][], 
      aRows: number, 
      aCols: number, 
      bCols: number
    ) {
      let sum = 0;
      for (let i = 0; i < aCols; i++) {
        sum += a[this.thread.y][i] * b[i][this.thread.x];
      }
      return sum;
    }, {
      dynamicOutput: true
    });

    // Element-wise addition
    const elementAdd = this.gpu.createKernel(function(a: number[], b: number[]) {
      return a[this.thread.x] + b[this.thread.x];
    }, {
      dynamicOutput: true
    });

    // Element-wise multiplication
    const elementMultiply = this.gpu.createKernel(function(a: number[], b: number[]) {
      return a[this.thread.x] * b[this.thread.x];
    }, {
      dynamicOutput: true
    });

    // Vector normalization
    const normalize = this.gpu.createKernel(function(vector: number[], magnitude: number) {
      return magnitude > 0 ? vector[this.thread.x] / magnitude : 0;
    }, {
      dynamicOutput: true
    });

    return {
      matrixMultiply,
      elementAdd,
      elementMultiply,
      normalize
    };
  }

  private createActivationKernels(): any {
    // Softmax activation
    const softmax = this.gpu.createKernel(function(input: number[], maxVal: number, sumExp: number) {
      const shifted = input[this.thread.x] - maxVal;
      return Math.exp(shifted) / sumExp;
    }, {
      dynamicOutput: true
    });

    // ReLU activation
    const relu = this.gpu.createKernel(function(input: number[]) {
      return Math.max(0, input[this.thread.x]);
    }, {
      dynamicOutput: true
    });

    // Sigmoid activation
    const sigmoid = this.gpu.createKernel(function(input: number[]) {
      return 1 / (1 + Math.exp(-input[this.thread.x]));
    }, {
      dynamicOutput: true
    });

    // GELU activation
    const gelu = this.gpu.createKernel(function(input: number[]) {
      const x = input[this.thread.x];
      return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
    }, {
      dynamicOutput: true
    });

    return {
      softmax,
      relu,
      sigmoid,
      gelu
    };
  }

  public getKernels(): any {
    this.ensureInitialized();
    return this.kernels;
  }

  public checkAvailability(): boolean {
    this.ensureInitialized();
    return this.isAvailable;
  }

  public createCustomKernel(func: Function, output: number[]): any {
    this.ensureInitialized();
    if (!this.isAvailable) return null;
    return this.gpu.createKernel(func, { dynamicOutput: true }).setOutput(output);
  }

  public async benchmarkPerformance(): Promise<any> {
    this.ensureInitialized();
    if (!this.isAvailable) {
      return { error: 'GPU acceleration not available' };
    }

    console.log('🚀 Starting comprehensive GPU vs CPU benchmark...');
    
    // Test with multiple sizes to find GPU sweet spot
    const testSizes = [1000, 5000, 10000];
    const results = [];
    
    for (const testSize of testSizes) {
      console.log(`📏 Testing with ${testSize} elements...`);
      
      // Create realistic neural network similarity computation
      const dataPoints = Array.from({ length: testSize }, () => 
        Array.from({ length: 784 }, () => Math.random())
      );
      const neurons = Array.from({ length: 10 }, () => 
        Array.from({ length: 784 }, () => Math.random())
      );
      const iterations = Math.max(10, Math.floor(1000 / testSize)); // Fewer iterations for larger sizes
      
      // GPU Benchmark - Similarity computation (like MNIST training)
      const gpuKernel = this.gpu.createKernel(function(
        dataPoint: number[], 
        weights: number[][], 
        neuronCount: number,
        dimensions: number
      ) {
        let sum = 0;
        for (let i = 0; i < dimensions; i++) {
          sum += dataPoint[i] * weights[this.thread.x][i];
        }
        return sum;
      }, { dynamicOutput: true }).setOutput([10]); // 10 neurons

      // GPU Warmup
      for (let i = 0; i < 3; i++) {
        gpuKernel(dataPoints[0], neurons, 10, 784);
      }

      // GPU Benchmark
      const gpuStart = performance.now();
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < Math.min(100, testSize); i++) { // Limit to prevent timeout
          gpuKernel(dataPoints[i], neurons, 10, 784);
        }
      }
      const gpuEnd = performance.now();
      const gpuTime = (gpuEnd - gpuStart) / iterations;

      // CPU Benchmark (equivalent computation)
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
      const cpuEnd = performance.now();
      const cpuTime = (cpuEnd - cpuStart) / iterations;

      const speedup = cpuTime / gpuTime;
      
      results.push({
        testSize,
        gpuTime: Math.round(gpuTime * 100) / 100,
        cpuTime: Math.round(cpuTime * 100) / 100,
        speedup: Math.round(speedup * 100) / 100,
        iterations
      });

      console.log(`📊 Size ${testSize}: GPU=${gpuTime.toFixed(2)}ms, CPU=${cpuTime.toFixed(2)}ms, Speedup=${speedup.toFixed(2)}x`);
    }

    // Find best result
    const bestResult = results.reduce((best, current) => 
      current.speedup > best.speedup ? current : best
    );

    const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
    const opsPerSecond = Math.round((bestResult.testSize * 784 * 10 * 1000) / bestResult.gpuTime);

    console.log(`🏆 Best speedup: ${bestResult.speedup}x at size ${bestResult.testSize}`);
    console.log(`📈 Average speedup: ${avgSpeedup.toFixed(2)}x`);

    return {
      gpuTime: bestResult.gpuTime,
      cpuTime: bestResult.cpuTime,
      speedup: bestResult.speedup,
      opsPerSecond: opsPerSecond,
      backend: this.gpu.mode,
      testSize: bestResult.testSize,
      iterations: bestResult.iterations,
      avgSpeedup: Math.round(avgSpeedup * 100) / 100,
      allResults: results
    };
  }

  // Batch processing for large datasets
  public createBatchSimilarityKernel(metric: string, batchSize: number = 32): any {
    this.ensureInitialized();
    if (!this.isAvailable) return null;

    switch (metric) {
      case 'dotProduct':
        return this.gpu.createKernel(function(
          batch: number[][], 
          neurons: number[][], 
          dimensions: number
        ) {
          let sum = 0;
          for (let i = 0; i < dimensions; i++) {
            sum += batch[this.thread.y][i] * neurons[this.thread.x][i];
          }
          return sum;
        }).setOutput([10, batchSize]); // 10 neurons x batch size

      case 'euclidean':
        return this.gpu.createKernel(function(
          batch: number[][], 
          neurons: number[][], 
          dimensions: number
        ) {
          let sum = 0;
          for (let i = 0; i < dimensions; i++) {
            const diff = batch[this.thread.y][i] - neurons[this.thread.x][i];
            sum += diff * diff;
          }
          return Math.sqrt(sum);
        }).setOutput([10, batchSize]);

      default:
        return this.kernels.similarity.dotProduct;
    }
  }

  // Memory cleanup
  public cleanup(): void {
    if (this.gpu) {
      // GPU.js automatically handles memory cleanup
      console.log('🧹 GPU.js cleanup completed');
    }
  }
}

// Create singleton instance
const gpuAcceleration = new GPUAccelerationManager();

export default gpuAcceleration;
export type { GPUAcceleration, SimilarityMetrics }; 