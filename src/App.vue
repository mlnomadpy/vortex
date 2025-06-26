<template>
  <div id="app" :class="appClasses">
    <!-- Loading overlay -->
    <LoadingSpinner
      v-if="hasAnyLoading"
      :message="loadingMessage || 'Loading...'"
      :progress="loadingProgress"
      fullscreen
    />
    
    <!-- Background particles effect -->
    <ParticlesBackground />
    
    <!-- Main router view -->
    <router-view />
    
    <!-- Global notifications -->
    <NotificationContainer />
    
    <!-- Onboarding tour -->
    <OnboardingTour
      v-if="shouldShowOnboarding"
      :steps="tourSteps"
      @complete="handleOnboardingComplete"
      @skip="handleOnboardingSkip"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { ParticlesBackground, NotificationContainer, LoadingSpinner, OnboardingTour } from '@/components/ui'
import { useNotificationStore } from '@/stores/notification'
import { useTheme } from '@/composables/useTheme'
import { useLoadingState } from '@/composables/useLoadingState'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUserPreferences } from '@/composables/useUserPreferences'

const notificationStore = useNotificationStore()
const { initializeTheme } = useTheme()
const { hasAnyLoading, loadingMessage, loadingProgress } = useLoadingState()
const { handleError } = useErrorHandler()
const { preferences, updatePreference } = useUserPreferences()

const shouldShowOnboarding = computed(() => !preferences.value.hasSeenTutorial)

const appClasses = computed(() => [
  'min-h-screen scroll-smooth momentum-scroll',
  {
    'compact-mode': preferences.value.compactMode,
    'keyboard-navigation': preferences.value.keyboardNavigation,
    'reduced-motion': preferences.value.reducedMotion,
    [`font-size-${preferences.value.fontSize}`]: true,
  }
])

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

