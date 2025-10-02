<template>
  <div 
    v-if="showDebug" 
    class="fixed top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 min-w-[200px]"
  >
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-bold text-yellow-500">Grid Updates</h3>
      <Button 
        variant="ghost"
        size="icon-sm"
        class="text-theme-tertiary hover:text-white"
        @click="showDebug = false"
      >
        ×
      </Button>
    </div>
    
    <div class="space-y-1">
      <div class="flex justify-between">
        <span>Queue Size:</span>
        <span :class="queueSizeColor">{{ stats.queueSize }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>Processing:</span>
        <span :class="stats.isProcessing ? 'text-orange-500' : 'text-green-500'">
          {{ stats.isProcessing ? 'Yes' : 'No' }}
        </span>
      </div>
      
      <div class="flex justify-between">
        <span>Registered Grids:</span>
        <span class="text-blue-500">{{ stats.registeredGrids }}</span>
      </div>
      
      <div class="flex justify-between">
        <span>Last Update:</span>
        <span class="text-theme-tertiary">{{ lastUpdateText }}</span>
      </div>
      
      <div v-if="recentUpdates.length > 0" class="border-t border-theme-secondary pt-2 mt-2">
        <div class="text-yellow-500 mb-1">Recent Updates:</div>
        <div class="max-h-24 overflow-y-auto space-y-1 momentum-scroll scrollbar-thin">
          <div 
            v-for="update in recentUpdates.slice(0, 5)" 
            :key="update.id"
            class="text-xs text-theme-tertiary"
          >
            <span class="text-cyan-500">{{ update.type }}</span>
            <span v-if="update.metadata" class="text-theme-tertiary">
              • {{ formatMetadata(update.metadata) }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="border-t border-theme-secondary pt-2 mt-2">
        <Button 
          variant="destructive"
          size="xs"
          :disabled="stats.queueSize === 0"
          @click="flushUpdates"
        >
          Flush Queue
        </Button>
      </div>
    </div>
  </div>
  
  <!-- Toggle button when debug panel is hidden -->
  <Button
    v-else
    variant="secondary"
    size="icon-sm"
    class="fixed top-4 left-4 bg-black/60 text-white z-50 hover:bg-black/80"
    title="Show Grid Update Debug"
    @click="showDebug = true"
  >
    🔧
  </Button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui'
import { gridUpdateService, gridUpdateStats, type GridUpdateRequest } from '@/services/gridUpdateService'

const showDebug = ref(false)
const recentUpdates = ref<GridUpdateRequest[]>([])

// Computed properties
const stats = computed(() => gridUpdateStats.value)

const queueSizeColor = computed(() => {
  const size = stats.value.queueSize
  if (size === 0) return 'text-green-500'
  if (size < 5) return 'text-yellow-500'
  return 'text-red-500'
})

const lastUpdateText = computed(() => {
  if (stats.value.lastUpdateTime === 0) return 'Never'
  const diff = Date.now() - stats.value.lastUpdateTime
  if (diff < 1000) return `${diff}ms ago`
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  return `${Math.floor(diff / 60000)}m ago`
})

// Functions
function formatMetadata(metadata: any): string {
  if (!metadata) return ''
  
  if (metadata.neuronId !== undefined) {
    return `neuron ${metadata.neuronId}`
  }
  
  if (metadata.changeType) {
    return metadata.changeType
  }
  
  if (metadata.enabled !== undefined) {
    return metadata.enabled ? 'enabled' : 'disabled'
  }
  
  return JSON.stringify(metadata).slice(0, 20)
}

function flushUpdates(): void {
  gridUpdateService.flushUpdates()
}

// Track recent updates by intercepting the service
let originalScheduleUpdate: any

onMounted(() => {
  // Intercept schedule update to track recent updates
  originalScheduleUpdate = gridUpdateService.scheduleUpdate.bind(gridUpdateService)
  
  gridUpdateService.scheduleUpdate = function(type, metadata, customPriority, gridId) {
    const request: GridUpdateRequest = {
      id: gridId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: customPriority || 'normal',
      timestamp: Date.now(),
      metadata
    }
    
    // Add to recent updates
    recentUpdates.value.unshift(request)
    if (recentUpdates.value.length > 20) {
      recentUpdates.value = recentUpdates.value.slice(0, 20)
    }
    
    // Call original method
    return originalScheduleUpdate(type, metadata, customPriority, gridId)
  }

  // Keyboard shortcut to toggle debug
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'G') {
      showDebug.value = !showDebug.value
      event.preventDefault()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  return () => {
    document.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  // Restore original method
  if (originalScheduleUpdate) {
    gridUpdateService.scheduleUpdate = originalScheduleUpdate
  }
})
</script>

<style scoped>
/* Smooth transitions for debug panel */
.debug-panel {
  transition: all 0.2s ease;
}

/* Scrollbar styling for recent updates */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
        background: rgb(var(--bg-secondary) / 0.1);
}

::-webkit-scrollbar-thumb {
        background: rgb(var(--bg-secondary) / 0.3);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
        background: rgb(var(--bg-secondary) / 0.5);
}
</style> 