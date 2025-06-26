<template>
  <div class="min-h-screen scroll-smooth momentum-scroll">
    <AppHeader />
    
    <main class="container mx-auto px-6 py-8 max-w-7xl">
      <div class="main-container p-8">
        
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-theme-primary mb-4">Neural Network Playground</h1>
          <p class="text-lg text-theme-secondary">Experiment freely with neural network configurations</p>
        </div>
        
        <!-- Main Controls Bar -->
        <div class="controls-section mb-6">
          <ControlsGrid />
        </div>
        
        <!-- Visualization Controls and Class Toggles - Integrated -->
        <div class="visualization-header mb-6">
          <VisualizationControls />
          <ClassToggles />
        </div>
        
        <!-- Main Content Layout -->
        <div class="playground-layout">
          <!-- Neural Canvas - Main Focus -->
          <div class="canvas-section">
            <div class="canvas-container">
              <NeuralCanvas />
            </div>
          </div>
          
          <!-- Tool Panels - Organized Sidebar -->
          <div class="tools-sidebar">
            <!-- Tabbed Tool Interface -->
            <div class="tools-container">
              <!-- Tab Navigation -->
              <div class="tab-nav">
                <button 
                  v-for="tab in tabs" 
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="['tab-button', { active: activeTab === tab.id }]"
                >
                  <component :is="tab.icon" class="w-4 h-4" />
                  <span>{{ tab.label }}</span>
                </button>
              </div>
              
              <!-- Tab Content -->
              <div class="tab-content">
                <!-- Metrics Tab -->
                <div v-if="activeTab === 'metrics'" class="tab-panel">
                  <div class="panel-section">
                    <h3 class="panel-title">Real-time Metrics</h3>
                    <MetricsPanel />
                  </div>
                  
                  <div class="panel-section">
                    <h3 class="panel-title">Loss Landscape</h3>
                    <LossLandscape />
                  </div>
                </div>
                
                <!-- Presets Tab -->
                <div v-if="activeTab === 'presets'" class="tab-panel">
                  <div class="panel-section">
                    <h3 class="panel-title">Dataset Presets</h3>
                    <div class="preset-grid">
                      <button 
                        v-for="preset in datasetPresets"
                        :key="preset.id"
                        @click="loadPreset(preset.id)"
                        class="preset-card"
                      >
                        <div class="preset-icon">
                          <component :is="preset.icon" class="w-6 h-6" />
                        </div>
                        <div class="preset-info">
                          <h4 class="preset-name">{{ preset.name }}</h4>
                          <p class="preset-description">{{ preset.description }}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div class="panel-section">
                    <h3 class="panel-title">Network Presets</h3>
                    <div class="preset-grid">
                      <button 
                        v-for="preset in networkPresets"
                        :key="preset.id"
                        @click="loadNetworkPreset(preset.id)"
                        class="preset-card"
                      >
                        <div class="preset-icon">
                          <component :is="preset.icon" class="w-6 h-6" />
                        </div>
                        <div class="preset-info">
                          <h4 class="preset-name">{{ preset.name }}</h4>
                          <p class="preset-description">{{ preset.description }}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Experiments Tab -->
                <div v-if="activeTab === 'experiments'" class="tab-panel">
                  <div class="panel-section">
                    <h3 class="panel-title">Data Experiments</h3>
                    <div class="experiment-grid">
                      <button 
                        v-for="experiment in dataExperiments"
                        :key="experiment.id"
                        @click="runExperiment(experiment.id)"
                        :class="['experiment-card', experiment.type]"
                      >
                        <component :is="experiment.icon" class="w-5 h-5" />
                        <span class="experiment-name">{{ experiment.name }}</span>
                        <p class="experiment-description">{{ experiment.description }}</p>
                      </button>
                    </div>
                  </div>
                  
                  <div class="panel-section">
                    <h3 class="panel-title">Training Experiments</h3>
                    <div class="experiment-grid">
                      <button 
                        v-for="experiment in trainingExperiments"
                        :key="experiment.id"
                        @click="runExperiment(experiment.id)"
                        :class="['experiment-card', experiment.type]"
                      >
                        <component :is="experiment.icon" class="w-5 h-5" />
                        <span class="experiment-name">{{ experiment.name }}</span>
                        <p class="experiment-description">{{ experiment.description }}</p>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Settings Tab -->
                <div v-if="activeTab === 'settings'" class="tab-panel">
                  <div class="panel-section">
                    <h3 class="panel-title">Advanced Settings</h3>
                    <div class="settings-grid">
                      <div class="setting-item">
                        <label class="setting-label">Animation Speed</label>
                        <input 
                          v-model.number="animationSpeed"
                          type="range" 
                          min="0.1" 
                          max="2" 
                          step="0.1"
                          class="setting-slider"
                        />
                        <span class="setting-value">{{ animationSpeed }}x</span>
                      </div>
                      
                      <div class="setting-item">
                        <label class="setting-label">Grid Quality</label>
                        <select v-model="gridQuality" class="setting-select">
                          <option value="low">Low (Fast)</option>
                          <option value="medium">Medium</option>
                          <option value="high">High (Detailed)</option>
                        </select>
                      </div>
                      
                      <div class="setting-item">
                        <label class="setting-label">Auto-save</label>
                        <input 
                          v-model="autoSave"
                          type="checkbox"
                          class="setting-checkbox"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div class="panel-section">
                    <h3 class="panel-title">Export Options</h3>
                    <div class="export-buttons">
                      <Button @click="exportConfiguration" variant="outline" size="sm" class="w-full">
                        Export Configuration
                      </Button>
                      <Button @click="exportVisualization" variant="outline" size="sm" class="w-full">
                        Export as Image
                      </Button>
                      <Button @click="exportData" variant="outline" size="sm" class="w-full">
                        Export Training Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
