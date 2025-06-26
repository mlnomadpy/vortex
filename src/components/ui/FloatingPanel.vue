<template>
  <div 
    class="floating-panel"
    :class="{ 
      'is-minimized': isMinimized,
      'is-dragging': isDragging 
    }"
    :style="{ 
      transform: `translate(${position.x}px, ${position.y}px)`,
      width: width ? `${width}px` : 'auto',
      zIndex: zIndex 
    }"
    @mousedown="startDrag"
  >
    <!-- Panel Header -->
    <div class="panel-header" @mousedown="handleHeaderMouseDown">
      <div class="panel-title-section">
        <component v-if="icon" :is="icon" class="panel-icon" />
        <span class="panel-title">{{ title }}</span>
      </div>
      <div class="panel-controls">
        <button 
          @click="toggleMinimize" 
          class="panel-control-btn"
          title="Minimize"
        >
          <component :is="isMinimized ? 'ChevronDownIcon' : 'MinusIcon'" class="w-3 h-3" />
        </button>
        <button 
          v-if="closable"
          @click="$emit('close')" 
          class="panel-control-btn close-btn"
          title="Close"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
      </div>
    </div>
    
    <!-- Panel Content -->
    <div v-if="!isMinimized" class="panel-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { XMarkIcon, ChevronDownIcon } from '@/components/ui/icons'

// Create MinusIcon if it doesn't exist
import { h } from 'vue'

const MinusIcon = {
  render() {
    return h('svg', {
      class: 'w-3 h-3',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M20 12H4'
      })
    ])
  }
}

interface Props {
  title: string
  icon?: any
  closable?: boolean
  width?: number
  initialPosition?: { x: number; y: number }
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
  zIndex: 100,
  initialPosition: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<{
  close: []
  positionChange: [position: { x: number; y: number }]
}>()

const isMinimized = ref(false)
const isDragging = ref(false)
const position = ref({ ...props.initialPosition })
const dragStart = ref({ x: 0, y: 0 })

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function handleHeaderMouseDown(e: MouseEvent) {
  e.preventDefault()
  startDrag(e)
}

function startDrag(e: MouseEvent) {
  if (e.target instanceof HTMLElement && e.target.closest('.panel-control-btn')) {
    return // Don't drag when clicking control buttons
  }
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(e: MouseEvent) {
  if (!isDragging.value) return
  
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
  
  emit('positionChange', { ...position.value })
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.floating-panel {
  position: fixed;
  background: #2d2d30;
  border: 1px solid #464647;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  min-width: 200px;
  max-width: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  backdrop-filter: blur(8px);
}

.floating-panel.is-dragging {
  cursor: grabbing;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: linear-gradient(180deg, #404040 0%, #383838 100%);
  border-bottom: 1px solid #464647;
  cursor: grab;
  border-radius: 3px 3px 0 0;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-icon {
  width: 14px;
  height: 14px;
  color: #cccccc;
}

.panel-title {
  font-size: 11px;
  font-weight: 600;
  color: #cccccc;
  letter-spacing: 0.3px;
}

.panel-controls {
  display: flex;
  gap: 2px;
}

.panel-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: transparent;
  border: none;
  border-radius: 2px;
  color: #999999;
  cursor: pointer;
  transition: all 0.1s ease;
}

.panel-control-btn:hover {
  background: #484848;
  color: #cccccc;
}

.panel-control-btn.close-btn:hover {
  background: #e74856;
  color: white;
}

.panel-content {
  padding: 8px;
  background: #2d2d30;
  color: #cccccc;
  border-radius: 0 0 3px 3px;
  max-height: 70vh;
  overflow-y: auto;
}

.floating-panel.is-minimized {
  max-height: none;
}

.floating-panel.is-minimized .panel-content {
  display: none;
}

/* Custom scrollbar for panel content */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #383838;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style> 