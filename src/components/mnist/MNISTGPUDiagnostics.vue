<template>
  <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        GPU Acceleration Diagnostics
      </h3>
      <button
        @click="isExpanded = !isExpanded"
        class="text-slate-400 hover:text-white transition-colors"
      >
        <svg 
          class="w-5 h-5 transform transition-transform"
          :class="{ 'rotate-180': isExpanded }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <div v-if="isExpanded" class="space-y-4">
      <!-- GPU Performance Guide -->
      <div class="bg-blue-500/20 border border-blue-500/50 rounded p-3 mb-4">
        <div class="text-sm text-blue-300 mb-2">💡 GPU Performance Guide</div>
        <div class="text-xs text-blue-200 space-y-1">
          <div>• GPUs excel with large parallel workloads (batch size ≥32)</div>
          <div>• Small batches may be faster on CPU due to overhead</div>
          <div>• Run benchmarks to find optimal configuration</div>
          <div>• WebGL GPU compute has limitations vs native GPU</div>
        </div>
      </div>

      <!-- Debug Info -->
      <div class="bg-slate-600/20 border border-slate-600/50 rounded p-3 mb-4">
        <div class="text-sm text-slate-300">Status</div>
        <div class="text-xs text-slate-200">GPU Available: {{ gpuAvailable }}</div>
        <div class="text-xs text-slate-200">GPU Enabled: {{ useGpuAcceleration }}</div>
      </div>

      <!-- GPU Status -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-700/30 rounded p-3">
          <div class="text-sm text-slate-400 mb-1">GPU Available</div>
          <div class="flex items-center gap-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="gpuAvailable ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-white font-medium">
              {{ gpuAvailable ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <div class="bg-slate-700/30 rounded p-3">
          <div class="text-sm text-slate-400 mb-1">GPU Enabled</div>
          <div class="flex items-center gap-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="useGpuAcceleration ? 'bg-blue-500' : 'bg-gray-500'"
            ></div>
            <span class="text-white font-medium">
              {{ useGpuAcceleration ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <!-- GPU Backend Info -->
      <div v-if="gpuAvailable" class="bg-slate-700/30 rounded p-3">
        <div class="text-sm text-slate-400 mb-2">Backend Information</div>
        <div class="text-white">
          <div>Mode: <span class="font-mono text-cyan-400">{{ gpuBackend || 'Unknown' }}</span></div>
          <div v-if="kernelCount > 0">Kernels: <span class="font-mono text-cyan-400">{{ kernelCount }}</span></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-white font-medium">Enable GPU Acceleration</label>
          <button
            @click="toggleGPU"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="useGpuAcceleration ? 'bg-blue-600' : 'bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="useGpuAcceleration ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <div class="space-y-2">
          <!-- Static test button -->
          <button
            @click="() => console.log('Test button clicked!')"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
          >
            🧪 Test Button (Static)
          </button>
          
          <div class="flex gap-2">
            <button
              @click="initializeGPU"
              :disabled="isLoading"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
            >
              {{ isLoading ? 'Testing...' : 'Initialize GPU' }}
            </button>
            
                      <button
            @click="runBenchmark"
            :disabled="!gpuAvailable || isLoading"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
          >
            {{ isLoading ? 'Running...' : 'Full Benchmark' }}
          </button>
          
          <button
            @click="runMNISTBenchmark"
            :disabled="!gpuAvailable || isLoading"
            class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
          >
            {{ isLoading ? 'Testing...' : 'MNIST Test' }}
          </button>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="bg-slate-700/30 rounded p-3">
        <div class="text-sm text-slate-400 mb-2">Test Results</div>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            class="text-sm font-mono"
            :class="{
              'text-green-400': result.type === 'success',
              'text-red-400': result.type === 'error',
              'text-yellow-400': result.type === 'warning',
              'text-slate-300': result.type === 'info'
            }"
          >
            {{ result.message }}
          </div>
        </div>
        <button
          @click="clearResults"
          class="mt-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Clear Results
        </button>
      </div>

      <!-- Performance Metrics -->
      <div v-if="benchmarkResults" class="bg-slate-700/30 rounded p-3">
        <div class="text-sm text-slate-400 mb-2">Performance Metrics</div>
        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <div class="text-slate-400">GPU Time</div>
            <div class="text-cyan-400 font-mono">{{ benchmarkResults.gpuTime }}ms</div>
          </div>
          <div>
            <div class="text-slate-400">CPU Time</div>
            <div class="text-orange-400 font-mono">{{ benchmarkResults.cpuTime }}ms</div>
          </div>
          <div>
            <div class="text-slate-400">Speedup</div>
            <div class="text-green-400 font-mono font-bold">{{ benchmarkResults.speedup }}x</div>
          </div>
          <div>
            <div class="text-slate-400">Ops/sec</div>
            <div class="text-purple-400 font-mono">{{ benchmarkResults.opsPerSecond.toLocaleString() }}</div>
          </div>
        </div>
        <div class="text-xs text-slate-500 border-t border-slate-600 pt-2">
          Backend: {{ benchmarkResults.backend }} | 
          Test size: {{ benchmarkResults.testSize }} | 
          Iterations: {{ benchmarkResults.iterations }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import gpuAcceleration from '@/utils/gpuAcceleration'

const mnistStore = useMNISTClassifierStore()

// State
const isExpanded = ref(true)
const isLoading = ref(false)
const testResults = ref<Array<{ type: 'success' | 'error' | 'warning' | 'info', message: string }>>([])
const benchmarkResults = ref<{
  gpuTime: number
  cpuTime: number
  speedup: number
  opsPerSecond: number
  backend?: string
  testSize?: number
  iterations?: number
} | null>(null)

// Computed
const gpuAvailable = computed(() => {
  console.log('🔍 GPU Available computed:', mnistStore.gpuAvailable)
  return mnistStore.gpuAvailable
})
const useGpuAcceleration = computed(() => {
  console.log('🔍 GPU Enabled computed:', mnistStore.useGpuAcceleration)
  return mnistStore.useGpuAcceleration
})

const gpuBackend = computed(() => {
  try {
    return gpuAcceleration.gpu?.mode || 'Unknown'
  } catch {
    return 'Unknown'
  }
})

const kernelCount = computed(() => {
  try {
    const kernels = gpuAcceleration.getKernels()
    const simCount = Object.keys(kernels.similarity || {}).length
    const matrixCount = Object.keys(kernels.matrixOps || {}).length
    const activationCount = Object.keys(kernels.activations || {}).length
    return simCount + matrixCount + activationCount
  } catch {
    return 0
  }
})

// Methods
function addTestResult(type: 'success' | 'error' | 'warning' | 'info', message: string) {
  testResults.value.push({ type, message })
  // Keep only last 10 results
  if (testResults.value.length > 10) {
    testResults.value = testResults.value.slice(-10)
  }
}

function toggleGPU() {
  mnistStore.useGpuAcceleration = !mnistStore.useGpuAcceleration
  addTestResult('info', `GPU acceleration ${mnistStore.useGpuAcceleration ? 'enabled' : 'disabled'}`)
}

async function initializeGPU() {
  isLoading.value = true
  addTestResult('info', 'Initializing GPU acceleration...')
  
  try {
    // Force initialization
    gpuAcceleration.ensureInitialized()
    
    // Check availability
    const available = gpuAcceleration.checkAvailability()
    
    if (available) {
      addTestResult('success', `GPU initialized successfully (${gpuAcceleration.gpu?.mode})`)
      
      // Test kernels
      const kernels = gpuAcceleration.getKernels()
      if (kernels.similarity) {
        addTestResult('success', `Found ${Object.keys(kernels.similarity).length} similarity kernels`)
        
        // Test dot product kernel
        try {
          const testPoint = Array.from({ length: 784 }, () => Math.random())
          const testNeurons = Array.from({ length: 10 }, () => 
            Array.from({ length: 784 }, () => Math.random())
          )
          
          const kernel = kernels.similarity.dotProduct.setOutput([10])
          const result = kernel(testPoint, testNeurons, 10, 784)
          
          addTestResult('success', `Kernel test passed - result length: ${result.length}`)
        } catch (error: any) {
          addTestResult('error', `Kernel test failed: ${error?.message || 'Unknown error'}`)
        }
      } else {
        addTestResult('warning', 'No similarity kernels found')
      }
      
      // Update store state
      mnistStore.checkGpuSupport()
    } else {
      addTestResult('error', 'GPU acceleration not available on this device')
    }
  } catch (error: any) {
    addTestResult('error', `Initialization failed: ${error?.message || 'Unknown error'}`)
  } finally {
    isLoading.value = false
  }
}

async function runBenchmark() {
  if (!gpuAvailable.value) {
    addTestResult('error', 'GPU not available for benchmark')
    return
  }
  
  isLoading.value = true
  addTestResult('info', 'Running comprehensive benchmark...')
  
  try {
    const results = await gpuAcceleration.benchmarkPerformance()
    benchmarkResults.value = results
    
    addTestResult('success', `Best speedup: ${results.speedup}x (avg: ${results.avgSpeedup}x)`)
    addTestResult('info', `Optimal at ${results.testSize} elements`)
    
    // Provide guidance
    if (results.speedup > 1) {
      addTestResult('success', '🚀 GPU shows advantage at larger workloads!')
    } else {
      addTestResult('warning', '⚠️ GPU overhead dominates at small sizes')
    }
  } catch (error: any) {
    addTestResult('error', `Benchmark failed: ${error?.message || 'Unknown error'}`)
  } finally {
    isLoading.value = false
  }
}

async function runMNISTBenchmark() {
  if (!gpuAvailable.value) {
    addTestResult('error', 'GPU not available for MNIST test')
    return
  }
  
  isLoading.value = true
  addTestResult('info', 'Testing MNIST-specific workload...')
  
  try {
    // Test with actual MNIST batch sizes
    const batchSizes = [1, 16, 32, 64]
    let bestSpeedup = 0
    let bestBatchSize = 1
    
    for (const batchSize of batchSizes) {
      // Create test data similar to MNIST
      const testData = Array.from({ length: batchSize }, () => 
        Array.from({ length: 784 }, () => Math.random())
      )
      const neurons = Array.from({ length: 10 }, () => 
        Array.from({ length: 784 }, () => Math.random())
      )
      
      const kernels = gpuAcceleration.getKernels()
      const dotProductKernel = kernels.similarity.dotProduct.setOutput([10])
      
      // GPU test
      const gpuStart = performance.now()
      for (let i = 0; i < 100; i++) {
        for (const dataPoint of testData) {
          dotProductKernel(dataPoint, neurons, 10, 784)
        }
      }
      const gpuTime = performance.now() - gpuStart
      
      // CPU test
      const cpuStart = performance.now()
      for (let i = 0; i < 100; i++) {
        for (const dataPoint of testData) {
          const scores = neurons.map(neuron => 
            dataPoint.reduce((sum, val, idx) => sum + val * neuron[idx], 0)
          )
        }
      }
      const cpuTime = performance.now() - cpuStart
      
      const speedup = cpuTime / gpuTime
      if (speedup > bestSpeedup) {
        bestSpeedup = speedup
        bestBatchSize = batchSize
      }
      
      addTestResult('info', `Batch ${batchSize}: ${speedup.toFixed(2)}x speedup`)
    }
    
    addTestResult('success', `Best MNIST speedup: ${bestSpeedup.toFixed(2)}x at batch size ${bestBatchSize}`)
    
    if (bestSpeedup > 1) {
      addTestResult('success', '✅ GPU beneficial for MNIST training!')
    } else {
      addTestResult('warning', '⚠️ CPU faster for current workload sizes')
    }
    
  } catch (error: any) {
    addTestResult('error', `MNIST test failed: ${error?.message || 'Unknown error'}`)
  } finally {
    isLoading.value = false
  }
}

function clearResults() {
  testResults.value = []
  benchmarkResults.value = null
}

// Initialize on mount
onMounted(() => {
  console.log('🔍 GPU Diagnostics panel mounted')
  addTestResult('info', 'GPU Diagnostics panel loaded')
  
  // Immediately check GPU status
  try {
    const status = mnistStore.getGpuStatus()
    console.log('📊 Initial GPU status:', status)
    addTestResult('info', `Initial GPU status: Available=${status.available}, Backend=${status.backend}`)
  } catch (error) {
    console.error('❌ Error getting GPU status:', error)
    addTestResult('error', `Failed to get GPU status: ${error}`)
  }
})
</script> 