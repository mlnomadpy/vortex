<template>
  <footer class="mt-16 text-center">
    <div class="control-card p-6 max-w-2xl mx-auto">
      <div class="flex items-center justify-center mb-4">
              <HeartIcon class="w-5 h-5 text-red-500 mr-2" />
      <p class="text-theme-secondary">
          Built with love for machine learning exploration
        </p>
      </div>
      <p class="text-sm text-theme-tertiary mb-4">
        Interact, learn, and discover the beauty of neural networks
      </p>
      
      <!-- Links -->
      <div class="flex justify-center space-x-6 text-sm">
        <a 
          href="https://github.com/mlnomadpy/vortex" 
          target="_blank"
          class="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <CodeBracketIcon class="w-4 h-4 inline mr-1" />
          GitHub
        </a>
        <router-link 
          to="/docs" 
          class="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <DocumentTextIcon class="w-4 h-4 inline mr-1" />
          Documentation
        </router-link>
        <a 
          href="mailto:your.email@example.com" 
          class="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <EnvelopeIcon class="w-4 h-4 inline mr-1" />
          Contact
        </a>
      </div>
      
      <!-- Version -->
      <div class="mt-4 pt-4 border-t border-theme-secondary">
        <p class="text-xs text-theme-tertiary">
          Vortex Neural Network v1.0.0 - Vue 3 + TypeScript + D3.js
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { 
  HeartIcon, 
  CodeBracketIcon, 
  DocumentTextIcon, 
  EnvelopeIcon 
} from '@/components/ui/icons'
</script>
