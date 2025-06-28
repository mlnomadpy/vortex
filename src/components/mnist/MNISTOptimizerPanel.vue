<template>
  <div class="mnist-optimizer-panel">
    <!-- Header -->
    <header class="panel-header">
      <div class="header-content">
        <h3 class="panel-title">
          <CogIcon class="panel-icon" />
          Optimizer Configuration
        </h3>
        <div class="optimizer-status" :class="{ initialized: optimizerStatus.initialized }">
          <div class="status-dot"></div>
          <span>{{ optimizerStatus.initialized ? 'Ready' : 'Not Initialized' }}</span>
        </div>
      </div>
    </header>

    <!-- Optimizer Selection -->
    <section class="optimizer-config">
      <div class="config-group">
        <label class="config-label">Optimizer Type</label>
        <div class="optimizer-selection">
          <select 
            v-model="selectedOptimizer" 
            class="optimizer-select"
            :disabled="isTraining"
            @change="onOptimizerChange"
          >
            <option value="sgd">SGD</option>
            <option value="sgd_momentum">SGD with Momentum</option>
            <option value="adam">Adam</option>
            <option value="adamw">AdamW</option>
          </select>
          
          <Button
            @click="initializeOptimizer"
            :disabled="isTraining || !canInitialize"
            variant="default"
            size="sm"
            :class="initBtnClass"
          >
            <PlayIcon class="btn-icon" />
            {{ optimizerStatus.initialized ? 'Initialized' : 'Initialize' }}
          </Button>
        </div>
      </div>

      <!-- Hyperparameters -->
      <div class="hyperparams">
        <!-- Learning Rate -->
        <div class="param-control">
          <label class="param-label">Learning Rate</label>
          <div class="param-input-group">
            <input
              v-model.number="hyperparams.learningRate"
              type="number"
              step="0.0001"
              min="0.0001"
              max="1"
              class="param-input"
              :disabled="isTraining"
              @change="onHyperparamChange"
            />
            <span class="param-value">{{ hyperparams.learningRate.toFixed(4) }}</span>
          </div>
        </div>

        <!-- Momentum (conditional) -->
        <div 
          v-if="selectedOptimizer === 'sgd_momentum' || selectedOptimizer === 'adam' || selectedOptimizer === 'adamw'" 
          class="param-control"
        >
          <label class="param-label">Momentum</label>
          <div class="param-input-group">
            <input
              v-model.number="hyperparams.momentum"
              type="number"
              step="0.01"
              min="0"
              max="0.99"
              class="param-input"
              :disabled="isTraining"
              @change="onHyperparamChange"
            />
            <span class="param-value">{{ hyperparams.momentum.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Weight Decay (conditional) -->
        <div 
          v-if="selectedOptimizer === 'adamw'" 
          class="param-control"
        >
          <label class="param-label">Weight Decay</label>
          <div class="param-input-group">
            <input
              v-model.number="hyperparams.weightDecay"
              type="number"
              step="0.0001"
              min="0"
              max="0.01"
              class="param-input"
              :disabled="isTraining"
              @change="onHyperparamChange"
            />
            <span class="param-value">{{ hyperparams.weightDecay.toFixed(4) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="optimizer-actions">
        <Button
          @click="resetOptimizer"
          :disabled="isTraining"
          variant="outline"
          size="sm"
        >
          <ArrowPathIcon class="btn-icon" />
          Reset
        </Button>
        
        <Button
          @click="getOptimizerStatus"
          :disabled="!apiConnected"
          variant="outline"
          size="sm"
        >
          <InformationCircleIcon class="btn-icon" />
          Status
        </Button>
      </div>
    </section>

    <!-- Training Mode Selection -->
    <section class="training-mode">
      <h4 class="section-title">Training Mode</h4>
      <div class="mode-selection">
        <label class="mode-option">
          <input 
            v-model="useOptaxTraining" 
            type="radio" 
            :value="true"
            name="training-mode"
            @change="onTrainingModeChange"
          />
          <span class="mode-label">
            <BoltIcon class="mode-icon" />
            Optax Training
          </span>
          <span class="mode-desc">Use Optax optimizers with softmax cross-entropy loss</span>
        </label>
        
        <label class="mode-option">
          <input 
            v-model="useOptaxTraining" 
            type="radio" 
            :value="false"
            name="training-mode"
            @change="onTrainingModeChange"
          />
          <span class="mode-label">
            <CpuChipIcon class="mode-icon" />
            Legacy Training
          </span>
          <span class="mode-desc">Use custom gradient computation</span>
        </label>
      </div>
    </section>

    <!-- Status Information -->
    <section v-if="optimizerStatus.initialized" class="status-info">
      <h4 class="section-title">Current Configuration</h4>
      <div class="status-details">
        <div class="status-item">
          <span class="status-key">Type:</span>
          <span class="status-value">{{ optimizerStatus.optimizer_type }}</span>
        </div>
        <div class="status-item">
          <span class="status-key">Learning Rate:</span>
          <span class="status-value">{{ hyperparams.learningRate }}</span>
        </div>
        <div v-if="hyperparams.momentum > 0" class="status-item">
          <span class="status-key">Momentum:</span>
          <span class="status-value">{{ hyperparams.momentum }}</span>
        </div>
        <div v-if="hyperparams.weightDecay > 0" class="status-item">
          <span class="status-key">Weight Decay:</span>
          <span class="status-value">{{ hyperparams.weightDecay }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui'
import {
  CogIcon,
  PlayIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  BoltIcon,
  CpuChipIcon
} from '@/components/ui/icons'
import { mnistApiService } from '@/services/mnistApiService'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// Props
interface Props {
  isTraining?: boolean
  apiConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTraining: false,
  apiConnected: false
})

// Emits
const emit = defineEmits<{
  optimizerInitialized: [config: any]
  trainingModeChanged: [useOptax: boolean]
}>()

// State
const selectedOptimizer = ref<'sgd' | 'sgd_momentum' | 'adam' | 'adamw'>('sgd')
const useOptaxTraining = ref(true)

const hyperparams = ref({
  learningRate: 0.01,
  momentum: 0.9,
  weightDecay: 0.0001
})

const optimizerStatus = ref({
  initialized: false,
  optimizer_type: null as string | null,
  config: null as any,
  has_state: false,
  current_epoch: 0
})

// Computed
const canInitialize = computed(() => {
  return props.apiConnected && !props.isTraining
})

const initBtnClass = computed(() => {
  return optimizerStatus.value.initialized ? 'init-btn initialized' : 'init-btn'
})

// Methods
function onOptimizerChange() {
  optimizerStatus.value.initialized = false
  
  // Reset hyperparams based on optimizer type
  if (selectedOptimizer.value === 'adam' || selectedOptimizer.value === 'adamw') {
    hyperparams.value.learningRate = 0.001
  } else {
    hyperparams.value.learningRate = 0.01
  }
}

function onHyperparamChange() {
  // Re-initialize if optimizer was already initialized
  if (optimizerStatus.value.initialized) {
    optimizerStatus.value.initialized = false
  }
}

function onTrainingModeChange() {
  emit('trainingModeChanged', useOptaxTraining.value)
}

async function initializeOptimizer() {
  if (!props.apiConnected) {
    notificationStore.addNotification({
      message: 'API not connected. Please check connection.',
      type: 'error'
    })
    return
  }

  try {
    // Map optimizer types
    const optimizerTypeMap: Record<string, 'sgd' | 'adam' | 'adamw'> = {
      'sgd': 'sgd',
      'sgd_momentum': 'sgd',
      'adam': 'adam',
      'adamw': 'adamw'
    }

    const apiOptimizerType = optimizerTypeMap[selectedOptimizer.value]
    const momentum = selectedOptimizer.value === 'sgd_momentum' ? hyperparams.value.momentum : 0
    const weightDecay = selectedOptimizer.value === 'adamw' ? hyperparams.value.weightDecay : 0

    const result = await mnistApiService.initializeOptimizer(
      apiOptimizerType,
      hyperparams.value.learningRate,
      momentum,
      weightDecay
    )

    optimizerStatus.value = {
      initialized: true,
      optimizer_type: selectedOptimizer.value,
      config: result.config,
      has_state: true,
      current_epoch: 0
    }

    emit('optimizerInitialized', {
      type: selectedOptimizer.value,
      ...hyperparams.value,
      useOptax: useOptaxTraining.value
    })

    notificationStore.addNotification({
      message: `${selectedOptimizer.value.toUpperCase()} optimizer initialized successfully`,
      type: 'success'
    })

  } catch (error) {
    console.error('Failed to initialize optimizer:', error)
    notificationStore.addNotification({
      message: `Failed to initialize optimizer: ${error}`,
      type: 'error'
    })
  }
}

async function resetOptimizer() {
  try {
    await mnistApiService.resetOptimizer()
    
    optimizerStatus.value = {
      initialized: false,
      optimizer_type: null,
      config: null,
      has_state: false,
      current_epoch: 0
    }

    notificationStore.addNotification({
      message: 'Optimizer reset successfully',
      type: 'info'
    })

  } catch (error) {
    console.error('Failed to reset optimizer:', error)
    notificationStore.addNotification({
      message: `Failed to reset optimizer: ${error}`,
      type: 'error'
    })
  }
}

async function getOptimizerStatus() {
  try {
    const status = await mnistApiService.getOptimizerStatus()
    
    optimizerStatus.value = {
      initialized: status.initialized,
      optimizer_type: status.optimizer_type || null,
      config: status.config,
      has_state: status.has_state,
      current_epoch: status.current_epoch
    }

    notificationStore.addNotification({
      message: `Optimizer status: ${status.initialized ? 'Initialized' : 'Not initialized'}`,
      type: 'info'
    })

  } catch (error) {
    console.error('Failed to get optimizer status:', error)
    notificationStore.addNotification({
      message: `Failed to get optimizer status: ${error}`,
      type: 'error'
    })
  }
}

// Watch for API connection changes
watch(() => props.apiConnected, (connected) => {
  if (connected) {
    getOptimizerStatus()
  }
})
</script>

<style scoped>
.mnist-optimizer-panel {
  background: #2d2d30;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #464647;
  background: #383838;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
}

.panel-icon {
  width: 16px;
  height: 16px;
}

.optimizer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999999;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666666;
  transition: background 0.3s ease;
}

.optimizer-status.initialized .status-dot {
  background: #28a745;
}

.optimizer-config {
  padding: 16px 20px;
}

.config-group {
  margin-bottom: 16px;
}

.config-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 8px;
}

.optimizer-selection {
  display: flex;
  gap: 12px;
  align-items: center;
}

.optimizer-select {
  flex: 1;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #464647;
  border-radius: 4px;
  color: #cccccc;
  font-size: 13px;
}

.init-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.init-btn.initialized {
  background: #0e639c;
  border-color: #1177bb;
}

.hyperparams {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.param-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-label {
  font-size: 11px;
  font-weight: 500;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.param-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-input {
  flex: 1;
  padding: 6px 10px;
  background: #1e1e1e;
  border: 1px solid #464647;
  border-radius: 4px;
  color: #cccccc;
  font-size: 12px;
}

.param-value {
  font-size: 12px;
  color: #569cd6;
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

.optimizer-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.training-mode {
  padding: 16px 20px;
  border-top: 1px solid #464647;
  background: #383838;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.mode-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.mode-option:hover {
  background: rgba(255, 255, 255, 0.05);
}

.mode-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #cccccc;
}

.mode-icon {
  width: 14px;
  height: 14px;
}

.mode-desc {
  font-size: 11px;
  color: #999999;
  margin-left: auto;
}

.status-info {
  padding: 16px 20px;
  border-top: 1px solid #464647;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.status-key {
  color: #999999;
}

.status-value {
  color: #cccccc;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 480px) {
  .optimizer-selection {
    flex-direction: column;
    align-items: stretch;
  }
  
  .optimizer-actions {
    flex-direction: column;
  }
  
  .param-input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .param-value {
    text-align: left;
    min-width: auto;
  }
}
</style>
