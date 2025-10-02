<template>
  <div 
    v-if="store.allClasses.length > 0"
    class="class-toolbar mb-4 momentum-scroll scrollbar-thin"
  >
    <div class="section-label">
      <span>Classes</span>
    </div>
    <div class="class-buttons">
      <Button
        v-for="classLabel in sortedClasses"
        :key="classLabel"
        :variant="store.activeClasses.includes(classLabel) ? 'default' : 'outline'"
        size="xs"
        :class="`class-btn ${store.activeClasses.includes(classLabel) ? 'active' : 'inactive'}`"
        :style="{ 
          '--class-color': getClassColor(classLabel)
        }"
        :title="`Class ${classLabel} (${getClassCount(classLabel)} points)`"
        @click="store.toggleClass(classLabel)"
      >
        <div class="class-indicator"></div>
        <span class="class-label">{{ classLabel }}</span>
        <span class="class-count">{{ getClassCount(classLabel) }}</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNeuralNetworkStore } from '@/stores/neuralNetwork'
import { Button } from '@/components/ui'
import { getClassColor } from '@/utils/colors'

const store = useNeuralNetworkStore()

const sortedClasses = computed(() => 
  [...store.allClasses].sort((a, b) => a - b)
)

function getClassCount(classLabel: number) {
  return store.dataPoints.filter(point => point.label === classLabel).length
}
</script>

<style scoped>
/* Compact Class Toolbar */
.class-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-height: 28px;
  overflow-x: auto;
  white-space: nowrap;
}

.section-label {
  font-size: 8px;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
}

.class-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.class-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  font-size: 8px;
  font-weight: 500;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 2px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.1s ease;
  white-space: nowrap;
  min-height: 18px;
  position: relative;
  flex-shrink: 0;
}

.class-btn:hover {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-tertiary));
  transform: translateY(-1px);
}

.class-btn.active {
  background: var(--class-color);
  color: white;
  border-color: var(--class-color);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.class-btn.inactive {
  opacity: 0.6;
  filter: grayscale(50%);
}

.class-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--class-color);
  border: 1px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.class-btn.active .class-indicator {
  background: white;
  border-color: rgba(255, 255, 255, 0.8);
}

.class-label {
  font-size: 7px;
  font-weight: 600;
}

.class-count {
  font-size: 6px;
  opacity: 0.8;
  font-weight: 400;
}

/* Custom scrollbar */
.class-toolbar::-webkit-scrollbar {
  height: 3px;
}

.class-toolbar::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
}

.class-toolbar::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 2px;
}

.class-toolbar::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}

/* Keep single line on all screen sizes */
@media (max-width: 768px) {
  .class-toolbar {
    gap: 4px;
    padding: 2px 4px;
    min-height: 24px;
  }
  
  .class-buttons {
    gap: 1px;
  }
  
  .class-btn {
    padding: 1px 3px;
    min-height: 16px;
  }
  
  .section-label {
    font-size: 7px;
  }
  
  .class-count {
    display: none;
  }
  
  .class-label {
    font-size: 6px;
  }
  
  .class-indicator {
    width: 5px;
    height: 5px;
  }
}
</style>
