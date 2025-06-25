<template>
  <!-- Compact Neuron Details Panel -->
  <div 
    v-if="selectedNeuron" 
    class="neuron-details-panel"
  >
    <div class="panel-header">
      <div class="neuron-title">
        <div class="neuron-icon" :style="{ backgroundColor: selectedNeuron.color }"></div>
        <span class="neuron-name">N{{ selectedNeuron.id }}</span>
      </div>
      <button 
        @click="$emit('close')" 
        class="close-btn"
        title="Close Panel"
      >
        ×
      </button>
    </div>
    
    <div class="panel-content">
      <!-- Position Controls -->
      <div class="control-group">
        <label class="group-label">Position</label>
        <div class="coord-row">
          <div class="coord-input-group">
            <label class="coord-label">X</label>
            <input
              v-model.number="selectedNeuron.x"
              type="number"
              step="0.01"
              :min="coordinateRanges.xMin"
              :max="coordinateRanges.xMax"
              class="coord-input"
              @change="$emit('update-position')"
            />
          </div>
          <div class="coord-input-group">
            <label class="coord-label">Y</label>
            <input
              v-model.number="selectedNeuron.y"
              type="number"
              step="0.01"
              :min="coordinateRanges.yMin"
              :max="coordinateRanges.yMax"
              class="coord-input"
              @change="$emit('update-position')"
            />
          </div>
        </div>
      </div>

      <!-- Color Control -->
      <div class="control-group">
        <label class="group-label">Color</label>
        <input
          v-model="selectedNeuron.color"
          type="color"
          class="color-input"
          @change="$emit('update-color')"
        />
      </div>

      <!-- Neuron Stats -->
      <div class="control-group">
        <label class="group-label">Stats</label>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">Area</span>
            <span class="stat-value">{{ controlledArea.toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Score</span>
            <span class="stat-value">{{ averageScore.toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="control-group">
        <button
          @click="$emit('remove', selectedNeuron.id)"
          class="remove-btn"
          title="Remove Neuron"
        >
          Remove
        </button>
      </div>
    </div>
  </div>

  <!-- Compact Neurons List Panel -->
  <div 
    v-else-if="neurons.length > 0" 
    class="neurons-list-panel"
  >
    <div class="panel-header">
      <span class="list-title">Neurons ({{ neurons.length }})</span>
    </div>
    <div class="neurons-list">
      <div
        v-for="neuron in neurons"
        :key="neuron.id"
        class="neuron-item"
        @click="$emit('select', neuron)"
        :title="`Neuron ${neuron.id} at (${neuron.x.toFixed(2)}, ${neuron.y.toFixed(2)})`"
      >
        <div class="neuron-icon" :style="{ backgroundColor: neuron.color }"></div>
        <span class="neuron-label">N{{ neuron.id }}</span>
        <span class="neuron-coords">({{ neuron.x.toFixed(1) }}, {{ neuron.y.toFixed(1) }})</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Neuron } from '@/types'

interface Props {
  neurons: Neuron[]
  selectedNeuron: Neuron | null
  coordinateRanges: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  getControlledArea: (neuron: Neuron) => number
  getAverageScore: (neuron: Neuron) => number
}

interface Emits {
  (e: 'select', neuron: Neuron): void
  (e: 'close'): void
  (e: 'update-position'): void
  (e: 'update-color'): void
  (e: 'remove', neuronId: number): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Computed stats for selected neuron
const controlledArea = computed(() => 
  props.selectedNeuron ? props.getControlledArea(props.selectedNeuron) : 0
)

const averageScore = computed(() => 
  props.selectedNeuron ? props.getAverageScore(props.selectedNeuron) : 0
)

// Star path generator function
function generateStarPath(
  centerX: number, 
  centerY: number, 
  outerRadius: number = 12, 
  innerRadius: number = 5, 
  points: number = 5
): string {
  const angleIncrement = (Math.PI * 2) / points
  const halfAngleIncrement = angleIncrement / 2
  
  let path = ''
  
  for (let i = 0; i < points; i++) {
    // Outer point
    const outerAngle = i * angleIncrement - Math.PI / 2 // Start from top
    const outerX = centerX + Math.cos(outerAngle) * outerRadius
    const outerY = centerY + Math.sin(outerAngle) * outerRadius
    
    // Inner point
    const innerAngle = outerAngle + halfAngleIncrement
    const innerX = centerX + Math.cos(innerAngle) * innerRadius
    const innerY = centerY + Math.sin(innerAngle) * innerRadius
    
    if (i === 0) {
      path += `M ${outerX} ${outerY}`
    } else {
      path += ` L ${outerX} ${outerY}`
    }
    
    path += ` L ${innerX} ${innerY}`
  }
  
  path += ' Z' // Close the path
  return path
}
</script>

<style scoped>
/* Compact Neuron Management Panels */
.neuron-details-panel {
  width: 100%;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 11px;
}

.neurons-list-panel {
  width: 100%;
  max-height: 300px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 11px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-primary));
  border-radius: 6px 6px 0 0;
}

.neuron-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.neuron-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.neuron-name {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.list-title {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgb(var(--text-tertiary));
  cursor: pointer;
  border-radius: 2px;
  font-size: 14px;
  line-height: 1;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgb(var(--bg-tertiary));
  color: rgb(var(--text-secondary));
}

.panel-content {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-label {
  font-size: 9px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coord-row {
  display: flex;
  gap: 6px;
}

.coord-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coord-label {
  font-size: 8px;
  font-weight: 500;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}

.coord-input {
  width: 100%;
  padding: 4px 6px;
  font-size: 10px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  text-align: center;
}

.coord-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 1px rgb(var(--color-primary) / 0.2);
}

.color-input {
  width: 40px;
  height: 24px;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 3px;
  cursor: pointer;
  background: none;
  padding: 0;
}

.color-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
}

.stats-row {
  display: flex;
  gap: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 8px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}

.stat-value {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.remove-btn {
  padding: 6px 8px;
  font-size: 10px;
  font-weight: 500;
  background: rgb(var(--color-error));
  color: white;
  border: 1px solid rgb(var(--color-error));
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: rgb(var(--color-error-hover));
  border-color: rgb(var(--color-error-hover));
}

.neurons-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.neuron-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.neuron-item:hover {
  background: rgb(var(--bg-tertiary));
}

.neuron-label {
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-primary));
  min-width: 20px;
}

.neuron-coords {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  margin-left: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .coord-row {
    gap: 4px;
  }
  
  .coord-input {
    padding: 3px 4px;
    font-size: 9px;
  }
  
  .stats-row {
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .neuron-details-panel,
  .neurons-list-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 200px;
    z-index: 50;
  }
  
  .neurons-list-panel {
    max-height: 60vh;
  }
}

/* Custom scrollbar for neurons list */
.neurons-list::-webkit-scrollbar {
  width: 4px;
}

.neurons-list::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
}

.neurons-list::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 2px;
}

.neurons-list::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}
</style> 