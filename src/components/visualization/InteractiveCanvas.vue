<template>
  <div 
    :class="[
      'interactive-canvas-container',
      { 
        'fullscreen-mode': fullscreen,
        'regular-mode': !fullscreen
      }
    ]"
  >
    <!-- Click Instructions (only in regular mode) -->
    <div v-if="!fullscreen" class="absolute top-4 right-4 z-10">
      <div class="flex items-center space-x-2 text-sm text-theme-secondary glass-effect px-3 py-1 rounded-full">
        <CursorArrowRaysIcon class="w-4 h-4" />
        <span>Click to add neurons</span>
      </div>
    </div>
    
    <!-- SVG Canvas -->
    <svg
      ref="canvasRef"
      :width="canvasConfig.width"
      :height="canvasConfig.height"
      :class="canvasClasses"
      :style="canvasStyles"
      @click="handleCanvasClick"
      @mouseleave="hideTooltip"
    >
      <!-- Canvas content is rendered by D3 -->
    </svg>
    
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
import { useNeuralCanvas } from '@/composables/useNeuralCanvas'
import CanvasTooltip from './CanvasTooltip.vue'

export interface InteractiveCanvasProps {
  width?: number
  height?: number
  fullscreen?: boolean
  showInstructions?: boolean
}

const props = withDefaults(defineProps<InteractiveCanvasProps>(), {
  width: 600,
  height: 600,
  fullscreen: false,
  showInstructions: true
})

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
  width: props.width,
  height: props.height,
  fullscreen: props.fullscreen
})

// Development mode check
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// Dynamic canvas classes based on mode
const canvasClasses = computed(() => [
  'interactive-canvas',
  {
    'fullscreen-canvas': props.fullscreen,
    'regular-canvas': !props.fullscreen,
    'cursor-crosshair': !props.fullscreen
  }
])

// Dynamic canvas styles based on mode
const canvasStyles = computed(() => {
  if (props.fullscreen) {
    return {
      maxWidth: '100%',
      maxHeight: '100%',
      width: 'auto',
      height: 'auto'
    }
  }
  return {
    maxWidth: '100%',
    height: 'auto'
  }
})

// Expose composable functions and state for parent components
defineExpose({
  selectedNeuron,
  cellSize,
  canvasConfig,
  updateNeuronPosition,
  updateNeuronColor,
  removeNeuron,
  getControlledArea,
  getAverageScore
})
</script>

<style scoped>
/* Container Styles */
.interactive-canvas-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.regular-mode {
  overflow: hidden;
}

.fullscreen-mode {
  width: 100%;
  height: 100%;
          background: rgb(var(--canvas-bg));
}

/* Canvas Base Styles */
.interactive-canvas {
  transition: all 0.2s ease;
  user-select: none;
}

/* Regular Mode Canvas */
.regular-canvas {
  border: 1px solid rgb(var(--canvas-border));
  border-radius: 0.5rem;
  background: rgb(var(--canvas-bg));
  box-shadow: var(--shadow-light);
}

.regular-canvas:hover {
  box-shadow: var(--shadow-medium);
  border-color: rgb(var(--canvas-hover-border));
}

/* Fullscreen Mode Canvas */
.fullscreen-canvas {
  border: 2px solid var(--interactive-border);
  border-radius: 8px;
  background: rgb(var(--canvas-bg));
  box-shadow: 
    var(--shadow-heavy),
    inset 0 1px 0 var(--interactive-border);
}

.fullscreen-canvas:hover {
  border-color: var(--interactive-border-hover);
  box-shadow: 
    var(--shadow-heavy),
    var(--viz-glow),
    inset 0 1px 0 var(--interactive-border);
}

/* Cursor Styles */
.cursor-crosshair {
  cursor: crosshair;
}

.fullscreen-canvas {
  cursor: crosshair;
}

/* D3 Element Styles - Shared between modes */
:deep(.grid-cell) {
  transition: stroke 0.1s ease-out, stroke-width 0.1s ease-out;
}

:deep(.grid-cell:hover) {
          stroke: rgb(var(--canvas-grid));
  stroke-width: 2;
}

/* Data Point Styles */
:deep(.data-point) {
  opacity: 0.85;
  cursor: pointer;
  transition: 
    stroke-width 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.data-point:hover) {
  stroke-width: 4;
  filter: brightness(1.1);
  transform: scale(1.05);
}

/* Regular mode data points */
.regular-mode :deep(.data-point) {
  filter: drop-shadow(0 1px 2px var(--shadow-light));
}

.regular-mode :deep(.data-point:hover) {
  filter: brightness(1.1) drop-shadow(0 2px 4px var(--shadow-medium));
}

/* Fullscreen mode data points */
.fullscreen-mode :deep(.data-point) {
  filter: drop-shadow(0 2px 4px var(--shadow-medium));
}

.fullscreen-mode :deep(.data-point:hover) {
  filter: brightness(1.2) drop-shadow(0 4px 8px var(--shadow-heavy));
}

/* Neuron Styles */
:deep(.neuron) {
  cursor: pointer;
}

/* Regular mode neurons */
.regular-mode :deep(.neuron) {
        filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.2));
}

/* Fullscreen mode neurons */
.fullscreen-mode :deep(.neuron) {
        filter: 
        drop-shadow(0 2px 4px rgb(0 0 0 / 0.4))
        drop-shadow(0 0 8px rgb(255 255 255 / 0.1));
}

/* Grid Styles for Fullscreen */
.fullscreen-mode :deep(.grid-cell) {
  stroke: var(--interactive-border);
}

.fullscreen-mode :deep(.grid-cell:hover) {
  stroke: var(--interactive-border-hover);
  stroke-width: 1.5;
}

/* Axes Styles */
.regular-mode :deep(.axes-group line) {
  stroke: rgb(var(--canvas-grid));
}

.fullscreen-mode :deep(.axes-group line) {
  stroke: var(--interactive-border-hover);
}

/* Animation for smooth transitions */
.interactive-canvas-container {
  transition: background-color 0.3s ease;
}

.interactive-canvas {
  will-change: transform;
}

/* High DPI / Retina support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .interactive-canvas {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
</style> 