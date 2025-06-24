<template>
  <div 
    v-if="store.allClasses.length > 0"
    class="flex flex-wrap gap-3 justify-center mb-6 p-4 glass-effect rounded-2xl"
  >
    <button
      v-for="classLabel in sortedClasses"
      :key="classLabel"
      @click="store.toggleClass(classLabel)"
      :class="[
        'class-toggle px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 cursor-pointer',
        store.activeClasses.includes(classLabel) ? 'active scale-105 shadow-lg' : 'opacity-70 grayscale hover:scale-102'
      ]"
      :style="{ 
        backgroundColor: getClassColor(classLabel),
        boxShadow: store.activeClasses.includes(classLabel) ? `0 0 20px 2px ${getClassColor(classLabel)}40` : ''
      }"
    >
      Class {{ classLabel }}
      <span class="ml-2 text-xs opacity-75">
        ({{ getClassCount(classLabel) }})
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'

const store = useNeuralNetworkStore()

const sortedClasses = computed(() => 
  [...store.allClasses].sort((a, b) => a - b)
)

function getClassColor(classLabel: number) {
  return `hsl(${(classLabel * 360 / 10) % 360}, 70%, 60%)`
}

function getClassCount(classLabel: number) {
  return store.dataPoints.filter(point => point.label === classLabel).length
}
</script>

<style scoped>
/* Glass effect styles moved from global CSS */
.glass-effect {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateZ(0);
  will-change: transform;
}

.class-toggle.active {
  filter: brightness(100%);
  transform: scale(1.05);
}

.class-toggle:not(.active) {
  filter: brightness(60%) grayscale(30%);
  opacity: 0.7;
}

.class-toggle:hover {
  transform: scale(1.02);
}
</style>
