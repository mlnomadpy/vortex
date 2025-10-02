<template>
  <section class="text-center mb-8">
    <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6 animate-bounce-gentle">
      <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
      </svg>
    </div>
    
    <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 bg-clip-text text-transparent mb-4 animate-fade-in">
      Neural Network Playground
    </h1>
    
    <h2 class="text-2xl font-semibold text-theme-secondary mb-4 animate-fade-in" style="animation-delay: 0.1s;">
      Classify Your Own Dataset
    </h2>
    
    <p class="text-lg text-theme-secondary max-w-4xl mx-auto leading-relaxed animate-fade-in" style="animation-delay: 0.2s;">
      🚀 Upload your dataset (CSV with x, y, label), then interactively build a neural network. 
      🎯 Click on the canvas to add neurons, optimize using gradient descent, and explore how different 
      settings affect classification. 📊 Visualize the loss landscape for each neuron in real-time.
    </p>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl mx-auto animate-fade-in" style="animation-delay: 0.3s;">
      <Tooltip content="Number of data points currently loaded">
        <div class="stats-card glass-effect rounded-xl p-4" role="status" aria-label="Data points count">
          <div class="text-2xl font-bold text-blue-500">{{ dataPointCount }}</div>
          <div class="text-sm text-theme-secondary">Data Points</div>
        </div>
      </Tooltip>
      <Tooltip content="Number of neurons (classifiers) in your network">
        <div class="stats-card glass-effect rounded-xl p-4" role="status" aria-label="Neurons count">
          <div class="text-2xl font-bold text-indigo-500">{{ neuronCount }}</div>
          <div class="text-sm text-theme-secondary">Neurons</div>
        </div>
      </Tooltip>
      <Tooltip content="Number of different classes in your dataset">
        <div class="stats-card glass-effect rounded-xl p-4" role="status" aria-label="Classes count">
          <div class="text-2xl font-bold text-purple-500">{{ classCount }}</div>
          <div class="text-sm text-theme-secondary">Classes</div>
        </div>
      </Tooltip>
      <Tooltip content="Current classification accuracy of your network">
        <div class="stats-card glass-effect rounded-xl p-4" role="status" aria-label="Accuracy percentage">
          <div class="text-2xl font-bold text-green-500">{{ accuracy }}%</div>
          <div class="text-sm text-theme-secondary">Accuracy</div>
        </div>
      </Tooltip>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip } from '@/components/ui'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'

const store = useNeuralNetworkStore()

const dataPointCount = computed(() => store.filteredDataPoints.length)
const neuronCount = computed(() => store.neurons.length)
const classCount = computed(() => store.allClasses.length)
const accuracy = computed(() => store.accuracy.toFixed(1))
</script>

<style scoped>
.stats-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: transform;
}

.stats-card:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: var(--shadow-light), var(--shadow-medium);
}

/* Performance optimization for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-bounce-gentle,
  .animate-fade-in {
    animation: none !important;
  }
  
  .stats-card {
    transition: none !important;
  }
}
</style>
