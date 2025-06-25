<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="fixed pointer-events-none z-50 bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm max-w-xs transition-opacity duration-150 shadow-lg"
      :style="{ left: x + 'px', top: y + 'px' }"
      v-html="content"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  visible: boolean
  x: number
  y: number
  content: string
}

const props = defineProps<Props>()
const tooltipRef = ref<HTMLElement>()

// Adjust tooltip position to keep it on screen
watch(
  () => [props.visible, props.x, props.y],
  async () => {
    if (props.visible) {
      await nextTick()
      adjustPosition()
    }
  },
  { immediate: true }
)

function adjustPosition() {
  if (!tooltipRef.value) return

  const tooltip = tooltipRef.value
  const rect = tooltip.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let adjustedX = props.x
  let adjustedY = props.y

  // Adjust horizontal position
  if (adjustedX + rect.width > viewport.width) {
    adjustedX = viewport.width - rect.width - 10
  }
  if (adjustedX < 0) {
    adjustedX = 10
  }

  // Adjust vertical position
  if (adjustedY + rect.height > viewport.height) {
    adjustedY = props.y - rect.height - 10
  }
  if (adjustedY < 0) {
    adjustedY = 10
  }

  // Apply adjusted position
  tooltip.style.left = adjustedX + 'px'
  tooltip.style.top = adjustedY + 'px'
}
</script>

<style scoped>
/* Tooltip animations */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style> 