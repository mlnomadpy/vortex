<template>
  <div class="metrics-grid" :class="{ detailed: showDetailed }">
    <!-- Primary metrics -->
    <div class="metric-card primary loss">
      <div class="metric-header">
        <ChartLineIcon class="metric-icon" />
        <TrendIcon :trend="lossTrend" />
      </div>
      <div class="metric-content">
        <div class="metric-label">Loss</div>
        <div class="metric-value">{{ formatValue(currentLoss, 4) }}</div>
        <div v-if="showDetailed" class="metric-best">
          Best: {{ formatValue(bestLoss, 4) }}
        </div>
      </div>
    </div>
    
    <div class="metric-card primary accuracy">
      <div class="metric-header">
        <CalculatorIcon class="metric-icon" />
        <TrendIcon :trend="accuracyTrend" />
      </div>
      <div class="metric-content">
        <div class="metric-label">Accuracy</div>
        <div class="metric-value">{{ formatValue(currentAccuracy, 1) }}%</div>
        <div v-if="showDetailed" class="metric-best">
          Best: {{ formatValue(bestAccuracy, 1) }}%
        </div>
      </div>
    </div>
    
    <!-- Secondary metrics (detailed view) -->
    <template v-if="showDetailed">
      <div class="metric-card secondary speed">
        <div class="metric-header">
          <BoltIcon class="metric-icon" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Speed</div>
          <div class="metric-value">{{ formatValue(stepsPerSecond, 1) }}/s</div>
          <div class="metric-sublabel">steps per second</div>
        </div>
      </div>
      
      <div class="metric-card secondary convergence">
        <div class="metric-header">
          <CogIcon class="metric-icon" />
          <StatusDot :status="convergenceStatus" />
        </div>
        <div class="metric-content">
          <div class="metric-label">Convergence</div>
          <div class="metric-value small">{{ convergenceStatus }}</div>
          <div class="metric-sublabel">{{ getConvergenceDescription() }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ChartLineIcon,
  CalculatorIcon,
  BoltIcon,
  CogIcon,
} from '@/components/ui/icons'
import TrendIcon from '@/components/ui/TrendIcon.vue'
import StatusDot from '@/components/ui/StatusDot.vue'

interface Props {
  showDetailed: boolean
  currentLoss: number
  currentAccuracy: number
  bestLoss: number
  bestAccuracy: number
  stepsPerSecond: number
  convergenceStatus: 'converged' | 'converging' | 'stable' | 'exploring' | 'starting'
  lossTrend: 'up' | 'down' | 'neutral'
  accuracyTrend: 'up' | 'down' | 'neutral'
}

const props = defineProps<Props>()

function formatValue(value: number, decimals: number = 2): string {
  if (value === 0) return '0'
  if (isNaN(value)) return '—'
  return value.toFixed(decimals)
}

function getConvergenceDescription(): string {
  switch (props.convergenceStatus) {
    case 'converged': return 'Loss stabilized'
    case 'converging': return 'Loss decreasing'
    case 'stable': return 'Loss stable'
    case 'exploring': return 'Loss varying'
    default: return 'Initializing'
  }
}
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.metrics-grid.detailed {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.metric-card {
  background: var(--metric-bg, #383838);
  border-radius: 6px;
  border: 1px solid var(--metric-border, #555555);
  padding: 12px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.metric-card:hover {
  border-color: var(--metric-hover-border, #666666);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.metric-card.primary {
  border-left: 3px solid var(--primary-color, #007acc);
}

.metric-card.primary.loss {
  border-left-color: var(--danger-color, #dc3545);
}

.metric-card.primary.accuracy {
  border-left-color: var(--success-color, #28a745);
}

.metric-card.secondary {
  border-left: 3px solid var(--secondary-color, #6c757d);
}

.metric-card.secondary.speed {
  border-left-color: var(--warning-color, #ffc107);
}

.metric-card.secondary.convergence {
  border-left-color: var(--info-color, #17a2b8);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-icon {
  width: 16px;
  height: 16px;
  color: var(--metric-icon-color, #999999);
}

.metric-content {
  text-align: left;
}

.metric-label {
  font-size: 10px;
  color: var(--text-secondary, #999999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-weight: 500;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #cccccc);
  line-height: 1.2;
}

.metric-value.small {
  font-size: 12px;
}

.metric-best {
  font-size: 10px;
  color: var(--text-tertiary, #777777);
  margin-top: 2px;
}

.metric-sublabel {
  font-size: 9px;
  color: var(--text-tertiary, #777777);
  margin-top: 2px;
  line-height: 1.2;
}

/* Color variations for different card types */
.metric-card.loss .metric-icon {
  color: var(--danger-color, #dc3545);
}

.metric-card.accuracy .metric-icon {
  color: var(--success-color, #28a745);
}

.metric-card.speed .metric-icon {
  color: var(--warning-color, #ffc107);
}

.metric-card.convergence .metric-icon {
  color: var(--info-color, #17a2b8);
}

/* Responsive design */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
  }
  
  .metrics-grid.detailed {
    grid-template-columns: 1fr;
  }
  
  .metric-card {
    padding: 10px;
  }
  
  .metric-value {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .metric-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style> 