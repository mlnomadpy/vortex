<template>
  <div class="network-config-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <div class="panel-icon">
          <CogIcon class="w-5 h-5" />
        </div>
        <div class="panel-title">
          <h3>Network Configuration</h3>
          <div class="panel-subtitle">
            Global neural network settings
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="panel-content">
      <!-- Activation Function -->
      <div class="config-section">
        <h4 class="config-section-title">
          <BoltIcon class="w-4 h-4" />
          Activation Function
        </h4>
        
        <div class="config-group">
          <label class="config-label">Function Type</label>
          <div class="select-wrapper">
            <select
              :value="activationFunction"
              class="config-select"
              @change="$emit('update-activation', ($event.target as HTMLSelectElement).value)"
            >
              <option value="none">None</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="relu">ReLU</option>
              <option value="gelu">GELU</option>
              <option value="softmax">Softmax</option>
              <option value="softermax">Softermax</option>
            </select>
            <div class="config-description">
              {{ getActivationDescription(activationFunction) }}
            </div>
          </div>
        </div>

        <!-- Visual Preview -->
        <div class="function-preview">
          <div class="preview-label">Function Shape:</div>
          <div class="preview-graph">
            <svg viewBox="0 0 200 100" class="preview-svg">
              <!-- Grid lines -->
              <defs>
                <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#374151" stroke-width="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="200" height="100" fill="url(#grid)" />
              
              <!-- Axes -->
              <line x1="0" y1="50" x2="200" y2="50" stroke="#6b7280" stroke-width="1"/>
              <line x1="100" y1="0" x2="100" y2="100" stroke="#6b7280" stroke-width="1"/>
              
              <!-- Function curve -->
              <path :d="getActivationCurve()" fill="none" stroke="#3b82f6" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Similarity Metric -->
      <div class="config-section">
        <h4 class="config-section-title">
          <ChartBarIcon class="w-4 h-4" />
          Similarity Metric
        </h4>
        
        <div class="config-group">
          <label class="config-label">Metric Type</label>
          <div class="select-wrapper">
            <select
              :value="similarityMetric"
              class="config-select"
              @change="$emit('update-similarity', ($event.target as HTMLSelectElement).value)"
            >
              <option value="euclidean">Euclidean</option>
              <option value="dotProduct">Dot Product</option>
              <option value="yatProduct">Yat Product</option>
            </select>
            <div class="config-description">
              {{ getSimilarityDescription(similarityMetric) }}
            </div>
          </div>
        </div>

        <!-- Metric Explanation -->
        <div class="metric-explanation">
          <div class="explanation-label">How it works:</div>
          <div class="explanation-text">
            {{ getSimilarityExplanation(similarityMetric) }}
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="config-section">
        <h4 class="config-section-title">
          <DocumentTextIcon class="w-4 h-4" />
          Quick Presets
        </h4>
        
        <div class="preset-buttons">
          <button
            v-for="preset in configPresets"
            :key="preset.name"
            @click="applyPreset(preset)"
            class="preset-button"
            :class="preset.type"
          >
            <component :is="preset.icon" class="preset-icon" />
            <div class="preset-info">
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-desc">{{ preset.description }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CogIcon,
  BoltIcon,
  ChartBarIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  CalculatorIcon,
  CodeBracketIcon
} from '@/components/ui/icons'

interface Props {
  activationFunction: string
  similarityMetric: string
}

