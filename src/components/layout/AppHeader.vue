<template>
  <header class="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        
        <!-- Logo & Title -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Vortex Neural Network
            </h1>
            <p class="text-sm text-gray-600">Interactive Neural Network Visualization</p>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <router-link 
            to="/" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            active-class="text-blue-600"
          >
            Home
          </router-link>
          <router-link 
            to="/playground" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            active-class="text-blue-600"
          >
            Playground
          </router-link>
          <router-link 
            to="/docs" 
            class="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            active-class="text-blue-600"
          >
            Documentation
          </router-link>
        </nav>
        
        <!-- Actions -->
        <div class="flex items-center space-x-3">
          <button 
            @click="toggleTheme"
            class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Toggle theme"
          >
            <SunIcon v-if="isDark" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>
          
          <a 
            href="https://github.com/yourusername/vortex" 
            target="_blank"
            class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="View on GitHub"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
        </div>
        
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SunIcon, MoonIcon } from '@/components/ui/icons'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  // Theme switching logic would go here
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>
