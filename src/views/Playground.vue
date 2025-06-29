<template>
  <div class="min-h-screen photoshop-workspace">
    <AppHeader />
    
    <main class="workspace-main">
      <div class="workspace-container">
        
        <div class="text-center mb-4">
          <h1 class="text-3xl font-bold text-theme-primary mb-2">Neural Network Playground</h1>
          <p class="text-sm text-theme-secondary">Experiment freely with neural network configurations</p>
        </div>
        
        <!-- Central Canvas Area -->
        <div class="canvas-area">
          <div class="canvas-container" data-tour="neural-canvas">
            <NeuralCanvas ref="neuralCanvas" />
            
            <!-- Class Toggles Toolbar -->
            <div v-if="store.allClasses.length > 0" class="class-toolbar-overlay">
              <ClassToggles />
            </div>
          </div>
        </div>
        
        <!-- Floating Panels -->
        <DataPanel 
          v-if="panels.data"
          :initial-position="{ x: 10, y: 10 }"
          :z-index="150"
          @close="panels.data = false"
        />
        
        <VisualizationPanel 
          v-if="panels.visualization"
          :initial-position="{ x: 300, y: 10 }"
          :z-index="150"
          @close="panels.visualization = false"
        />
        
        <FloatingPanel
          title="Optimization"
          :icon="RocketLaunchIcon"
          :initial-position="{ x: 590, y: 10 }"
          :width="380"
          :height="500"
          :z-index="150"
          @close="panels.optimization = false"
          v-if="panels.optimization"
          data-tour="optimization-panel"
        >
          <div class="optimization-content">
            <OptimizationPanel />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="Metrics & Charts"
          :icon="ChartBarIcon"
          :initial-position="{ x: 10, y: 300 }"
          :width="350"
          :height="400"
          :z-index="150"
          @close="panels.metrics = false"
          v-if="panels.metrics"
          data-tour="metrics-panel"
        >
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
        </FloatingPanel>
        
        <FloatingPanel
          title="Presets & Experiments"
          :icon="DocumentTextIcon"
          :initial-position="{ x: 50, y: 500 }"
          :width="600"
          :height="300"
          :z-index="150"
          @close="panels.presets = false"
          v-if="panels.presets"
          data-tour="presets-panel"
        >
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
        </FloatingPanel>
        
        <FloatingPanel
          v-if="neuralCanvas && neuralCanvas.canvasComponent && panels.neurons"
          title="Neuron Management"
          :icon="CpuChipIcon"
          :initial-position="{ x: 700, y: 500 }"
          :width="400"
          :height="300"
          :z-index="150"
          @close="panels.neurons = false"
        >
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
            @add-neuron="(x, y) => store.addNeuron(x, y)"
          />
        </FloatingPanel>
        
        <FloatingPanel
          v-if="panels.networkConfig"
          title="Network Configuration"
          :icon="CogIcon"
          :initial-position="{ x: 1000, y: 10 }"
          :width="400"
          :height="500"
          :z-index="150"
          @close="panels.networkConfig = false"
          data-tour="network-config-panel"
        >
          <NetworkConfigPanel
            :activation-function="store.activationFunction"
            :similarity-metric="store.similarityMetric"
            @update-activation="handleActivationUpdate"
            @update-similarity="handleSimilarityUpdate"
          />
        </FloatingPanel>
        
        <!-- Panel Control Sidebar -->
        <div class="panel-controls-sidebar" data-tour="panel-controls">
          <div class="sidebar-section">
            <div class="panel-toggles">
              <button 
                v-for="(panel, key) in panels"
                :key="key"
                @click="togglePanel(key)"
                :class="['panel-toggle', { active: panel }]"
                :title="`Toggle ${getPanelName(key)} panel`"
                :data-tour="`toggle-${key}`"
              >
                <component :is="getPanelIcon(key)" class="toggle-icon" />
                <span class="toggle-label">{{ getPanelName(key) }}</span>
              </button>
            </div>
          </div>
          
          <div class="sidebar-section">
            <div class="layout-controls">
              <button @click="resetPanelPositions" class="layout-btn" title="Reset Layout">
                <ArrowPathIcon class="btn-icon" />
              </button>
              <button @click="minimizeAllPanels" class="layout-btn" title="Minimize All">
                <MinusIcon class="btn-icon" />
              </button>
              <button @click="showAllPanels" class="layout-btn" title="Show All">
                <Square3Stack3DIcon class="btn-icon" />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import NeuralCanvas from '@/components/visualization/NeuralCanvas.vue'
import MetricsPanel from '@/components/visualization/MetricsPanel.vue'
import LossLandscape from '@/components/visualization/LossLandscape.vue'
import NeuronManagement from '@/components/visualization/NeuronManagement.vue'
import NetworkConfigPanel from '@/components/panels/NetworkConfigPanel.vue'
import LossHistoryChart from '@/components/visualization/LossHistoryChart.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import DataPanel from '@/components/panels/DataPanel.vue'
import VisualizationPanel from '@/components/panels/VisualizationPanel.vue'
import OptimizationPanel from '@/components/panels/OptimizationPanel.vue'
import FloatingPanel from '@/components/ui/FloatingPanel.vue'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CpuChipIcon,
  DatabaseIcon,
  MapIcon,
  RocketLaunchIcon,
  HeartIcon,
  XCircleIcon,
  Square3Stack3DIcon,
  BoltIcon,
  ArrowPathIcon,
  MinusIcon,
  CogIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import type { DataPoint } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

const neuralCanvas = ref<InstanceType<typeof NeuralCanvas> | null>(null)

