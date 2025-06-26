<template>
  <div class="trend-icon" :class="trend">
    <TrendingUpIcon v-if="trend === 'up'" class="icon up" />
    <TrendingDownIcon v-else-if="trend === 'down'" class="icon down" />
    <MinusIcon v-else class="icon neutral" />
  </div>
</template>

<script setup lang="ts">
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from '@/components/ui/icons'

interface Props {
  trend: 'up' | 'down' | 'neutral'
}

defineProps<Props>()
</script>

<style scoped>
.trend-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 14px;
  height: 14px;
  transition: color 0.2s ease;
}

.icon.up {
  color: #28a745;
}

.icon.down {
  color: #dc3545;
}

.icon.neutral {
  color: #6c757d;
}
</style> 