<template>
  <div class="min-h-screen">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8 max-w-7xl">
      <div class="main-container p-8 fade-in">
        
        <!-- Hero Section -->
        <HeroSection />
        
        <!-- Controls Grid -->
        <ControlsGrid />
        
        <!-- Visualization Controls -->
        <VisualizationControls />
        
        <!-- Class Toggles -->
        <ClassToggles />
        
        <!-- Main Visualization Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          <!-- Main Canvas -->
          <div class="lg:col-span-2">
            <NeuralCanvas />
          </div>
          
          <!-- Metrics Panel -->
          <div class="flex flex-col gap-6">
            <MetricsPanel />
            <LossLandscape />
          </div>
          
        </div>
        
        <!-- Mathematical Formulas -->
        <MathFormulas />
        
        <!-- Footer -->
        <AppFooter />
        
      </div>
    </main>

    <!-- Fullscreen Canvas -->
    <FullscreenCanvas 
      :isVisible="showFullscreen" 
      @close="showFullscreen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import ControlsGrid from '@/components/sections/ControlsGrid.vue'
import VisualizationControls from '@/components/sections/VisualizationControls.vue'
import ClassToggles from '@/components/sections/ClassToggles.vue'
import NeuralCanvas from '@/components/visualization/NeuralCanvas.vue'
import MetricsPanel from '@/components/visualization/MetricsPanel.vue'
import LossLandscape from '@/components/visualization/LossLandscape.vue'
import MathFormulas from '@/components/sections/MathFormulas.vue'
import FullscreenCanvas from '@/components/visualization/FullscreenCanvas.vue'

const showFullscreen = ref(false)

function handleToggleFullscreen() {
  showFullscreen.value = true
}

onMounted(() => {
  window.addEventListener('toggle-fullscreen', handleToggleFullscreen)
})

onUnmounted(() => {
  window.removeEventListener('toggle-fullscreen', handleToggleFullscreen)
})
</script>

<style scoped>
/* Main container styles moved from global CSS */
.main-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
