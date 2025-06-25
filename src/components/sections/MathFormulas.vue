<template>
  <div class="mt-12 fade-in">
    <div class="control-card p-8 max-w-5xl mx-auto">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
          <CalculatorIcon class="w-8 h-8 text-white" />
        </div>
        <h3 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Mathematical Formulas
        </h3>
        <p class="text-theme-secondary mt-2">Understanding the mathematics behind activation functions</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="formula in formulas" 
          :key="formula.name"
          class="glass-effect p-6 rounded-xl border hover:shadow-lg transition-all duration-300"
        >
          <div class="flex items-center mb-3">
            <component :is="formula.icon" class="w-5 h-5 text-indigo-500 mr-2" />
            <h4 class="font-semibold text-theme-primary">{{ formula.name }}</h4>
          </div>
          <div class="text-theme-primary mb-2" v-html="formula.latex"></div>
          <p class="text-sm text-theme-secondary">{{ formula.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { 
  CalculatorIcon, 
  FunctionIcon, 
  CurveIcon, 
  ChartLineIcon,
  BoltIcon 
} from '@/components/ui/icons'

// Define formula data
const formulas = [
  {
    name: 'Softmax',
    icon: FunctionIcon,
    latex: '\\(\\text{softmax}(x_i) = \\frac{e^{x_i}}{\\sum_{j} e^{x_j}}\\)',
    description: 'Normalizes outputs to probabilities'
  },
  {
    name: 'Softermax',
    icon: CurveIcon,
    latex: '\\(\\text{softermax}(x_i) = \\frac{x_i^n}{\\epsilon + \\sum_{j} ( x_j)^n}\\)',
    description: 'Gentler version of softmax'
  },
  {
    name: 'Sigmoid',
    icon: ChartLineIcon,
    latex: '\\(\\text{sigmoid}(x) = \\frac{1}{1 + e^{-x}}\\)',
    description: 'Maps input to (0,1) range'
  },
  {
    name: 'ReLU',
    icon: BoltIcon,
    latex: '\\(\\text{ReLU}(x) = \\max(0, x)\\)',
    description: 'Simple threshold activation'
  },
  {
    name: 'GELU',
    icon: FunctionIcon,
    latex: '\\(\\text{GELU}(x) = 0.5x(1 + \\tanh(\\sqrt{2/\\pi}(x + 0.044715x^3)))\\)',
    description: 'Gaussian Error Linear Unit - smooth ReLU alternative'
  }
]

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
  // Re-render MathJax formulas when it's ready
  try {
    await waitForMathJax()
    await window.MathJax.typesetPromise()
  } catch (error) {
    console.warn('MathJax rendering failed:', error)
  }
})
</script>

<style scoped>
/* Control card styles with theme support */
.control-card {
  background: linear-gradient(to bottom right, rgb(var(--bg-primary)), rgb(var(--bg-secondary)));
  border: 1px solid rgb(var(--border-primary) / 0.8);
  border-radius: 1rem;
  box-shadow: var(--shadow-light), var(--shadow-medium);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: transform;
}

/* Glass effect styles with theme support */
.glass-effect {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  transform: translateZ(0);
  will-change: transform;
}

/* Fade in animation moved from global CSS */
.fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px) translateZ(0); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) translateZ(0); 
  }
}
</style>
