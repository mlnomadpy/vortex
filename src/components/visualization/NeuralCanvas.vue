<template>
  <div class="control-card p-6 relative overflow-hidden">
    <!-- Interactive Canvas -->
    <InteractiveCanvas
      ref="canvasComponent"
      :width="600"
      :height="600"
      :fullscreen="props.fullscreen"
      :show-instructions="true"
    />
    
    <!-- Stats Card -->
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

    <!-- Neuron Management Panels -->
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import StatsCard from './StatsCard.vue'
import NeuronManagement from './NeuronManagement.vue'
import InteractiveCanvas from './InteractiveCanvas.vue'
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
/* Styles are now handled by InteractiveCanvas component */
</style>
