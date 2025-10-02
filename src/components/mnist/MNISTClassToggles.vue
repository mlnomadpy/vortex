<template>
  <div class="mnist-class-toggles">
    <div class="toggles-container">
      <button
        v-for="digit in digits"
        :key="digit"
        :class="['digit-toggle', { 
          active: store.activeClasses.includes(digit),
          training: store.isTraining 
        }]"
        :disabled="store.isTraining"
        :title="`Toggle digit ${digit}`"
        @click="store.toggleClass(digit)"
      >
        <span class="digit-label">{{ digit }}</span>
        <span class="digit-count">{{ getDigitCount(digit) }}</span>
      </button>
    </div>
    
    <div class="toggle-actions">
      <button class="action-btn" :disabled="store.isTraining" @click="toggleAll">
        {{ allActive ? 'Hide All' : 'Show All' }}
      </button>
      <button class="action-btn" :disabled="store.isTraining" @click="toggleOddEven">
        {{ evenActive ? 'Odds Only' : 'Evens Only' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMNISTClassifierStore } from '@/stores/mnistClassifier'

const store = useMNISTClassifierStore()

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const allActive = computed(() => store.activeClasses.length === 10)
const evenActive = computed(() => store.activeClasses.every(d => d % 2 === 0))

function getDigitCount(digit: number): number {
  return store.filteredTrainData.filter(point => point.label === digit).length
}

function toggleAll() {
  if (allActive.value) {
    // Hide all
    store.activeClasses = []
  } else {
    // Show all
    store.activeClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
}

function toggleOddEven() {
  if (evenActive.value) {
    // Show odds only
    store.activeClasses = [1, 3, 5, 7, 9]
  } else {
    // Show evens only
    store.activeClasses = [0, 2, 4, 6, 8]
  }
}
</script>

<style scoped>
.mnist-class-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--glass-bg);
  border-radius: 6px;
  backdrop-filter: var(--glass-backdrop);
}

.toggles-container {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.digit-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 4px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.digit-toggle:hover:not(:disabled) {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-secondary));
  transform: translateY(-1px);
}

.digit-toggle.active {
  background: rgb(var(--color-primary));
  border-color: rgb(var(--color-primary));
  color: rgb(var(--text-primary));
}

.digit-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.digit-toggle.training {
  pointer-events: none;
}

.digit-label {
  font-weight: 600;
  font-size: 14px;
}

.digit-count {
  font-size: 8px;
  opacity: 0.7;
  margin-top: 1px;
}

.toggle-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  padding: 4px 8px;
  background: rgb(var(--bg-secondary));
  border: 1px solid rgb(var(--border-primary));
  border-radius: 3px;
  color: rgb(var(--text-primary));
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
}

.action-btn:hover:not(:disabled) {
  background: rgb(var(--bg-tertiary));
  border-color: rgb(var(--border-secondary));
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 