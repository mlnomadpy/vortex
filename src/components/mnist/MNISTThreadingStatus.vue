<template>
  <div class="worker-status-panel bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Multi-Threading Status</h3>
      <div class="flex items-center gap-2">
        <div 
          :class="[
            'w-3 h-3 rounded-full',
            status.initialized ? 'bg-green-500' : 'bg-red-500'
          ]"
        ></div>
        <span class="text-sm text-gray-600">
          {{ status.initialized ? 'Active' : 'Inactive' }}
        </span>
      </div>
    </div>

    <!-- Worker Pool Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-blue-50 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-700">GPU Workers</span>
          <span class="text-lg font-bold text-blue-800">{{ status.gpuWorkers }}</span>
        </div>
        <div class="text-xs text-blue-600">
          Handles GPU accelerated computations
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-purple-700">CPU Workers</span>
          <span class="text-lg font-bold text-purple-800">{{ status.cpuWorkers }}</span>
        </div>
        <div class="text-xs text-purple-600">
          Handles CPU fallback computations
        </div>
      </div>
    </div>

    <!-- Activity Status -->
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{{ status.totalWorkers }}</div>
        <div class="text-xs text-gray-600">Total Workers</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600">{{ status.busyWorkers }}</div>
        <div class="text-xs text-gray-600">Busy Workers</div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{{ status.queuedTasks }}</div>
        <div class="text-xs text-gray-600">Queued Tasks</div>
      </div>
    </div>

    <!-- Performance Monitoring -->
    <div v-if="performanceData.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Performance History</h4>
      <div class="h-20 bg-gray-50 rounded border overflow-hidden relative">
        <!-- Simple performance chart -->
        <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            :points="chartPoints"
            fill="none"
            stroke="#3B82F6"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
          Task Completion Time (ms)
        </div>
      </div>
    </div>

    <!-- Worker Utilization -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Worker Utilization</span>
        <span class="text-sm text-gray-600">{{ utilizationPercentage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-green-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${utilizationPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="flex gap-2 flex-wrap">
      <button
        @click="refreshStatus"
        class="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
      >
        🔄 Refresh
      </button>
      
      <button
        @click="runBenchmark"
        :disabled="isRunningBenchmark || !status.initialized"
        class="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isRunningBenchmark ? '⏳ Running...' : '🏃 Benchmark' }}
      </button>
      
      <button
        @click="resetWorkers"
        class="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
      >
        🔄 Reset Workers
      </button>
    </div>

    <!-- Benchmark Results -->
    <div v-if="benchmarkResult" class="mt-4 bg-gray-50 rounded-lg p-3">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Benchmark Results</h4>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-600">Speedup:</span>
          <span class="font-bold ml-2" :class="speedupColor">{{ benchmarkResult.speedup }}x</span>
        </div>
        <div>
          <span class="text-gray-600">Backend:</span>
          <span class="font-bold ml-2">{{ benchmarkResult.backend }}</span>
        </div>
        <div>
          <span class="text-gray-600">GPU Time:</span>
          <span class="font-bold ml-2">{{ benchmarkResult.gpuTime }}ms</span>
        </div>
        <div>
          <span class="text-gray-600">CPU Time:</span>
          <span class="font-bold ml-2">{{ benchmarkResult.cpuTime }}ms</span>
        </div>
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="showDebug" class="mt-4 bg-gray-100 rounded p-2">
      <pre class="text-xs text-gray-700 overflow-auto max-h-32">{{ JSON.stringify(status, null, 2) }}</pre>
    </div>
    
    <button 
      @click="showDebug = !showDebug"
      class="mt-2 text-xs text-gray-500 hover:text-gray-700"
    >
      {{ showDebug ? 'Hide' : 'Show' }} Debug Info
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import multiThreadManager from '@/utils/multiThreadManager'

// State
const status = ref({
  initialized: false,
  gpuWorkers: 0,
  cpuWorkers: 0,
  busyWorkers: 0,
  queuedTasks: 0,
  totalWorkers: 0
})

const performanceData = ref<number[]>([])
const isRunningBenchmark = ref(false)
const benchmarkResult = ref<any>(null)
const showDebug = ref(false)

// Computed properties
const utilizationPercentage = computed(() => {
  if (status.value.totalWorkers === 0) return 0
  return Math.round((status.value.busyWorkers / status.value.totalWorkers) * 100)
})

const speedupColor = computed(() => {
  if (!benchmarkResult.value) return 'text-gray-700'
  const speedup = benchmarkResult.value.speedup
  if (speedup > 2) return 'text-green-600'
  if (speedup > 1) return 'text-yellow-600'
  return 'text-red-600'
})

const chartPoints = computed(() => {
  if (performanceData.value.length < 2) return ''
  
  const maxValue = Math.max(...performanceData.value)
  const minValue = Math.min(...performanceData.value)
  const range = maxValue - minValue || 1
  
  return performanceData.value
    .map((value, index) => {
      const x = (index / (performanceData.value.length - 1)) * 100
      const y = 100 - ((value - minValue) / range) * 100
      return `${x},${y}`
    })
    .join(' ')
})

// Methods
async function refreshStatus() {
  try {
    status.value = multiThreadManager.getStatus()
  } catch (error) {
    console.error('Failed to get worker status:', error)
  }
}

async function runBenchmark() {
  if (isRunningBenchmark.value) return
  
  isRunningBenchmark.value = true
  benchmarkResult.value = null
  
  try {
    const start = performance.now()
    const result = await multiThreadManager.runBenchmark()
    const end = performance.now()
    
    benchmarkResult.value = result
    performanceData.value.push(end - start)
    
    // Keep only last 20 data points
    if (performanceData.value.length > 20) {
      performanceData.value = performanceData.value.slice(-20)
    }
    
    console.log('🏆 Benchmark completed:', result)
    
  } catch (error) {
    console.error('Benchmark failed:', error)
    benchmarkResult.value = {
      error: error instanceof Error ? error.message : 'Unknown error',
      speedup: 0,
      backend: 'error'
    }
  } finally {
    isRunningBenchmark.value = false
  }
}

async function resetWorkers() {
  try {
    multiThreadManager.cleanup()
    await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
    await multiThreadManager.initialize()
    await refreshStatus()
    console.log('🔄 Workers reset successfully')
  } catch (error) {
    console.error('Failed to reset workers:', error)
  }
}

// Auto-refresh status
let statusInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await refreshStatus()
  
  // Refresh status every 2 seconds
  statusInterval = setInterval(refreshStatus, 2000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.worker-status-panel {
  max-width: 500px;
}

/* Smooth animations for utilization bar */
.bg-green-500 {
  transition: width 0.3s ease-in-out;
}
</style> 