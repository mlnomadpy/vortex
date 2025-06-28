<template>
  <div class="min-h-screen photoshop-workspace">
    <AppHeader />
    
    <main class="workspace-main">
      <div class="workspace-container">
        
        <div class="text-center mb-4">
          <h1 class="text-3xl font-bold text-theme-primary mb-2">MNIST Neural Network Classifier</h1>
          <p class="text-sm text-theme-secondary">N-dimensional classification with weight visualization</p>
        </div>
        
        <!-- Central Visualization Area -->
        <div class="visualization-area">
          <div class="visualization-container" data-tour="mnist-canvas">
            <MNISTVisualization ref="mnistVisualization" />
            
            <!-- Controls Toolbar -->
            <div v-if="store.allClasses.length > 0" class="controls-toolbar-overlay">
              <MNISTClassToggles />
            </div>
          </div>
        </div>
        
        <!-- Floating Panels -->
        <FloatingPanel
          title="Dataset & Loading"
          :icon="DatabaseIcon"
          :initial-position="{ x: 10, y: 10 }"
          :width="380"
          :height="400"
          :z-index="150"
          @close="panels.dataset = false"
          v-if="panels.dataset"
          data-tour="dataset-panel"
        >
          <div class="dataset-content">
            <MNISTDataPanel />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="Weight Visualization"
          :icon="EyeIcon"
          :initial-position="{ x: 400, y: 10 }"
          :width="400"
          :height="500"
          :z-index="150"
          @close="panels.visualization = false"
          v-if="panels.visualization"
          data-tour="visualization-panel"
        >
          <div class="visualization-content">
            <MNISTVisualization />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="Network Configuration"
          :icon="CogIcon"
          :initial-position="{ x: 810, y: 10 }"
          :width="380"
          :height="450"
          :z-index="150"
          @close="panels.networkConfig = false"
          v-if="panels.networkConfig"
          data-tour="network-config-panel"
        >
          <div class="network-config-content">
            <MNISTNetworkConfig
              :similarity-metric="store.similarityMetric"
              :activation-function="store.activationFunction"
              @update-similarity="handleSimilarityUpdate"
              @update-activation="handleActivationUpdate"
              @initialize-ternary="handleInitializeTernary"
              @quantize-weights="handleQuantizeWeights"
              @refresh-stats="handleRefreshTernaryStats"
            />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="Training & Optimization"
          :icon="RocketLaunchIcon"
          :initial-position="{ x: 10, y: 420 }"
          :width="450"
          :height="400"
          :z-index="150"
          @close="panels.training = false"
          v-if="panels.training"
          data-tour="training-panel"
        >
          <div class="training-content">
            <MNISTTrainingPanel />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="Metrics & Performance"
          :icon="ChartBarIcon"
          :initial-position="{ x: 470, y: 420 }"
          :width="400"
          :height="400"
          :z-index="150"
          @close="panels.metrics = false"
          v-if="panels.metrics"
          data-tour="metrics-panel"
        >
          <div class="metrics-content">
            <MNISTMetricsPanel />
          </div>
        </FloatingPanel>
        
        <FloatingPanel
          title="API Status"
          :icon="CpuChipIcon"
          :initial-position="{ x: 880, y: 420 }"
          :width="400"
          :height="350"
          :z-index="150"
          @close="panels.apiStatus = false"
          v-if="panels.apiStatus"
          data-tour="api-status-panel"
        >
          <div class="api-status-content">
            <MNISTApiStatus />
          </div>
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
              <button @click="quickDemo" class="layout-btn demo-btn" title="Quick Demo">
                <BoltIcon class="btn-icon" />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import FloatingPanel from '@/components/ui/FloatingPanel.vue'

// MNIST-specific components (we'll create these)
import MNISTVisualization from '@/components/mnist/MNISTVisualization.vue'
import MNISTClassToggles from '@/components/mnist/MNISTClassToggles.vue'
import MNISTDataPanel from '@/components/mnist/MNISTDataPanel.vue'
import MNISTNetworkConfig from '@/components/mnist/MNISTNetworkConfig.vue'
import MNISTTrainingPanel from '@/components/mnist/MNISTTrainingPanel.vue'
import MNISTMetricsPanel from '@/components/mnist/MNISTMetricsPanel.vue'
import MNISTApiStatus from '@/components/mnist/MNISTApiStatus.vue'

// Icons
import { 
  ChartBarIcon, 
  DatabaseIcon, 
  EyeIcon,
  CogIcon,
  RocketLaunchIcon,
  Square3Stack3DIcon,
  BoltIcon,
  ArrowPathIcon,
  MinusIcon,
  CpuChipIcon
} from '@/components/ui/icons'

// Stores
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'
import { useNotificationStore } from '@/stores/notification'

const store = useMNISTClassifierStore()
const notificationStore = useNotificationStore()

const mnistVisualization = ref<InstanceType<typeof MNISTVisualization> | null>(null)

// Panel visibility state
const panels = reactive({
  dataset: true,       // Dataset loading and info
  visualization: true, // Weight and neuron visualization
  networkConfig: false, // Similarity metrics and activation functions
  training: false,     // Training controls and progress
  metrics: false,      // Performance metrics and charts
  apiStatus: false,    // JAX API connection status and control
})

