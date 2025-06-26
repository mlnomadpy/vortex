<template>
  <div class="status-dot" :class="status" :title="status">
    <div class="dot"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  status: 'converged' | 'converging' | 'stable' | 'exploring' | 'starting'
}

defineProps<Props>()
</script>

<style scoped>
.status-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.status-dot.converged .dot {
  background: #28a745;
  box-shadow: 0 0 4px rgba(40, 167, 69, 0.5);
}

.status-dot.converging .dot {
  background: #ffc107;
  animation: pulse 2s infinite;
}

.status-dot.stable .dot {
  background: #17a2b8;
}

.status-dot.exploring .dot {
  background: #dc3545;
  animation: blink 1s infinite;
}

.status-dot.starting .dot {
  background: #6c757d;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}
</style> 