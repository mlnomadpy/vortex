<template>
  <div class="min-h-screen">
    <AppHeader />
    
    <main class="container mx-auto px-6 py-8 max-w-7xl">
      <div class="main-container p-8">
        
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Neural Network Playground</h1>
          <p class="text-lg text-gray-600">Experiment freely with neural network configurations</p>
        </div>
        
        <!-- Enhanced Controls for Playground -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div class="lg:col-span-3">
            <ControlsGrid />
          </div>
          <div>
            <!-- Quick presets -->
            <div class="control-card p-6">
              <h3 class="font-bold text-lg text-gray-800 mb-4">Quick Presets</h3>
              <div class="space-y-2">
                <button 
                  @click="loadPreset('spiral')"
                  class="modern-button px-4 py-2 text-sm w-full"
                >
                  Spiral Dataset
                </button>
                <button 
                  @click="loadPreset('clusters')"
                  class="modern-button px-4 py-2 text-sm w-full"
                >
                  Clustered Data
                </button>
                <button 
                  @click="loadPreset('xor')"
                  class="modern-button px-4 py-2 text-sm w-full"
                >
                  XOR Problem
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <VisualizationControls />
        <ClassToggles />
        
        <!-- Main playground area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2">
            <NeuralCanvas />
          </div>
          <div class="flex flex-col gap-6">
            <MetricsPanel />
            <LossLandscape />
            
            <!-- Additional playground controls -->
            <div class="control-card p-6">
              <h3 class="font-bold text-lg text-gray-800 mb-4">Experiments</h3>
              <div class="space-y-3">
                <button 
                  @click="runExperiment('noise')"
                  class="modern-button px-4 py-2 text-sm w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  Add Noise
                </button>
                <button 
                  @click="runExperiment('shuffle')"
                  class="modern-button px-4 py-2 text-sm w-full bg-orange-600 hover:bg-orange-700"
                >
                  Shuffle Labels
                </button>
                <button 
                  @click="runExperiment('cluster')"
                  class="modern-button px-4 py-2 text-sm w-full bg-teal-600 hover:bg-teal-700"
                >
                  Auto-cluster
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import ControlsGrid from '@/components/sections/ControlsGrid.vue'
import VisualizationControls from '@/components/sections/VisualizationControls.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import NeuralCanvas from '@/components/visualization/NeuralCanvas.vue'
import MetricsPanel from '@/components/visualization/MetricsPanel.vue'
import LossLandscape from '@/components/visualization/LossLandscape.vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'
import type { DataPoint } from '@/types'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

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
  }
  
  store.setDataPoints(data)
  
  notificationStore.addNotification({
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} dataset loaded!`,
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

function runExperiment(type: string) {
  switch (type) {
    case 'noise':
      addNoise()
      break
    case 'shuffle':
      shuffleLabels()
      break
    case 'cluster':
      autoCluster()
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

function autoCluster() {
  // Simple k-means-like clustering
  notificationStore.addNotification({
    message: 'Auto-clustering not yet implemented!',
    type: 'info'
  })
}
</script>

<style scoped>
/* Main container styles moved from global CSS */
.main-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: translateZ(0);
  will-change: transform;
}
</style>
