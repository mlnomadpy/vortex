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
    
    <div class="config-section">
      <h4 class="config-title">Weight Quantization</h4>
      
      <div class="ternary-controls">
        <div class="toggle-group">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              :checked="store.useTernaryWeights" 
              @change="store.toggleTernaryWeights()"
              class="toggle-checkbox"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-text">Ternary Weights (-1, 0, 1)</span>
          </label>
        </div>
        
        <div v-if="store.useTernaryWeights" class="ternary-config">
          <div class="sparsity-control">
            <label class="sparsity-label">Sparsity Ratio:</label>
            <div class="sparsity-input-group">
              <input 
                type="range" 
                :value="store.ternarySparsityRatio" 
                @input="store.setTernarySparsity(parseFloat(($event.target as HTMLInputElement).value))"
                min="0" 
                max="0.9" 
                step="0.1" 
                class="sparsity-slider"
              />
              <span class="sparsity-value">{{ (store.ternarySparsityRatio * 100).toFixed(0) }}%</span>
            </div>
          </div>
          
          <div class="ternary-actions">
            <button 
              @click="$emit('initialize-ternary')" 
              class="ternary-btn init-btn"
              :disabled="!store.apiConnected"
              title="Initialize network with ternary weights"
            >
              🔧 Initialize
            </button>
            
            <button 
              @click="$emit('quantize-weights')" 
              class="ternary-btn quantize-btn"
              :disabled="!store.apiConnected"
              title="Quantize current weights to ternary values"
            >
              ⚡ Quantize
            </button>
            
            <button 
              @click="$emit('refresh-stats')" 
              class="ternary-btn stats-btn"
              :disabled="!store.apiConnected"
              title="Refresh ternary weight statistics"
            >
              📊 Stats
            </button>
          </div>
          
          <div v-if="store.ternaryStats" class="ternary-stats">
            <div class="stats-header">Weight Distribution:</div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">-1:</span>
                <span class="stat-value">{{ (store.ternaryStats.overall_distribution.negative_one_ratio * 100).toFixed(1) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">0:</span>
                <span class="stat-value">{{ (store.ternaryStats.overall_distribution.zero_ratio * 100).toFixed(1) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">+1:</span>
                <span class="stat-value">{{ (store.ternaryStats.overall_distribution.positive_one_ratio * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stats-info">
              <span class="info-text" :class="{ valid: store.ternaryStats.is_ternary }">
                {{ store.ternaryStats.is_ternary ? '✅ Truly Ternary' : '⚠️ Not Ternary' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <p class="config-description">
        {{ store.useTernaryWeights ? 'Weights constrained to {-1, 0, 1} for efficiency' : 'Standard continuous weights' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NDSimilarityMetric, ActivationFunction } from '@/types'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'

const store = useMNISTClassifierStore()

defineProps<{
  similarityMetric: NDSimilarityMetric
  activationFunction: ActivationFunction
}>()

defineEmits<{
  'update-similarity': [value: string]
  'update-activation': [value: string]
  'initialize-ternary': []
  'quantize-weights': []
  'refresh-stats': []
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

/* Ternary weights controls */
.ternary-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-group {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: rgb(var(--text-primary));
}

.toggle-checkbox {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: rgb(var(--text-tertiary));
  border-radius: 50%;
  top: 1px;
  left: 1px;
  transition: all 0.2s ease;
}

.toggle-checkbox:checked + .toggle-slider {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: white;
}

.ternary-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
}

.sparsity-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sparsity-label {
  font-size: 11px;
  color: rgb(var(--text-secondary));
  font-weight: 500;
}

.sparsity-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sparsity-slider {
  flex: 1;
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.sparsity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: rgb(var(--color-primary));
  border-radius: 50%;
  cursor: pointer;
}

.sparsity-value {
  font-size: 11px;
  color: rgb(var(--text-primary));
  font-weight: 600;
  min-width: 35px;
  text-align: right;
}

.ternary-actions {
  display: flex;
  gap: 6px;
}

.ternary-btn {
  flex: 1;
  padding: 6px 8px;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ternary-btn:hover:not(:disabled) {
  background: rgb(var(--bg-quaternary));
  border-color: rgb(var(--color-primary));
}

.ternary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.init-btn:hover:not(:disabled) {
  background: rgb(var(--color-success));
  color: white;
}

.quantize-btn:hover:not(:disabled) {
  background: rgb(var(--color-warning));
  color: white;
}

.stats-btn:hover:not(:disabled) {
  background: rgb(var(--color-info));
  color: white;
}

.ternary-stats {
  padding: 8px;
  background: rgb(var(--bg-tertiary));
  border-radius: 3px;
}

.stats-header {
  font-size: 10px;
  color: rgb(var(--text-secondary));
  margin-bottom: 6px;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
}

.stat-label {
  color: rgb(var(--text-tertiary));
  font-weight: 500;
}

.stat-value {
  color: rgb(var(--text-primary));
  font-weight: 600;
}

.stats-info {
  text-align: center;
}

.info-text {
  font-size: 9px;
  color: rgb(var(--text-tertiary));
  font-weight: 500;
}

.info-text.valid {
  color: rgb(var(--color-success));
}
</style> 