import ControlsGrid from '@/components/sections/ControlsGrid.vue'
import VisualizationControls from '@/components/sections/VisualizationControls.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import NeuralCanvas from '@/components/visualization/NeuralCanvas.vue'
import MetricsPanel from '@/components/visualization/MetricsPanel.vue'
import LossLandscape from '@/components/visualization/LossLandscape.vue'
import { Button } from '@/components/ui'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CalculatorIcon, 
  CogIcon,
  HeartIcon,
  XCircleIcon,
  Square3Stack3DIcon,
  BoltIcon,
  BoltIcon as SparklesIcon,
  ArrowPathIcon,
  ArrowPathIcon as ShuffleIcon,
  ExclamationTriangleIcon as NoiseIcon,
  ChartBarIcon as ChartScatterIcon,
  RocketLaunchIcon,
  CpuChipIcon as AcademicCapIcon,
  CpuChipIcon,
  Square3Stack3DIcon as LayersIcon
} from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import type { DataPoint } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

// Tab management
const activeTab = ref('metrics')
const tabs = [
  { id: 'metrics', label: 'Metrics', icon: ChartBarIcon },
  { id: 'presets', label: 'Presets', icon: DocumentTextIcon },
  { id: 'experiments', label: 'Experiments', icon: CalculatorIcon },
  { id: 'settings', label: 'Settings', icon: CogIcon }
]

// Settings
const animationSpeed = ref(1)
const gridQuality = ref('medium')
const autoSave = ref(false)

// Dataset presets
const datasetPresets = [
  {
    id: 'spiral',
    name: 'Spiral',
    description: 'Two interleaved spirals',
    icon: SparklesIcon
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
    icon: LayersIcon
  },
  {
    id: 'complex',
    name: 'Complex',
    description: '10+ neurons',
    icon: AcademicCapIcon
  }
]

// Data experiments
const dataExperiments = [
  {
    id: 'noise',
    name: 'Add Noise',
    description: 'Add random noise to data points',
    icon: SparklesIcon,
    type: 'warning'
  },
  {
    id: 'shuffle',
    name: 'Shuffle Labels',
    description: 'Randomly shuffle data labels',
    icon: ShuffleIcon,
    type: 'warning'
  },
  {
    id: 'outliers',
    name: 'Add Outliers',
    description: 'Add outlier data points',
    icon: ChartScatterIcon,
    type: 'destructive'
  }
]

