<template>
  <div 
    class="relative inline-block"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
    @keydown="handleKeydown"
  >
    <slot></slot>
    
    <Teleport to="body">
      <div
        v-if="isVisible && shouldShow"
        :id="tooltipId"
        ref="tooltipRef"
        role="tooltip"
        :class="tooltipClasses"
        :style="tooltipStyle"
        @mouseenter="keepVisible"
        @mouseleave="scheduleHide"
      >
        <div class="relative z-10">
          <slot name="content">
            {{ content }}
          </slot>
        </div>
        
        <!-- Arrow -->
        <div 
          v-if="showArrow"
          :class="arrowClasses"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, useSlots } from 'vue'
import { useUserPreferences } from '@/composables/useUserPreferences'

interface Props {
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
  showArrow?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  delay: 500,
  disabled: false,
  showArrow: true,
  maxWidth: '200px'
})

const { shouldShowTooltips } = useUserPreferences()

const isVisible = ref(false)
const tooltipRef = ref<HTMLElement>()
const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 11)}`
let showTimer: number | null = null
let hideTimer: number | null = null

const slots = useSlots()

const shouldShow = computed(() => 
  !props.disabled && shouldShowTooltips.value && (props.content || !!slots.content)
)

const tooltipClasses = computed(() => [
  'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700',
  'rounded-lg shadow-lg border border-gray-200 dark:border-gray-600',
  'pointer-events-auto transition-opacity duration-200',
  'max-w-xs break-words',
  {
    'opacity-0': !isVisible.value,
    'opacity-100': isVisible.value,
  }
])

const arrowClasses = computed(() => [
  'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
  'transform rotate-45',
  {
    'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0': props.placement === 'top',
    'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0': props.placement === 'bottom',
    'right-[-4px] top-1/2 -translate-y-1/2 border-t-0 border-l-0': props.placement === 'left',
    'left-[-4px] top-1/2 -translate-y-1/2 border-b-0 border-r-0': props.placement === 'right',
  }
])

const tooltipStyle = ref<Record<string, string>>({
  maxWidth: props.maxWidth
})

const showTooltip = () => {
  if (!shouldShow.value) return
  
  if (hideTimer) clearTimeout(hideTimer)
  
  if (props.delay > 0) {
    showTimer = window.setTimeout(() => {
      isVisible.value = true
      nextTick(positionTooltip)
    }, props.delay)
  } else {
    isVisible.value = true
    nextTick(positionTooltip)
  }
}

const hideTooltip = () => {
  if (showTimer) clearTimeout(showTimer)
  scheduleHide()
}

const scheduleHide = () => {
  hideTimer = window.setTimeout(() => {
    isVisible.value = false
  }, 100)
}

const keepVisible = () => {
  if (hideTimer) clearTimeout(hideTimer)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    hideTooltip()
  }
}

const positionTooltip = async () => {
  if (!tooltipRef.value) return
  
  await nextTick()
  
  const trigger = tooltipRef.value.parentElement?.querySelector(':first-child') as HTMLElement
  if (!trigger) return
  
  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let top = 0
  let left = 0
  
  switch (props.placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - 8
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = triggerRect.bottom + 8
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - 8
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + 8
      break
  }
  
  // Ensure tooltip stays within viewport
  top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8))
  left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8))
  
  tooltipStyle.value = {
    ...tooltipStyle.value,
    top: `${top}px`,
    left: `${left}px`
  }
}

onMounted(() => {
  // Add ARIA attributes to trigger element
  const trigger = document.querySelector(`[aria-describedby="${tooltipId}"]`) as HTMLElement
  if (trigger) {
    trigger.setAttribute('aria-describedby', tooltipId)
  }
})

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
/* Additional styles for better tooltip appearance */
.tooltip-enter-active, .tooltip-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from, .tooltip-leave-to {
  opacity: 0;
}
</style> 