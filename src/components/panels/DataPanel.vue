<template>
  <FloatingPanel 
    title="Data & Neurons" 
    :icon="DatabaseIcon"
    :width="280"
    :initial-position="initialPosition"
    :z-index="zIndex"
    :closable="true"
    @close="$emit('close')"
  >
    <!-- Data Section -->
    <div class="panel-section">
      <div class="section-header">
        <DatabaseIcon class="section-icon" />
        <span class="section-title">Dataset</span>
      </div>
      
      <div class="data-controls">
        <!-- File Upload Area -->
        <FileUpload
          accept=".csv"
          @file-selected="handleFileSelected"
          class="file-upload-area"
        >
          <template #default="{ isDragging }">
            <div :class="['upload-zone', { 'is-dragging': isDragging, 'has-file': selectedFile }]">
              <ArrowUpTrayIcon class="upload-icon" />
              <div class="upload-text">
                <span class="upload-title">
                  {{ selectedFile ? selectedFileName : 'Drop CSV file here' }}
                </span>
                <span class="upload-subtitle">or click to browse</span>
              </div>
            </div>
          </template>
        </FileUpload>
        
        <!-- Action Buttons -->
        <div class="action-row">
          <Button 
            @click="loadData"
            :disabled="!selectedFile || isLoading"
            variant="default"
            size="sm"
            class="action-btn primary"
          >
            <PlayIcon v-if="!isLoading" class="btn-icon" />
            <div v-else class="loading-spinner" />
            Load Data
          </Button>
          
          <Button 
            @click="exportData"
            :disabled="store.dataPoints.length === 0"
            variant="outline"
            size="sm"
            class="action-btn"
          >
            <ArrowDownTrayIcon class="btn-icon" />
            Export
          </Button>
        </div>
        
        <!-- Data Info -->
        <div v-if="store.dataPoints.length > 0" class="data-info">
          <div class="info-item">
            <span class="info-label">Points:</span>
            <span class="info-value">{{ store.dataPoints.length.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Classes:</span>
            <span class="info-value">{{ store.allClasses.length }}</span>
          </div>
        </div>
        
        <!-- Generate Link -->
        <Button 
          as="a"
          href="https://colab.research.google.com/drive/1o9eogdqXhd2iRZnworQA_2oIwSuX8WsN?usp=sharing" 
          target="_blank" 
          variant="ghost"
          size="sm"
          class="generate-link"
        >
          <ArrowTopRightOnSquareIcon class="btn-icon" />
          Generate Custom Data
        </Button>
      </div>
    </div>
    
    <!-- Divider -->
    <div class="panel-divider"></div>
    
    <!-- Neurons Section -->
    <div class="panel-section">
      <div class="section-header">
        <CpuChipIcon class="section-icon" />
        <span class="section-title">Neurons</span>
        <span class="neuron-count">{{ store.neurons.length }}</span>
      </div>
      
      <div class="neuron-controls">
        <!-- Neuron Actions -->
        <div class="action-row">
          <Button 
            @click="addRandomNeuron"
            variant="default"
            size="sm"
            class="action-btn"
          >
            <component :is="PlusIcon" class="btn-icon" />
            Add Random
          </Button>
          
          <Button 
            @click="store.removeLastNeuron()"
            :disabled="store.neurons.length === 0"
            variant="destructive"
            size="sm"
            class="action-btn"
          >
            <TrashIcon class="btn-icon" />
            Remove Last
          </Button>
        </div>
        
        <!-- Load/Save Neurons -->
        <div class="file-actions">
          <FileUpload
            accept=".csv"
            @file-selected="handleNeuronFileSelected"
            class="neuron-upload"
          >
            <template #default>
              <Button variant="outline" size="sm" class="action-btn">
                <DocumentArrowUpIcon class="btn-icon" />
                Load Neurons
              </Button>
            </template>
          </FileUpload>
          
          <Button 
            @click="saveNeurons"
            :disabled="store.neurons.length === 0"
            variant="outline"
            size="sm"
            class="action-btn"
          >
            <DocumentArrowDownIcon class="btn-icon" />
            Save Neurons
          </Button>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <Button 
            @click="clearAllNeurons"
            :disabled="store.neurons.length === 0"
            variant="ghost"
            size="xs"
            class="quick-btn"
          >
            Clear All
          </Button>
          <Button 
            @click="randomizeNeurons"
            :disabled="store.neurons.length === 0"
            variant="ghost"
            size="xs"
            class="quick-btn"
          >
            Randomize
          </Button>
        </div>
      </div>
    </div>
  </FloatingPanel>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import FloatingPanel from '@/components/ui/FloatingPanel.vue'
import FileUpload from '@/components/ui/FileUpload.vue'
import { Button } from '@/components/ui'
import { 
  DatabaseIcon,
  CpuChipIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import { parseCSV, exportToCSV } from '@/utils/csvUtils'

// Props
interface Props {
  initialPosition?: { x: number; y: number }
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialPosition: () => ({ x: 20, y: 80 })
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Create PlusIcon since it might not exist
const PlusIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 4v16m8-8H4'
      })
    ])
  }
}

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const selectedFile = ref<File | null>(null)
const selectedFileName = ref<string>('')
const isLoading = ref(false)

