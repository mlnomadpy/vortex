<template>
  <div class="p-6 space-y-6 scroll-container">
    <div>
      <h2 class="text-2xl font-bold text-theme-primary mb-4">Shadcn UI Button Variants</h2>
      <p class="text-theme-secondary mb-6">
        Here are all the available button variants you can use in your application.
      </p>
    </div>

    <!-- Default Variants -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">Variants</h3>
      <div class="flex flex-wrap gap-3">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>

    <!-- Sizes -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">Sizes</h3>
      <div class="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="outline">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </Button>
      </div>
    </div>

    <!-- With Icons -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">With Icons</h3>
      <div class="flex flex-wrap gap-3">
        <Button>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Item
        </Button>
        <Button variant="destructive">
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </Button>
        <Button variant="outline">
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">Loading State</h3>
      <div class="flex flex-wrap gap-3">
        <Button :disabled="isLoading" @click="simulateLoading">
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isLoading ? 'Loading...' : 'Trigger Loading' }}
        </Button>
      </div>
    </div>

    <!-- Disabled State -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">Disabled State</h3>
      <div class="flex flex-wrap gap-3">
        <Button disabled>Disabled Default</Button>
        <Button variant="secondary" disabled>Disabled Secondary</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
      </div>
    </div>

    <!-- Custom Styles -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-theme-primary">Custom Classes</h3>
      <div class="flex flex-wrap gap-3">
        <Button class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          Gradient Button
        </Button>
        <Button variant="outline" class="border-2 border-dashed border-blue-300 hover:border-blue-500">
          Dashed Border
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui'

const isLoading = ref(false)

function simulateLoading() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}
</script> 