<template>
  <div class="glass-effect rounded-xl p-4 shadow-theme-medium border-theme-primary min-w-[200px]">
    <div class="grid grid-cols-1 gap-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-theme-secondary">Accuracy</span>
        <span class="metric-value">{{ accuracy.toFixed(1) }}%</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-theme-secondary">Data Points</span>
        <span class="metric-value">{{ dataPointsCount }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-theme-secondary">Neurons</span>
        <span class="metric-value">{{ neuronsCount }}</span>
      </div>
      
      <!-- Additional metrics -->
      <div v-if="showExtendedStats" class="border-t border-theme-primary pt-3 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-theme-secondary">Active Classes</span>
          <span class="metric-value">{{ activeClassesCount }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-theme-secondary">Grid Cells</span>
          <span class="metric-value">{{ estimatedGridCells }}</span>
        </div>
        <div v-if="avgLoss !== null" class="flex items-center justify-between">
          <span class="text-sm font-medium text-theme-secondary">Avg Loss</span>
          <span class="metric-value text-orange-500">{{ avgLoss.toFixed(3) }}</span>
        </div>
      </div>
      
      <!-- Toggle for extended stats -->
      <button
        @click="showExtendedStats = !showExtendedStats"
        class="text-xs text-blue-500 hover:text-blue-600 transition-colors mt-2"
      >
        {{ showExtendedStats ? 'Show Less' : 'Show More' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  accuracy: number
  dataPointsCount: number
  neuronsCount: number
  activeClassesCount: number
  canvasWidth: number
  canvasHeight: number
  cellSize: number
  avgLoss?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  avgLoss: null
})

const showExtendedStats = ref(false)

// Computed metrics
const estimatedGridCells = computed(() => {
  const cellsX = Math.ceil(props.canvasWidth / props.cellSize)
  const cellsY = Math.ceil(props.canvasHeight / props.cellSize)
  return cellsX * cellsY
})
</script>

<style scoped>
.metric-value {
  @apply text-lg font-bold text-blue-500;
}
</style> 