<template>
  <div 
    class="floating-panel"
    :class="{ 
      'is-minimized': isMinimized,
      'is-dragging': isDragging,
      'is-resizing': isResizing
    }"
    :style="{ 
      transform: `translate(${position.x}px, ${position.y}px)`,
      width: `${width}px`,
      height: `${height}px`,
      'z-index': zIndex,
      '--position-x': `${position.x}px`,
      '--position-y': `${position.y}px`
    }"
    @mousedown="bringToFront"
  >
    <!-- Panel Header -->
    <div class="panel-header" @mousedown="handleHeaderMouseDown">
      <div class="panel-title-section">
        <component :is="icon" v-if="icon" class="panel-icon" />
        <span class="panel-title">{{ title }}</span>
        <span v-if="subtitle" class="panel-subtitle">{{ subtitle }}</span>
      </div>
      <div class="panel-controls">
        <button 
          class="panel-control-btn minimize-btn" 
          :title="isMinimized ? 'Expand' : 'Collapse'"
          @click="toggleMinimize"
        >
          <component :is="isMinimized ? ChevronDownIcon : ChevronUpIcon" class="control-icon" />
        </button>
        <button 
          v-if="resizable"
          class="panel-control-btn resize-btn"
          title="Resize"
          @mousedown="startResize"
        >
          <ArrowsPointingOutIcon class="control-icon" />
        </button>
        <button 
          v-if="closable"
          class="panel-control-btn close-btn" 
          title="Close"
          @click="$emit('close')"
        >
          <XMarkIcon class="control-icon" />
        </button>
      </div>
    </div>
    
    <!-- Panel Content with Animation -->
    <Transition name="panel-content" appear>
      <div v-if="!isMinimized" class="panel-content" :style="contentStyle">
        <slot></slot>
      </div>
    </Transition>
    
    <!-- Resize Handle -->
    <div 
      v-if="resizable && !isMinimized"
      class="resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowsPointingOutIcon
} from '@/components/ui/icons'

interface Props {
  title: string
  subtitle?: string
  icon?: any
  closable?: boolean
  resizable?: boolean
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  initialPosition?: { x: number; y: number }
  zIndex?: number
  collapsible?: boolean
  initiallyMinimized?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  resizable: true,
  collapsible: true,
  initiallyMinimized: false,
  minWidth: 200,
  minHeight: 100,
  maxWidth: 800,
  maxHeight: 600,
  zIndex: 100,
  initialPosition: () => ({ x: 100, y: 100 })
})

const emit = defineEmits<{
  close: []
  positionChange: [position: { x: number; y: number }]
  sizeChange: [size: { width: number; height: number }]
  minimize: [minimized: boolean]
}>()

// State
const isMinimized = ref(props.initiallyMinimized)
const isDragging = ref(false)
const isResizing = ref(false)
const position = ref({ x: props.initialPosition.x, y: props.initialPosition.y })
const width = ref(props.width || 300)
const height = ref(props.height || 400)
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// Computed
const contentStyle = computed(() => ({
  maxHeight: isMinimized.value ? '0' : `${height.value - 40}px`
}))

// Panel management
function toggleMinimize() {
  isMinimized.value = !isMinimized.value
  emit('minimize', isMinimized.value)
}

function bringToFront(e: Event) {
  // Bring panel to front when clicked
  const panels = Array.from(document.querySelectorAll('.floating-panel'))
  const maxZ = Math.max(...panels.map(
    el => parseInt((el as HTMLElement).style.zIndex) || props.zIndex || 100
  ))
  const currentPanel = e.currentTarget as HTMLElement
  if (currentPanel) {
    currentPanel.style.zIndex = String(Math.max(maxZ + 1, (props.zIndex || 100) + 1))
  }
}

// Dragging functionality
function handleHeaderMouseDown(e: MouseEvent) {
  if (e.target instanceof HTMLElement && e.target.closest('.panel-control-btn')) {
    return // Don't drag when clicking control buttons
  }
  e.preventDefault()
  startDrag(e)
}

