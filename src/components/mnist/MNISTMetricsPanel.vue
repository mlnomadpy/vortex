<template>
  <div class="mnist-metrics-panel">
    <h3>Metrics & Performance</h3>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">{{ store.trainAccuracy.toFixed(1) }}%</div>
        <div class="metric-label">Train Accuracy</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ store.testAccuracy.toFixed(1) }}%</div>
        <div class="metric-label">Test Accuracy</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ store.currentLoss.toFixed(4) }}</div>
        <div class="metric-label">Loss</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'

const store = useMNISTClassifierStore()
</script>

<style scoped>
.mnist-metrics-panel {
  padding: 16px;
  color: rgb(var(--text-primary));
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.metric-card {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--color-primary));
  margin-bottom: 4px;
}

.metric-label {
  font-size: 11px;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
}
</style> 