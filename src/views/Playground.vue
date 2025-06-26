<template>
  <div class="min-h-screen photoshop-workspace">
    <AppHeader />
    
    <main class="workspace-main">
      <div class="workspace-container">
        
        <div class="text-center mb-4">
          <h1 class="text-3xl font-bold text-theme-primary mb-2">Neural Network Playground</h1>
          <p class="text-sm text-theme-secondary">Experiment freely with neural network configurations</p>
        </div>
        
        <!-- Flexible Panel Layout -->
        <div class="panels-layout">
          <!-- Left Panel Column -->
          <div class="panel-column left-column">
            <DataPanel />
            <VisualizationPanel />
          </div>
          
          <!-- Center Canvas Area -->
          <div class="canvas-area">
            <div class="canvas-container">
              <NeuralCanvas ref="neuralCanvas" />
              
              <!-- Class Toggles Toolbar -->
              <div v-if="store.allClasses.length > 0" class="class-toolbar-overlay">
                <ClassToggles />
              </div>
            </div>
          </div>
          
          <!-- Right Panel Column -->
          <div class="panel-column right-column">
            <OptimizationPanel />
            
            <!-- Metrics Panel -->
            <div class="panel-wrapper">
              <div class="panel-header">
                <div class="panel-title-section">
                  <ChartBarIcon class="panel-icon" />
                  <span class="panel-title">Metrics & Charts</span>
                </div>
              </div>
              <div class="panel-content">
                <div class="metrics-content">
                  <div class="metrics-section">
                    <h3 class="metrics-title">Real-time Metrics</h3>
                    <MetricsPanel />
                  </div>
                  <div class="metrics-section">
                    <h3 class="metrics-title">Loss History</h3>
                    <LossHistoryChart />
                  </div>
                  <div class="metrics-section">
                    <h3 class="metrics-title">Loss Landscape</h3>
                    <LossLandscape />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bottom Panel Row -->
        <div class="bottom-panels">
          <!-- Presets Panel -->
          <div class="panel-wrapper">
            <div class="panel-header">
              <div class="panel-title-section">
                <DocumentTextIcon class="panel-icon" />
                <span class="panel-title">Presets & Experiments</span>
              </div>
            </div>
            <div class="panel-content">
              <div class="presets-content">
                <!-- Dataset Presets -->
                <div class="preset-section">
                  <h3 class="preset-title">Dataset Presets</h3>
                  <div class="preset-grid">
                    <button 
                      v-for="preset in datasetPresets"
                      :key="preset.id"
                      @click="loadPreset(preset.id)"
                      class="preset-card"
                    >
                      <component :is="preset.icon" class="preset-icon" />
                      <div class="preset-info">
                        <h4 class="preset-name">{{ preset.name }}</h4>
                        <p class="preset-description">{{ preset.description }}</p>
                      </div>
                    </button>
                  </div>
                </div>
                
                <!-- Network Presets -->
                <div class="preset-section">
                  <h3 class="preset-title">Network Presets</h3>
                  <div class="preset-grid">
                    <button 
                      v-for="preset in networkPresets"
                      :key="preset.id"
                      @click="loadNetworkPreset(preset.id)"
                      class="preset-card"
                    >
                      <component :is="preset.icon" class="preset-icon" />
                      <div class="preset-info">
                        <h4 class="preset-name">{{ preset.name }}</h4>
                        <p class="preset-description">{{ preset.description }}</p>
                      </div>
                    </button>
                  </div>
                </div>
                
                <!-- Experiments -->
                <div class="preset-section">
                  <h3 class="preset-title">Quick Experiments</h3>
                  <div class="experiment-grid">
                    <button 
                      v-for="experiment in quickExperiments"
                      :key="experiment.id"
                      @click="runExperiment(experiment.id)"
                      :class="['experiment-btn', experiment.type]"
                    >
                      <component :is="experiment.icon" class="experiment-icon" />
                      <span class="experiment-name">{{ experiment.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Neuron Management Panel (conditional) -->
          <div 
            v-if="neuralCanvas && neuralCanvas.canvasComponent"
            class="panel-wrapper"
          >
            <div class="panel-header">
              <div class="panel-title-section">
                <CpuChipIcon class="panel-icon" />
                <span class="panel-title">Neuron Management</span>
              </div>
            </div>
            <div class="panel-content">
              <NeuronManagement
                :neurons="store.neurons"
                :selected-neuron="neuralCanvas.canvasComponent.selectedNeuron"
                :coordinate-ranges="store.coordinateRanges"
                :get-controlled-area="neuralCanvas.canvasComponent.getControlledArea"
                :get-average-score="neuralCanvas.canvasComponent.getAverageScore"
                @select="neuralCanvas.selectNeuron"
                @close="() => { if (neuralCanvas && neuralCanvas.canvasComponent) neuralCanvas.canvasComponent.selectedNeuron = null }"
                @update-position="(...args) => neuralCanvas?.canvasComponent?.updateNeuronPosition(...args)"
                @update-color="(...args) => neuralCanvas?.canvasComponent?.updateNeuronColor(...args)"
                @remove="(...args) => neuralCanvas?.canvasComponent?.removeNeuron(...args)"
              />
            </div>
          </div>
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import NeuralCanvas from '@/components/visualization/NeuralCanvas.vue'
import MetricsPanel from '@/components/visualization/MetricsPanel.vue'
import LossLandscape from '@/components/visualization/LossLandscape.vue'
import NeuronManagement from '@/components/visualization/NeuronManagement.vue'
import LossHistoryChart from '@/components/visualization/LossHistoryChart.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import DataPanel from '@/components/panels/DataPanel.vue'
import VisualizationPanel from '@/components/panels/VisualizationPanel.vue'
import OptimizationPanel from '@/components/panels/OptimizationPanel.vue'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CpuChipIcon,
  HeartIcon,
  XCircleIcon,
  Square3Stack3DIcon,
  BoltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import type { DataPoint } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const neuralCanvas = ref<InstanceType<typeof NeuralCanvas> | null>(null)

// Dataset presets
const datasetPresets = [
  {
    id: 'spiral',
    name: 'Spiral',
    description: 'Two interleaved spirals',
    icon: BoltIcon
  },
  {
    id: 'clusters',
    name: 'Clusters',
    description: 'Clustered data points',
    icon: XCircleIcon
  },
  {
    id: 'xor',
    name: 'XOR',
    description: 'XOR logic problem',
    icon: Square3Stack3DIcon
  },
  {
    id: 'donut',
    name: 'Donut',
    description: 'Ring-shaped data',
    icon: HeartIcon
  }
]

// Network presets
const networkPresets = [
  {
    id: 'simple',
    name: 'Simple',
    description: '2-3 neurons',
    icon: CpuChipIcon
  },
  {
    id: 'medium',
    name: 'Medium',
    description: '5-8 neurons',
    icon: Square3Stack3DIcon
  },
  {
    id: 'complex',
    name: 'Complex',
    description: '10+ neurons',
    icon: CpuChipIcon
  }
]

// Quick experiments
const quickExperiments = [
  {
    id: 'noise',
    name: 'Add Noise',
    icon: BoltIcon,
    type: 'warning'
  },
  {
    id: 'shuffle',
    name: 'Shuffle Labels',
    icon: ArrowPathIcon,
    type: 'warning'
  },
  {
    id: 'boost',
    name: 'Learning Boost',
    icon: RocketLaunchIcon,
    type: 'success'
  },
  {
    id: 'perturbation',
    name: 'Perturbation',
    icon: BoltIcon,
    type: 'default'
  }
]

function loadPreset(type: string) {
  let data: DataPoint[] = []
  
  switch (type) {
    case 'spiral':
      data = generateSpiralData()
      break
    case 'clusters':
      data = generateClusteredData()
      break
    case 'xor':
      data = generateXORData()
      break
    case 'donut':
      data = generateDonutData()
      break
  }
  
  store.setDataPoints(data)
  
  notificationStore.addNotification({
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} dataset loaded!`,
    type: 'success'
  })
}

function loadNetworkPreset(type: string) {
  store.neurons.splice(0)
  
  switch (type) {
    case 'simple':
      store.addNeuron(-0.3, 0)
      store.addNeuron(0.3, 0)
      if (Math.random() > 0.5) store.addNeuron(0, 0.4)
      break
    case 'medium':
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          store.addNeuron((i - 0.5) * 0.6, (j - 1) * 0.4)
        }
      }
      break
    case 'complex':
      for (let i = 0; i < 12; i++) {
        store.addNeuron(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5
        )
      }
      break
  }
  
  notificationStore.addNotification({
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} network loaded!`,
    type: 'success'
  })
}

function runExperiment(type: string) {
  switch (type) {
    case 'noise':
      addNoise()
      break
    case 'shuffle':
      shuffleLabels()
      break
    case 'boost':
      learningBoost()
      break
    case 'perturbation':
      addPerturbation()
      break
  }
}

function generateSpiralData(): DataPoint[] {
  const data: DataPoint[] = []
  const n = 100
  
  for (let i = 0; i < n; i++) {
    const r = i / n * 0.8
    const t = 1.75 * i / n * 2 * Math.PI
    
    data.push({
      x: r * Math.cos(t) + Math.random() * 0.1 - 0.05,
      y: r * Math.sin(t) + Math.random() * 0.1 - 0.05,
      label: 0
    })
    
    data.push({
      x: r * Math.cos(t + Math.PI) + Math.random() * 0.1 - 0.05,
      y: r * Math.sin(t + Math.PI) + Math.random() * 0.1 - 0.05,
      label: 1
    })
  }
  
  return data
}

function generateClusteredData(): DataPoint[] {
  const data: DataPoint[] = []
  const clusters = [
    { x: -0.5, y: -0.5, label: 0 },
    { x: 0.5, y: -0.5, label: 1 },
    { x: 0, y: 0.5, label: 2 }
  ]
  
  clusters.forEach(cluster => {
    for (let i = 0; i < 50; i++) {
      data.push({
        x: cluster.x + (Math.random() - 0.5) * 0.4,
        y: cluster.y + (Math.random() - 0.5) * 0.4,
        label: cluster.label
      })
    }
  })
  
  return data
}

function generateXORData(): DataPoint[] {
  const data: DataPoint[] = []
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 2 - 1
    const y = Math.random() * 2 - 1
    const label = (x > 0) !== (y > 0) ? 1 : 0
    
    data.push({ x, y, label })
  }
  
  return data
}

