<template>
  <div 
    class="training-preset" 
    :class="[
      `preset-${preset.type}`,
      { 
        selected: selected,
        disabled: disabled
      }
    ]"
    @click="selectPreset"
  >
    <div class="preset-header">
      <div class="preset-icon-wrapper">
        <component :is="preset.icon" class="preset-icon" />
      </div>
      <div v-if="selected" class="preset-selected-indicator">
        <CheckCircleIcon class="selected-icon" />
      </div>
    </div>

    <div class="preset-content">
      <h4 class="preset-name">{{ preset.name }}</h4>
      <p class="preset-description">{{ preset.description }}</p>
      
      <div class="preset-config">
        <div class="config-item">
          <span class="config-label">Learning Rate</span>
          <span class="config-value">{{ preset.config.learningRate }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Epochs</span>
          <span class="config-value">{{ preset.config.epochs }}</span>
        </div>
        <div class="config-item">
          <span class="config-label">Speed</span>
          <span class="config-value">{{ preset.config.speed }}x</span>
        </div>
      </div>
    </div>

    <div class="preset-footer">
      <div class="preset-tags">
        <span v-if="preset.config.learningRate > 0.05" class="tag fast">Fast</span>
        <span v-if="preset.config.epochs > 150" class="tag thorough">Thorough</span>
        <span v-if="preset.config.speed > 2" class="tag quick">Quick</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from '@/components/ui/icons'

interface PresetConfig {
  learningRate: number
  epochs: number
  speed: number
}

interface TrainingPreset {
  id: string
  name: string
  description: string
  icon: any
  config: PresetConfig
  type: 'success' | 'primary' | 'secondary'
}

interface Props {
  preset: TrainingPreset
  selected?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false
})

const emit = defineEmits<{
  select: [preset: TrainingPreset]
}>()

function selectPreset() {
  if (!props.disabled) {
    emit('select', props.preset)
  }
}
</script>

<style scoped>
.training-preset {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #383838;
  border: 2px solid #555555;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.training-preset:hover:not(.disabled) {
  background: #404040;
  border-color: #666666;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.training-preset.selected {
  border-color: #007acc;
  background: rgba(0, 122, 204, 0.1);
  box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
}

.training-preset.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Preset Type Variants */
.preset-success {
  border-left: 4px solid #28a745;
}

.preset-primary {
  border-left: 4px solid #007acc;
}

.preset-secondary {
  border-left: 4px solid #6c757d;
}

/* Header */
.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preset-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.preset-icon {
  width: 18px;
  height: 18px;
  color: #cccccc;
  transition: all 0.3s ease;
}

.preset-selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #007acc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-icon {
  width: 12px;
  height: 12px;
  color: white;
}

/* Content */
.preset-content {
  flex: 1;
  margin-bottom: 8px;
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
  margin: 0 0 4px 0;
}

.preset-description {
  font-size: 11px;
  color: #999999;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.preset-config {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: #2d2d30;
  border-radius: 4px;
  border: 1px solid #464647;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-label {
  font-size: 9px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.config-value {
  font-size: 10px;
  font-weight: 600;
  color: #007acc;
}

/* Footer */
.preset-footer {
  margin-top: 8px;
}

.preset-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.tag.fast {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.tag.thorough {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.tag.quick {
  background: rgba(0, 122, 204, 0.2);
  color: #007acc;
}

/* Hover Effects */
.training-preset:hover:not(.disabled) .preset-icon-wrapper {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.training-preset:hover:not(.disabled) .preset-icon {
  color: #ffffff;
}

.training-preset.preset-success:hover:not(.disabled) .preset-icon {
  color: #28a745;
}

.training-preset.preset-primary:hover:not(.disabled) .preset-icon {
  color: #007acc;
}

.training-preset.preset-secondary:hover:not(.disabled) .preset-icon {
  color: #6c757d;
}

/* Active State */
.training-preset:active:not(.disabled) {
  transform: scale(0.98);
}

/* Responsive */
@media (max-width: 480px) {
  .training-preset {
    padding: 8px;
  }
  
  .preset-icon-wrapper {
    width: 28px;
    height: 28px;
  }
  
  .preset-icon {
    width: 16px;
    height: 16px;
  }
  
  .preset-name {
    font-size: 13px;
  }
  
  .preset-description {
    font-size: 10px;
  }
  
  .config-label,
  .config-value {
    font-size: 8px;
  }
}
</style> 