// Panel visibility state
const panels = reactive({
  data: false,
  visualization: false,
  optimization: false,
  metrics: false,
  presets: false,
  neurons: false,
  networkConfig: false
})

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

// Panel management functions
function togglePanel(key: string) {
  panels[key as keyof typeof panels] = !panels[key as keyof typeof panels]
  
  notificationStore.addNotification({
    message: `${getPanelName(key)} panel ${panels[key as keyof typeof panels] ? 'shown' : 'hidden'}`,
    type: 'info'
  })
}

function getPanelName(key: string): string {
  const names: Record<string, string> = {
    data: 'Data',
    visualization: 'Visualization',
    optimization: 'Optimization',
    metrics: 'Metrics',
    presets: 'Presets',
    neurons: 'Neurons',
    networkConfig: 'Network'
  }
  return names[key] || key
}

function getPanelIcon(key: string) {
  const icons: Record<string, any> = {
    data: DatabaseIcon,
    visualization: MapIcon,
    optimization: RocketLaunchIcon,
    metrics: ChartBarIcon,
    presets: DocumentTextIcon,
    neurons: CpuChipIcon,
    networkConfig: CogIcon
  }
  return icons[key] || DocumentTextIcon
}

function resetPanelPositions() {
  // Reset canvas and all associated state
  store.reset()

  // Reset all panels to default positions by re-rendering them
  const currentPanels = { ...panels }
  Object.keys(panels).forEach(key => {
    panels[key as keyof typeof panels] = false
  })
  
  setTimeout(() => {
    Object.assign(panels, currentPanels)
  }, 100)
  
  notificationStore.addNotification({
    message: 'Canvas and panel layout have been reset',
    type: 'info'
  })
}

function minimizeAllPanels() {
  Object.keys(panels).forEach(key => {
    panels[key as keyof typeof panels] = false
  })
  
  notificationStore.addNotification({
    message: 'All panels hidden',
    type: 'info'
  })
}

function showAllPanels() {
  Object.keys(panels).forEach(key => {
    panels[key as keyof typeof panels] = true
  })
  
  notificationStore.addNotification({
    message: 'All panels shown',
    type: 'info'
  })
}

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

function handleActivationUpdate(value: string) {
  store.activationFunction = value as any
  notificationStore.addNotification({
    message: `Activation function changed to ${value}!`,
    type: 'info'
  })
}

function handleSimilarityUpdate(value: string) {
  store.similarityMetric = value as any
  notificationStore.addNotification({
    message: `Similarity metric changed to ${value}!`,
    type: 'info'
  })
}
</script>

<style scoped>
/* Photoshop-style workspace with floating panels */
.photoshop-workspace {
  background: #333333;
  color: #cccccc;
  min-height: 100vh;
  position: relative;
}

.workspace-main {
  padding: 0;
  margin: 0;
  /* overflow: hidden; */ /* Removed to allow floating panels to be visible */
}

.workspace-container {
  padding: 16px 16px 16px 80px; /* Add left padding for sidebar */
  height: calc(100vh - 60px);
  position: relative;
}

/* Central Canvas Area */
.canvas-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 200px);
  position: relative;
  z-index: 1;
}

.canvas-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid #464647;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  width: 700px;
  height: 700px;
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

/* Panel Controls Sidebar */
.panel-controls-sidebar {
  position: fixed;
  left: 0;
  top: 60px; /* Below header */
  bottom: 0;
  width: 64px;
  background: #2d2d30;
  border-right: 1px solid #464647;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 16px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-toggles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #cccccc;
  width: 48px;
  height: 48px;
}

.panel-toggle:hover {
  background: #404040;
  border-color: #666666;
}

.panel-toggle.active {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.toggle-icon {
  width: 18px;
  height: 18px;
}

.toggle-label {
  font-size: 8px;
  font-weight: 500;
  text-align: center;
  line-height: 1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #464647;
}

.layout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  background: #383838;
  border: 1px solid #555555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #cccccc;
  width: 48px;
  height: 32px;
}

.layout-btn:hover {
  background: #404040;
  border-color: #666666;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Floating Panel Content Styles */
.optimization-content {
  padding: 8px;
}

.metrics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
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
  padding: 8px;
  display: flex;
  flex-direction: column;
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
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

/* Responsive Design */
@media (max-width: 1400px) {
  .canvas-container {
    width: 600px;
    height: 600px;
  }
}

@media (max-width: 1024px) {
  .canvas-container {
    width: 500px;
    height: 500px;
  }
}

@media (max-width: 768px) {
  .workspace-container {
    padding: 8px 8px 8px 72px;
  }
  
  .canvas-container {
    width: 400px;
    height: 400px;
  }
  
  .panel-controls-sidebar {
    width: 56px;
    padding: 12px 6px;
  }
  
  .panel-toggle,
  .layout-btn {
    width: 44px;
  }
  
  .panel-toggle {
    height: 44px;
  }
  
  .layout-btn {
    height: 28px;
  }
}

@media (max-width: 480px) {
  .workspace-container {
    padding: 8px 8px 8px 64px;
  }
  
  .canvas-container {
    width: 300px;
    height: 300px;
  }
  
  .panel-controls-sidebar {
    width: 48px;
    padding: 8px 4px;
  }
  
  .panel-toggle,
  .layout-btn {
    width: 40px;
  }
  
  .panel-toggle {
    height: 40px;
  }
  
  .layout-btn {
    height: 24px;
  }
  
  .toggle-label {
    font-size: 7px;
  }
}
</style>