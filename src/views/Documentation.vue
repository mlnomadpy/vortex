<template>
  <div class="min-h-screen">
    <AppHeader />
    
    <main class="container mx-auto px-6 py-8 max-w-4xl">
      <div class="main-container p-8">
        
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p class="text-lg text-gray-600">Learn how to use the Neural Network Playground</p>
        </div>
        
        <div class="prose prose-lg max-w-none">
          <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <p class="mb-4">
              The Neural Network Playground allows you to visualize and interact with neural networks 
              in real-time. Here's how to get started:
            </p>
            
            <ol class="space-y-2">
              <li><strong>Upload Data:</strong> Click "Choose CSV File" and select a CSV file with x, y, label columns</li>
              <li><strong>Add Neurons:</strong> Click anywhere on the canvas to add neurons</li>
              <li><strong>Configure Settings:</strong> Choose similarity metrics and activation functions</li>
              <li><strong>Optimize:</strong> Run gradient descent to train your network</li>
              <li><strong>Analyze:</strong> View metrics and loss landscapes in real-time</li>
            </ol>
          </section>
          
          <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Data Format</h2>
            <p class="mb-4">
              Your CSV file should have the following format:
            </p>
            <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              x,y,label<br>
              0.5,0.3,0<br>
              -0.2,0.8,1<br>
              0.1,-0.4,0<br>
              ...
            </div>
            <p class="mt-4">
              Where <code>x</code> and <code>y</code> are coordinates in the range [-1, 1], 
              and <code>label</code> is the class identifier (integer).
            </p>
          </section>
          
          <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Similarity Metrics</h2>
            <div class="space-y-4">
              <div>
                <h3 class="font-semibold">Dot Product</h3>
                <p>Measures the alignment between neuron position and data point: x₁x₂ + y₁y₂</p>
              </div>
              <div>
                <h3 class="font-semibold">Euclidean Distance</h3>
                <p>Measures the distance between neuron and data point: -√((x₁-x₂)² + (y₁-y₂)²)</p>
              </div>
              <div>
                <h3 class="font-semibold">My Product</h3>
                <p>Normalized dot product: (x₁x₂ + y₁y₂) / √(distance² + ε)</p>
              </div>
            </div>
          </section>
          
          <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Activation Functions</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">Softmax</h3>
                <p class="text-sm">Converts raw scores to probabilities that sum to 1</p>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">ReLU</h3>
                <p class="text-sm">Simple threshold function: max(0, x)</p>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">Sigmoid</h3>
                <p class="text-sm">S-shaped curve mapping to (0,1) range</p>
              </div>
              <div class="bg-indigo-50 p-4 rounded-lg">
                <h3 class="font-semibold mb-2">GELU</h3>
                <p class="text-sm">Smooth ReLU alternative with Gaussian properties</p>
              </div>
            </div>
          </section>
          
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
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
</style>
