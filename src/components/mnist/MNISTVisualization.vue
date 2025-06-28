<template>
  <div class="mnist-visualization">
    <!-- Enhanced Header with better controls -->
    <div class="visualization-header">
      <div class="header-section">
        <div class="mode-selector">
          <button
            v-for="mode in visualizationModes"
            :key="mode.id"
            @click="currentMode = mode.id as 'weights' | 'activations' | 'similarity'"
            :class="['mode-btn', { active: currentMode === mode.id }]"
            :title="mode.description"
          >
            <component :is="mode.icon" class="mode-icon" />
            <span>{{ mode.label }}</span>
          </button>
        </div>

        <div class="sync-controls">
          <div class="sync-status" :class="{ 
            connected: store.apiConnected, 
            syncing: isSyncing,
            error: syncError 
          }">
            <div class="status-dot"></div>
            <span class="status-text">
              {{ store.apiConnected ? (isSyncing ? 'Syncing...' : 'API Connected') : 'Local Mode' }}
            </span>
            <span v-if="lastSyncTime" class="sync-time">
              Last sync: {{ formatTime(lastSyncTime) }}
            </span>
          </div>
          
          <button 
            @click="forceSync" 
            :disabled="!store.apiConnected || isSyncing"
            class="sync-btn"
            title="Force sync weights from API"
          >
            <div class="sync-icon" :class="{ spinning: isSyncing }">🔄</div>
            Sync
          </button>
          
          <button 
            @click="toggleAutoSync" 
            :class="['auto-sync-btn', { active: store.autoSyncWeights }]"
            title="Toggle automatic weight synchronization"
          >
            <div class="auto-icon">{{ store.autoSyncWeights ? '🔄' : '⏸️' }}</div>
            Auto
          </button>
        </div>
      </div>
      
      <div class="header-section">
        <div class="control-group">
          <label class="control-label">View:</label>
          <select v-model="selectedNeuronId" class="neuron-select">
            <option value="all">All Classes (Grid)</option>
            <option value="comparison">Side Comparison</option>
            <option v-for="neuron in store.neurons" :key="neuron.id" :value="neuron.id">
              Class {{ neuron.id }} - {{ getClassLabel(neuron.id) }}
            </option>
          </select>
        </div>
        
        <div class="control-group" v-if="currentMode === 'weights'">
          <label class="control-label">Colormap:</label>
          <select v-model="colormap" class="colormap-select" @change="updateVisualization">
            <option value="diverging">Diverging (Blue-Red)</option>
            <option value="viridis">Viridis</option>
            <option value="plasma">Plasma</option>
            <option value="grayscale">Grayscale</option>
            <option value="cool">Cool</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        <div class="control-group">
          <label class="control-label">Update Rate:</label>
          <select v-model="updateRate" @change="adjustUpdateRate" class="update-rate-select">
            <option value="realtime">Real-time</option>
            <option value="fast">Fast (1s)</option>
            <option value="normal">Normal (3s)</option>
            <option value="slow">Slow (10s)</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      <div class="training-indicator" :class="{ 
        active: store.isTraining,
        'high-activity': highTrainingActivity,
        'live-updating': isLiveUpdating
      }">
        <div class="indicator-dot" :class="{ pulsing: store.isTraining }"></div>
        <span class="indicator-text">
          {{ store.isTraining ? `Training (Epoch ${currentEpoch})` : 'Training Idle' }}
        </span>
        <div v-if="store.isTraining" class="training-stats">
          <span class="stat" :class="{ improving: lossImproving, degrading: lossDegrading }">
            Loss: {{ currentLoss.toFixed(4) }}
            <span class="trend-arrow">{{ lossTrendIcon }}</span>
          </span>
          <span class="stat" :class="{ improving: accuracyImproving }">
            Acc: {{ store.trainAccuracy.toFixed(1) }}%
            <span class="trend-arrow">{{ accuracyTrendIcon }}</span>
          </span>
                     <span class="stat">
             Speed: {{ trainingSpeed.toFixed(1) }} batch/s
           </span>
        </div>
        
        <!-- Live weight update indicator -->
        <div v-if="recentWeightUpdates > 0" class="weight-update-indicator">
          <div class="update-pulse"></div>
          <span class="update-count">{{ recentWeightUpdates }} updates</span>
        </div>
      </div>
    </div>

    <!-- Main visualization area with improved layout -->
    <div class="visualization-content">
      <!-- Weight matrices visualization -->
      <div v-if="currentMode === 'weights'" class="weights-section">
        <div v-if="selectedNeuronId === 'all'" class="all-neurons-grid">
          <div
            v-for="neuron in store.neurons"
            :key="neuron.id"
            class="neuron-weight-container"
            @click="openWeightModal(neuron)"
            :class="{ 
              selected: selectedNeuronId === neuron.id.toString(),
              'high-activity': recentWeightUpdates > 0 && isNeuronRecentlyUpdated(neuron.id)
            }"
          >
            <div class="neuron-header">
              <div class="neuron-title">
                <span class="neuron-label">{{ getClassLabel(neuron.id) }}</span>
                <span class="neuron-id">Class {{ neuron.id }}</span>
                <button 
                  @click.stop="openWeightModal(neuron)" 
                  class="expand-btn"
                  title="Click to expand weight visualization"
                >
                  🔍
                </button>
              </div>
              <div class="neuron-stats">
                <div class="stat-row">
                  <span class="stat-label">‖w‖:</span>
                  <span class="stat-value">{{ getNeuronWeightNorm(neuron).toFixed(3) }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">μ:</span>
                  <span class="stat-value">{{ getAverageWeight(neuron).toFixed(3) }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">σ:</span>
                  <span class="stat-value">{{ getWeightStandardDeviation(neuron).toFixed(3) }}</span>
                </div>
              </div>
            </div>
            <div class="canvas-container" @click.stop="openWeightModal(neuron)">
              <canvas
                :ref="el => { if (el) neuronCanvases[neuron.id] = el as HTMLCanvasElement }"
                class="weight-canvas enhanced"
                :width="enhancedImageSize"
                :height="enhancedImageSize"
              ></canvas>
              <div class="canvas-overlay" v-if="isUpdatingWeights">
                <div class="update-spinner"></div>
              </div>
              <div class="canvas-overlay-hover">
                <div class="hover-text">
                  <span class="hover-icon">🔍</span>
                  <span>Click to expand</span>
                </div>
              </div>
            </div>
            <div class="weight-range">
              <span class="range-min">{{ Math.min(...neuron.weights).toFixed(2) }}</span>
              <div class="range-bar">
                <div class="range-fill" :style="{ 
                  width: `${Math.abs(getAverageWeight(neuron)) * 100}%`,
                  backgroundColor: neuron.color 
                }"></div>
              </div>
              <span class="range-max">{{ Math.max(...neuron.weights).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div v-else-if="selectedNeuronId === 'comparison'" class="comparison-view">
          <div class="comparison-grid">
            <div 
              v-for="neuron in store.neurons" 
              :key="neuron.id"
              class="comparison-item"
            >
              <div class="comparison-header">
                <h4>{{ getClassLabel(neuron.id) }}</h4>
                <div class="comparison-stats">
                  <span>‖w‖: {{ getNeuronWeightNorm(neuron).toFixed(3) }}</span>
                </div>
              </div>
              <canvas
                :ref="el => { if (el) comparisonCanvases[neuron.id] = el as HTMLCanvasElement }"
                class="comparison-canvas"
                :width="imageSize * 2"
                :height="imageSize * 2"
              ></canvas>
            </div>
          </div>
        </div>
        
        <div v-else-if="selectedNeuron" class="single-neuron-view">
          <div class="neuron-detail-header">
            <div class="detail-title">
              <h3>{{ getClassLabel(selectedNeuron.id) }} (Class {{ selectedNeuron.id }})</h3>
              <div class="detail-actions">
                <button @click="resetNeuronWeights" class="reset-btn">Reset Weights</button>
                <button @click="randomizeNeuronWeights" class="randomize-btn">Randomize</button>
              </div>
            </div>
            <div class="neuron-detail-stats">
              <div class="stat-grid">
                <div class="stat-item">
                  <span class="stat-label">Weight Norm (‖w‖):</span>
                  <span class="stat-value">{{ getNeuronWeightNorm(selectedNeuron).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Bias (b):</span>
                  <span class="stat-value">{{ selectedNeuron.bias.toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Mean Weight (μ):</span>
                  <span class="stat-value">{{ getAverageWeight(selectedNeuron).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Std Dev (σ):</span>
                  <span class="stat-value">{{ getWeightStandardDeviation(selectedNeuron).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Min Weight:</span>
                  <span class="stat-value">{{ Math.min(...selectedNeuron.weights).toFixed(4) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Max Weight:</span>
                  <span class="stat-value">{{ Math.max(...selectedNeuron.weights).toFixed(4) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-visualization">
            <div class="detail-canvas-container">
              <canvas
                ref="detailCanvas"
                class="weight-canvas-large"
                :width="imageSize * 6"
                :height="imageSize * 6"
              ></canvas>
              <div class="canvas-info">
                <div class="colormap-legend">
                  <span class="legend-label">{{ Math.min(...selectedNeuron.weights).toFixed(3) }}</span>
                  <div class="legend-gradient" :class="`${colormap}-gradient`"></div>
                  <span class="legend-label">{{ Math.max(...selectedNeuron.weights).toFixed(3) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Enhanced weight histogram -->
            <div class="weight-histogram">
              <h4>Weight Distribution</h4>
              <canvas
                ref="histogramCanvas"
                class="histogram-canvas"
                width="400"
                height="200"
              ></canvas>
              <div class="histogram-stats">
                <div class="hist-stat">
                  <span class="hist-label">Skewness:</span>
                  <span class="hist-value">{{ calculateSkewness(selectedNeuron.weights).toFixed(3) }}</span>
                </div>
                <div class="hist-stat">
                  <span class="hist-label">Kurtosis:</span>
                  <span class="hist-value">{{ calculateKurtosis(selectedNeuron.weights).toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced activations visualization -->
      <div v-else-if="currentMode === 'activations'" class="activations-view">
        <div class="activations-header">
          <h3>Real-time Neural Activations</h3>
          <div class="activation-controls">
            <button @click="generateRandomSample" class="sample-btn">
              🎲 Random Sample
            </button>
            <button @click="loadTestSample" class="sample-btn">
              📊 Test Sample
            </button>
            <button @click="clearSample" class="sample-btn">
              🗑️ Clear
            </button>
          </div>
        </div>
        
        <div class="activations-content">
          <div class="sample-input-section">
            <div class="sample-container">
              <h4>Input Sample</h4>
              <canvas
                ref="sampleCanvas"
                class="sample-canvas"
                :width="imageSize * 4"
                :height="imageSize * 4"
                @click="generateRandomSample"
              ></canvas>
              <p class="sample-hint">Click to generate a new random sample</p>
              
              <div class="sample-info" v-if="currentSampleInfo">
                <div class="info-item">
                  <span class="info-label">Predicted:</span>
                  <span class="info-value prediction">{{ currentSampleInfo.predicted_class }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Confidence:</span>
                  <span class="info-value confidence">{{ (currentSampleInfo.confidence * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="activations-display">
            <div class="activations-grid">
              <div
                v-for="(neuron, index) in store.neurons"
                :key="neuron.id"
                class="activation-item"
              >
                <div class="activation-header">
                  <span class="activation-label">{{ getClassLabel(neuron.id) }}</span>
                  <span class="activation-value">{{ getActivationLevel(neuron, index).toFixed(3) }}</span>
                </div>
                <div class="activation-bar-wrapper">
                  <div
                    class="activation-bar"
                    :style="{
                      width: `${Math.max(2, getActivationLevel(neuron, index) * 100)}%`,
                      backgroundColor: getActivationColor(getActivationLevel(neuron, index))
                    }"
                  ></div>
                </div>
                <div class="activation-details" v-if="currentSampleInfo">
                  <span class="similarity-score">
                    Sim: {{ currentSampleInfo.similarity_breakdown?.[index]?.similarity_score?.toFixed(3) || '0.000' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced similarity metrics comparison -->
      <div v-else-if="currentMode === 'similarity'" class="similarity-view">
        <div class="similarity-header">
          <h3>Similarity Metrics Comparison</h3>
          <div class="similarity-controls">
            <label class="control-label">Test Input:</label>
            <select v-model="selectedTestInput" @change="updateSimilarityComparison">
              <option value="random">Random Pattern</option>
              <option value="zeros">All Zeros</option>
              <option value="ones">All Ones</option>
              <option value="test_sample">Test Sample</option>
            </select>
          </div>
        </div>
        
        <div class="similarity-content">
          <div class="test-input-display">
            <canvas
              ref="similarityInputCanvas"
              class="similarity-input-canvas"
              :width="imageSize * 3"
              :height="imageSize * 3"
            ></canvas>
          </div>
          
          <div class="metrics-comparison">
            <div
              v-for="metric in availableMetrics"
              :key="metric.id"
              class="metric-section"
              :class="{ active: store.similarityMetric === metric.id }"
            >
              <div class="metric-header">
                <h5>{{ metric.label }}</h5>
                <button 
                  @click="setActiveMetric(metric.id)"
                  :class="['metric-select-btn', { active: store.similarityMetric === metric.id }]"
                >
                  {{ store.similarityMetric === metric.id ? 'Active' : 'Select' }}
                </button>
              </div>
              <div class="metric-bars">
                <div
                  v-for="neuron in store.neurons"
                  :key="neuron.id"
                  class="metric-bar-container"
                >
                  <span class="metric-neuron-label">{{ getClassLabel(neuron.id) }}</span>
                  <div class="metric-bar">
                    <div
                      class="metric-bar-fill"
                      :style="{
                        width: `${Math.max(2, getSimilarityScore(neuron, metric.id) * 100)}%`,
                        backgroundColor: getSimilarityColor(getSimilarityScore(neuron, metric.id))
                      }"
                    ></div>
                  </div>
                  <span class="metric-value">{{ getSimilarityScore(neuron, metric.id).toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enhanced info panel -->
    <div class="info-panel">
      <div class="info-section">
        <h4>Dataset Info</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Dataset:</span>
            <span class="info-value">{{ store.selectedDataset || 'Local' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Train Size:</span>
            <span class="info-value">{{ store.datasetInfo.trainSize.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Test Size:</span>
            <span class="info-value">{{ store.datasetInfo.testSize.toLocaleString() }}</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>Model Config</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Similarity:</span>
            <span class="info-value">{{ store.similarityMetric }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Activation:</span>
            <span class="info-value">{{ store.activationFunction }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Classes:</span>
            <span class="info-value">{{ store.activeClasses.length }}/10</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h4>Performance</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Train Acc:</span>
            <span class="info-value performance">{{ store.trainAccuracy.toFixed(1) }}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Test Acc:</span>
            <span class="info-value performance">{{ store.testAccuracy.toFixed(1) }}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Loss:</span>
            <span class="info-value performance">{{ currentLoss.toFixed(4) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Weight Visualization Modal -->
  <WeightVisualizationModal
    v-if="modalNeuron"
    :neuron="modalNeuron"
    :is-visible="showWeightModal"
    :colormap="colormap"
    @close="closeWeightModal"
    @update-neuron="updateNeuronFromModal"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMNISTClassifierStore, visualizationEvents } from '@/stores/mnistClassifier'
import { weightsToImage, calculateNDSimilarityScore } from '@/utils/ndMathCore'
import type { NDNeuron, NDSimilarityMetric } from '@/types'
import {
  EyeIcon,
  ChartBarSquareIcon,
  ChartBarIcon,
} from '@/components/ui/icons'
import WeightVisualizationModal from './WeightVisualizationModal.vue'

// Helper function to get CSS variable values for canvas operations
function getCSSVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

function getCSSVarAsColor(varName: string): string {
  const value = getCSSVar(varName)
  // Convert RGB values to hex format for canvas
  if (value.includes(' ')) {
    const [r, g, b] = value.split(' ').map(v => parseInt(v))
    return `rgb(${r}, ${g}, ${b})`
  }
  return value
}

const store = useMNISTClassifierStore()

// Reactive state
const currentMode = ref<'weights' | 'activations' | 'similarity'>('weights')
const selectedNeuronId = ref<string | number>('all')
const colormap = ref('diverging')
const imageSize = 28 // MNIST image size
const enhancedImageSize = 224 // Much larger size for better visibility (28 * 8)
const updateRate = ref('normal')

// Modal state
const showWeightModal = ref(false)
const modalNeuron = ref<NDNeuron | null>(null)

// Sync state
const isSyncing = ref(false)
const syncError = ref(false)
const lastSyncTime = ref<number | null>(null)

// Training state
const currentEpoch = ref(0)
const highTrainingActivity = ref(false)
const currentLoss = computed(() => store.currentLoss)
const isLiveUpdating = ref(false)
const recentWeightUpdates = ref(0)
const trainingSpeed = ref(0)

// Loss and accuracy tracking for trends
const previousLoss = ref(0)
const previousAccuracy = ref(0)

// Computed trend indicators
const lossImproving = computed(() => currentLoss.value < previousLoss.value)
const lossDegrading = computed(() => currentLoss.value > previousLoss.value)
const accuracyImproving = computed(() => store.trainAccuracy > previousAccuracy.value)

const lossTrendIcon = computed(() => {
  if (lossImproving.value) return '↘️'
  if (lossDegrading.value) return '↗️'
  return '→'
})

const accuracyTrendIcon = computed(() => {
  if (accuracyImproving.value) return '↗️'
  if (store.trainAccuracy < previousAccuracy.value) return '↘️'
  return '→'
})

// Canvas references
const neuronCanvases = ref<Record<number, HTMLCanvasElement>>({})
const comparisonCanvases = ref<Record<number, HTMLCanvasElement>>({})
const detailCanvas = ref<HTMLCanvasElement | null>(null)
const histogramCanvas = ref<HTMLCanvasElement | null>(null)
const sampleCanvas = ref<HTMLCanvasElement | null>(null)
const similarityInputCanvas = ref<HTMLCanvasElement | null>(null)

// Test sample for activations
const testSample = ref<number[]>(new Array(784).fill(0))
const currentSampleInfo = ref<any>(null)
const selectedTestInput = ref('random')
const isUpdatingWeights = ref(false)

// Configuration
const visualizationModes = [
  { id: 'weights', label: 'Weights', icon: EyeIcon, description: 'View weight matrices as images' },
  { id: 'activations', label: 'Activations', icon: ChartBarIcon, description: 'Real-time neural activations' },
  { id: 'similarity', label: 'Similarity', icon: ChartBarSquareIcon, description: 'Compare similarity metrics' }
]

const availableMetrics: Array<{ id: NDSimilarityMetric, label: string }> = [
  { id: 'dotProduct', label: 'Dot Product' },
  { id: 'euclidean', label: 'Euclidean' },
  { id: 'yatProduct', label: 'YAT Product' },
  { id: 'cosine', label: 'Cosine' },
  { id: 'manhattan', label: 'Manhattan' },
  { id: 'rbf', label: 'RBF' }
]

// MNIST class labels
const classLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

// Computed properties
const selectedNeuron = computed(() => {
  if (selectedNeuronId.value === 'all' || selectedNeuronId.value === 'comparison') return null
  return store.neurons.find(n => n.id === parseInt(selectedNeuronId.value as string)) || null
})

// Methods
function getClassLabel(classId: number): string {
  return classLabels[classId] || `Class ${classId}`
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 1000) return 'now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

async function forceSync(): Promise<void> {
  if (!store.apiConnected || isSyncing.value) return
  
  isSyncing.value = true
  syncError.value = false
  
  try {
    await store.forceWeightSync()
    lastSyncTime.value = Date.now()
    await updateVisualization()
  } catch (error) {
    console.error('Force sync failed:', error)
    syncError.value = true
  } finally {
    isSyncing.value = false
  }
}

function toggleAutoSync(): void {
  store.autoSyncWeights = !store.autoSyncWeights
  if (store.autoSyncWeights) {
    store.startWeightSync()
  } else {
    store.stopWeightSync()
  }
}

function adjustUpdateRate(): void {
  // Implementation for update rate adjustment
  console.log('Update rate changed to:', updateRate.value)
}


function openWeightModal(neuron: NDNeuron) {
  modalNeuron.value = neuron
  showWeightModal.value = true
}

function closeWeightModal() {
  showWeightModal.value = false
  modalNeuron.value = null
}

function updateNeuronFromModal(updatedNeuron: NDNeuron) {
  // Update the neuron in the store
  const neuronIndex = store.neurons.findIndex(n => n.id === updatedNeuron.id)
  if (neuronIndex !== -1) {
    store.neurons[neuronIndex] = updatedNeuron
    // Trigger visualization update
    updateVisualization()
  }
}

function isNeuronRecentlyUpdated(neuronId: number): boolean {
    console.log(neuronId)
  // Check if this neuron was recently updated (within last 2 seconds)
  return Date.now() - (lastSyncTime.value || 0) < 2000
}

function getNeuronWeightNorm(neuron: NDNeuron): number {
  return Math.sqrt(neuron.weights.reduce((sum, w) => sum + w * w, 0))
}

function getAverageWeight(neuron: NDNeuron): number {
  return neuron.weights.reduce((sum, w) => sum + w, 0) / neuron.weights.length
}

function getWeightStandardDeviation(neuron: NDNeuron): number {
  const mean = getAverageWeight(neuron)
  const variance = neuron.weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / neuron.weights.length
  return Math.sqrt(variance)
}

function calculateSkewness(weights: number[]): number {
  const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length
  const std = Math.sqrt(weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length)
  const skewness = weights.reduce((sum, w) => sum + Math.pow((w - mean) / std, 3), 0) / weights.length
  return skewness
}

function calculateKurtosis(weights: number[]): number {
  const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length
  const std = Math.sqrt(weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length)
  const kurtosis = weights.reduce((sum, w) => sum + Math.pow((w - mean) / std, 4), 0) / weights.length - 3
  return kurtosis
}

function getActivationLevel(neuron: NDNeuron, index: number): number {
  if (currentSampleInfo.value?.similarity_breakdown?.[index]) {
    return Math.max(0, Math.min(1, currentSampleInfo.value.similarity_breakdown[index].activation_value || 0))
  }
  
  if (testSample.value.length === 0) return 0
  try {
    const score = calculateNDSimilarityScore(neuron, testSample.value, store.similarityMetric)
    return Math.max(0, Math.min(1, (score + 5) / 10)) // Normalize for display
  } catch {
    return 0
  }
}

function getActivationColor(level: number): string {
  // Create a color gradient from blue to red based on activation level
  const hue = (1 - level) * 240 // Blue (240) to Red (0)
  return `hsl(${hue}, 70%, 50%)`
}

function getSimilarityScore(neuron: NDNeuron, metric: NDSimilarityMetric): number {
  if (testSample.value.length === 0) return 0
  try {
    const score = calculateNDSimilarityScore(neuron, testSample.value, metric)
    return Math.max(0, Math.min(1, (score + 5) / 10)) // Normalize for display
  } catch {
    return 0
  }
}

function getSimilarityColor(score: number): string {
  // Create a color gradient from purple to yellow based on similarity score
  const hue = score * 60 + 240 // Purple (300) to Yellow (60)
  return `hsl(${hue}, 70%, 50%)`
}

async function generateRandomSample() {
  // Generate a simple random pattern
  testSample.value = new Array(784).fill(0).map(() => Math.random())
  await renderSampleCanvas()
  await updateActivations()
}

async function loadTestSample() {
  // Load a real test sample from the dataset
  try {
    const batch = await store.getTrainingBatch(1)
    if (batch.length > 0) {
      testSample.value = batch[0].features
      await renderSampleCanvas()
      await updateActivations()
    }
  } catch (error) {
    console.warn('Failed to load test sample:', error)
    generateRandomSample()
  }
}

function clearSample() {
  testSample.value = new Array(784).fill(0)
  currentSampleInfo.value = null
  renderSampleCanvas()
}

async function updateActivations() {
  if (store.apiConnected && testSample.value.length > 0) {
    try {
      currentSampleInfo.value = await store.getActivationsForVisualization(testSample.value)
    } catch (error) {
      console.warn('Failed to get API activations:', error)
      currentSampleInfo.value = null
    }
  }
}

function setActiveMetric(metric: NDSimilarityMetric) {
  store.similarityMetric = metric
  updateSimilarityComparison()
}

async function updateSimilarityComparison() {
  // Generate test input based on selection
  switch (selectedTestInput.value) {
    case 'zeros':
      testSample.value = new Array(784).fill(0)
      break
    case 'ones':
      testSample.value = new Array(784).fill(1)
      break
    case 'test_sample':
      await loadTestSample()
      return
    case 'random':
    default:
      await generateRandomSample()
      return
  }
  
  await renderSimilarityInputCanvas()
}

async function resetNeuronWeights() {
  if (!selectedNeuron.value) return
  
  // Reset weights to random values
  selectedNeuron.value.weights = Array.from({ length: 784 }, () => (Math.random() - 0.5) * 0.1)
  selectedNeuron.value.bias = 0
  
  await store.syncWeightsToApi()
  await updateVisualization()
}

async function randomizeNeuronWeights() {
  if (!selectedNeuron.value) return
  
  // Randomize weights with larger range
  selectedNeuron.value.weights = Array.from({ length: 784 }, () => (Math.random() - 0.5) * 0.5)
  selectedNeuron.value.bias = (Math.random() - 0.5) * 0.1
  
  await store.syncWeightsToApi()
  await updateVisualization()
}

function renderWeightCanvas(canvas: HTMLCanvasElement, weights: number[]) {
  const ctx = canvas.getContext('2d')
  
  if (!ctx || weights.length !== 784) {
    console.warn('❌ renderWeightCanvas: Invalid context or weights length:', { 
      hasContext: !!ctx, 
      weightsLength: weights.length,
      expected: 784 
    })
    return
  }

  try {
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const range = maxWeight - minWeight || 0.001
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const imageMatrix = weightsToImage(weights, 28, 28)
    const imageData = ctx.createImageData(28, 28)
    
    // Enhanced visualization with better contrast and colors
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const value = imageMatrix[y][x]
        
        // Smart normalization
        let normalized = (value - minWeight) / range
        normalized = Math.max(0, Math.min(1, normalized))
        
        // Apply selected colormap
        const color = applyColormap(normalized, colormap.value)
        
        const index = (y * 28 + x) * 4
        imageData.data[index] = color.r
        imageData.data[index + 1] = color.g
        imageData.data[index + 2] = color.b
        imageData.data[index + 3] = 255
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
  } catch (error) {
    console.error('Error rendering weight canvas:', error)
  }
}

function applyColormap(value: number, colormap: string): { r: number, g: number, b: number } {
  // Ensure value is between 0 and 1
  value = Math.max(0, Math.min(1, value))
  
  switch (colormap) {
    case 'diverging':
      // Blue to white to red
      if (value < 0.5) {
        const t = value * 2
        return {
          r: Math.round(t * 255),
          g: Math.round(t * 255),
          b: 255
        }
      } else {
        const t = (value - 0.5) * 2
        return {
          r: 255,
          g: Math.round((1 - t) * 255),
          b: Math.round((1 - t) * 255)
        }
      }
    case 'viridis':
      // Viridis colormap approximation
      return {
        r: Math.round(value * 68 + (1 - value) * 68),
        g: Math.round(value * 1 + (1 - value) * 1),
        b: Math.round(value * 84 + (1 - value) * 84)
      }
    case 'grayscale':
      const gray = Math.round(value * 255)
      return { r: gray, g: gray, b: gray }
    default:
      // Default to grayscale
      const defaultGray = Math.round(value * 255)
      return { r: defaultGray, g: defaultGray, b: defaultGray }
  }
}

async function renderSampleCanvas() {
  const canvas = sampleCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const imageData = ctx.createImageData(28, 28)
  
  for (let i = 0; i < 784; i++) {
    const value = Math.round(testSample.value[i] * 255)
    const pixelIndex = i * 4
    imageData.data[pixelIndex] = value     // R
    imageData.data[pixelIndex + 1] = value // G
    imageData.data[pixelIndex + 2] = value // B
    imageData.data[pixelIndex + 3] = 255   // A
  }
  
  // Scale up the 28x28 image to canvas size
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = 28
  tempCanvas.height = 28
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.putImageData(imageData, 0, 0)
  
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height)
}

async function renderSimilarityInputCanvas() {
  const canvas = similarityInputCanvas.value
  if (!canvas) return
  
  await renderSampleCanvas() // Reuse the same logic
}

async function updateVisualization() {
  isUpdatingWeights.value = true
  
  try {
    // Update all weight visualizations
    for (const neuron of store.neurons) {
      const canvas = neuronCanvases.value[neuron.id]
      if (canvas) {
        renderWeightCanvas(canvas, neuron.weights)
      }
      
      const comparisonCanvas = comparisonCanvases.value[neuron.id]
      if (comparisonCanvas) {
        renderWeightCanvas(comparisonCanvas, neuron.weights)
      }
    }
    
    // Update detail view if a neuron is selected
    if (selectedNeuron.value && detailCanvas.value) {
      renderWeightCanvas(detailCanvas.value, selectedNeuron.value.weights)
      renderHistogram()
    }
    
  } finally {
    isUpdatingWeights.value = false
  }
}

function renderHistogram() {
  if (!selectedNeuron.value || !histogramCanvas.value) return
  
  const canvas = histogramCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const weights = selectedNeuron.value.weights
  const bins = 20
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const binWidth = (maxWeight - minWeight) / bins
  
  // Calculate histogram
  const histogram = new Array(bins).fill(0)
  for (const weight of weights) {
    const binIndex = Math.min(bins - 1, Math.floor((weight - minWeight) / binWidth))
    histogram[binIndex]++
  }
  
  const maxCount = Math.max(...histogram)
  
  // Clear and draw histogram
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = getCSSVarAsColor('--color-primary')
  
  const barWidth = canvas.width / bins
  for (let i = 0; i < bins; i++) {
    const barHeight = (histogram[i] / maxCount) * canvas.height
    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
  }
}

// Watch for changes and update visualization
watch(() => store.visualizationUpdateTrigger, updateVisualization)
watch(() => store.neurons, updateVisualization, { deep: true })
watch(() => currentMode.value, updateVisualization)
watch(() => colormap.value, updateVisualization)

// Live update watchers
watch(() => store.isTraining, (isTraining) => {
  isLiveUpdating.value = isTraining
  if (isTraining) {
    currentEpoch.value = store.optimizationHistory.currentStep
  }
})

watch(() => store.optimizationHistory.currentStep, (newStep) => {
  currentEpoch.value = newStep
  if (store.isTraining && newStep > 0) {
    // Calculate training speed based on optimization history
    const steps = store.optimizationHistory.steps
    if (steps.length >= 2) {
      const recent = steps.slice(-5) // Last 5 steps
      if (recent.length >= 2) {
        const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
        const stepSpan = recent.length - 1
        if (timeSpan > 0) {
          trainingSpeed.value = (stepSpan / (timeSpan / 1000)) || 0
        }
      }
    }
  }
})

watch(() => store.currentLoss, (newLoss, oldLoss) => {
  if (oldLoss !== undefined) {
    previousLoss.value = oldLoss
  }
  console.log(newLoss)

})

watch(() => store.trainAccuracy, (newAccuracy, oldAccuracy) => {
  if (oldAccuracy !== undefined) {
    previousAccuracy.value = oldAccuracy
  }
  console.log(newAccuracy)
})

watch(() => store.neurons, (newNeurons, oldNeurons) => {
  if (store.isTraining && oldNeurons) {
    // Count weight updates
    let updates = 0
    newNeurons.forEach((neuron, index) => {
      if (oldNeurons[index] && 
          JSON.stringify(neuron.weights) !== JSON.stringify(oldNeurons[index].weights)) {
        updates++
      }
    })
    
    if (updates > 0) {
      recentWeightUpdates.value = updates
      highTrainingActivity.value = true
      
      // Reset indicators after a short time
      setTimeout(() => {
        recentWeightUpdates.value = 0
        highTrainingActivity.value = false
      }, 2000)
    }
  }
}, { deep: true })

// Listen for visualization events
onMounted(() => {
  visualizationEvents.on(updateVisualization)
  updateVisualization()
  
  // Generate initial sample
  generateRandomSample()
})

onUnmounted(() => {
  visualizationEvents.off(updateVisualization)
})
</script>

<style scoped>
.mnist-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgb(var(--bg-secondary));
  color: rgb(var(--text-primary));
}

.visualization-header {
  padding: 12px;
  border-bottom: 1px solid rgb(var(--border-primary));
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-section {
  display: flex;
  gap: 16px;
  align-items: center;
}

.mode-selector {
  display: flex;
  gap: 4px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-secondary));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.mode-btn:hover {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--border-secondary));
}

.mode-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.mode-icon {
  width: 14px;
  height: 14px;
}

.sync-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-secondary));
  font-size: 11px;
}

.sync-status.connected {
  background: rgb(var(--color-success));
  border-color: rgb(var(--color-success));
}

.sync-status.syncing {
  background: rgb(var(--color-warning));
  border-color: rgb(var(--color-warning));
}

.sync-status.error {
  background: rgb(var(--color-error));
  border-color: rgb(var(--color-error));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--text-tertiary));
}

.status-text {
  font-size: 10px;
  color: rgb(var(--text-secondary));
}

.sync-time {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
}

.sync-btn {
  padding: 4px 8px;
  background: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sync-btn:hover {
  background: rgb(var(--color-primary-hover));
}

.auto-sync-btn {
  padding: 4px 8px;
  background: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auto-sync-btn:hover {
  background: rgb(var(--color-primary-hover));
}

.auto-icon {
  width: 14px;
  height: 14px;
}

.auto-sync-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 11px;
  color: rgb(var(--text-tertiary));
  white-space: nowrap;
}

.neuron-select,
.colormap-select {
  padding: 4px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  min-width: 100px;
}

.training-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-secondary));
  font-size: 11px;
}

.training-indicator.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
}

.training-indicator.active .indicator-dot {
  background: rgb(var(--color-success));
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--text-tertiary));
}

.indicator-text {
  font-size: 10px;
  color: rgb(var(--text-secondary));
}

.training-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.stat {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
}

.visualization-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* Weights visualization */
.all-neurons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.neuron-weight-container {
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 280px;
}

.neuron-weight-container:hover {
  border-color: rgb(var(--color-primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-primary), 0.15);
}

.neuron-weight-container.selected {
  border-color: rgb(var(--color-primary));
  background: rgb(var(--bg-quaternary));
}

.neuron-weight-container.high-activity {
  border-color: rgb(var(--color-success));
  box-shadow: 0 0 10px rgba(var(--color-success), 0.3);
  animation: activity-pulse 1.5s ease-in-out infinite;
}

@keyframes activity-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(var(--color-success), 0.3); }
  50% { box-shadow: 0 0 20px rgba(var(--color-success), 0.5); }
}

.neuron-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.neuron-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.neuron-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.neuron-id {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
}

.expand-btn {
  padding: 4px 6px;
  background: rgb(var(--bg-quaternary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-secondary));
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.expand-btn:hover {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: white;
  transform: scale(1.05);
}

.neuron-stats {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: flex-end;
}

.stat-row {
  font-family: 'Courier New', monospace;
  background: var(--interactive-bg);
  padding: 1px 3px;
  border-radius: 2px;
}

.canvas-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%; /* Creates a perfect square aspect ratio */
  margin: 12px auto;
  border: 2px solid rgb(var(--border-primary));
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
}

.canvas-container:hover {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 4px 16px rgba(var(--color-primary), 0.2);
  transform: scale(1.02);
}

.weight-canvas.enhanced {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  object-fit: contain;
  display: block;
}

.canvas-overlay-hover {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 6px;
  z-index: 2;
}

.canvas-container:hover .canvas-overlay-hover {
  opacity: 1;
}

.hover-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 11px;
  font-weight: 500;
}

.hover-icon {
  font-size: 16px;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.update-spinner {
  width: 20px;
  height: 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid rgb(var(--color-primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.weight-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.range-min,
.range-max {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
}

.range-bar {
  flex: 1;
  height: 12px;
  background: rgb(var(--bg-tertiary));
  border-radius: 6px;
  overflow: hidden;
}

.range-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

/* Activations visualization */
.activations-view {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 24px;
}

.activations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activation-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sample-btn {
  padding: 4px 8px;
  background: rgb(var(--color-primary));
  border: 1px solid rgb(var(--color-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sample-btn:hover {
  background: rgb(var(--color-primary-hover));
}

.sample-input-section {
  text-align: center;
}

.sample-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sample-canvas {
  width: 140px;
  height: 140px;
  border: 2px solid rgb(var(--border-primary));
  border-radius: 6px;
  cursor: pointer;
  image-rendering: pixelated;
  transition: border-color 0.2s ease;
}

.sample-canvas:hover {
  border-color: rgb(var(--color-primary));
}

.sample-hint {
  margin: 8px 0 0 0;
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

.activations-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activations-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activation-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activation-label {
  width: 80px;
  font-size: 11px;
  color: rgb(var(--text-primary));
  text-align: right;
}

.activation-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activation-bar {
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 8px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.activation-value {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
  min-width: 40px;
}

.activation-details {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.similarity-score {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
}

/* Similarity visualization */
.similarity-view {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 24px;
}

.similarity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.similarity-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.similarity-input-canvas {
  width: 100%;
  height: auto;
  max-width: 250px;
  image-rendering: pixelated;
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-light);
  cursor: pointer;
}

.metrics-comparison {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-select-btn {
  padding: 4px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.metric-select-btn:hover {
  background: rgb(var(--bg-quaternary));
}

.metric-select-btn.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.metric-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-neuron-label {
  width: 20px;
  font-size: 10px;
  color: rgb(var(--text-primary));
  text-align: center;
}

.metric-bar {
  flex: 1;
  height: 12px;
  background: rgb(var(--bg-tertiary));
  border-radius: 6px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.metric-value {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  min-width: 35px;
}

/* Info panel */
.info-panel {
  padding: 12px;
  border-top: 1px solid rgb(var(--border-primary));
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--interactive-bg);
}

.info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.info-label {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}

.info-value {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.performance {
  font-size: 10px;
  color: rgb(var(--text-tertiary));
}

/* Responsive */
@media (max-width: 768px) {
  .visualization-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .activations-view {
    grid-template-columns: 1fr;
  }
  
  .similarity-view {
    grid-template-columns: 1fr;
  }
}
</style> 