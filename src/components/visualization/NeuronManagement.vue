<template>
  <div class="neuron-management-panel">
    <!-- Enhanced Header -->
    <div class="panel-header">
      <div class="header-left">
        <div class="panel-icon">
          <CpuChipIcon class="w-5 h-5" />
        </div>
        <div class="panel-title">
          <h3>Neural Network</h3>
          <div class="panel-subtitle">
            {{ neurons.length }} neuron{{ neurons.length !== 1 ? 's' : '' }}
            {{ selectedNeuron ? `• Editing N${selectedNeuron.id}` : '' }}
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <Button
          @click="addRandomNeuron"
          variant="default"
          size="xs"
          title="Add Random Neuron"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </Button>
        
        <Button
          v-if="neurons.length > 0"
          @click="clearAllNeurons"
          variant="destructive"
          size="xs"
          title="Clear All Neurons"
        >
          <TrashIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="panel-content">
      <!-- Selected Neuron Editor -->
      <div v-if="selectedNeuron" class="neuron-editor">
        <div class="editor-header">
          <div class="neuron-identifier">
            <div class="neuron-icon-large" :style="{ backgroundColor: selectedNeuron.color }">
              N{{ selectedNeuron.id }}
            </div>
            <div class="neuron-info">
              <h4>Neuron {{ selectedNeuron.id }}</h4>
              <p>Position: ({{ selectedNeuron.x.toFixed(3) }}, {{ selectedNeuron.y.toFixed(3) }})</p>
            </div>
          </div>
          
          <Button
            @click="$emit('close')"
            variant="ghost"
            size="xs"
            title="Close Editor"
          >
            <XMarkIcon class="w-4 h-4" />
          </Button>
        </div>

        <!-- Position Controls -->
        <div class="control-section">
          <h5 class="section-title">
            <MapPinIcon class="w-4 h-4" />
            Position
          </h5>
          
          <div class="position-controls">
            <div class="coordinate-group">
              <label class="coordinate-label">X Coordinate</label>
              <div class="coordinate-input-wrapper">
                <input
                  v-model.number="selectedNeuron.x"
                  type="number"
                  step="0.01"
                  :min="coordinateRanges.xMin"
                  :max="coordinateRanges.xMax"
                  class="coordinate-input"
                  @change="$emit('update-position')"
                />
                <div class="coordinate-range">
                  {{ coordinateRanges.xMin }} to {{ coordinateRanges.xMax }}
                </div>
              </div>
            </div>
            
            <div class="coordinate-group">
              <label class="coordinate-label">Y Coordinate</label>
              <div class="coordinate-input-wrapper">
                <input
                  v-model.number="selectedNeuron.y"
                  type="number"
                  step="0.01"
                  :min="coordinateRanges.yMin"
                  :max="coordinateRanges.yMax"
                  class="coordinate-input"
                  @change="$emit('update-position')"
                />
                <div class="coordinate-range">
                  {{ coordinateRanges.yMin }} to {{ coordinateRanges.yMax }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Position Presets -->
          <div class="position-presets">
            <span class="presets-label">Quick positions:</span>
            <div class="preset-buttons">
              <button
                v-for="preset in positionPresets"
                :key="preset.name"
                @click="setPresetPosition(preset)"
                class="preset-button"
                :title="preset.description"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Appearance Controls -->
        <div class="control-section">
          <h5 class="section-title">
            <SwatchIcon class="w-4 h-4" />
            Appearance
          </h5>
          
          <div class="appearance-controls">
            <div class="color-control">
              <label class="color-label">Color</label>
              <div class="color-picker-wrapper">
                <input
                  v-model="selectedNeuron.color"
                  type="color"
                  class="color-picker"
                  @change="$emit('update-color')"
                />
                <div class="color-info">
                  <span class="color-value">{{ selectedNeuron.color.toUpperCase() }}</span>
                  <div class="color-preview" :style="{ backgroundColor: selectedNeuron.color }"></div>
                </div>
              </div>
            </div>
            
            <!-- Color Presets -->
            <div class="color-presets">
              <span class="presets-label">Presets:</span>
              <div class="preset-colors">
                <button
                  v-for="color in colorPresets"
                  :key="color"
                  @click="setPresetColor(color)"
                  class="color-preset"
                  :style="{ backgroundColor: color }"
                  :title="color"
                ></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="control-section">
          <h5 class="section-title">
            <ChartBarIcon class="w-4 h-4" />
            Performance
          </h5>
          
          <div class="performance-metrics">
            <div class="metric-item">
              <div class="metric-label">Controlled Area</div>
              <div class="metric-value-wrapper">
                <div class="metric-value">{{ controlledArea.toFixed(1) }}%</div>
                <div class="metric-bar">
                  <div class="metric-fill" :style="{ width: `${controlledArea}%` }"></div>
                </div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">Average Score</div>
              <div class="metric-value-wrapper">
                <div class="metric-value">{{ averageScore.toFixed(3) }}</div>
                <div class="metric-description">
                  {{ getScoreDescription(averageScore) }}
                </div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">Classification Impact</div>
              <div class="metric-value-wrapper">
                <div class="metric-value">{{ classificationImpact }}</div>
                <div class="metric-description">
                  {{ getImpactDescription(classificationImpact) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="control-section">
          <h5 class="section-title">
            <CogIcon class="w-4 h-4" />
            Actions
          </h5>
          
          <div class="action-buttons">
            <Button
              @click="duplicateNeuron"
              variant="outline"
              size="sm"
              class="action-button"
            >
              <DocumentDuplicateIcon class="w-4 h-4" />
              Duplicate
            </Button>
            
            <Button
              @click="centerNeuron"
              variant="outline"
              size="sm"
              class="action-button"
            >
              <ViewfinderCircleIcon class="w-4 h-4" />
              Center
            </Button>
            
            <Button
              @click="randomizePosition"
              variant="outline"
              size="sm"
              class="action-button"
            >
              <ArrowPathIcon class="w-4 h-4" />
              Randomize
            </Button>
            
            <Button
              @click="$emit('remove', selectedNeuron.id)"
              variant="destructive"
              size="sm"
              class="action-button"
            >
              <TrashIcon class="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <!-- Neurons List -->
      <div v-else class="neurons-list-container">
        <!-- List Header -->
        <div class="list-header">
          <h4>Network Neurons</h4>
          <div class="list-controls">
            <div class="sort-control">
              <label class="sort-label">Sort by:</label>
              <select v-model="sortBy" class="sort-select">
                <option value="id">ID</option>
                <option value="position">Position</option>
                <option value="area">Area</option>
                <option value="score">Score</option>
              </select>
            </div>
            
            <div class="view-control">
              <button
                @click="listView = 'grid'"
                :class="['view-button', { active: listView === 'grid' }]"
                title="Grid View"
              >
                <Squares2X2Icon class="w-4 h-4" />
              </button>
              <button
                @click="listView = 'list'"
                :class="['view-button', { active: listView === 'list' }]"
                title="List View"
              >
                <ListBulletIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="neurons.length === 0" class="empty-neurons">
          <div class="empty-icon">
            <CpuChipIcon class="w-12 h-12 opacity-40" />
          </div>
          <h4>No Neurons</h4>
          <p>Click on the canvas to add neurons or use the button above</p>
        </div>

        <!-- Neurons Grid/List -->
        <div v-else class="neurons-list" :class="listView">
          <div
            v-for="neuron in sortedNeurons"
            :key="neuron.id"
            @click="$emit('select', neuron)"
            class="neuron-card"
            :class="{ selected: selectedNeuron?.id === neuron.id }"
          >
            <div class="neuron-card-header">
              <div class="neuron-icon" :style="{ backgroundColor: neuron.color }">
                {{ neuron.id }}
              </div>
              <div class="neuron-basic-info">
                <div class="neuron-name">Neuron {{ neuron.id }}</div>
                <div class="neuron-coords">
                  ({{ neuron.x.toFixed(2) }}, {{ neuron.y.toFixed(2) }})
                </div>
              </div>
            </div>
            
            <div class="neuron-card-metrics">
              <div class="mini-metric">
                <span class="mini-label">Area</span>
                <span class="mini-value">{{ getNeuronArea(neuron).toFixed(1) }}%</span>
              </div>
              <div class="mini-metric">
                <span class="mini-label">Score</span>
                <span class="mini-value">{{ getNeuronScore(neuron).toFixed(2) }}</span>
              </div>
            </div>
            
            <div class="neuron-card-actions">
              <button
                @click.stop="$emit('select', neuron)"
                class="quick-action"
                title="Edit Neuron"
              >
                <PencilIcon class="w-3 h-3" />
              </button>
              <button
                @click.stop="$emit('remove', neuron.id)"
                class="quick-action delete"
                title="Delete Neuron"
              >
                <TrashIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- List Statistics -->
        <div v-if="neurons.length > 0" class="list-statistics">
          <div class="stat-item">
            <span class="stat-label">Total Coverage</span>
            <span class="stat-value">{{ totalCoverage.toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg Distance</span>
            <span class="stat-value">{{ averageDistance.toFixed(2) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Network Density</span>
            <span class="stat-value">{{ networkDensity }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CpuChipIcon, 
  TrashIcon, 
  XMarkIcon, 
  MapIcon as MapPinIcon, 
  CogIcon as SwatchIcon,
  ChartBarIcon, 
  CogIcon,
  DocumentTextIcon as DocumentDuplicateIcon,
  CursorArrowRaysIcon as ViewfinderCircleIcon,
  ArrowPathIcon,
  Square3Stack3DIcon as Squares2X2Icon,
  ChartBarSquareIcon as ListBulletIcon,
  CursorArrowRaysIcon as PencilIcon
} from '@/components/ui/icons'
import { Button } from '@/components/ui'
import type { Neuron } from '@/types'

interface Props {
  neurons: Neuron[]
  selectedNeuron: Neuron | null
  coordinateRanges: {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
  }
  getControlledArea: (neuron: Neuron) => number
  getAverageScore: (neuron: Neuron) => number
}

interface Emits {
  (e: 'select', neuron: Neuron): void
  (e: 'close'): void
  (e: 'update-position'): void
  (e: 'update-color'): void
  (e: 'remove', neuronId: number): void
  (e: 'add-neuron', x: number, y: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// UI State
const sortBy = ref<'id' | 'position' | 'area' | 'score'>('id')
const listView = ref<'grid' | 'list'>('grid')

// Position presets
const positionPresets = [
  { name: 'Center', x: 0, y: 0, description: 'Move to center' },
  { name: 'Top-Left', x: -0.8, y: 0.8, description: 'Move to top-left corner' },
  { name: 'Top-Right', x: 0.8, y: 0.8, description: 'Move to top-right corner' },
  { name: 'Bottom-Left', x: -0.8, y: -0.8, description: 'Move to bottom-left corner' },
  { name: 'Bottom-Right', x: 0.8, y: -0.8, description: 'Move to bottom-right corner' }
]

// Color presets
const colorPresets = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
]

// Computed stats for selected neuron
const controlledArea = computed(() => 
  props.selectedNeuron ? props.getControlledArea(props.selectedNeuron) : 0
)

const averageScore = computed(() => 
  props.selectedNeuron ? props.getAverageScore(props.selectedNeuron) : 0
)

const classificationImpact = computed(() => {
  if (!props.selectedNeuron) return 'None'
  const area = controlledArea.value
  if (area > 40) return 'High'
  if (area > 20) return 'Medium'
  if (area > 5) return 'Low'
  return 'Minimal'
})

// Sorted neurons based on current sort criteria
const sortedNeurons = computed((): Neuron[] => {
  const sorted = [...props.neurons]
  
  if (sortBy.value === 'id') {
    return sorted.sort((a, b) => a.id - b.id)
  } else if (sortBy.value === 'position') {
    return sorted.sort((a, b) => {
      const distA = Math.sqrt(a.x * a.x + a.y * a.y)
      const distB = Math.sqrt(b.x * b.x + b.y * b.y)
      return distA - distB
    })
  } else if (sortBy.value === 'area') {
    return sorted.sort((a, b) => props.getControlledArea(b) - props.getControlledArea(a))
  } else if (sortBy.value === 'score') {
    return sorted.sort((a, b) => props.getAverageScore(b) - props.getAverageScore(a))
  }
  return sorted
})

// Network statistics
const totalCoverage = computed(() => {
  return props.neurons.reduce((sum, neuron) => sum + getNeuronArea(neuron), 0)
})

const averageDistance = computed(() => {
  if (props.neurons.length < 2) return 0
  
  let totalDistance = 0
  let count = 0
  
  for (let i = 0; i < props.neurons.length; i++) {
    for (let j = i + 1; j < props.neurons.length; j++) {
      const dx = props.neurons[i].x - props.neurons[j].x
      const dy = props.neurons[i].y - props.neurons[j].y
      totalDistance += Math.sqrt(dx * dx + dy * dy)
      count++
    }
  }
  
  return count > 0 ? totalDistance / count : 0
})

const networkDensity = computed(() => {
  const density = props.neurons.length / 4 // Assuming 2x2 grid area
  if (density < 0.5) return 'Sparse'
  if (density < 1.5) return 'Moderate'
  if (density < 3) return 'Dense'
  return 'Very Dense'
})

// Helper functions
function getNeuronArea(neuron: Neuron): number {
  return props.getControlledArea(neuron)
}

function getNeuronScore(neuron: Neuron): number {
  return props.getAverageScore(neuron)
}

function getScoreDescription(score: number): string {
  if (score > 0.8) return 'Excellent'
  if (score > 0.5) return 'Good'
  if (score > 0.2) return 'Average'
  if (score > 0) return 'Poor'
  return 'Very Poor'
}

function getImpactDescription(impact: string): string {
  switch (impact) {
    case 'High': return 'Dominates classification'
    case 'Medium': return 'Significant influence'
    case 'Low': return 'Minor influence'
    case 'Minimal': return 'Little influence'
    default: return 'No influence'
  }
}

// Actions
function setPresetPosition(preset: { x: number; y: number }) {
  if (props.selectedNeuron) {
    props.selectedNeuron.x = preset.x
    props.selectedNeuron.y = preset.y
    emit('update-position')
  }
}

function setPresetColor(color: string) {
  if (props.selectedNeuron) {
    props.selectedNeuron.color = color
    emit('update-color')
  }
}

function duplicateNeuron() {
  if (props.selectedNeuron) {
    const offset = 0.1
    emit('add-neuron', 
      props.selectedNeuron.x + offset, 
      props.selectedNeuron.y + offset
    )
  }
}

function centerNeuron() {
  setPresetPosition({ x: 0, y: 0 })
}

function randomizePosition() {
  if (props.selectedNeuron) {
    const x = (Math.random() - 0.5) * 1.6 // Random between -0.8 and 0.8
    const y = (Math.random() - 0.5) * 1.6
    props.selectedNeuron.x = x
    props.selectedNeuron.y = y
    emit('update-position')
  }
}

function addRandomNeuron() {
  const x = (Math.random() - 0.5) * 1.6
  const y = (Math.random() - 0.5) * 1.6
  emit('add-neuron', x, y)
}

function clearAllNeurons() {
  if (confirm('Are you sure you want to delete all neurons?')) {
    props.neurons.forEach(neuron => {
      emit('remove', neuron.id)
    })
  }
}
</script>

<style scoped>
.neuron-management-panel {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgb(var(--bg-tertiary));
  border-bottom: 1px solid rgb(var(--border-primary));
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(var(--color-primary));
  color: white;
  border-radius: 8px;
}

.panel-title h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
}

.panel-subtitle {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  margin-top: 0.125rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Neuron Editor Styles */
.neuron-editor {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
}

.neuron-identifier {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.neuron-icon-large {
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.neuron-info h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
}

.neuron-info p {
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
  margin: 0.25rem 0 0 0;
  font-family: monospace;
}

.control-section {
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.position-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.coordinate-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.coordinate-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
}

.coordinate-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.coordinate-input {
  padding: 0.75rem;
  font-size: 0.875rem;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 6px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
  font-family: monospace;
  text-align: center;
}

.coordinate-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
}

.coordinate-range {
  font-size: 0.625rem;
  color: rgb(var(--text-tertiary));
  text-align: center;
  font-family: monospace;
}

.position-presets,
.color-presets {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.presets-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--text-secondary));
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgb(var(--bg-tertiary));
  color: rgb(var(--text-secondary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-button:hover {
  background: rgb(var(--bg-hover));
  color: rgb(var(--text-primary));
  border-color: rgb(var(--border-tertiary));
}

.appearance-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-picker {
  width: 3rem;
  height: 3rem;
  border: 2px solid rgb(var(--border-secondary));
  border-radius: 8px;
  cursor: pointer;
  background: none;
}

.color-picker:hover {
  border-color: rgb(var(--border-tertiary));
}

.color-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-value {
  font-family: monospace;
  font-size: 0.875rem;
  color: rgb(var(--text-primary));
  font-weight: 500;
}

.color-preview {
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  border: 1px solid rgb(var(--border-secondary));
}

.preset-colors {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-preset {
  width: 2rem;
  height: 2rem;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preset:hover {
  border-color: rgb(var(--text-primary));
  transform: scale(1.1);
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
}

.metric-value-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
}

.metric-bar {
  height: 4px;
  background: rgb(var(--bg-tertiary));
  border-radius: 2px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: rgb(var(--color-primary));
  transition: width 0.3s ease;
}

.metric-description {
  font-size: 0.75rem;
  color: rgb(var(--text-tertiary));
  font-style: italic;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
}

/* Neurons List Styles */
.neurons-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(var(--border-secondary));
  flex-shrink: 0;
}

.list-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0 0 1rem 0;
}

.list-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
}

.sort-select {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  background: rgb(var(--bg-primary));
  color: rgb(var(--text-primary));
}

.view-control {
  display: flex;
  gap: 0.25rem;
}

.view-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-button:hover {
  background: rgb(var(--bg-hover));
}

.view-button.active {
  background: rgb(var(--color-primary));
  color: white;
  border-color: rgb(var(--color-primary));
}

.empty-neurons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  flex: 1;
  gap: 1rem;
}

.empty-icon {
  color: rgb(var(--text-tertiary));
}

.empty-neurons h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin: 0;
}

.empty-neurons p {
  color: rgb(var(--text-secondary));
  margin: 0;
}

.neurons-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.neurons-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.neurons-list.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.neuron-card {
  background: rgb(var(--bg-primary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.neuron-card:hover {
  background: rgb(var(--bg-hover));
  border-color: rgb(var(--border-tertiary));
  transform: translateY(-1px);
  box-shadow: var(--shadow-small);
}

.neuron-card.selected {
  border-color: rgb(var(--color-primary));
  background: rgba(var(--color-primary), 0.05);
}

.neurons-list.list .neuron-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
}

.neuron-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.neurons-list.list .neuron-card-header {
  margin-bottom: 0;
  flex: 1;
}

.neuron-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.neuron-basic-info {
  flex: 1;
}

.neuron-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
  margin-bottom: 0.125rem;
}

.neuron-coords {
  font-size: 0.75rem;
  color: rgb(var(--text-secondary));
  font-family: monospace;
}

.neuron-card-metrics {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.neurons-list.list .neuron-card-metrics {
  margin-bottom: 0;
  flex-shrink: 0;
}

.mini-metric {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.mini-label {
  font-size: 0.625rem;
  color: rgb(var(--text-tertiary));
  text-transform: uppercase;
  font-weight: 600;
}

.mini-value {
  font-size: 0.75rem;
  color: rgb(var(--text-primary));
  font-weight: 600;
  font-family: monospace;
}

.neuron-card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.neurons-list.list .neuron-card-actions {
  flex-shrink: 0;
}

.quick-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: rgb(var(--bg-tertiary));
  border: 1px solid rgb(var(--border-secondary));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgb(var(--text-secondary));
}

.quick-action:hover {
  background: rgb(var(--bg-hover));
  color: rgb(var(--text-primary));
}

.quick-action.delete:hover {
  background: rgb(var(--color-error));
  color: white;
  border-color: rgb(var(--color-error));
}

.list-statistics {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgb(var(--border-secondary));
  background: rgb(var(--bg-tertiary));
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-secondary));
  text-transform: uppercase;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .list-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .neurons-list.grid {
    grid-template-columns: 1fr;
  }
  
  .position-controls {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .list-statistics {
    grid-template-columns: 1fr;
  }
}

/* Custom scrollbar */
.neuron-editor::-webkit-scrollbar,
.neurons-list::-webkit-scrollbar {
  width: 6px;
}

.neuron-editor::-webkit-scrollbar-track,
.neurons-list::-webkit-scrollbar-track {
  background: rgb(var(--bg-tertiary));
}

.neuron-editor::-webkit-scrollbar-thumb,
.neurons-list::-webkit-scrollbar-thumb {
  background: rgb(var(--border-tertiary));
  border-radius: 3px;
}

.neuron-editor::-webkit-scrollbar-thumb:hover,
.neurons-list::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--color-primary));
}
</style> 