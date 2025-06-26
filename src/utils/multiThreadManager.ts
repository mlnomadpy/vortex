// Multi-threaded Compute Manager
// Manages worker pools for GPU and CPU computations to keep UI responsive

interface ComputeTask {
  id: string;
  type: string;
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  priority: number;
}

interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  id: string;
  capabilities: string[];
}

class MultiThreadManager {
  private gpuWorkers: WorkerInfo[] = [];
  private cpuWorkers: WorkerInfo[] = [];
  private taskQueue: ComputeTask[] = [];
  private nextTaskId = 0;
  private maxWorkers = 4;
  private initialized = false;

  constructor() {
    // Auto-detect optimal worker count
    this.maxWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
  }

  /**
   * Initialize worker pools
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`🚀 Initializing ${this.maxWorkers} compute workers...`);

    try {
      // Create GPU workers
      await this.createGPUWorkers();
      
      // Create CPU workers  
      await this.createCPUWorkers();
      
      this.initialized = true;
      console.log('✅ Multi-threaded compute manager initialized');
      
    } catch (error) {
      console.warn('⚠️ Worker initialization failed:', error);
      // Fallback to main thread computation
    }
  }

  /**
   * Create GPU compute workers
   */
  private async createGPUWorkers(): Promise<void> {
    const workerPromises = [];
    
    for (let i = 0; i < Math.min(2, this.maxWorkers); i++) {
      const promise = this.createGPUWorker(i);
      workerPromises.push(promise);
    }
    
    const workers = await Promise.allSettled(workerPromises);
    
    workers.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.gpuWorkers.push(result.value);
        console.log(`✅ GPU Worker ${index} ready`);
      } else {
        console.warn(`❌ GPU Worker ${index} failed:`, result);
      }
    });
  }

  /**
   * Create CPU compute workers
   */
  private async createCPUWorkers(): Promise<void> {
    const workerPromises = [];
    
    for (let i = 0; i < this.maxWorkers - this.gpuWorkers.length; i++) {
      const promise = this.createCPUWorker(i);
      workerPromises.push(promise);
    }
    
    const workers = await Promise.allSettled(workerPromises);
    
    workers.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.cpuWorkers.push(result.value);
        console.log(`✅ CPU Worker ${index} ready`);
      }
    });
  }

  /**
   * Create individual GPU worker
   */
  private createGPUWorker(id: number): Promise<WorkerInfo> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker('/gpu-worker.js');
        const workerId = `gpu-${id}`;
        
        const workerInfo: WorkerInfo = {
          worker,
          busy: false,
          id: workerId,
          capabilities: ['gpu', 'similarity', 'batch', 'benchmark']
        };

        // Handle worker messages
        worker.onmessage = (e) => {
          const { type, message } = e.data;
          
          if (type === 'ready') {
            console.log(`🟢 GPU Worker ${id} is ready`);
            resolve(workerInfo);
          } else {
            this.handleWorkerMessage(workerId, e.data);
          }
        };

        worker.onerror = (error) => {
          console.error(`❌ GPU Worker ${id} error:`, error);
          reject(error);
        };

        // Timeout for worker initialization
        setTimeout(() => {
          reject(new Error(`GPU Worker ${id} initialization timeout`));
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create individual CPU worker
   */
  private createCPUWorker(id: number): Promise<WorkerInfo> {
    return new Promise((resolve, reject) => {
      try {
        // Create CPU worker with inline code to avoid external file dependency
        const workerCode = `
          // CPU Compute Worker
          self.onmessage = async function(e) {
            const { id, type, data } = e.data;
            
            try {
              let result;
              
              switch (type) {
                case 'computeSimilarity':
                  result = computeCPUSimilarity(data.dataPoint, data.neurons, data.metric);
                  break;
                  
                case 'computeBatch':
                  result = computeCPUBatch(data.batchData, data.neurons, data.metric);
                  break;
                  
                case 'gradientComputation':
                  result = computeGradients(data.neuron, data.data, data.neurons, data.metric, data.activation);
                  break;
                  
                default:
                  throw new Error('Unknown CPU task type: ' + type);
              }
              
              self.postMessage({ id, success: true, result });
              
            } catch (error) {
              self.postMessage({ id, success: false, error: error.message });
            }
          };
          
          // CPU similarity computations
          function computeCPUSimilarity(dataPoint, neurons, metric) {
            return neurons.map(neuron => {
              switch (metric) {
                case 'dotProduct':
                  return dataPoint.reduce((sum, val, idx) => sum + val * neuron[idx], 0);
                case 'euclidean':
                  const diff = dataPoint.map((val, idx) => val - neuron[idx]);
                  return Math.sqrt(diff.reduce((sum, d) => sum + d * d, 0));
                case 'cosine':
                  const dotProd = dataPoint.reduce((sum, val, idx) => sum + val * neuron[idx], 0);
                  const magA = Math.sqrt(dataPoint.reduce((sum, val) => sum + val * val, 0));
                  const magB = Math.sqrt(neuron.reduce((sum, val) => sum + val * val, 0));
                  return magA * magB > 0 ? dotProd / (magA * magB) : 0;
                default:
                  return 0;
              }
            });
          }
          
          function computeCPUBatch(batchData, neurons, metric) {
            return batchData.map(dataPoint => computeCPUSimilarity(dataPoint, neurons, metric));
          }
          
          function computeGradients(neuron, data, allNeurons, metric, activation) {
            // Simplified gradient computation for CPU worker
            const weightGrads = new Array(neuron.weights.length).fill(0);
            let biasGrad = 0;
            
            for (const point of data) {
              const scores = computeCPUSimilarity(point.features, allNeurons, metric);
              const predictions = applyActivation(scores, activation);
              
              // Simplified gradient calculation
              for (let i = 0; i < neuron.weights.length; i++) {
                weightGrads[i] += point.features[i] * 0.01; // Simplified
              }
              biasGrad += 0.01;
            }
            
            return {
              weights: weightGrads.map(g => g / data.length),
              bias: biasGrad / data.length
            };
          }
          
          function applyActivation(scores, activation) {
            switch (activation) {
              case 'softmax':
                const max = Math.max(...scores);
                const exp = scores.map(s => Math.exp(s - max));
                const sum = exp.reduce((a, b) => a + b, 0);
                return exp.map(e => e / sum);
              case 'relu':
                return scores.map(s => Math.max(0, s));
              default:
                return scores;
            }
          }
          
          self.postMessage({ type: 'ready', message: 'CPU worker ready' });
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        const workerId = `cpu-${id}`;
        
        const workerInfo: WorkerInfo = {
          worker,
          busy: false,
          id: workerId,
          capabilities: ['cpu', 'similarity', 'batch', 'gradients']
        };

        worker.onmessage = (e) => {
          const { type, message } = e.data;
          
          if (type === 'ready') {
            console.log(`🟢 CPU Worker ${id} is ready`);
            resolve(workerInfo);
          } else {
            this.handleWorkerMessage(workerId, e.data);
          }
        };

        worker.onerror = (error) => {
          console.error(`❌ CPU Worker ${id} error:`, error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle worker response messages
   */
  private handleWorkerMessage(workerId: string, message: any): void {
    const { id, success, result, error } = message;
    
    // Find the worker and mark as not busy
    const allWorkers = [...this.gpuWorkers, ...this.cpuWorkers];
    const worker = allWorkers.find(w => w.id === workerId);
    if (worker) {
      worker.busy = false;
    }

    // Find the corresponding task in queue and resolve/reject
    const taskIndex = this.taskQueue.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      
      if (success) {
        task.resolve(result);
      } else {
        task.reject(new Error(error));
      }
    }

    // Process next task in queue
    this.processNextTask();
  }

  /**
   * Add task to queue and process
   */
  private queueTask(type: string, data: any, priority: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: ComputeTask = {
        id: `task-${this.nextTaskId++}`,
        type,
        data,
        resolve,
        reject,
        priority
      };

      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
      
      this.processNextTask();
    });
  }

  /**
   * Sanitize data to ensure it's cloneable for Web Workers
   */
  private sanitizeDataForWorker(data: any): any {
    try {
      // First, log what we're trying to serialize for debugging
      console.debug('🔍 Sanitizing data for worker:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        keys: data && typeof data === 'object' ? Object.keys(data) : 'not object'
      });
      
      // Convert to plain objects/arrays by serializing and parsing
      // This removes any methods, prototypes, or circular references
      const sanitized = JSON.parse(JSON.stringify(data));
      
      // Ensure arrays are plain arrays (not typed arrays or custom array objects)
      if (sanitized.batchData && Array.isArray(sanitized.batchData)) {
        sanitized.batchData = sanitized.batchData.map((item: any) => 
          Array.isArray(item) ? [...item] : item
        );
      }
      
      if (sanitized.neurons && Array.isArray(sanitized.neurons)) {
        sanitized.neurons = sanitized.neurons.map((neuron: any) => 
          Array.isArray(neuron) ? [...neuron] : neuron
        );
      }
      
      if (sanitized.dataPoint && Array.isArray(sanitized.dataPoint)) {
        sanitized.dataPoint = [...sanitized.dataPoint];
      }
      
      console.debug('✅ Data sanitization successful');
      return sanitized;
    } catch (error) {
      console.error('❌ Data sanitization failed:', error, 'Original data:', data);
      throw new Error(`Cannot serialize data for worker transfer: ${error}`);
    }
  }

  /**
   * Process next task in queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    // Find available worker for the task
    const task = this.taskQueue[0];
    let worker: WorkerInfo | undefined;

    // Try to find GPU worker for GPU tasks
    if (task.type.includes('gpu') || task.type.includes('batch')) {
      worker = this.gpuWorkers.find(w => !w.busy);
    }
    
    // Fall back to CPU worker
    if (!worker) {
      worker = this.cpuWorkers.find(w => !w.busy);
    }

    if (worker) {
      // Remove task from queue and assign to worker
      this.taskQueue.shift();
      worker.busy = true;
      
      try {
        // Ensure data is cloneable by sanitizing it
        const cloneableData = this.sanitizeDataForWorker(task.data);
        
        // Send task to worker
        worker.worker.postMessage({
          id: task.id,
          type: task.type,
          data: cloneableData
        });
      } catch (error) {
        console.error('Failed to send task to worker:', error);
        worker.busy = false;
        
        // Reject the task
        task.reject(new Error(`Data serialization failed: ${error}`));
      }
    }
  }

  /**
   * Public API Methods
   */

  /**
   * Compute similarity scores (non-blocking)
   */
  async computeSimilarity(
    dataPoint: number[], 
    neurons: number[][], 
    metric: string,
    useGPU: boolean = true
  ): Promise<number[]> {
    await this.initialize();
    
    const taskType = useGPU && this.gpuWorkers.length > 0 ? 'computeSimilarity' : 'computeSimilarity';
    
    return this.queueTask(taskType, {
      dataPoint,
      neurons,
      metric,
      neuronCount: neurons.length
    }, 2); // Normal priority
  }

  /**
   * Compute batch similarities (non-blocking)
   */
  async computeBatchSimilarity(
    batchData: number[][], 
    neurons: number[][], 
    metric: string,
    useGPU: boolean = true
  ): Promise<number[][]> {
    await this.initialize();
    
    const taskType = useGPU && this.gpuWorkers.length > 0 ? 'computeBatchSimilarity' : 'computeBatch';
    
    return this.queueTask(taskType, {
      batchData,
      neurons,
      metric,
      neuronCount: neurons.length
    }, 3); // High priority for batches
  }

  /**
   * Run benchmark (non-blocking)
   */
  async runBenchmark(): Promise<any> {
    await this.initialize();
    
    if (this.gpuWorkers.length > 0) {
      return this.queueTask('benchmark', {}, 1); // Low priority
    } else {
      throw new Error('No GPU workers available for benchmark');
    }
  }

  /**
   * Get manager status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      gpuWorkers: this.gpuWorkers.length,
      cpuWorkers: this.cpuWorkers.length,
      busyWorkers: [...this.gpuWorkers, ...this.cpuWorkers].filter(w => w.busy).length,
      queuedTasks: this.taskQueue.length,
      totalWorkers: this.gpuWorkers.length + this.cpuWorkers.length
    };
  }

  /**
   * Cleanup workers
   */
  cleanup(): void {
    [...this.gpuWorkers, ...this.cpuWorkers].forEach(workerInfo => {
      workerInfo.worker.terminate();
    });
    
    this.gpuWorkers = [];
    this.cpuWorkers = [];
    this.taskQueue = [];
    this.initialized = false;
    
    console.log('🧹 Multi-thread manager cleaned up');
  }
}

// Create singleton instance
const multiThreadManager = new MultiThreadManager();

export default multiThreadManager;
export { MultiThreadManager }; 