function handleFileSelected(file: File) {
  selectedFile.value = file
  selectedFileName.value = file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name
}

function handleNeuronFileSelected(file: File) {
  parseCSV(file).then(_data => {
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
    
    if (data.length === 0) {
      throw new Error('CSV file appears to be empty')
    }
    
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
      message: `Successfully loaded ${dataPoints.length} data points with ${store.allClasses.length} classes!`,
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

function addRandomNeuron() {
  const x = (Math.random() - 0.5) * 2
  const y = (Math.random() - 0.5) * 2
  store.addNeuron(x, y)
  
  notificationStore.addNotification({
    message: 'Random neuron added!',
    type: 'success',
    duration: 2000
  })
}

function clearAllNeurons() {
  store.neurons.splice(0)
  notificationStore.addNotification({
    message: 'All neurons cleared!',
    type: 'info'
  })
}

function randomizeNeurons() {
  store.neurons.forEach(neuron => {
    neuron.x = (Math.random() - 0.5) * 2
    neuron.y = (Math.random() - 0.5) * 2
  })
  
  notificationStore.addNotification({
    message: 'Neuron positions randomized!',
    type: 'info'
  })
}
</script>

<style scoped>
.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #464647;
}

.section-icon {
  width: 14px;
  height: 14px;
  color: #007acc;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  flex: 1;
}

.neuron-count {
  font-size: 10px;
  color: #999999;
  background: #464647;
  padding: 2px 6px;
  border-radius: 8px;
}

.panel-divider {
  height: 1px;
  background: #464647;
  margin: 12px -8px;
}

/* Upload Zone */
.upload-zone {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed #666666;
  border-radius: 6px;
  background: #383838;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.upload-zone:hover {
  border-color: #007acc;
  background: #404040;
}

.upload-zone.is-dragging {
  border-color: #007acc;
  background: #404040;
  transform: scale(1.02);
}

.upload-zone.has-file {
  border-color: #28a745;
  background: #2d4a2d;
}

.upload-icon {
  width: 20px;
  height: 20px;
  color: #999999;
  flex-shrink: 0;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.upload-title {
  font-size: 11px;
  font-weight: 500;
  color: #cccccc;
}

.upload-subtitle {
  font-size: 9px;
  color: #999999;
}

/* Action Buttons */
.action-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.action-btn {
  flex: 1;
  font-size: 10px;
  padding: 6px 8px;
  height: auto;
}

.action-btn.primary {
  background: #007acc;
  border-color: #007acc;
}

.action-btn.primary:hover:not(:disabled) {
  background: #005a9e;
  border-color: #005a9e;
}

.btn-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Data Info */
.data-info {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  background: #383838;
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 9px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
}

/* File Actions */
.file-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 4px;
}

.quick-btn {
  font-size: 9px;
  padding: 4px 6px;
  height: auto;
}

/* Generate Link */
.generate-link {
  width: 100%;
  font-size: 10px;
  padding: 6px 8px;
  height: auto;
  margin-top: 4px;
}
</style> 