function generateDonutData(): DataPoint[] {
  const data: DataPoint[] = []
  
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * 2 * Math.PI
    const radius = Math.random() * 0.5 + 0.3
    const x = radius * Math.cos(angle) + (Math.random() - 0.5) * 0.1
    const y = radius * Math.sin(angle) + (Math.random() - 0.5) * 0.1
    const label = radius < 0.55 ? 0 : 1
    
    data.push({ x, y, label })
  }
  
  return data
}

function addNoise() {
  const noisyData = store.dataPoints.map(point => ({
    ...point,
    x: point.x + (Math.random() - 0.5) * 0.2,
    y: point.y + (Math.random() - 0.5) * 0.2
  }))
  
  store.setDataPoints(noisyData)
  
  notificationStore.addNotification({
    message: 'Noise added to data points!',
    type: 'info'
  })
}

function shuffleLabels() {
  const shuffledData = [...store.dataPoints]
  
  for (let i = shuffledData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tempLabel = shuffledData[i].label
    shuffledData[i].label = shuffledData[j].label
    shuffledData[j].label = tempLabel
  }
  
  store.setDataPoints(shuffledData)
  
  notificationStore.addNotification({
    message: 'Labels shuffled randomly!',
    type: 'warning'
  })
}

function learningBoost() {
  notificationStore.addNotification({
    message: 'Learning boost applied! Training will be faster for next 10 steps.',
    type: 'success'
  })
}

