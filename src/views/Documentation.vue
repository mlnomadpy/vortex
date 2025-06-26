<template>
  <div class="min-h-screen scroll-smooth momentum-scroll">
    <AppHeader />
    
    <main class="container mx-auto px-6 py-8 max-w-6xl">
      <div class="main-container p-8">
        
        <!-- Header Section -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 class="text-5xl font-bold text-theme-primary mb-4">Documentation</h1>
          <p class="text-xl text-theme-secondary max-w-3xl mx-auto">
            Comprehensive guide to mastering the Vortex Neural Network Playground - from basic concepts to advanced techniques
          </p>
        </div>

        <!-- Quick Navigation -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <a href="#getting-started" class="nav-card group">
            <div class="w-8 h-8 bg-green-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Getting Started</h3>
          </a>
          <a href="#data-format" class="nav-card group">
            <div class="w-8 h-8 bg-blue-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Data Format</h3>
          </a>
          <a href="#theory" class="nav-card group">
            <div class="w-8 h-8 bg-purple-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Theory</h3>
          </a>
          <a href="#examples" class="nav-card group">
            <div class="w-8 h-8 bg-orange-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Examples</h3>
          </a>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Table of Contents -->
          <div class="lg:col-span-1">
            <div class="sticky top-8">
              <div class="toc-card p-6">
                <h3 class="font-bold text-lg text-theme-primary mb-4">Contents</h3>
                <nav class="space-y-2 text-sm">
                  <a href="#getting-started" class="toc-link">1. Getting Started</a>
                  <a href="#data-format" class="toc-link ml-3">1.1 Data Format</a>
                  <a href="#uploading" class="toc-link ml-3">1.2 Uploading Data</a>
                  <a href="#theory" class="toc-link">2. Theory & Concepts</a>
                  <a href="#similarity-metrics" class="toc-link ml-3">2.1 Similarity Metrics</a>
                  <a href="#activation-functions" class="toc-link ml-3">2.2 Activation Functions</a>
                  <a href="#optimization" class="toc-link ml-3">2.3 Optimization</a>
                  <a href="#interface" class="toc-link">3. User Interface</a>
                  <a href="#canvas" class="toc-link ml-3">3.1 Interactive Canvas</a>
                  <a href="#controls" class="toc-link ml-3">3.2 Control Panel</a>
                  <a href="#visualizations" class="toc-link ml-3">3.3 Visualizations</a>
                  <a href="#examples" class="toc-link">4. Examples & Tutorials</a>
                  <a href="#troubleshooting" class="toc-link">5. Troubleshooting</a>
                </nav>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="lg:col-span-3">
            <div class="space-y-12">
              
              <!-- Getting Started -->
              <section id="getting-started">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-blue-500 pb-2">1. Getting Started</h2>
                
                <div class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">Quick Start Guide</h3>
                  <p class="mb-4 text-theme-secondary">
                    The Vortex Neural Network Playground allows you to build, train, and visualize neural networks 
                    interactively. Follow these steps to get started:
                  </p>
                  
                  <ol class="space-y-3 ml-6">
                    <li class="flex items-start">
                      <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5 flex-shrink-0">1</span>
                      <div>
                        <strong>Upload Your Data:</strong> Start by uploading a CSV file containing your dataset, or choose from pre-built examples in the playground.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5 flex-shrink-0">2</span>
                      <div>
                        <strong>Build Your Network:</strong> Click anywhere on the canvas to add neurons (classifiers). Each neuron will learn to recognize patterns in your data.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5 flex-shrink-0">3</span>
                      <div>
                        <strong>Configure Settings:</strong> Choose similarity metrics, activation functions, and optimization parameters that suit your problem.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5 flex-shrink-0">4</span>
                      <div>
                        <strong>Train & Optimize:</strong> Run gradient descent to train your network and watch it learn in real-time.
                      </div>
                    </li>
                    <li class="flex items-start">
                      <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 mt-0.5 flex-shrink-0">5</span>
                      <div>
                        <strong>Analyze Results:</strong> Explore metrics, loss landscapes, and decision boundaries to understand your network's behavior.
                      </div>
                    </li>
                  </ol>
                </div>

                <div id="data-format" class="doc-card">
                  <h3 class="text-xl font-semibold mb-4">1.1 Data Format Requirements</h3>
                  <p class="mb-4 text-theme-secondary">
                    Your CSV file must follow this specific format for proper loading:
                  </p>
                  <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
                    <div class="text-gray-500 mb-2">// Example CSV format</div>
                    x,y,label<br>
                    0.5,0.3,0<br>
                    -0.2,0.8,1<br>
                    0.1,-0.4,0<br>
                    0.7,-0.6,2<br>
                    ...
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div class="constraint-card">
                      <h4 class="font-semibold text-blue-500 mb-2">X Coordinate</h4>
                      <p class="text-sm text-theme-secondary">Range: [-1, 1]<br>Represents horizontal position</p>
                    </div>
                    <div class="constraint-card">
                      <h4 class="font-semibold text-green-500 mb-2">Y Coordinate</h4>
                      <p class="text-sm text-theme-secondary">Range: [-1, 1]<br>Represents vertical position</p>
                    </div>
                    <div class="constraint-card">
                      <h4 class="font-semibold text-purple-500 mb-2">Label</h4>
                      <p class="text-sm text-theme-secondary">Integer values<br>Class identifier (0, 1, 2, ...)</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Theory & Concepts -->
              <section id="theory">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-purple-500 pb-2">2. Theory & Concepts</h2>
                
                <div id="similarity-metrics" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">2.1 Similarity Metrics</h3>
                  <p class="mb-4 text-theme-secondary">
                    Similarity metrics determine how neurons measure their "closeness" to data points. Each metric captures different geometric relationships:
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="metric-card">
                      <h4 class="font-semibold text-blue-500 mb-2">Dot Product</h4>
                      <div class="math-formula mb-2">s = x₁x₂ + y₁y₂</div>
                      <p class="text-sm text-theme-secondary">Measures alignment between vectors. Positive when vectors point in similar directions.</p>
                    </div>
                    <div class="metric-card">
                      <h4 class="font-semibold text-green-500 mb-2">Euclidean Distance</h4>
                      <div class="math-formula mb-2">s = -√((x₁-x₂)² + (y₁-y₂)²)</div>
                      <p class="text-sm text-theme-secondary">Standard geometric distance. Negative because similarity decreases with distance.</p>
                    </div>
                    <div class="metric-card">
                      <h4 class="font-semibold text-purple-500 mb-2">My Product</h4>
                      <div class="math-formula mb-2">s = (x₁x₂ + y₁y₂) / √(d² + ε)</div>
                      <p class="text-sm text-theme-secondary">Normalized dot product that balances alignment and distance.</p>
                    </div>
                  </div>
                </div>

                <div id="activation-functions" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">2.2 Activation Functions</h3>
                  <p class="mb-4 text-theme-secondary">
                    Activation functions transform the raw similarity scores into meaningful outputs:
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="activation-card">
                      <h4 class="font-semibold text-blue-500 mb-2">Softmax</h4>
                      <div class="math-formula mb-2">σ(z)ᵢ = e^(zᵢ) / Σⱼe^(zⱼ)</div>
                      <p class="text-sm text-theme-secondary">Converts scores to probabilities that sum to 1. Ideal for classification.</p>
                    </div>
                    <div class="activation-card">
                      <h4 class="font-semibold text-green-500 mb-2">ReLU</h4>
                      <div class="math-formula mb-2">f(x) = max(0, x)</div>
                      <p class="text-sm text-theme-secondary">Simple threshold function. Fast computation, common in deep networks.</p>
                    </div>
                    <div class="activation-card">
                      <h4 class="font-semibold text-purple-500 mb-2">Sigmoid</h4>
                      <div class="math-formula mb-2">σ(x) = 1 / (1 + e^(-x))</div>
                      <p class="text-sm text-theme-secondary">S-shaped curve mapping to (0,1). Smooth gradients but can saturate.</p>
                    </div>
                    <div class="activation-card">
                      <h4 class="font-semibold text-orange-500 mb-2">GELU</h4>
                      <div class="math-formula mb-2">f(x) = x · Φ(x)</div>
                      <p class="text-sm text-theme-secondary">Smooth ReLU alternative using Gaussian properties. Modern choice for transformers.</p>
                    </div>
                  </div>
                </div>

                <div id="optimization" class="doc-card">
                  <h3 class="text-xl font-semibold mb-4">2.3 Optimization</h3>
                  <p class="mb-4 text-theme-secondary">
                    The playground uses gradient descent to minimize classification error:
                  </p>
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                    <h4 class="font-semibold text-blue-700 dark:text-blue-300 mb-2">Key Hyperparameters</h4>
                    <ul class="text-sm space-y-1 text-blue-600 dark:text-blue-400">
                      <li><strong>Learning Rate:</strong> Controls step size in parameter updates (0.001 - 1.0)</li>
                      <li><strong>Batch Size:</strong> Number of samples processed together (1 - 100)</li>
                      <li><strong>Regularization:</strong> Prevents overfitting by penalizing large weights</li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- User Interface -->
              <section id="interface">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-green-500 pb-2">3. User Interface</h2>
                
                <div id="canvas" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">3.1 Interactive Canvas</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 class="font-semibold text-green-500 mb-2">Mouse Controls</h4>
                      <ul class="text-sm space-y-1 text-theme-secondary">
                        <li><strong>Left Click:</strong> Add neuron at cursor position</li>
                        <li><strong>Right Click:</strong> Remove nearest neuron</li>
                        <li><strong>Mouse Wheel:</strong> Zoom in/out</li>
                        <li><strong>Drag:</strong> Pan around the canvas</li>
                      </ul>
                    </div>
                    <div>
                      <h4 class="font-semibold text-blue-500 mb-2">Visual Elements</h4>
                      <ul class="text-sm space-y-1 text-theme-secondary">
                        <li><strong>Data Points:</strong> Colored by class labels</li>
                        <li><strong>Neurons:</strong> Size indicates influence</li>
                        <li><strong>Decision Boundary:</strong> Background color regions</li>
                        <li><strong>Connections:</strong> Lines showing data flow</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div id="examples" class="doc-card">
                  <h3 class="text-xl font-semibold mb-4">4. Examples & Tutorials</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <router-link to="/playground" class="example-card group">
                      <div class="w-12 h-12 bg-purple-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 class="font-semibold text-purple-500 mb-2">Spiral Dataset</h4>
                      <p class="text-sm text-theme-secondary">Learn to classify intertwined spirals - a classic non-linear problem.</p>
                    </router-link>
                    <router-link to="/playground" class="example-card group">
                      <div class="w-12 h-12 bg-blue-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <h4 class="font-semibold text-blue-500 mb-2">XOR Problem</h4>
                      <p class="text-sm text-theme-secondary">Solve the famous XOR logic gate with neural networks.</p>
                    </router-link>
                    <router-link to="/playground" class="example-card group">
                      <div class="w-12 h-12 bg-green-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 class="font-semibold text-green-500 mb-2">Clustering</h4>
                      <p class="text-sm text-theme-secondary">Experiment with clustered data and decision boundaries.</p>
                    </router-link>
                  </div>
                </div>
              </section>

              <!-- UI Components Showcase -->
              <section class="doc-card">
                <h3 class="text-xl font-semibold mb-4">UI Components</h3>
                <p class="mb-4 text-theme-secondary">
                  The application uses modern UI components for consistent, accessible design:
                </p>
                <ButtonShowcase />
              </section>

              <!-- Troubleshooting -->
              <section id="troubleshooting" class="doc-card">
                <h3 class="text-xl font-semibold mb-4">5. Troubleshooting</h3>
                <div class="space-y-4">
                  <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Common Issues</h4>
                    <ul class="text-sm space-y-1 text-yellow-600 dark:text-yellow-400">
                      <li><strong>CSV Upload Fails:</strong> Ensure your file has x,y,label columns with proper numeric values</li>
                      <li><strong>Poor Training Performance:</strong> Try adjusting learning rate or adding more neurons</li>
                      <li><strong>Canvas Not Responding:</strong> Check if data is loaded and neurons are present</li>
                    </ul>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
        
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import ButtonShowcase from '@/components/examples/ButtonShowcase.vue'
</script>