// Initialize the app when mounted
onMounted(async () => {
  try {
    console.log('🚀 Initializing MNIST Classifier...')
    
    // Initialize API connection and load available datasets
    await store.initializeApiConnection()
    
    notificationStore.addNotification({
      message: store.apiConnected 
        ? 'Connected to API - Real datasets available' 
        : 'Using local computation - Synthetic data mode',
      type: store.apiConnected ? 'success' : 'info'
    })
    
    console.log('✅ MNIST Classifier initialized successfully')
    
  } catch (error) {
    console.error('❌ Failed to initialize MNIST Classifier:', error)
    notificationStore.addNotification({
      message: 'Failed to initialize classifier. Check console for details.',
      type: 'error'
    })
  }
})

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
    dataset: 'Dataset',
    visualization: 'Visualization',
    networkConfig: 'Network',
    training: 'Training',
    metrics: 'Metrics',
    apiStatus: 'API Status'
  }
  return names[key] || key
}

function getPanelIcon(key: string) {
  const icons: Record<string, any> = {
    dataset: DatabaseIcon,
    visualization: EyeIcon,
    networkConfig: CogIcon,
    training: RocketLaunchIcon,
    metrics: ChartBarIcon,
    apiStatus: CpuChipIcon
  }
  return icons[key] || CpuChipIcon
}

function resetPanelPositions() {
  // Reset classifier and all associated state
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
    message: 'MNIST classifier and panel layout have been reset',
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

async function quickDemo() {
  try {
    notificationStore.addNotification({
      message: 'Setting up quick demo with synthetic MNIST data...',
      type: 'info'
    })
    
    // Quick test setup
    await store.quickTest(200)
    
    // Show relevant panels
    panels.dataset = true
    panels.visualization = true
    panels.training = true
    panels.metrics = true
    panels.apiStatus = true
    
    notificationStore.addNotification({
      message: 'Quick demo ready! You can now start training.',
      type: 'success'
    })
    
  } catch (error) {
    notificationStore.addNotification({
      message: `Failed to setup demo: ${error}`,
      type: 'error'
    })
  }
}

function handleSimilarityUpdate(value: string) {
  store.similarityMetric = value as any
  notificationStore.addNotification({
    message: `Similarity metric changed to ${value}!`,
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

async function handleInitializeTernary() {
  try {
    console.log('🔧 Initializing ternary weights...')
    await store.initializeTernaryWeights()
    notificationStore.addNotification({
      message: 'Network initialized with ternary weights (-1, 0, 1)',
      type: 'success'
    })
  } catch (error) {
    console.error('❌ Failed to initialize ternary weights:', error)
    notificationStore.addNotification({
      message: 'Failed to initialize ternary weights. Check API connection.',
      type: 'error'
    })
  }
}

async function handleQuantizeWeights() {
  try {
    console.log('⚡ Quantizing weights to ternary...')
    await store.quantizeWeightsToTernary()
    notificationStore.addNotification({
      message: 'Current weights quantized to ternary values',
      type: 'success'
    })
  } catch (error) {
    console.error('❌ Failed to quantize weights:', error)
    notificationStore.addNotification({
      message: 'Failed to quantize weights. Check API connection.',
      type: 'error'
    })
  }
}

async function handleRefreshTernaryStats() {
  try {
    console.log('📊 Refreshing ternary stats...')
    await store.refreshTernaryStats()
    notificationStore.addNotification({
      message: 'Ternary weight statistics updated',
      type: 'info'
    })
  } catch (error) {
    console.error('❌ Failed to refresh ternary stats:', error)
    notificationStore.addNotification({
      message: 'Could not refresh ternary statistics',
      type: 'warning'
    })
  }
}
</script>

<style scoped>
/* Photoshop-style workspace similar to Playground but adapted for MNIST */
.photoshop-workspace {
  background: #333333;
  color: #cccccc;
  min-height: 100vh;
  position: relative;
}

.workspace-main {
  padding: 0;
  margin: 0;
}

.workspace-container {
  padding: 16px 16px 16px 80px; /* Add left padding for sidebar */
  height: calc(100vh - 60px);
  position: relative;
}

/* Central Visualization Area */
.visualization-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 200px);
  position: relative;
  z-index: 1;
}

.visualization-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid #464647;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  width: 800px;
  height: 600px;
  position: relative;
}

/* Controls Toolbar Overlay */
.controls-toolbar-overlay {
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

.layout-btn.demo-btn {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.layout-btn.demo-btn:hover {
  background: #218838;
  border-color: #218838;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Panel Content Styles */
.dataset-content,
.visualization-content,
.network-config-content,
.training-content,
.metrics-content,
.inference-content {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .visualization-container {
    width: 700px;
    height: 500px;
  }
}

@media (max-width: 1024px) {
  .visualization-container {
    width: 600px;
    height: 450px;
  }
}

@media (max-width: 768px) {
  .workspace-container {
    padding: 8px 8px 8px 72px;
  }
  
  .visualization-container {
    width: 500px;
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
}
</style> 