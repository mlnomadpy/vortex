<template>
  <div class="status-indicator" :class="statusClass">
    <div class="status-visual">
      <div class="status-dot" :class="{ pulse: status === 'running' }"></div>
      <component :is="statusIcon" class="status-icon" />
    </div>
    <div class="status-content">
      <span class="status-text">{{ statusLabel }}</span>
      <span v-if="showProgress" class="status-detail">{{ progress }}%</span>
      <span v-if="eta && eta !== '—'" class="status-eta">ETA: {{ eta }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@/components/ui/icons'

interface Props {
  status: 'ready' | 'running' | 'paused' | 'completed'
  progress?: number
  eta?: string
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  eta: '—'
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'running': return PlayIcon
    case 'paused': return PauseIcon
    case 'completed': return CheckCircleIcon
    default: return ArrowPathIcon
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'running': return 'Training'
    case 'paused': return 'Paused'
    case 'completed': return 'Completed'
    default: return 'Ready'
  }
})

const statusClass = computed(() => ({
  'status-ready': props.status === 'ready',
  'status-running': props.status === 'running',
  'status-paused': props.status === 'paused',
  'status-completed': props.status === 'completed'
}))

const showProgress = computed(() => 
  props.status === 'running' || props.status === 'paused'
)
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--status-bg, #383838);
  border: 1px solid var(--status-border, #555555);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.status-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.status-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot-color, #666666);
  transition: all 0.3s ease;
}

.status-dot.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.status-icon {
  width: 16px;
  height: 16px;
  color: var(--icon-color, #999999);
  z-index: 1;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 60px;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color, #cccccc);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-detail {
  font-size: 11px;
  font-weight: 500;
  color: var(--detail-color, #007acc);
}

.status-eta {
  font-size: 10px;
  color: var(--eta-color, #999999);
}

/* Status-specific styles */
.status-ready {
  --dot-color: #666666;
  --icon-color: #999999;
  --text-color: #cccccc;
}

.status-running {
  --status-bg: rgba(40, 167, 69, 0.1);
  --status-border: #28a745;
  --dot-color: #28a745;
  --icon-color: #28a745;
  --text-color: #28a745;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.3);
}

.status-paused {
  --status-bg: rgba(255, 193, 7, 0.1);
  --status-border: #ffc107;
  --dot-color: #ffc107;
  --icon-color: #ffc107;
  --text-color: #ffc107;
}

.status-completed {
  --status-bg: rgba(40, 167, 69, 0.1);
  --status-border: #28a745;
  --dot-color: #28a745;
  --icon-color: #28a745;
  --text-color: #28a745;
}
</style> 