// Training experiments
const trainingExperiments = [
  {
    id: 'boost',
    name: 'Learning Boost',
    description: 'Increase learning rate temporarily',
    icon: RocketLaunchIcon,
    type: 'success'
  },
  {
    id: 'reset',
    name: 'Random Reset',
    description: 'Reset random neurons',
    icon: ArrowPathIcon,
    type: 'warning'
  },
  {
    id: 'perturbation',
    name: 'Perturbation',
    description: 'Add small random changes',
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
  // Clear existing neurons
  store.neurons.splice(0)
  
  switch (type) {
    case 'simple':
      // Add 2-3 neurons in simple formation
      store.addNeuron(-0.3, 0)
      store.addNeuron(0.3, 0)
      if (Math.random() > 0.5) store.addNeuron(0, 0.4)
      break
    case 'medium':
      // Add 5-8 neurons in grid-like formation
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          store.addNeuron((i - 0.5) * 0.6, (j - 1) * 0.4)
        }
      }
      break
    case 'complex':
      // Add 10+ neurons in random formation
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

function generateSpiralData(): DataPoint[] {
  const data: DataPoint[] = []
  const n = 100
  
  for (let i = 0; i < n; i++) {
    const r = i / n * 0.8
    const t = 1.75 * i / n * 2 * Math.PI
    
    // Spiral 1
    data.push({
      x: r * Math.cos(t) + Math.random() * 0.1 - 0.05,
      y: r * Math.sin(t) + Math.random() * 0.1 - 0.05,
      label: 0
    })
    
    // Spiral 2
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

function runExperiment(type: string) {
  switch (type) {
    case 'noise':
      addNoise()
      break
    case 'shuffle':
      shuffleLabels()
      break
    case 'outliers':
      addOutliers()
      break
    case 'boost':
      learningBoost()
      break
    case 'reset':
      randomReset()
      break
    case 'perturbation':
      addPerturbation()
      break
  }
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
  
  // Fisher-Yates shuffle for labels
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

function addOutliers() {
  const outliers: DataPoint[] = []
  for (let i = 0; i < 10; i++) {
    outliers.push({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      label: Math.floor(Math.random() * Math.max(2, store.allClasses.length))
    })
  }
  
  store.setDataPoints([...store.dataPoints, ...outliers])
  
  notificationStore.addNotification({
    message: 'Outliers added to dataset!',
    type: 'warning'
  })
}

function learningBoost() {
  notificationStore.addNotification({
    message: 'Learning boost applied! Training will be faster for next 10 steps.',
    type: 'success'
  })
}

function randomReset() {
  if (store.neurons.length === 0) return
  
  const neuronToReset = store.neurons[Math.floor(Math.random() * store.neurons.length)]
  neuronToReset.x = (Math.random() - 0.5) * 2
  neuronToReset.y = (Math.random() - 0.5) * 2
  
  notificationStore.addNotification({
    message: `Neuron ${neuronToReset.id} position reset!`,
    type: 'warning'
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

function exportConfiguration() {
  notificationStore.addNotification({
    message: 'Configuration export not yet implemented!',
    type: 'info'
  })
}

function exportVisualization() {
  notificationStore.addNotification({
    message: 'Visualization export not yet implemented!',
    type: 'info'
  })
}

function exportData() {
  notificationStore.addNotification({
    message: 'Data export not yet implemented!',
    type: 'info'
  })
}
</script>

<style scoped>
/* Main container styles with theme support */
.main-container {
  background: var(--viz-overlay);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-heavy);
  transform: translateZ(0);
  will-change: transform;
}

.controls-section {
  margin-bottom: 1.5rem;
}

.visualization-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

/* Playground Layout */
.playground-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  min-height: 600px;
}

@media (max-width: 1280px) {
  .playground-layout {
    grid-template-columns: 1fr 350px;
  }
}

@media (max-width: 1024px) {
  .playground-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* Canvas Section */
.canvas-section {
  display: flex;
  flex-direction: column;
}

.canvas-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  min-height: 500px;
}

/* Tools Sidebar */
.tools-sidebar {
  display: flex;
  flex-direction: column;
}

.tools-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  height: fit-content;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-primary));
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-secondary));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  background: rgb(var(--bg-hover));
  color: rgb(var(--text-primary));
}

.tab-button.active {
  background: rgb(var(--bg-secondary));
  color: rgb(var(--color-primary));
  border-bottom-color: rgb(var(--color-primary));
}

/* Tab Content */
.tab-content {
  max-height: 70vh;
  overflow-y: auto;
}

.tab-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 0.5rem;
}

/* Preset Cards */
.preset-grid {
  display: grid;
  gap: 0.75rem;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.preset-card:hover {
  background: rgb(var(--bg-hover));
  border-color: rgb(var(--border-tertiary));
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.preset-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(var(--color-primary));
  color: white;
  border-radius: 6px;
  flex-shrink: 0;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 0.25rem;
}

.preset-description {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin: 0;
}

/* Experiment Cards */
.experiment-grid {
  display: grid;
  gap: 0.5rem;
}

.experiment-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.experiment-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.experiment-card.success {
  border-color: rgb(var(--color-success));
}

.experiment-card.success:hover {
  background: rgba(var(--color-success), 0.1);
}

.experiment-card.warning {
  border-color: rgb(var(--color-warning));
}

.experiment-card.warning:hover {
  background: rgba(var(--color-warning), 0.1);
}

.experiment-card.destructive {
  border-color: rgb(var(--color-destructive));
}

.experiment-card.destructive:hover {
  background: rgba(var(--color-destructive), 0.1);
}

.experiment-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.experiment-description {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin: 0;
}

/* Settings */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--text-primary));
}

.setting-slider {
  width: 100%;
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.setting-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.setting-select {
  padding: 0.5rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  color: rgb(var(--text-primary));
  font-size: 0.875rem;
}

.setting-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: rgb(var(--color-primary));
}

.setting-value {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin-top: 0.25rem;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .tab-nav {
    flex-wrap: wrap;
  }
  
  .tab-button {
    min-width: 50%;
  }
  
  .tab-panel {
    padding: 1rem;
  }
  
  .preset-card {
    padding: 0.75rem;
  }
  
  .preset-icon {
    width: 2rem;
    height: 2rem;
  }
}

/* Custom scrollbar for tab content */
.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
}

.tab-content::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}
</style>