function addPerturbation() {
  store.neurons.forEach(neuron => {
    neuron.x += (Math.random() - 0.5) * 0.1
    neuron.y += (Math.random() - 0.5) * 0.1
  })
  
  notificationStore.addNotification({
    message: 'Small perturbations added to all neurons!',
    type: 'info'
  })
}
</script>

<style scoped>
/* Photoshop-style workspace with flexbox layout */
.photoshop-workspace {
  background: #333333;
  color: #cccccc;
  min-height: 100vh;
}

.workspace-main {
  padding: 0;
  margin: 0;
  overflow-x: hidden;
}

.workspace-container {
  padding: 16px;
  max-width: 100vw;
}

/* Flexible Panel Layout */
.panels-layout {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  min-height: 600px;
}

.panel-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 0 0 280px;
}

.left-column {
  order: 1;
}

.canvas-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  order: 2;
  padding: 0 16px;
}

.right-column {
  order: 3;
}

.canvas-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid #464647;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1;
  position: relative;
}

/* Class Toolbar Overlay */
.class-toolbar-overlay {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* Bottom Panels */
.bottom-panels {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.bottom-panels .panel-wrapper {
  flex: 1;
  min-width: 300px;
}

/* Panel Wrapper Styles */
.panel-wrapper {
  background: #2d2d30;
  border: 1px solid #464647;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(180deg, #404040 0%, #383838 100%);
  border-bottom: 1px solid #464647;
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 16px;
  height: 16px;
  color: #007acc;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #cccccc;
  letter-spacing: 0.3px;
}

.panel-content {
  padding: 12px;
  background: #2d2d30;
  color: #cccccc;
  max-height: 400px;
  overflow-y: auto;
}

/* Panel Content Styles */
.metrics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-section {
  padding: 8px 0;
}

.metrics-title {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #464647;
}

.presets-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preset-section {
  padding: 8px 0;
}

.preset-title {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #464647;
}

.preset-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.preset-card:hover {
  background: #404040;
  border-color: #666666;
  transform: translateY(-1px);
}

.preset-icon {
  width: 16px;
  height: 16px;
  color: #007acc;
  flex-shrink: 0;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 2px;
}

.preset-description {
  font-size: 9px;
  color: #999999;
  margin: 0;
}

/* Experiments */
.experiment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.experiment-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 9px;
  color: #cccccc;
}

.experiment-btn:hover {
  transform: translateY(-1px);
}

.experiment-btn.success {
  border-color: #28a745;
}

.experiment-btn.success:hover {
  background: rgba(40, 167, 69, 0.1);
}

.experiment-btn.warning {
  border-color: #ffc107;
}

.experiment-btn.warning:hover {
  background: rgba(255, 193, 7, 0.1);
}

.experiment-icon {
  width: 14px;
  height: 14px;
}

.experiment-name {
  font-weight: 500;
  text-align: center;
}

/* Custom scrollbar */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #383838;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .panels-layout {
    flex-direction: column;
  }
  
  .panel-column {
    flex-direction: row;
    flex: none;
  }
  
  .left-column, .right-column {
    order: 3;
  }
  
  .canvas-area {
    order: 1;
  }
  
  .canvas-container {
    max-width: 500px;
  }
}

@media (max-width: 1024px) {
  .panel-column {
    flex-direction: column;
  }
  
  .canvas-container {
    max-width: 400px;
  }
  
  .presets-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .workspace-container {
    padding: 8px;
  }
  
  .panels-layout, .bottom-panels {
    gap: 8px;
  }
  
  .panel-column {
    flex: none;
  }
  
  .canvas-container {
    max-width: 300px;
  }
}
</style>

    max-width: 300px;