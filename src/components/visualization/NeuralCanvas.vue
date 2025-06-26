<template>
  <div class="neural-canvas-layout">
    <!-- Full-width canvas at the top -->
    <div class="canvas-container" data-tour="neural-canvas">
      <InteractiveCanvas
        ref="canvasComponent"
        :width="600"
        :height="600"
        :fullscreen="props.fullscreen"
        :show-instructions="true"
      />
    </div>

    <!-- Bottom section with stats, neuron management, and visualization panels -->
    <div class="bottom-section">
      <!-- Left Column: Stats and Optimization Controls -->
      <div class="left-column">
        <div class="stats-container">
          <StatsCard
            :accuracy="store.accuracy"
            :data-points-count="store.filteredDataPoints.length"
            :neurons-count="store.neurons.length"
            :active-classes-count="store.activeClasses.length"
            :canvas-width="canvasComponent?.canvasConfig?.width || 600"
            :canvas-height="canvasComponent?.canvasConfig?.height || 600"
            :cell-size="canvasComponent?.cellSize || 0"
            :avg-loss="avgLoss"
          />
        </div>
        
        <div class="optimization-container">
          <OptimizationControls />
        </div>
      </div>

      <!-- Middle Column: Neuron Management -->
      <div class="neuron-management-container">
        <NeuronManagement
          v-if="canvasComponent"
          :neurons="store.neurons"
          :selected-neuron="canvasComponent.selectedNeuron"
          :coordinate-ranges="store.coordinateRanges"
          :get-controlled-area="canvasComponent.getControlledArea"
          :get-average-score="canvasComponent.getAverageScore"
          @select="selectNeuron"
          @close="() => canvasComponent!.selectedNeuron = null"
          @update-position="canvasComponent.updateNeuronPosition"
          @update-color="canvasComponent.updateNeuronColor"
          @remove="canvasComponent.removeNeuron"
        />
      </div>

      <!-- Right Column: Loss History and Landscape -->
      <div class="right-column">
        <div class="loss-history-container">
          <LossHistoryChart />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import StatsCard from './StatsCard.vue'
import NeuronManagement from './NeuronManagement.vue'
import InteractiveCanvas from './InteractiveCanvas.vue'
import LossHistoryChart from './LossHistoryChart.vue'
import OptimizationControls from './OptimizationControls.vue'
import type { Neuron } from '@/types'

interface Props {
  fullscreen?: boolean
}

const props = defineProps<Props>()
const store = useNeuralNetworkStore()

// Reference to the interactive canvas component
const canvasComponent = ref<InstanceType<typeof InteractiveCanvas> | null>(null)

// Computed average loss for stats
const avgLoss = computed(() => {
  if (store.filteredDataPoints.length === 0 || store.neurons.length === 0) {
    return null
  }
  return store.computeLoss(store.filteredDataPoints)
})

// Neuron selection
function selectNeuron(neuron: Neuron) {
  if (canvasComponent.value) {
    canvasComponent.value.selectedNeuron = neuron
    store.selectedNeuronForLandscape = neuron
  }
}
</script>

<style scoped>
.neural-canvas-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.canvas-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(var(--bg-primary));
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--border-primary));
  padding: 1rem;
}

.bottom-section {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 0 0 250px;
}

.stats-container {
  display: flex;
  justify-content: flex-start;
}

.optimization-container {
  display: flex;
  justify-content: flex-start;
}

.neuron-management-container {
  flex: 1;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 0.5rem;
  overflow: hidden;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 0 0 320px;
}

.loss-history-container {
  display: flex;
  justify-content: flex-start;
}

.loss-landscape-container {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Responsive design for smaller screens */
@media (max-width: 1200px) {
  .bottom-section {
    flex-direction: column;
  }
  
  .stats-container,
  .neuron-management-container,
  .loss-landscape-container {
    flex: none;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .neural-canvas-layout {
    gap: 1rem;
  }
  
  .canvas-container {
    padding: 0.5rem;
  }
  
  .bottom-section {
    gap: 1rem;
  }
}
</style>
