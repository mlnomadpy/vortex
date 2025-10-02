<template>
  <Teleport to="body">
    <div v-if="isVisible" class="onboarding-overlay">
      <!-- Backdrop with pulse animation -->
      <div class="fixed inset-0 bg-black/60 z-40 animate-pulse-slow"></div>
      
      <!-- Spotlight with glow effect -->
      <div 
        v-if="currentStepTarget"
        class="onboarding-spotlight"
        :style="spotlightStyle"
      >
        <!-- Animated border -->
        <div class="spotlight-border"></div>
        <!-- Ripple effect -->
        <div class="spotlight-ripple" :class="{ active: isSpotlightActive }"></div>
      </div>
      
      <!-- Tour Card with enhanced design -->
      <div 
        v-if="currentStep"
        class="onboarding-card"
        :style="cardStyle"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="flex items-center space-x-3">
            <div class="step-indicator">
              <div class="step-number">{{ currentStepIndex + 1 }}</div>
              <div class="step-progress">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }"
                ></div>
              </div>
            </div>
            <div>
              <h3 class="card-title">{{ currentStep.title }}</h3>
              <p class="card-subtitle">Step {{ currentStepIndex + 1 }} of {{ steps.length }}</p>
            </div>
          </div>
          <button
            class="close-button"
            aria-label="Skip tutorial"
            @click="skipTour"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Card Content -->
        <div class="card-content">
          <div class="description-section">
            <p class="description-text">{{ currentStep.description }}</p>
            
            <!-- Interactive Demo Section -->
            <div v-if="currentStep.interactive" class="interactive-demo">
              <div class="demo-header">
                <span class="demo-icon">🎯</span>
                <span class="demo-label">Try it now:</span>
              </div>
              <div class="demo-content">
                <component 
                  :is="currentStep.interactive.component" 
                  v-bind="currentStep.interactive.props"
                  @action="handleInteractiveAction"
                />
              </div>
            </div>
            
            <!-- Tips Section with icons -->
            <div v-if="currentStep.tips?.length" class="tips-section">
              <div class="tips-header">
                <span class="tips-icon">💡</span>
                <span class="tips-label">Pro Tips:</span>
              </div>
              <ul class="tips-list">
                <li v-for="(tip, index) in currentStep.tips" :key="index" class="tip-item">
                  <span class="tip-bullet">{{ index + 1 }}</span>
                  <span class="tip-text">{{ tip }}</span>
                </li>
              </ul>
            </div>
            
            <!-- Keyboard Shortcuts -->
            <div v-if="showKeyboardShortcuts" class="shortcuts-section">
              <div class="shortcuts-header">
                <span class="shortcuts-icon">⌨️</span>
                <span class="shortcuts-label">Keyboard Shortcuts:</span>
              </div>
              <div class="shortcuts-grid">
                <div class="shortcut-item">
                  <kbd>←</kbd><span>Previous</span>
                </div>
                <div class="shortcut-item">
                  <kbd>→</kbd><span>Next</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Esc</kbd><span>Skip</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Space</kbd><span>Continue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Card Footer -->
        <div class="card-footer">
          <!-- Progress Dots -->
          <div class="progress-dots">
            <div 
              v-for="(_, index) in steps"
              :key="index"
              :class="[
                'progress-dot',
                {
                  'active': index === currentStepIndex,
                  'completed': index < currentStepIndex,
                  'upcoming': index > currentStepIndex
                }
              ]"
              @click="goToStep(index)"
            ></div>
          </div>
          
          <!-- Navigation Buttons -->
          <div class="navigation-buttons">
            <button
              v-if="currentStepIndex > 0"
              class="nav-button secondary"
              @click="previousStep"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div class="flex-1"></div>
            
            <button
              class="nav-button ghost"
              @click="skipTour"
            >
              Skip Tutorial
            </button>
            
            <button
              v-if="currentStepIndex < steps.length - 1"
              class="nav-button primary"
              :disabled="currentStep.waitForInteraction && !interactionCompleted"
              @click="nextStep"
            >
              {{ currentStep.waitForInteraction && !interactionCompleted ? 'Complete Action First' : 'Next' }}
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              v-else
              class="nav-button success"
              @click="completeTour"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Complete Tour
            </button>
          </div>
        </div>
      </div>
      
      <!-- Floating Help Button -->
      <div class="floating-help">
        <button 
          class="help-button"
          :class="{ active: showKeyboardShortcuts }"
          title="Toggle keyboard shortcuts"
          @click="showKeyboardShortcuts = !showKeyboardShortcuts"
        >
          <span class="help-icon">?</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useUserPreferences } from '@/composables/useUserPreferences'

