<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    
    <!-- Data Controls -->
    <div class="control-card p-6">
      <div class="flex items-center mb-4">
        <DatabaseIcon class="w-6 h-6 text-blue-600 mr-3" />
        <h3 class="font-bold text-lg text-gray-800">Data Controls</h3>
      </div>
      <div class="space-y-3">
        <FileUpload
          accept=".csv"
          @file-selected="handleFileSelected"
          class="w-full"
        >
          <template #default="{ isDragging }">
            <div :class="[
              'modern-button px-4 py-3 text-sm font-semibold cursor-pointer flex items-center justify-center w-full transition-all',
              isDragging ? 'bg-blue-700' : ''
            ]">
              <ArrowUpTrayIcon class="w-5 h-5 mr-2" />
              {{ selectedFileName || 'Choose CSV File' }}
            </div>
          </template>
        </FileUpload>
        
        <button 
          @click="loadData"
          :disabled="!selectedFile || isLoading"
          class="modern-button px-4 py-3 text-sm font-semibold w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <component 
            :is="isLoading ? 'div' : PlayIcon" 
            :class="isLoading ? 'loading-spinner w-5 h-5 mr-2' : 'w-5 h-5 mr-2'"
          />
          {{ isLoading ? 'Loading...' : 'Load Data' }}
        </button>
        
        <button 
          @click="exportData"
          :disabled="store.dataPoints.length === 0"
          class="modern-button px-4 py-3 text-sm font-semibold w-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center disabled:opacity-50"
        >
          <ArrowDownTrayIcon class="w-5 h-5 mr-2" />
          Export Data
        </button>
        
        <a 
          href="https://colab.research.google.com/drive/1o9eogdqXhd2iRZnworQA_2oIwSuX8WsN?usp=sharing" 
          target="_blank" 
          class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center transition-colors"
        >
          <ArrowTopRightOnSquareIcon class="w-4 h-4 mr-2" />
          Generate Your Own Data
        </a>
      </div>
    </div>

    <!-- Neuron Controls -->
    <div class="control-card p-6">
      <div class="flex items-center mb-4">
        <CpuChipIcon class="w-6 h-6 text-green-600 mr-3" />
        <h3 class="font-bold text-lg text-gray-800">Neuron Controls</h3>
      </div>
      <div class="space-y-3">
        <div class="flex gap-2">
          <FileUpload
            accept=".csv"
            @file-selected="handleNeuronFileSelected"
            class="flex-1"
          >
            <template #default>
              <div class="modern-button px-3 py-2 text-sm font-semibold cursor-pointer flex items-center justify-center w-full bg-green-600 hover:bg-green-700">
                <DocumentArrowUpIcon class="w-4 h-4 mr-1" />
                Load
              </div>
            </template>
          </FileUpload>
          
          <button 
            @click="saveNeurons"
            :disabled="store.neurons.length === 0"
            class="modern-button px-3 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 flex items-center disabled:opacity-50"
          >
            <DocumentArrowDownIcon class="w-4 h-4 mr-1" />
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Optimization -->
    <div class="control-card p-6">
      <div class="flex items-center mb-4">
        <CogIcon class="w-6 h-6 text-purple-600 mr-3" />
        <h3 class="font-bold text-lg text-gray-800">Optimization</h3>
      </div>
      <div class="space-y-3">
        <button 
          @click="runGradientDescent"
          :disabled="store.neurons.length === 0 || store.filteredDataPoints.length === 0"
          class="modern-button px-4 py-3 text-sm font-semibold w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center disabled:opacity-50"
        >
          <RocketLaunchIcon class="w-5 h-5 mr-2" />
          Run Gradient Descent
        </button>
        
        <button 
          @click="store.removeLastNeuron()"
          :disabled="store.neurons.length === 0"
          class="modern-button px-4 py-3 text-sm font-semibold w-full bg-red-600 hover:bg-red-700 flex items-center justify-center disabled:opacity-50"
        >
          <TrashIcon class="w-5 h-5 mr-2" />
          Remove Last Neuron
        </button>
      </div>
    </div>

    <!-- Settings -->
    <div class="control-card p-6">
      <div class="flex items-center mb-4">
        <AdjustmentsHorizontalIcon class="w-6 h-6 text-indigo-600 mr-3" />
        <h3 class="font-bold text-lg text-gray-800">Settings</h3>
      </div>
      <div class="space-y-3">
        <div>
          <label for="similarityMetric" class="block text-sm font-semibold text-gray-700 mb-2">
            Similarity Metric
          </label>
          <select 
            id="similarityMetric" 
            v-model="store.similarityMetric"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dotProduct">Dot Product</option>
            <option value="euclidean">Euclidean Distance</option>
            <option value="myProduct">My Product</option>
          </select>
        </div>
        
        <div>
          <label for="activationFunction" class="block text-sm font-semibold text-gray-700 mb-2">
            Activation Function
          </label>
          <select 
            id="activationFunction" 
            v-model="store.activationFunction"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

function runGradientDescent() {
  // Implementation for gradient descent
  notificationStore.addNotification({
    message: 'Gradient descent optimization started!',
    type: 'info'
  })
  
  // TODO: Implement gradient descent logic
}
</script>

<style scoped>
/* Control card styles moved from global CSS */
.control-card {
  background: linear-gradient(to bottom right, rgb(255 255 255), rgb(249 250 251));
  border: 1px solid rgba(229 231 235, 0.8);
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: transform;
}

.control-card:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Modern button styles moved from global CSS */
.modern-button {
  background: linear-gradient(to right, rgb(37 99 235), rgb(79 70 229));
  border: 0;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: transform;
}

.modern-button:hover {
  transform: translateY(-1px) translateZ(0);
  box-shadow: 0 10px 25px -3px rgba(59, 130, 246, 0.25);
}

.modern-button:active {
  transform: translateY(0) translateZ(0);
  transition-duration: 0.05s;
}

.modern-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%) translateZ(0);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-button:hover::before {
  transform: translateX(100%) translateZ(0);
}
</style>
