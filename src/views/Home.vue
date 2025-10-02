<template>
  <div class="min-h-screen scroll-smooth">
    <!-- Header -->
    <AppHeader />
    
    <!-- Enhanced Hero Section with Descartes Tribute -->
    <section class="relative overflow-hidden">
      <!-- Background geometric pattern -->
      <div class="absolute inset-0 opacity-5">
        <svg viewBox="0 0 400 400" class="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div class="container mx-auto px-6 py-24 max-w-6xl text-center relative">
        <!-- Main Brand Identity -->
        <div class="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-full mb-8 animate-bounce-gentle shadow-2xl">
          <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
          </svg>
        </div>
        
        <h1 class="text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-6 animate-fade-in">
          Vortex
        </h1>
        
        <p class="text-3xl text-theme-secondary mb-6 animate-fade-in font-light italic" style="animation-delay: 0.1s;">
          "I think, therefore I am."
        </p>
        
        <p class="text-lg text-theme-secondary mb-4 animate-fade-in" style="animation-delay: 0.15s;">
          — René Descartes
        </p>
        
        <div class="max-w-4xl mx-auto mb-12">
          <p class="text-xl text-theme-secondary leading-relaxed mb-6 animate-fade-in" style="animation-delay: 0.2s;">
            Inspired by Descartes' <strong>vortex theory</strong> of celestial mechanics, <strong>Vortex</strong> models neural networks as gravitational systems. 
            Just as planets move through space influenced by invisible forces, data points navigate through Vectoverse guided by similarity.
          </p>
          
          <p class="text-lg text-theme-secondary leading-relaxed mb-6 animate-fade-in" style="animation-delay: 0.25s;">
            In our universe, neurons are like celestial bodies, and the <strong>ⵟ-product (Yat Product)</strong> acts as the gravitational force—
            stronger when aligned (high dot product) and weaker with distance. Every click adds a new world to this neural cosmos.
          </p>

          <!-- Paper Reference -->
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 animate-fade-in" style="animation-delay: 0.3s;">
            <div class="flex items-center mb-3">
              <svg class="w-6 h-6 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <h3 class="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Research Paper</h3>
            </div>
            <h4 class="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-2">
              <a href="https://www.preprints.org/manuscript/202506.2010//v1" target="_blank" class="hover:underline">
                Deep Learning 2.0.1: Mind and Cosmos - Towards Cosmos-Inspired Interpretable Neural Networks
              </a>
            </h4>
            <p class="text-sm text-indigo-600 dark:text-indigo-400 mb-2">
              <strong>Author:</strong> Taha Bouhsine
            </p>
            <p class="text-sm text-indigo-600 dark:text-indigo-400 leading-relaxed">
              This work introduces the ⵟ-product, a novel neural operator inspired by physical inverse-square laws, 
              leading to Neural-Matter Networks (NMNs) with enhanced interpretability and geometric fidelity.
            </p>
          </div>
        </div>

        <!-- Call to Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in" style="animation-delay: 0.3s;">
          <router-link to="/playground">
            <Button size="lg" class="text-lg px-8 py-4">
              Enter the Playground
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </router-link>
          <router-link to="/docs">
            <Button variant="outline" size="lg" class="text-lg px-8 py-4">
              Read the Theory
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Button>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Main Options Section -->
    <section class="container mx-auto px-6 pb-16 max-w-6xl">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <!-- Interactive Playground -->
        <div class="option-card group">
          <div class="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          
          <h3 class="text-3xl font-bold text-theme-primary mb-6">Interactive Playground</h3>
          <p class="text-theme-secondary mb-8 leading-relaxed text-lg">
            Experience machine learning through hands-on experimentation. Build neural networks with intuitive clicks, 
            watch algorithms learn in real-time, and explore the mathematical beauty of artificial intelligence.
          </p>
          
          <div class="space-y-4 mb-8">
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span><strong>Spiral & XOR Datasets:</strong> Classic machine learning challenges</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span><strong>Real-time Visualization:</strong> Watch networks learn step by step</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span><strong>Interactive Canvas:</strong> Click to add neurons, see instant results</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span><strong>Loss Landscapes:</strong> Explore optimization in 3D space</span>
            </div>
          </div>
          
          <router-link to="/playground" class="block">
            <Button class="w-full text-lg py-4" size="lg">
              Start Experimenting
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </router-link>
        </div>

        <!-- Comprehensive Documentation -->
        <div class="option-card group">
          <div class="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-8 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          
          <h3 class="text-3xl font-bold text-theme-primary mb-6">Mathematical Foundation</h3>
          <p class="text-theme-secondary mb-8 leading-relaxed text-lg">
            Understand the mathematical principles that power modern AI. From Cartesian coordinates to gradient descent, 
            explore the elegant equations that transform data into intelligence.
          </p>
          
          <div class="space-y-4 mb-8">
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span><strong>ⵟ-product (Yat Kernel):</strong> (x·n)² / (||x-n||² + ε) - physics-inspired similarity</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span><strong>Activation Functions:</strong> Softermax (temperature-controlled), ReLU, Sigmoid, GELU</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span><strong>Optimization Theory:</strong> Gradient descent and learning dynamics</span>
            </div>
            <div class="flex items-center text-theme-secondary">
              <div class="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <span><strong>Step-by-step Guides:</strong> From basics to advanced concepts</span>
            </div>
          </div>
          
          <router-link to="/docs" class="block">
            <Button variant="outline" class="w-full text-lg py-4" size="lg">
              Explore the Mathematics
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </router-link>
        </div>
      </div>

      <!-- Philosophical Note -->
      <div class="text-center max-w-4xl mx-auto">
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-700">
          <svg class="w-8 h-8 text-indigo-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <h4 class="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-3">The Cartesian Vortex in AI</h4>
          <p class="text-indigo-600 dark:text-indigo-400 leading-relaxed">
            "All matter in the universe is in motion and forms whirlpools." — Descartes' Vortex Theory<br />
            <span class="text-sm mt-2 block">In Vortex, neurons and data points form gravitational systems governed by the YAT metric, where similarity acts as the fundamental force shaping the neural universe's structure and dynamics.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Fullscreen Canvas -->
    <FullscreenCanvas 
      :is-visible="showFullscreen" 
      @close="showFullscreen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import FullscreenCanvas from '@/components/visualization/FullscreenCanvas.vue'
import { Button } from '@/components/ui'

const showFullscreen = ref(false)
</script>

<style scoped>
.option-card {
  @apply bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700;
  background: var(--viz-overlay);
  backdrop-filter: blur(24px);
  transform: translateZ(0);
  will-change: transform;
}

.option-card:hover {
  transform: translateY(-8px) translateZ(0);
}

/* Main container styles moved from global CSS */
.main-container {
  background: var(--viz-overlay);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-heavy);
  transform: translateZ(0);
  will-change: transform;
}

/* Fade in animation */
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

/* Performance optimization for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-bounce-gentle,
  .animate-fade-in {
    animation: none !important;
  }
  
  .option-card {
    transition: none !important;
    transform: none !important;
  }
  
  .option-card:hover {
    transform: none !important;
  }
}
</style>