function startDrag(e: MouseEvent) {
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
  
  // Constrain to viewport
  const newX = Math.max(0, Math.min(window.innerWidth - width.value, e.clientX - dragStart.value.x))
  const newY = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragStart.value.y))
  
  position.value = { x: newX, y: newY }
  emit('positionChange', { ...position.value })
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Resizing functionality
function startResize(e: MouseEvent) {
  if (!props.resizable) return
  
  e.preventDefault()
  e.stopPropagation()
  
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: width.value,
    height: height.value
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y
  
  const newWidth = Math.max(
    props.minWidth,
    Math.min(props.maxWidth, resizeStart.value.width + deltaX)
  )
  const newHeight = Math.max(
    props.minHeight,
    Math.min(props.maxHeight, resizeStart.value.height + deltaY)
  )
  
  width.value = newWidth
  height.value = newHeight
  
  emit('sizeChange', { width: newWidth, height: newHeight })
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Initialize panel positioning
onMounted(() => {
  // Ensure panel is positioned correctly on mount
  if (props.initialPosition) {
    position.value = { x: props.initialPosition.x, y: props.initialPosition.y }
  }
})

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.floating-panel {
  /* CSS Custom Properties for theming */
  --panel-bg: rgb(var(--bg-secondary));
  --panel-border: rgb(var(--border-primary));
  --panel-shadow: rgba(0, 0, 0, 0.3);
  --panel-shadow-hover: rgba(0, 0, 0, 0.4);
  --panel-header-bg: linear-gradient(180deg, rgb(var(--bg-tertiary)) 0%, rgb(var(--bg-secondary)) 100%);
  --panel-text: rgb(var(--text-primary));
  --panel-text-muted: rgb(var(--text-secondary));
  --panel-accent: rgb(var(--theme-primary));
  --panel-radius: 8px;
  
  position: fixed;
  top: 0;
  left: 0;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-radius);
  box-shadow: 
    0 6px 20px var(--panel-shadow),
    0 2px 6px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  font-family: inherit;
  user-select: none;
  backdrop-filter: blur(12px) saturate(180%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  will-change: transform, box-shadow;
}

.floating-panel:hover {
  box-shadow: 
    0 8px 25px var(--panel-shadow-hover),
    0 3px 8px rgba(0, 0, 0, 0.15);
  border-color: var(--panel-accent);
  transform: translate(var(--position-x, 0), var(--position-y, 0)) translateY(-1px);
}

.floating-panel.is-dragging {
  cursor: grabbing;
  z-index: 1000 !important;
  box-shadow: 
    0 12px 35px var(--panel-shadow-hover),
    0 6px 12px rgba(0, 0, 0, 0.2);
  border-color: var(--panel-accent);
  transform: translate(var(--position-x, 0), var(--position-y, 0)) scale(1.02);
}

.floating-panel.is-resizing {
  cursor: nw-resize;
  border-color: var(--panel-accent);
}

.floating-panel.is-minimized {
  height: auto !important;
  box-shadow: 
    0 2px 8px var(--panel-shadow),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--panel-header-bg);
  border-bottom: 1px solid var(--panel-border);
  cursor: grab;
  border-radius: calc(var(--panel-radius) - 1px) calc(var(--panel-radius) - 1px) 0 0;
  min-height: 44px;
  transition: all 0.2s ease;
  position: relative;
}

.panel-header:active {
  cursor: grabbing;
  background: linear-gradient(180deg, rgb(var(--bg-tertiary)) 0%, rgb(var(--bg-primary)) 100%);
}

.panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--panel-accent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.floating-panel:hover .panel-header::before {
  opacity: 1;
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.panel-icon {
  width: 18px;
  height: 18px;
  color: var(--panel-accent);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.floating-panel:hover .panel-icon {
  transform: scale(1.1);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--panel-text);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.panel-subtitle {
  font-size: 11px;
  color: var(--panel-text-muted);
  margin-left: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.panel-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.panel-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--panel-text-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.panel-control-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: inherit;
}

.panel-control-btn:hover {
  color: var(--panel-text);
  transform: scale(1.1);
}

.panel-control-btn:hover::before {
  opacity: 0.1;
}

.panel-control-btn:active {
  transform: scale(0.95);
}

.panel-control-btn.close-btn:hover {
  color: rgb(var(--destructive));
}

.panel-control-btn.minimize-btn:hover {
  color: var(--panel-accent);
}

.panel-control-btn.resize-btn:hover {
  color: rgb(var(--success));
}

.control-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.panel-content {
  background: var(--panel-bg);
  color: var(--panel-text);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--panel-text-muted) transparent;
}

/* Content Animation */
.panel-content-enter-active,
.panel-content-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.panel-content-enter-from,
.panel-content-leave-to {
  opacity: 0;
  transform: scaleY(0) translateY(-10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.panel-content-enter-to,
.panel-content-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: transparent;
  cursor: nw-resize;
  display: flex;
  align-items: end;
  justify-content: end;
  padding: 3px;
  border-radius: 0 0 var(--panel-radius) 0;
  transition: all 0.2s ease;
}

.resize-handle::after {
  content: '';
  width: 12px;
  height: 12px;
  background: linear-gradient(
    135deg, 
    transparent 30%, 
    var(--panel-text-muted) 30%, 
    var(--panel-text-muted) 40%, 
    transparent 40%, 
    transparent 60%, 
    var(--panel-text-muted) 60%, 
    var(--panel-text-muted) 70%, 
    transparent 70%
  );
  opacity: 0.4;
  transition: all 0.2s ease;
}

.resize-handle:hover {
  background: rgba(var(--theme-primary-rgb), 0.1);
}

.resize-handle:hover::after {
  opacity: 1;
  background: linear-gradient(
    135deg, 
    transparent 30%, 
    var(--panel-accent) 30%, 
    var(--panel-accent) 40%, 
    transparent 40%, 
    transparent 60%, 
    var(--panel-accent) 60%, 
    var(--panel-accent) 70%, 
    transparent 70%
  );
}

/* Custom scrollbar for panel content */
.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--panel-text-muted);
  border-radius: 4px;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--panel-accent);
  opacity: 0.8;
}

/* Focus and active states */
.floating-panel:focus-within {
  border-color: var(--panel-accent);
  box-shadow: 
    0 8px 25px var(--panel-shadow-hover),
    0 0 0 2px rgba(var(--theme-primary-rgb), 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .floating-panel {
    min-width: 280px;
    max-width: calc(100vw - 20px);
  }
  
  .panel-header {
    padding: 10px 12px;
    min-height: 40px;
  }
  
  .panel-content {
    padding: 12px;
  }
  
  .panel-controls {
    gap: 2px;
  }
  
  .panel-control-btn {
    width: 22px;
    height: 22px;
  }
  
  .control-icon {
    width: 14px;
    height: 14px;
  }
}
</style> 