interface Emits {
  (e: 'update-activation', value: string): void
  (e: 'update-similarity', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Configuration presets
const configPresets = [
  {
    name: 'Classic',
    description: 'Traditional neural network',
    activation: 'sigmoid',
    similarity: 'euclidean',
    icon: CalculatorIcon,
    type: 'default'
  },
  {
    name: 'Modern',
    description: 'ReLU with dot product',
    activation: 'relu',
    similarity: 'dotProduct',
    icon: RocketLaunchIcon,
    type: 'success'
  },
  {
    name: 'Experimental',
    description: 'GELU with Yat product',
    activation: 'gelu',
    similarity: 'yatProduct',
    icon: CodeBracketIcon,
    type: 'warning'
  }
]

function getActivationDescription(activation: string): string {
  switch (activation) {
    case 'none': return 'No activation function applied'
    case 'sigmoid': return 'Smooth S-curve, outputs between 0 and 1'
    case 'relu': return 'Rectified Linear Unit, outputs 0 or positive values'
    case 'gelu': return 'Gaussian Error Linear Unit, smooth alternative to ReLU'
    case 'softmax': return 'Probabilistic output, sums to 1'
    case 'softermax': return 'Softer version of softmax'
    default: return 'Unknown activation function'
  }
}

function getSimilarityDescription(similarity: string): string {
  switch (similarity) {
    case 'euclidean': return 'Distance-based similarity measure'
    case 'dotProduct': return 'Dot product similarity (cosine-like)'
    case 'yatProduct': return 'Yet Another Transform product'
    default: return 'Unknown similarity metric'
  }
}

function getSimilarityExplanation(similarity: string): string {
  switch (similarity) {
    case 'euclidean': return 'Measures straight-line distance between points. Closer points have higher similarity.'
    case 'dotProduct': return 'Calculates angle between vectors. Similar directions have higher scores.'
    case 'yatProduct': return 'Custom similarity metric with unique mathematical properties.'
    default: return 'Unknown similarity metric'
  }
}

function getActivationCurve(): string {
  const points: string[] = []
  
  for (let i = 0; i <= 200; i += 2) {
    const x = (i - 100) / 50 // Map to [-2, 2]
    let y = 50 // Default center
    
    switch (props.activationFunction) {
      case 'sigmoid':
        y = 50 - 40 / (1 + Math.exp(-x))
        break
      case 'relu':
        y = 50 - Math.max(0, x) * 10
        break
      case 'gelu':
        y = 50 - x * 10 * 0.5 * (1 + Math.tanh(Math.sqrt(2/Math.PI) * (x + 0.044715 * x * x * x)))
        break
      case 'softmax':
        y = 50 - 40 / (1 + Math.exp(-x * 2))
        break
      case 'softermax':
        y = 50 - 35 / (1 + Math.exp(-x * 1.5))
        break
      case 'none':
      default:
        y = 50 - x * 15 // Linear
        break
    }
    
    y = Math.max(5, Math.min(95, y)) // Clamp to visible area
    points.push(i === 0 ? `M ${i} ${y}` : `L ${i} ${y}`)
  }
  
  return points.join(' ')
}

function applyPreset(preset: any) {
  emit('update-activation', preset.activation)
  emit('update-similarity', preset.similarity)
}
</script>

<style scoped>
.network-config-panel {
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-tertiary));
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(var(--color-primary));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.panel-title h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
  margin: 0;
}

.panel-subtitle {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin-top: 0.125rem;
}

.panel-content {
  padding: 1.5rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.config-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  font-size: 0.875rem;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  padding-right: 3rem;
}

.config-select:hover {
  border-color: rgb(var(--border-primary));
  background-color: rgb(var(--bg-hover));
}

.config-select:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
}

.config-description {
  font-size: 0.75rem;
  color: rgb(var(--text-tertiary));
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  background: rgb(var(--bg-tertiary));
  border-radius: 6px;
  border-left: 3px solid rgb(var(--color-primary));
}

/* Function Preview */
.function-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
}

.preview-graph {
  background: rgb(var(--bg-tertiary));
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgb(var(--border-secondary));
}

.preview-svg {
  width: 100%;
  height: 60px;
}

/* Metric Explanation */
.metric-explanation {
  background: rgb(var(--bg-tertiary));
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid rgb(var(--color-secondary));
}

.explanation-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  margin-bottom: 0.5rem;
}

.explanation-text {
  font-size: 0.875rem;
  color: rgb(var(--text-primary));
  line-height: 1.5;
}

/* Preset Buttons */
.preset-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.preset-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.preset-button:hover {
  background: rgb(var(--bg-hover));
  border-color: rgb(var(--border-primary));
  transform: translateY(-1px);
}

.preset-button.success {
  border-color: #22c55e;
}

.preset-button.success:hover {
  background: rgba(34, 197, 94, 0.1);
}

.preset-button.warning {
  border-color: #eab308;
}

.preset-button.warning:hover {
  background: rgba(234, 179, 8, 0.1);
}

.preset-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: rgb(var(--color-primary));
  flex-shrink: 0;
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.preset-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.preset-desc {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel-content {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .preset-buttons {
    gap: 0.5rem;
  }
  
  .preset-button {
    padding: 0.75rem;
  }
}
</style> 