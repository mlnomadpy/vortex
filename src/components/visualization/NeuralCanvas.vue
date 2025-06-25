<template>
  <div class="control-card p-6 relative overflow-hidden">
    <!-- Click Instructions -->
    <div class="absolute top-4 right-4 z-10">
      <div class="flex items-center space-x-2 text-sm text-gray-600 bg-white/90 px-3 py-1 rounded-full">
        <CursorArrowRaysIcon class="w-4 h-4" />
        <span>Click to add neurons</span>
      </div>
    </div>
    
    <!-- SVG Canvas -->
    <svg
      ref="canvasRef"
      :width="canvasConfig.width"
      :height="canvasConfig.height"
      class="neural-canvas border border-gray-200 rounded-lg cursor-crosshair"
      style="max-width: 100%; height: auto;"
      @click="handleCanvasClick"
      @mouseleave="hideTooltip"
    >
      <!-- Canvas content is rendered by D3 -->
    </svg>

    <!-- Stats Card -->
    <StatsCard
      :accuracy="store.accuracy"
      :data-points-count="store.filteredDataPoints.length"
      :neurons-count="store.neurons.length"
      :active-classes-count="store.activeClasses.length"
      :canvas-width="canvasConfig.width"
      :canvas-height="canvasConfig.height"
      :cell-size="cellSize"
      :avg-loss="avgLoss"
    />

    <!-- Neuron Management Panels -->
    <NeuronManagement
      :neurons="store.neurons"
      :selected-neuron="selectedNeuron"
      :coordinate-ranges="store.coordinateRanges"
      :get-controlled-area="getControlledArea"
      :get-average-score="getAverageScore"
      @select="selectNeuron"
      @close="selectedNeuron = null"
      @update-position="updateNeuronPosition"
      @update-color="updateNeuronColor"
      @remove="removeNeuron"
    />
    
    <!-- Tooltip -->
    <CanvasTooltip
      :visible="tooltip.visible"
      :x="tooltip.x"
      :y="tooltip.y"
      :content="tooltip.content"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CursorArrowRaysIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNeuralCanvas } from '@/composables/useNeuralCanvas'
import StatsCard from './StatsCard.vue'
import NeuronManagement from './NeuronManagement.vue'
import CanvasTooltip from './CanvasTooltip.vue'
import type { Neuron } from '@/types'

interface Props {
  fullscreen?: boolean
}

const props = defineProps<Props>()
const store = useNeuralNetworkStore()

// Use the neural canvas composable
const {
  canvasRef,
  selectedNeuron,
  tooltip,
  canvasConfig,
  cellSize,
  handleCanvasClick,
  hideTooltip,
  updateNeuronPosition,
  updateNeuronColor,
  removeNeuron,
  getControlledArea,
  getAverageScore
} = useNeuralCanvas({
  width: 600,
  height: 600,
  fullscreen: props.fullscreen
})

// Computed average loss for stats
const avgLoss = computed(() => {
  if (store.filteredDataPoints.length === 0 || store.neurons.length === 0) {
    return null
  }
  return store.computeLoss(store.filteredDataPoints)
})

// Neuron selection
function selectNeuron(neuron: Neuron) {
  selectedNeuron.value = neuron
  store.selectedNeuronForLandscape = neuron
}
</script>

<style scoped>
.neural-canvas {
  transition: all 0.2s ease;
}

.neural-canvas:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Ensure D3 rendered elements have proper styles */
:deep(.grid-cell) {
  transition: stroke 0.1s ease-out, stroke-width 0.1s ease-out;
}

:deep(.grid-cell:hover) {
  stroke: rgb(156 163 175);
  stroke-width: 2;
}

:deep(.data-point) {
  opacity: 0.85;
  cursor: pointer;
  transition: stroke-width 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              filter 0.15s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.data-point:hover) {
  stroke-width: 4;
  filter: brightness(1.1);
  transform: scale(1.05);
}

:deep(.neuron) {
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: filter 0.2s ease;
}

:deep(.neuron:hover) {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}
</style>
