<template>
  <div class="control-card p-4 mb-6">
    <div class="flex flex-wrap items-center justify-center gap-4">
      <button 
        @click="toggleColorMode"
        class="modern-button px-6 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 flex items-center"
      >
        <EyeIcon class="w-5 h-5 mr-2" />
        {{ store.showPredictedColors ? 'Show Actual' : 'Show Predicted' }}
      </button>
      
      <button 
        @click="toggleBoundaries"
        class="modern-button px-6 py-2 text-sm font-semibold bg-gray-600 hover:bg-gray-700 flex items-center"
      >
        <Square3Stack3DIcon class="w-5 h-5 mr-2" />
        {{ store.showBoundaries ? 'Hide Boundaries' : 'Show Boundaries' }}
      </button>
      
      <button 
        @click="resetView"
        class="modern-button px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 flex items-center"
      >
        <ArrowPathIcon class="w-5 h-5 mr-2" />
        Reset View
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, Square3Stack3DIcon, ArrowPathIcon } from '@/components/ui/icons'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { useNotificationStore } from '@/stores/notification'

const store = useNeuralNetworkStore()
const notificationStore = useNotificationStore()

function toggleColorMode() {
  store.showPredictedColors = !store.showPredictedColors
}

function toggleBoundaries() {
  store.showBoundaries = !store.showBoundaries
}

function resetView() {
  store.reset()
  
  notificationStore.addNotification({
    message: 'View reset successfully!',
    type: 'success'
  })
}
</script>
