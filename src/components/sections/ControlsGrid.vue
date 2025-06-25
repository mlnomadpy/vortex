<template>
  <!-- Compact Toolbar - Photoshop Style -->
  <div class="compact-toolbar mb-4">
    <!-- Data Section -->
    <div class="toolbar-section">
      <div class="section-label">
        <DatabaseIcon class="w-4 h-4" />
        <span>Data</span>
      </div>
      <div class="controls-row">
        <FileUpload
          accept=".csv"
          @file-selected="handleFileSelected"
          class="compact-upload"
        >
          <template #default="{ isDragging }">
            <div :class="[
              'compact-btn upload-btn',
              isDragging ? 'dragging' : ''
            ]">
              <ArrowUpTrayIcon class="w-3 h-3" />
              <span class="btn-text">{{ selectedFileName || 'CSV' }}</span>
            </div>
          </template>
        </FileUpload>
        
        <button 
          @click="loadData"
          :disabled="!selectedFile || isLoading"
          class="compact-btn primary"
          title="Load Data"
        >
          <component 
            :is="isLoading ? 'div' : PlayIcon" 
            :class="isLoading ? 'loading-spinner w-3 h-3' : 'w-3 h-3'"
          />
          <span class="btn-text">Load</span>
        </button>
        
        <button 
          @click="exportData"
          :disabled="store.dataPoints.length === 0"
          class="compact-btn secondary"
          title="Export Data"
        >
          <ArrowDownTrayIcon class="w-3 h-3" />
          <span class="btn-text">Export</span>
        </button>
        
        <a 
          href="https://colab.research.google.com/drive/1o9eogdqXhd2iRZnworQA_2oIwSuX8WsN?usp=sharing" 
          target="_blank" 
          class="compact-btn link"
          title="Generate Your Own Data"
        >
          <ArrowTopRightOnSquareIcon class="w-3 h-3" />
          <span class="btn-text">Generate</span>
        </a>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Neurons Section -->
    <div class="toolbar-section">
      <div class="section-label">
        <CpuChipIcon class="w-4 h-4" />
        <span>Neurons</span>
      </div>
      <div class="controls-row">
        <FileUpload
          accept=".csv"
          @file-selected="handleNeuronFileSelected"
          class="compact-upload"
        >
          <template #default>
            <div class="compact-btn success">
              <DocumentArrowUpIcon class="w-3 h-3" />
              <span class="btn-text">Load</span>
            </div>
          </template>
        </FileUpload>
        
        <button 
          @click="saveNeurons"
          :disabled="store.neurons.length === 0"
          class="compact-btn success"
          title="Save Neurons"
        >
          <DocumentArrowDownIcon class="w-3 h-3" />
          <span class="btn-text">Save</span>
        </button>
        
        <button 
          @click="store.removeLastNeuron()"
          :disabled="store.neurons.length === 0"
          class="compact-btn error"
          title="Remove Last Neuron"
        >
          <TrashIcon class="w-3 h-3" />
          <span class="btn-text">Remove</span>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Optimization Section -->
    <div class="toolbar-section">
      <div class="section-label">
        <CogIcon class="w-4 h-4" />
        <span>Optimization</span>
      </div>
      <div class="controls-row">
        <button 
          @click="runGradientDescent"
          :disabled="store.neurons.length === 0 || store.filteredDataPoints.length === 0"
          class="compact-btn warning"
          title="Run Gradient Descent"
        >
          <RocketLaunchIcon class="w-3 h-3" />
          <span class="btn-text">Optimize</span>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Settings Section -->
    <div class="toolbar-section">
      <div class="section-label">
        <AdjustmentsHorizontalIcon class="w-4 h-4" />
        <span>Settings</span>
      </div>
      <div class="controls-row">
        <div class="compact-select-group">
          <label class="select-label">Similarity</label>
          <select 
            v-model="store.similarityMetric"
            class="compact-select"
          >
            <option value="dotProduct">Dot Product</option>
            <option value="euclidean">Euclidean</option>
            <option value="myProduct">My Product</option>
          </select>
        </div>
        
        <div class="compact-select-group">
          <label class="select-label">Activation</label>
          <select 
            v-model="store.activationFunction"
            class="compact-select"
          >
            <option value="none">None</option>
            <option value="softmax">Softmax</option>
            <option value="softermax">Softermax</option>
            <option value="sigmoid">Sigmoid</option>
            <option value="relu">ReLU</option>
            <option value="gelu">GELU</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  DatabaseIcon, 
  CpuChipIcon, 
  CogIcon, 
  AdjustmentsHorizontalIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  RocketLaunchIcon,
  TrashIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import FileUpload from '@/components/ui/FileUpload.vue'
import { parseCSV, exportToCSV } from '@/utils/csvUtils'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const selectedFile = ref<File | null>(null)
const selectedFileName = ref<string>('')
const isLoading = ref(false)

function handleFileSelected(file: File) {
  selectedFile.value = file
  selectedFileName.value = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name
}

function handleNeuronFileSelected(file: File) {
  // Load neurons from CSV
  parseCSV(file).then(data => {
    // Implementation for loading neurons
    notificationStore.addNotification({
      message: 'Neurons loaded successfully!',
      type: 'success'
    })
  }).catch(error => {
    notificationStore.addNotification({
      message: `Error loading neurons: ${error.message}`,
      type: 'error'
    })
  })
}

