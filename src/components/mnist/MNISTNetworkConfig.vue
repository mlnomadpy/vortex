<template>
  <div class="mnist-network-config">
    <div class="config-section">
      <h4 class="config-title">Similarity Metric</h4>
      <select 
        :value="similarityMetric" 
        @change="$emit('update-similarity', ($event.target as HTMLSelectElement).value)"
        class="config-select"
      >
        <option value="dotProduct">Dot Product</option>
        <option value="euclidean">Euclidean Distance</option>
        <option value="yatProduct">YAT Product</option>
        <option value="cosine">Cosine Similarity</option>
        <option value="manhattan">Manhattan Distance</option>
        <option value="rbf">RBF Kernel</option>
      </select>
      <p class="config-description">{{ getSimilarityDescription(similarityMetric) }}</p>
    </div>
    
    <div class="config-section">
      <h4 class="config-title">Activation Function</h4>
      <select 
        :value="activationFunction" 
        @change="$emit('update-activation', ($event.target as HTMLSelectElement).value)"
        class="config-select"
      >
        <option value="none">None</option>
        <option value="softmax">Softmax</option>
        <option value="softermax">Softermax</option>
        <option value="sigmoid">Sigmoid</option>
        <option value="relu">ReLU</option>
        <option value="gelu">GELU</option>
      </select>
      <p class="config-description">{{ getActivationDescription(activationFunction) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NDSimilarityMetric, ActivationFunction } from '@/types'

defineProps<{
  similarityMetric: NDSimilarityMetric
  activationFunction: ActivationFunction
}>()

defineEmits<{
  'update-similarity': [value: string]
  'update-activation': [value: string]
}>()

function getSimilarityDescription(metric: NDSimilarityMetric): string {
  switch (metric) {
    case 'dotProduct': return 'Linear similarity measure'
    case 'euclidean': return 'Distance-based similarity'
    case 'yatProduct': return 'Custom normalized similarity'
    case 'cosine': return 'Angular similarity measure'
    case 'manhattan': return 'Manhattan distance metric'
    case 'rbf': return 'Radial basis function'
    default: return 'Unknown metric'
  }
}

function getActivationDescription(activation: ActivationFunction): string {
  switch (activation) {
    case 'none': return 'No activation function'
    case 'softmax': return 'Probabilistic output'
    case 'softermax': return 'Soft probabilistic output'
    case 'sigmoid': return 'S-curve activation'
    case 'relu': return 'Rectified linear unit'
    case 'gelu': return 'Gaussian error linear unit'
    default: return 'Unknown activation'
  }
}
</script>

<style scoped>
.mnist-network-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section {
  padding: 12px 0;
}

.config-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--color-primary));
}

.config-select {
  width: 100%;
  padding: 8px 12px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  font-size: 12px;
}

.config-description {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: rgb(var(--text-tertiary));
  font-style: italic;
}
</style> 