<template>
  <div 
    class="training-preset" 
    :class="[`preset-${preset.color}`, { 'preset-selected': isSelected }]"
    @click="$emit('select', preset.id)"
  >
    <div class="preset-header">
      <component :is="preset.icon" class="preset-icon" />
      <h5 class="preset-name">{{ preset.name }}</h5>
    </div>
    
    <p class="preset-description">{{ preset.description }}</p>
    
    <div class="preset-config">
      <div class="config-item">
        <span class="config-label">LR:</span>
        <span class="config-value">{{ preset.config.learningRate }}</span>
      </div>
      <div class="config-item">
        <span class="config-label">Epochs:</span>
        <span class="config-value">{{ preset.config.epochs }}</span>
      </div>
      <div class="config-item">
        <span class="config-label">Speed:</span>
        <span class="config-value">{{ preset.config.speed }}x</span>
      </div>
    </div>
    
    <button 
      class="apply-button"
      :class="{ active: isSelected }"
      @click.stop="$emit('apply', preset)"
    >
      {{ isSelected ? 'Applied' : 'Apply' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface PresetConfig {
  learningRate: number
  epochs: number
  speed: number
  optimizer: string
}

interface TrainingPreset {
  id: string
  name: string
  description: string
  icon: any
  color: string
  config: PresetConfig
}

interface Props {
  preset: TrainingPreset
  isSelected: boolean
}

defineProps<Props>()

defineEmits<{
  select: [id: string]
  apply: [preset: TrainingPreset]
}>()
</script>

<style scoped>
.training-preset {
  background: var(--preset-bg, #383838);
  border: 2px solid var(--preset-border, #555555);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.training-preset:hover {
  border-color: var(--preset-hover-border, #666666);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.training-preset.preset-selected {
  border-color: var(--preset-selected-border, #007acc);
  background: var(--preset-selected-bg, rgba(0, 122, 204, 0.1));
}

/* Preset color variants */
.preset-primary {
  --preset-color: #007acc;
  --preset-icon-bg: rgba(0, 122, 204, 0.2);
}

.preset-success {
  --preset-color: #28a745;
  --preset-icon-bg: rgba(40, 167, 69, 0.2);
}

.preset-secondary {
  --preset-color: #6c757d;
  --preset-icon-bg: rgba(108, 117, 125, 0.2);
}

.preset-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.preset-icon {
  width: 20px;
  height: 20px;
  color: var(--preset-color, #007acc);
  padding: 8px;
  background: var(--preset-icon-bg, rgba(0, 122, 204, 0.2));
  border-radius: 6px;
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #cccccc);
  margin: 0;
}

.preset-description {
  font-size: 12px;
  color: var(--text-secondary, #999999);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.preset-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.config-label {
  color: var(--text-tertiary, #777777);
  font-weight: 500;
}

.config-value {
  color: var(--preset-color, #007acc);
  font-weight: 600;
}

.apply-button {
  width: 100%;
  padding: 8px 16px;
  background: var(--preset-color, #007acc);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.apply-button:hover {
  background: var(--preset-color-hover, #0056b3);
  transform: translateY(-1px);
}

.apply-button.active {
  background: var(--success-color, #28a745);
}

.apply-button.active:hover {
  background: var(--success-color-hover, #218838);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .preset-config {
    grid-template-columns: 1fr;
  }
  
  .training-preset {
    padding: 12px;
  }
}
</style> 