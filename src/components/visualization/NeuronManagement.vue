<template>
  <!-- Neuron Details Panel -->
  <div 
    v-if="selectedNeuron" 
    class="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[280px] max-w-[350px]"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-lg text-gray-800 flex items-center">
        <div class="w-4 h-4 mr-2 relative">
          <svg class="w-full h-full" viewBox="0 0 24 24">
            <path 
              :d="generateStarPath(12, 12, 8, 3)"
              :fill="selectedNeuron.color"
              stroke="black"
              stroke-width="1"
            />
          </svg>
        </div>
        Neuron {{ selectedNeuron.id }}
      </h3>
      <button 
        @click="$emit('close')" 
        class="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="space-y-3">
      <!-- Position Controls -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-500 mb-1">X</label>
            <input
              v-model.number="selectedNeuron.x"
              type="number"
              step="0.01"
              :min="coordinateRanges.xMin"
              :max="coordinateRanges.xMax"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="$emit('update-position')"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Y</label>
            <input
              v-model.number="selectedNeuron.y"
              type="number"
              step="0.01"
              :min="coordinateRanges.yMin"
              :max="coordinateRanges.yMax"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="$emit('update-position')"
            />
          </div>
        </div>
      </div>

      <!-- Color Control -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <input
          v-model="selectedNeuron.color"
          type="color"
          class="w-full h-8 border border-gray-300 rounded cursor-pointer"
          @change="$emit('update-color')"
        />
      </div>

      <!-- Neuron Stats -->
      <div class="border-t pt-3">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600">Controlled Area:</span>
            <span class="font-medium">{{ controlledArea.toFixed(1) }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Avg. Score:</span>
            <span class="font-medium">{{ averageScore.toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t pt-3">
        <button
          @click="$emit('remove', selectedNeuron.id)"
          class="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Remove Neuron
        </button>
      </div>
    </div>
  </div>

  <!-- Neurons List Panel -->
  <div 
    v-else-if="neurons.length > 0" 
    class="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 min-w-[250px]"
  >
    <h3 class="font-bold text-lg text-gray-800 mb-3">
      Neurons ({{ neurons.length }})
    </h3>
    <div class="space-y-2 max-h-48 overflow-y-auto">
      <div
        v-for="neuron in neurons"
        :key="neuron.id"
        class="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
        @click="$emit('select', neuron)"
      >
        <div class="flex items-center">
          <div class="w-3 h-3 mr-2 relative">
            <svg class="w-full h-full" viewBox="0 0 24 24">
              <path 
                :d="generateStarPath(12, 12, 8, 3)"
                :fill="neuron.color"
                stroke="black"
                stroke-width="1"
              />
            </svg>
          </div>
          <span class="text-sm font-medium">Neuron {{ neuron.id }}</span>
        </div>
        <div class="text-xs text-gray-500">
          ({{ neuron.x.toFixed(2) }}, {{ neuron.y.toFixed(2) }})
        </div>
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