<style scoped>
/* Main container styles with theme support */
.main-container {
  background: var(--viz-overlay);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-heavy);
  transform: translateZ(0);
  will-change: transform;
}

/* Navigation cards for quick access */
.nav-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700;
  text-decoration: none;
}

.nav-card:hover {
  transform: translateY(-2px);
}

/* Table of contents styling */
.toc-card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
  background: var(--viz-overlay);
  backdrop-filter: blur(16px);
}

.toc-link {
  @apply block py-1 px-2 rounded text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors;
  text-decoration: none;
}

/* Documentation content cards */
.doc-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700;
  background: var(--viz-overlay);
  backdrop-filter: blur(16px);
}

/* Constraint cards for data format */
.constraint-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

/* Metric and activation function cards */
.metric-card, .activation-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

/* Math formula styling */
.math-formula {
  @apply font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded;
  font-family: 'Courier New', monospace;
}

/* Example cards for tutorials */
.example-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200;
  text-decoration: none;
}

.example-card:hover {
  transform: translateY(-2px);
}

/* Smooth scrolling for anchor links */
html {
  scroll-behavior: smooth;
}

/* Performance optimization for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .nav-card,
  .example-card {
    transition: none !important;
    transform: none !important;
  }
  
  .nav-card:hover,
  .example-card:hover {
    transform: none !important;
  }
  
  html {
    scroll-behavior: auto;
  }
}
</style>