interface TourStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  tips?: string[]
  waitForInteraction?: boolean
  interactive?: {
    component: string
    props?: Record<string, any>
  }
  beforeEnter?: () => void
  afterLeave?: () => void
}

interface Props {
  steps: TourStep[]
  autoStart?: boolean
  showKeyboardHelp?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
  showKeyboardHelp: true
})

const emit = defineEmits<{
  complete: []
  skip: []
  stepChange: [step: TourStep, index: number]
  beforeStep: [step: TourStep, index: number]
  afterStep: [step: TourStep, index: number]
}>()

const { updatePreference } = useUserPreferences()

const isVisible = ref(false)
const currentStepIndex = ref(0)
const currentStepTarget = ref<HTMLElement | null>(null)
const isSpotlightActive = ref(false)
const interactionCompleted = ref(false)
const showKeyboardShortcuts = ref(false)

const currentStep = computed(() => props.steps[currentStepIndex.value])

const spotlightStyle = ref<Record<string, string>>({})
const cardStyle = ref<Record<string, string>>({})

// Watch for step changes to trigger animations
watch(currentStepIndex, () => {
  interactionCompleted.value = false
  isSpotlightActive.value = false
  
  setTimeout(() => {
    isSpotlightActive.value = true
  }, 100)
})

const startTour = () => {
  isVisible.value = true
  currentStepIndex.value = 0
  updateTargetAndPosition()
}

const nextStep = () => {
  if (currentStepIndex.value < props.steps.length - 1) {
    const currentStepData = currentStep.value
    
    // Execute afterLeave hook
    currentStepData.afterLeave?.()
    
    emit('afterStep', currentStepData, currentStepIndex.value)
    
    currentStepIndex.value++
    
    const nextStepData = currentStep.value
    
    // Execute beforeEnter hook
    nextStepData.beforeEnter?.()
    
    emit('beforeStep', nextStepData, currentStepIndex.value)
    
    updateTargetAndPosition()
    emit('stepChange', nextStepData, currentStepIndex.value)
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    const currentStepData = currentStep.value
    currentStepData.afterLeave?.()
    
    emit('afterStep', currentStepData, currentStepIndex.value)
    
    currentStepIndex.value--
    
    const prevStepData = currentStep.value
    prevStepData.beforeEnter?.()
    
    emit('beforeStep', prevStepData, currentStepIndex.value)
    
    updateTargetAndPosition()
    emit('stepChange', prevStepData, currentStepIndex.value)
  }
}

const goToStep = (index: number) => {
  if (index >= 0 && index < props.steps.length && index !== currentStepIndex.value) {
    currentStepIndex.value = index
    updateTargetAndPosition()
    emit('stepChange', currentStep.value, currentStepIndex.value)
  }
}

const skipTour = () => {
  isVisible.value = false
  emit('skip')
}

const completeTour = () => {
  isVisible.value = false
  updatePreference('hasSeenTutorial', true)
  emit('complete')
}

const handleInteractiveAction = (_action: string) => {
  interactionCompleted.value = true
  
  if (currentStep.value.waitForInteraction) {
    // Auto-advance after a short delay to show success
    setTimeout(() => {
      nextStep()
    }, 1000)
  }
}