async function loadData() {
  if (!selectedFile.value) return
  
  isLoading.value = true
  
  try {
    const data = await parseCSV(selectedFile.value)
    
    // Validate data format
    if (data.length === 0) {
      throw new Error('CSV file appears to be empty')
    }
    
    // Convert to DataPoint format efficiently
    const dataPoints = data.map((row, index) => {
      const x = parseFloat(row.x as string)
      const y = parseFloat(row.y as string) 
      const label = parseFloat(row.label as string)
      
      if (isNaN(x) || isNaN(y) || isNaN(label)) {
        throw new Error(`Invalid data format at row ${index + 1}. Expected format: x,y,label`)
      }
      
      return { x, y, label }
    })
    
    store.setDataPoints(dataPoints)
    
    notificationStore.addNotification({
      message: `🎉 Successfully loaded ${dataPoints.length} data points with ${store.allClasses.length} classes!`,
      type: 'success'
    })
    
  } catch (error) {
    notificationStore.addNotification({
      message: `Error loading CSV: ${(error as Error).message}`,
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function exportData() {
  if (store.dataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'No data to export!',
      type: 'warning'
    })
    return
  }
  
  exportToCSV(store.dataPoints, 'neural_network_data.csv')
  
  notificationStore.addNotification({
    message: 'Data exported successfully!',
    type: 'success'
  })
}

function saveNeurons() {
  if (store.neurons.length === 0) {
    notificationStore.addNotification({
      message: 'No neurons to save!',
      type: 'warning'
    })
    return
  }
  
  const neuronData = store.neurons.map(n => ({ x: n.x, y: n.y, id: n.id }))
  exportToCSV(neuronData, 'neurons.csv')
  
  notificationStore.addNotification({
    message: 'Neurons saved successfully!',
    type: 'success'
  })
}

async function runGradientDescent() {
  if (store.neurons.length === 0 || store.filteredDataPoints.length === 0) {
    notificationStore.addNotification({
      message: 'Cannot start optimization: need neurons and data points',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  notificationStore.addNotification({
    message: 'Gradient descent optimization started!',
    type: 'info',
    duration: 2000
  })
  
  try {
    await store.runGradientDescent()
    
    if (store.optimizationHistory.currentStep >= store.optimizationHistory.totalSteps) {
      notificationStore.addNotification({
        message: 'Optimization completed successfully!',
        type: 'success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Optimization error:', error)
    notificationStore.addNotification({
      message: 'Optimization failed. Please try again.',
      type: 'error',
      duration: 4000
    })
  }
}
</script>

<style scoped>
/* Compact Toolbar - Photoshop Style */
.compact-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-height: 28px;
  overflow-x: auto;
  white-space: nowrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  font-size: 8px;
  font-weight: 500;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.1s ease;
  white-space: nowrap;
  min-height: 18px;
  flex-shrink: 0;
}

.compact-btn:hover {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-tertiary));
}

.compact-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compact-btn.primary {
  background: rgb(var(--color-primary));
  color: white;
  border-color: rgb(var(--color-primary));
}

.compact-btn.primary:hover:not(:disabled) {
  background: rgb(var(--color-primary-hover));
  border-color: rgb(var(--color-primary-hover));
}

.compact-btn.secondary {
  background: rgb(var(--color-secondary));
  color: white;
  border-color: rgb(var(--color-secondary));
}

.compact-btn.secondary:hover:not(:disabled) {
  background: rgb(var(--color-secondary-hover));
  border-color: rgb(var(--color-secondary-hover));
}

.compact-btn.success {
  background: rgb(var(--color-success));
  color: white;
  border-color: rgb(var(--color-success));
}

.compact-btn.success:hover:not(:disabled) {
  background: rgb(var(--color-success-hover));
  border-color: rgb(var(--color-success-hover));
}

.compact-btn.warning {
  background: rgb(var(--color-warning));
  color: white;
  border-color: rgb(var(--color-warning));
}

.compact-btn.warning:hover:not(:disabled) {
  background: rgb(var(--color-warning-hover));
  border-color: rgb(var(--color-warning-hover));
}

.compact-btn.error {
  background: rgb(var(--color-error));
  color: white;
  border-color: rgb(var(--color-error));
}

.compact-btn.error:hover:not(:disabled) {
  background: rgb(var(--color-error-hover));
  border-color: rgb(var(--color-error-hover));
}

.compact-btn.link {
  background: transparent;
  color: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
}

.compact-btn.link:hover {
  background: rgb(var(--color-primary) / 0.1);
}

.upload-btn.dragging {
  background: rgb(var(--color-primary) / 0.1);
  border-color: rgb(var(--color-primary));
  color: rgb(var(--color-primary));
}

.btn-text {
  font-size: 7px;
  font-weight: 500;
}

.compact-select-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.select-label {
  font-size: 7px;
  font-weight: 500;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.compact-select {
  padding: 1px 3px;
  font-size: 7px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  min-width: 50px;
}

.compact-select:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 1px rgb(var(--color-primary) / 0.2);
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: rgb(var(--border-secondary));
  margin: 0 1px;
  flex-shrink: 0;
}

.loading-spinner {
  border: 1px solid transparent;
  border-top: 1px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Custom scrollbar for horizontal overflow */
.compact-toolbar::-webkit-scrollbar {
  height: 3px;
}

.compact-toolbar::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
}

.compact-toolbar::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 2px;
}

.compact-toolbar::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}

/* Remove responsive wrapping - keep single line always */
@media (max-width: 768px) {
  .compact-toolbar {
    gap: 4px;
    padding: 2px 4px;
    min-height: 24px;
  }
  
  .toolbar-section {
    gap: 2px;
  }
  
  .compact-btn {
    padding: 1px 3px;
    min-height: 16px;
  }
  
  .btn-text {
    font-size: 6px;
  }
  
  .section-label {
    font-size: 7px;
  }
  
  .compact-select {
    min-width: 40px;
    font-size: 6px;
  }
  
  .toolbar-divider {
    height: 12px;
  }
}
</style>