const tourSteps = ref<TourStep[]>([
  {
    id: 'welcome',
    title: 'Welcome to Vortex Neural Network',
    description: 'Welcome to the interactive neural network playground! This tutorial will guide you through all the features.',
    position: 'bottom',
    tips: [
      'Use keyboard shortcuts to navigate quickly',
      'You can skip this tutorial anytime and restart it from settings',
      'Each section is designed to build your understanding progressively'
    ]
  },
  {
    id: 'upload-data',
    title: 'Upload Your Dataset',
    description: 'Start by uploading a CSV file with your training data. We support classification and regression datasets.',
    target: '[data-tour="file-upload"]',
    position: 'bottom',
    waitForInteraction: true,
    tips: [
      'Drag and drop files directly onto the upload area',
      'CSV files should have features in columns and labels in the last column',
      'Sample datasets are available if you want to experiment first',
      'File validation happens automatically to ensure compatibility'
    ],
    interactive: {
      component: 'demo-file-upload',
      props: {
        showSampleFiles: true,
        highlightDropzone: true
      }
    },
    beforeEnter: () => {
      // Scroll to upload section and highlight it
      const uploadSection = document.querySelector('[data-tour="file-upload"]')
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  },
  {
    id: 'canvas-interaction',
    title: 'Interactive Neural Canvas',
    description: 'Click anywhere on the canvas to add neurons. The network will automatically connect them and visualize data flow.',
    target: '[data-tour="neural-canvas"]',
    position: 'right',
    waitForInteraction: true,
    tips: [
      'Each click adds a neuron at that position',
      'Neurons are color-coded by their activation values',
      'Watch the real-time data flow through connections',
      'Right-click to remove neurons you don\'t need',
      'Zoom and pan to explore different areas of the decision space'
    ],
    interactive: {
      component: 'demo-canvas-click',
      props: {
        showClickHints: true,
        highlightEmptyAreas: true
      }
    },
    beforeEnter: () => {
      // Enable canvas interaction hints
      const canvas = document.querySelector('[data-tour="neural-canvas"]')
      if (canvas) {
        canvas.classList.add('tour-highlight-canvas')
      }
    },
    afterLeave: () => {
      // Remove canvas highlights
      const canvas = document.querySelector('[data-tour="neural-canvas"]')
      if (canvas) {
        canvas.classList.remove('tour-highlight-canvas')
      }
    }
  },
  {
    id: 'controls-panel',
    title: 'Control Your Network',
    description: 'Use these controls to adjust learning rate, batch size, and other hyperparameters. Experiment to see how they affect training!',
    target: '[data-tour="controls-grid"]',
    position: 'left',
    tips: [
      'Learning rate controls how fast the network learns',
      'Batch size affects training stability and speed',
      'Different optimizers work better for different problems',
      'Watch the loss landscape change as you adjust parameters',
      'Use the preset buttons for quick common configurations'
    ],
    interactive: {
      component: 'demo-parameter-slider',
      props: {
        parameter: 'learningRate',
        showEffect: true
      }
    }
  },
  {
    id: 'training-process',
    title: 'Train Your Network',
    description: 'Watch your neural network learn in real-time! The loss chart shows training progress, and the decision boundary updates live.',
    target: '[data-tour="train-button"]',
    position: 'top',
    tips: [
      'Training happens in real-time with live visualizations',
      'Watch the decision boundary evolve as the network learns',
      'The loss chart shows how well your network is performing',
      'You can pause and resume training at any time',
      'Different datasets require different amounts of training time'
    ],
    beforeEnter: () => {
      // Highlight training-related elements
      const trainButton = document.querySelector('[data-tour="train-button"]')
      const lossChart = document.querySelector('[data-tour="loss-chart"]')
      if (trainButton) trainButton.classList.add('tour-pulse')
      if (lossChart) lossChart.classList.add('tour-highlight')
    },
    afterLeave: () => {
      // Remove highlights
      const trainButton = document.querySelector('[data-tour="train-button"]')
      const lossChart = document.querySelector('[data-tour="loss-chart"]')
      if (trainButton) trainButton.classList.remove('tour-pulse')
      if (lossChart) lossChart.classList.remove('tour-highlight')
    }
  },
  {
    id: 'visualization-features',
    title: 'Advanced Visualizations',
    description: 'Explore the loss landscape, examine individual neurons, and analyze your network\'s decision-making process.',
    target: '[data-tour="visualization-panel"]',
    position: 'left',
    tips: [
      'The loss landscape shows optimization challenges',
      'Neuron inspection reveals what each unit has learned',
      'Gradient flow visualization shows information propagation',
      'Export visualizations for presentations or reports',
      'Switch between different visualization modes'
    ]
  },
  {
    id: 'settings-and-export',
    title: 'Settings & Export Options',
    description: 'Customize your experience with themes, accessibility options, and export your trained models or visualizations.',
    target: '[data-tour="settings-button"]',
    position: 'bottom',
    tips: [
      'Dark mode is easier on the eyes for long sessions',
      'Accessibility options help users with different needs',
      'Export trained models in standard formats',
      'Save visualizations as high-quality images',
      'Backup your work with session export'
    ]
  },
  {
    id: 'completion',
    title: 'You\'re Ready to Explore!',
    description: 'Congratulations! You now know how to use all the main features. Start experimenting with your own data and neural network architectures.',
    tips: [
      'Try different network architectures for your problem',
      'Experiment with various datasets to see different behaviors',
      'Share your interesting discoveries with the community',
      'Check the documentation for advanced features',
      'Remember: the best way to learn is by experimenting!'
    ]
  }
])

const handleOnboardingComplete = () => {
  notificationStore.addNotification({
    message: 'Great! You\'re all set. Start by uploading a dataset or exploring the playground.',
    type: 'success',
    duration: 5000
  })
}

const handleOnboardingSkip = () => {
  updatePreference('hasSeenTutorial', true)
  notificationStore.addNotification({
    message: 'You can always restart the tour from the help menu.',
    type: 'info',
    duration: 3000
  })
}

// Helper function to wait for MathJax to be ready
const waitForMathJax = (): Promise<void> => {
  return new Promise((resolve) => {
    const checkMathJax = () => {
      if (window.MathJax && window.MathJax.typesetPromise && typeof window.MathJax.typesetPromise === 'function') {
        resolve()
      } else {
        setTimeout(checkMathJax, 100) // Check every 100ms
      }
    }
    checkMathJax()
  })
}

onMounted(async () => {
  try {
    // Initialize theme system
    initializeTheme()
    
    // Initialize MathJax when it's ready
    try {
      await waitForMathJax()
      await window.MathJax.typesetPromise()
    } catch (error) {
      handleError(error as Error, { component: 'App', phase: 'MathJax' })
    }
    
    // Welcome notification (only if not showing onboarding)
    if (!shouldShowOnboarding.value) {
      setTimeout(() => {
        notificationStore.addNotification({
          message: 'Welcome back! Upload a CSV file or explore the playground.',
          type: 'info',
          duration: 4000
        })
      }, 1000)
    }
  } catch (error) {
    handleError(error as Error, { component: 'App', phase: 'initialization' })
  }
})
</script>

<style>
/* Global styles will be handled by Tailwind CSS */
</style>