const updateTargetAndPosition = async () => {
  await nextTick()
  
  if (!currentStep.value.target) {
    currentStepTarget.value = null
    positionCardCenter()
    return
  }
  
  const target = document.querySelector(currentStep.value.target) as HTMLElement
  if (!target) {
    currentStepTarget.value = null
    positionCardCenter()
    return
  }
  
  currentStepTarget.value = target
  
  // Smooth scroll to target with better timing
  target.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center',
    inline: 'center' 
  })
  
  // Wait for scroll to complete
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const targetRect = target.getBoundingClientRect()
  const padding = 12
  
  // Enhanced spotlight effect
  spotlightStyle.value = {
    position: 'fixed',
    top: `${targetRect.top - padding}px`,
    left: `${targetRect.left - padding}px`,
    width: `${targetRect.width + padding * 2}px`,
    height: `${targetRect.height + padding * 2}px`,
    borderRadius: '12px',
    zIndex: '45',
    pointerEvents: 'none',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  }
  
  // Position tour card
  positionCard(targetRect)
}

const positionCard = (targetRect: DOMRect) => {
  const cardWidth = 420
  const cardHeight = 400 // Approximate
  const margin = 24
  const position = currentStep.value.position || 'right'
  
  let top = 0
  let left = 0
  
  switch (position) {
    case 'top':
      top = targetRect.top - cardHeight - margin
      left = targetRect.left + (targetRect.width - cardWidth) / 2
      break
    case 'bottom':
      top = targetRect.bottom + margin
      left = targetRect.left + (targetRect.width - cardWidth) / 2
      break
    case 'left':
      top = targetRect.top + (targetRect.height - cardHeight) / 2
      left = targetRect.left - cardWidth - margin
      break
    case 'right':
    default:
      top = targetRect.top + (targetRect.height - cardHeight) / 2
      left = targetRect.right + margin
      break
  }
  
  // Enhanced viewport clamping
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  top = Math.max(margin, Math.min(top, viewportHeight - cardHeight - margin))
  left = Math.max(margin, Math.min(left, viewportWidth - cardWidth - margin))
  
  cardStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${cardWidth}px`,
    maxHeight: `${Math.min(cardHeight, viewportHeight - 2 * margin)}px`,
    zIndex: '50',
    transform: 'translateZ(0)'
  }
}

const positionCardCenter = () => {
  cardStyle.value = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '420px',
    maxHeight: '80vh',
    zIndex: '50'
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isVisible.value) return
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      skipTour()
      break
    case 'ArrowRight':
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (currentStepIndex.value < props.steps.length - 1) {
        nextStep()
      } else {
        completeTour()
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (currentStepIndex.value > 0) {
        previousStep()
      }
      break
    case '?':
      event.preventDefault()
      showKeyboardShortcuts.value = !showKeyboardShortcuts.value
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  if (props.autoStart) {
    startTour()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

defineExpose({
  startTour,
  skipTour,
  completeTour,
  nextStep,
  previousStep,
  goToStep
})
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

/* Enhanced spotlight with animations */
.onboarding-spotlight {
  pointer-events: none;
  position: relative;
}

.spotlight-border {
  position: absolute;
  inset: 0;
  border: 3px solid rgb(59 130 246);
  border-radius: inherit;
  animation: pulse-glow 2s ease-in-out infinite;
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.2),
    0 0 0 9999px rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(59, 130, 246, 0.1);
}

.spotlight-ripple {
  position: absolute;
  inset: -20px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: inherit;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.6s ease-out;
}

.spotlight-ripple.active {
  opacity: 1;
  transform: scale(1.1);
  animation: ripple 1.5s ease-out infinite;
}

/* Enhanced tour card design */
.onboarding-card {
  background: white;
  border-radius: 16px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  animation: slideInCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .onboarding-card {
  background: rgb(17 24 39);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgb(229 231 235);
  background: linear-gradient(135deg, rgb(248 250 252), rgb(241 245 249));
}

.dark .card-header {
  border-bottom-color: rgb(75 85 99);
  background: linear-gradient(135deg, rgb(30 41 59), rgb(15 23 42));
}

.step-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgb(59 130 246), rgb(99 102 241));
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.125rem;
  z-index: 2;
}

.step-progress {
  position: absolute;
  inset: 0;
  background: rgb(229 231 235);
  border-radius: 50%;
  overflow: hidden;
}

.dark .step-progress {
  background: rgb(75 85 99);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, rgb(34 197 94), rgb(59 130 246));
  transition: width 0.5s ease-out;
  border-radius: 50%;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--text-primary));
  margin: 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: rgb(var(--text-secondary));
  margin: 0.25rem 0 0 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: rgb(var(--text-secondary));
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgb(var(--text-primary));
}

.dark .close-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.card-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.description-text {
  color: rgb(var(--text-primary));
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.interactive-demo {
  background: linear-gradient(135deg, rgb(239 246 255), rgb(243 244 246));
  border: 1px solid rgb(59 130 246 / 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.dark .interactive-demo {
  background: linear-gradient(135deg, rgb(30 41 59), rgb(15 23 42));
  border-color: rgb(59 130 246 / 0.3);
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: rgb(59 130 246);
}

.tips-section {
  background: rgb(249 250 251);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.dark .tips-section {
  background: rgb(31 41 55);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  space-y: 0.5rem;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.tip-bullet {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgb(59 130 246);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.tip-text {
  color: rgb(var(--text-secondary));
  font-size: 0.875rem;
  line-height: 1.5;
}

.shortcuts-section {
  border-top: 1px solid rgb(229 231 235);
  padding-top: 1rem;
  margin-top: 1rem;
}

.dark .shortcuts-section {
  border-top-color: rgb(75 85 99);
}

.shortcuts-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: rgb(var(--text-primary));
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

kbd {
  background: rgb(243 244 246);
  border: 1px solid rgb(209 213 219);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: rgb(var(--text-primary));
}

.dark kbd {
  background: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.card-footer {
  padding: 1.5rem;
  border-top: 1px solid rgb(229 231 235);
  background: rgb(249 250 251);
}

.dark .card-footer {
  border-top-color: rgb(75 85 99);
  background: rgb(31 41 55);
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.progress-dot.completed {
  background: rgb(34 197 94);
  transform: scale(1.1);
}

.progress-dot.active {
  background: rgb(59 130 246);
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.progress-dot.upcoming {
  background: rgb(209 213 219);
}

.dark .progress-dot.upcoming {
  background: rgb(75 85 99);
}

.navigation-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-button {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-button.primary {
  background: rgb(59 130 246);
  color: white;
}

.nav-button.primary:hover:not(:disabled) {
  background: rgb(37 99 235);
  transform: translateY(-1px);
}

.nav-button.secondary {
  background: white;
  color: rgb(var(--text-primary));
  border: 1px solid rgb(209 213 219);
}

.nav-button.secondary:hover {
  background: rgb(249 250 251);
}

.dark .nav-button.secondary {
  background: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.dark .nav-button.secondary:hover {
  background: rgb(75 85 99);
}

.nav-button.ghost {
  background: transparent;
  color: rgb(var(--text-secondary));
}

.nav-button.ghost:hover {
  color: rgb(var(--text-primary));
  background: rgba(0, 0, 0, 0.05);
}

.dark .nav-button.ghost:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-button.success {
  background: rgb(34 197 94);
  color: white;
}

.nav-button.success:hover {
  background: rgb(22 163 74);
  transform: translateY(-1px);
}

.floating-help {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 51;
  pointer-events: auto;
}

.help-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgb(59 130 246);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.help-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}

.help-button.active {
  background: rgb(34 197 94);
}

.help-icon {
  font-size: 1.25rem;
  font-weight: 700;
}

/* Animations */
@keyframes slideInCard {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 0 0 4px rgba(59, 130, 246, 0.2),
      0 0 0 9999px rgba(0, 0, 0, 0.6),
      inset 0 0 20px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 
      0 0 0 8px rgba(59, 130, 246, 0.3),
      0 0 0 9999px rgba(0, 0, 0, 0.6),
      inset 0 0 30px rgba(59, 130, 246, 0.2);
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .onboarding-card {
    width: calc(100vw - 2rem) !important;
    max-height: calc(100vh - 4rem) !important;
    position: fixed !important;
    top: 2rem !important;
    left: 1rem !important;
    transform: none !important;
  }
  
  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-buttons {
    flex-wrap: wrap;
  }
  
  .nav-button {
    flex: 1;
    min-width: 120px;
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .onboarding-card,
  .spotlight-border,
  .spotlight-ripple,
  .progress-fill,
  .nav-button,
  .help-button {
    animation: none !important;
    transition-duration: 0.1s !important;
  }
}
</style>