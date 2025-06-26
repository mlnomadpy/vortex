<template>
  <div class="neural-canvas-layout">
    <InteractiveCanvas
      ref="canvasComponent"
      :width="600"
      :height="600"
      :fullscreen="props.fullscreen"
      :show-instructions="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineExpose } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
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

defineExpose({
  canvasComponent,
  avgLoss,
  selectNeuron
})
</script>

<style scoped>
.neural-canvas-layout {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
