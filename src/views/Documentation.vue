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
          <h1 class="text-5xl font-bold text-theme-primary mb-4">Vortex Documentation</h1>
          <p class="text-xl text-theme-secondary max-w-3xl mx-auto mb-6">
            Mathematical foundations and practical guide to neural network experimentation
          </p>
          
          <!-- Paper Reference -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 max-w-4xl mx-auto">
            <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3">
              📄 Research Paper
            </h3>
            <h4 class="text-xl font-bold text-blue-800 dark:text-blue-200 mb-3">
              <a href="https://www.preprints.org/manuscript/202506.2010/" target="_blank" class="hover:underline">
                Deep Learning 2.0.1: Mind and Cosmos - Towards Cosmos-Inspired Interpretable Neural Networks
              </a>
            </h4>
            <p class="text-sm text-blue-600 dark:text-blue-400 mb-2">
              <strong>Author:</strong> Taha Bouhsine
            </p>
            <div class="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
              <strong>Abstract:</strong> The foundational dot product in deep learning, while ubiquitous, suffers from geometric limitations, conflating magnitude with direction and often obscuring complex data relationships. Conventional activation functions, introduced to imbue non-linearity, can further distort geometric fidelity. This paper introduces the ⵟ-product (Yat-product), a novel neural operator inspired by physical inverse-square laws, which intrinsically unifies vector alignment with spatial proximity to provide a geometrically richer measure of interaction...
            </div>
          </div>
        </div>

        <!-- Quick Navigation -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <a href="#mathematical-foundations" class="nav-card group">
            <div class="w-8 h-8 bg-purple-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Math Foundations</h3>
          </a>
          <a href="#similarity-metrics" class="nav-card group">
            <div class="w-8 h-8 bg-blue-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Similarity Kernels</h3>
          </a>
          <a href="#activation-functions" class="nav-card group">
            <div class="w-8 h-8 bg-green-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Activations</h3>
          </a>
          <a href="#usage-guide" class="nav-card group">
            <div class="w-8 h-8 bg-orange-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="font-semibold text-theme-primary text-sm">Usage Guide</h3>
          </a>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Table of Contents -->
          <div class="lg:col-span-1">
            <div class="sticky top-8">
              <div class="toc-card p-6">
                <h3 class="font-bold text-lg text-theme-primary mb-4">Contents</h3>
                <nav class="space-y-2 text-sm">
                  <a href="#mathematical-foundations" class="toc-link">1. Mathematical Foundations</a>
                  <a href="#similarity-metrics" class="toc-link ml-3">1.1 Similarity Kernels</a>
                  <a href="#yat-product" class="toc-link ml-6">1.1.1 Yat Product (ⵟ)</a>
                  <a href="#activation-functions" class="toc-link ml-3">1.2 Activation Functions</a>
                  <a href="#softermax" class="toc-link ml-6">1.2.1 Softermax</a>
                  <a href="#optimization" class="toc-link ml-3">1.3 Optimization</a>
                  <a href="#usage-guide" class="toc-link">2. Usage Guide</a>
                  <a href="#data-format" class="toc-link ml-3">2.1 Data Format</a>
                  <a href="#interface-guide" class="toc-link ml-3">2.2 Interface Guide</a>
                  <a href="#training-guide" class="toc-link ml-3">2.3 Training Guide</a>
                  <a href="#examples" class="toc-link">3. Examples & Tutorials</a>
                </nav>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="lg:col-span-3">
            <div class="space-y-12">
              
              <!-- Mathematical Foundations -->
              <section id="mathematical-foundations">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-purple-500 pb-2">1. Mathematical Foundations</h2>
                
                <div class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">Core Mathematical Framework</h3>
                  <p class="mb-4 text-theme-secondary">
                    Vortex implements a novel neural architecture inspired by celestial mechanics and gravitational systems. 
                    Each neuron acts as a gravitational body, influencing data points through similarity-based forces.
                  </p>
                  
                  <div class="math-section mb-6">
                    <h4 class="font-semibold text-blue-500 mb-3">Network Forward Pass</h4>
                    <div class="math-formula-block">
                      <div class="formula-title">For each data point x and neuron n:</div>
                      <div class="formula">s = Similarity(x, n)</div>
                      <div class="formula">a = Activation(s)</div>
                      <div class="formula">y = Σ(a × w)</div>
                    </div>
                  </div>
                </div>

                <div id="similarity-metrics" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">1.1 Similarity Kernels</h3>
                  <p class="mb-4 text-theme-secondary">
                    Similarity kernels determine how neurons measure their relationship to data points. 
                    Each kernel captures different geometric and mathematical properties.
                  </p>
                  
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="metric-card">
                      <h4 class="font-semibold text-blue-500 mb-2">Dot Product</h4>
                      <div class="math-formula mb-2">s = x₁n₁ + x₂n₂</div>
                      <p class="text-sm text-theme-secondary">Measures vector alignment. Positive when vectors point in similar directions.</p>
                      <div class="properties mt-2">
                        <span class="property-tag">Linear</span>
                        <span class="property-tag">Fast</span>
                      </div>
                    </div>
                    
                    <div class="metric-card">
                      <h4 class="font-semibold text-green-500 mb-2">Euclidean Distance</h4>
                      <div class="math-formula mb-2">s = -√((x₁-n₁)² + (x₂-n₂)²)</div>
                      <p class="text-sm text-theme-secondary">Standard geometric distance. Negative because similarity decreases with distance.</p>
                      <div class="properties mt-2">
                        <span class="property-tag">Geometric</span>
                        <span class="property-tag">Intuitive</span>
                      </div>
                    </div>
                    
                    <div class="metric-card highlight-card">
                      <h4 class="font-semibold text-purple-500 mb-2">Yat Product (ⵟ)</h4>
                      <div class="math-formula mb-2">s = (x·n)² / (||x-n||² + ε)</div>
                      <p class="text-sm text-theme-secondary">Novel kernel combining alignment with proximity, inspired by gravitational physics.</p>
                      <div class="properties mt-2">
                        <span class="property-tag">Novel</span>
                        <span class="property-tag">Physics-inspired</span>
                      </div>
                    </div>
                  </div>

                  <div id="yat-product" class="math-deep-dive">
                    <h4 class="text-lg font-semibold text-purple-600 mb-4">1.1.1 The Yat Product (ⵟ-product)</h4>
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border-l-4 border-purple-500">
                      <div class="math-formula-block mb-4">
                        <div class="formula-title">Yat Product Definition:</div>
                        <div class="formula large">ⵟ(x, n) = (x · n)² / (||x - n||² + ε)</div>
                        <div class="formula-vars">
                          <span>x: data point vector</span>
                          <span>n: neuron position vector</span>
                          <span>ε: regularization constant (default: 0.01)</span>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 class="font-semibold mb-2">Physical Interpretation</h5>
                          <ul class="text-sm space-y-1">
                            <li>• Numerator: Alignment strength (like gravitational mass interaction)</li>
                            <li>• Denominator: Distance-based decay (inverse square law)</li>
                            <li>• Combined: Gravitational-like force with directional sensitivity</li>
                          </ul>
                        </div>
                        <div>
                          <h5 class="font-semibold mb-2">Mathematical Properties</h5>
                          <ul class="text-sm space-y-1">
                            <li>• Non-negative: ⵟ(x, n) ≥ 0</li>
                            <li>• Symmetric: ⵟ(x, n) = ⵟ(n, x)</li>
                            <li>• Smooth and differentiable</li>
                            <li>• Combines benefits of dot product and RBF kernels</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="activation-functions" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">1.2 Activation Functions</h3>
                  <p class="mb-4 text-theme-secondary">
                    Activation functions transform similarity scores into meaningful neural outputs, 
                    introducing non-linearity and shaping the decision boundaries.
                  </p>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="activation-card">
                      <h4 class="font-semibold text-blue-500 mb-2">Softmax</h4>
                      <div class="math-formula mb-2">σ(z)ᵢ = e^(zᵢ) / Σⱼe^(zⱼ)</div>
                      <p class="text-sm text-theme-secondary">Converts scores to probabilities that sum to 1. Ideal for multi-class classification.</p>
                    </div>
                    
                    <div class="activation-card highlight-card">
                      <h4 class="font-semibold text-green-500 mb-2">Softermax</h4>
                      <div class="math-formula mb-2">σ(z)ᵢ = e^(βzᵢ) / Σⱼe^(βzⱼ)</div>
                      <p class="text-sm text-theme-secondary">Temperature-controlled softmax with β < 1, providing smoother probability distributions.</p>
                    </div>
                    
                    <div class="activation-card">
                      <h4 class="font-semibold text-red-500 mb-2">ReLU</h4>
                      <div class="math-formula mb-2">f(x) = max(0, x)</div>
                      <p class="text-sm text-theme-secondary">Simple threshold function. Fast computation, common in deep networks.</p>
                    </div>
                    
                    <div class="activation-card">
                      <h4 class="font-semibold text-purple-500 mb-2">GELU</h4>
                      <div class="math-formula mb-2">f(x) = x · Φ(x)</div>
                      <p class="text-sm text-theme-secondary">Smooth ReLU alternative using Gaussian properties. Modern choice for transformers.</p>
                    </div>
                  </div>

                  <div id="softermax" class="math-deep-dive">
                    <h4 class="text-lg font-semibold text-green-600 mb-4">1.2.1 Softermax Activation</h4>
                    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
                      <div class="math-formula-block mb-4">
                        <div class="formula-title">Softermax Definition:</div>
                        <div class="formula large">σₛₒft(z)ᵢ = e^(βzᵢ) / Σⱼe^(βzⱼ)</div>
                        <div class="formula-vars">
                          <span>β: temperature parameter (0 < β < 1)</span>
                          <span>Default β = 0.5 in Vortex</span>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 class="font-semibold mb-2">Behavior</h5>
                          <ul class="text-sm space-y-1">
                            <li>• β → 0: Uniform distribution</li>
                            <li>• β = 1: Standard softmax</li>
                            <li>• β < 1: Softer, more distributed probabilities</li>
                            <li>• Reduces overconfidence in predictions</li>
                          </ul>
                        </div>
                        <div>
                          <h5 class="font-semibold mb-2">Advantages</h5>
                          <ul class="text-sm space-y-1">
                            <li>• Better generalization on noisy data</li>
                            <li>• Smoother decision boundaries</li>
                            <li>• Reduced gradient saturation</li>
                            <li>• More robust to outliers</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="optimization" class="doc-card">
                  <h3 class="text-xl font-semibold mb-4">1.3 Optimization</h3>
                  <p class="mb-4 text-theme-secondary">
                    Vortex uses gradient descent to minimize classification error through iterative parameter updates.
                  </p>
                  
                  <div class="math-formula-block mb-4">
                    <div class="formula-title">Parameter Update Rule:</div>
                    <div class="formula">θₜ₊₁ = θₜ - α∇L(θₜ)</div>
                    <div class="formula-vars">
                      <span>θ: neuron parameters (position, weights)</span>
                      <span>α: learning rate</span>
                      <span>L: loss function (cross-entropy)</span>
                    </div>
                  </div>
                  
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 class="font-semibold text-blue-700 dark:text-blue-300 mb-2">Key Hyperparameters</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <ul class="space-y-1 text-blue-600 dark:text-blue-400">
                          <li><strong>Learning Rate (α):</strong> 0.001 - 1.0</li>
                          <li><strong>Batch Size:</strong> 1 - 100 samples</li>
                          <li><strong>Epochs:</strong> Training iterations</li>
                        </ul>
                      </div>
                      <div>
                        <ul class="space-y-1 text-blue-600 dark:text-blue-400">
                          <li><strong>Momentum:</strong> 0.0 - 0.99</li>
                          <li><strong>Weight Decay:</strong> L2 regularization</li>
                          <li><strong>Speed:</strong> Visualization multiplier</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Usage Guide -->
              <section id="usage-guide">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-green-500 pb-2">2. Usage Guide</h2>
                
                <div id="data-format" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">2.1 Data Format</h3>
                  <p class="mb-4 text-theme-secondary">
                    Vortex accepts CSV files with a specific 3-column format for 2D classification problems.
                  </p>
                  
                  <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
                    <div class="text-gray-500 mb-2">// Required CSV format</div>
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
                      <p class="text-sm text-theme-secondary">
                        <strong>Range:</strong> [-1, 1] recommended<br>
                        <strong>Type:</strong> Float<br>
                        <strong>Meaning:</strong> Horizontal position
                      </p>
                    </div>
                    <div class="constraint-card">
                      <h4 class="font-semibold text-green-500 mb-2">Y Coordinate</h4>
                      <p class="text-sm text-theme-secondary">
                        <strong>Range:</strong> [-1, 1] recommended<br>
                        <strong>Type:</strong> Float<br>
                        <strong>Meaning:</strong> Vertical position
                      </p>
                    </div>
                    <div class="constraint-card">
                      <h4 class="font-semibold text-purple-500 mb-2">Label</h4>
                      <p class="text-sm text-theme-secondary">
                        <strong>Range:</strong> 0, 1, 2, ...<br>
                        <strong>Type:</strong> Integer<br>
                        <strong>Meaning:</strong> Class identifier
                      </p>
                    </div>
                  </div>
                </div>

                <div id="interface-guide" class="doc-card mb-6">
                  <h3 class="text-xl font-semibold mb-4">2.2 Interface Guide</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 class="font-semibold text-blue-500 mb-3">Canvas Controls</h4>
                      <div class="control-list">
                        <div class="control-item">
                          <span class="control-key">Left Click</span>
                          <span class="control-desc">Add neuron at cursor position</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Right Click</span>
                          <span class="control-desc">Remove nearest neuron</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Mouse Wheel</span>
                          <span class="control-desc">Zoom in/out</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Drag</span>
                          <span class="control-desc">Pan around canvas</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 class="font-semibold text-green-500 mb-3">Panel System</h4>
                      <div class="control-list">
                        <div class="control-item">
                          <span class="control-key">Data Panel</span>
                          <span class="control-desc">Upload/export CSV files</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Optimization Panel</span>
                          <span class="control-desc">Configure training parameters</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Visualization Panel</span>
                          <span class="control-desc">Display options and styles</span>
                        </div>
                        <div class="control-item">
                          <span class="control-key">Metrics Panel</span>
                          <span class="control-desc">Training progress and statistics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="training-guide" class="doc-card">
                  <h3 class="text-xl font-semibold mb-4">2.3 Training Guide</h3>
                  
                  <div class="training-steps">
                    <div class="step-item">
                      <div class="step-number">1</div>
                      <div class="step-content">
                        <h4 class="font-semibold">Load Data</h4>
                        <p class="text-sm text-theme-secondary">Upload your CSV file or use built-in datasets (Spiral, XOR, Clusters)</p>
                      </div>
                    </div>
                    
                    <div class="step-item">
                      <div class="step-number">2</div>
                      <div class="step-content">
                        <h4 class="font-semibold">Place Neurons</h4>
                        <p class="text-sm text-theme-secondary">Click on canvas to add neurons strategically near decision boundaries</p>
                      </div>
                    </div>
                    
                    <div class="step-item">
                      <div class="step-number">3</div>
                      <div class="step-content">
                        <h4 class="font-semibold">Configure Network</h4>
                        <p class="text-sm text-theme-secondary">Choose similarity metric (Yat Product recommended) and activation function</p>
                      </div>
                    </div>
                    
                    <div class="step-item">
                      <div class="step-number">4</div>
                      <div class="step-content">
                        <h4 class="font-semibold">Set Parameters</h4>
                        <p class="text-sm text-theme-secondary">Adjust learning rate (0.01), epochs (100), and training speed</p>
                      </div>
                    </div>
                    
                    <div class="step-item">
                      <div class="step-number">5</div>
                      <div class="step-content">
                        <h4 class="font-semibold">Train & Monitor</h4>
                        <p class="text-sm text-theme-secondary">Start training and watch real-time decision boundary evolution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Examples -->
              <section id="examples">
                <h2 class="text-3xl font-bold text-theme-primary mb-6 border-b-2 border-orange-500 pb-2">3. Examples & Tutorials</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <router-link to="/playground" class="example-card group">
                    <div class="w-12 h-12 bg-purple-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 class="font-semibold text-purple-500 mb-2">Spiral Dataset</h4>
                    <p class="text-sm text-theme-secondary mb-3">
                      Learn to classify intertwined spirals using the Yat Product kernel. 
                      Demonstrates non-linear decision boundaries.
                    </p>
                    <div class="math-tip">
                      <strong>Tip:</strong> Use 4-6 neurons with Yat Product + Softermax
                    </div>
                  </router-link>
                  
                  <router-link to="/playground" class="example-card group">
                    <div class="w-12 h-12 bg-blue-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h4 class="font-semibold text-blue-500 mb-2">XOR Problem</h4>
                    <p class="text-sm text-theme-secondary mb-3">
                      Classic non-linearly separable problem requiring hidden representations.
                      Perfect for understanding neural network expressivity.
                    </p>
                    <div class="math-tip">
                      <strong>Tip:</strong> Place neurons at (±0.5, ±0.5) corners
                    </div>
                  </router-link>
                  
                  <router-link to="/playground" class="example-card group">
                    <div class="w-12 h-12 bg-green-500 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 class="font-semibold text-green-500 mb-2">Gaussian Clusters</h4>
                    <p class="text-sm text-theme-secondary mb-3">
                      Well-separated clusters ideal for understanding different similarity metrics.
                      Compare Euclidean vs. Yat Product performance.
                    </p>
                    <div class="math-tip">
                      <strong>Tip:</strong> Try both Euclidean and Yat Product to see differences
                    </div>
                  </router-link>
                </div>

                <!-- Advanced Features -->
                <div class="doc-card mt-8">
                  <h3 class="text-xl font-semibold mb-4">Advanced Features</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="feature-section">
                      <h4 class="font-semibold text-blue-500 mb-3">🔧 Interactive Tools</h4>
                      <ul class="space-y-2 text-sm text-theme-secondary">
                        <li>• Real-time parameter adjustment</li>
                        <li>• Live decision boundary visualization</li>
                        <li>• Neuron-specific configuration</li>
                        <li>• Interactive loss landscape exploration</li>
                        <li>• Custom data upload and generation</li>
                      </ul>
                    </div>
                    
                    <div class="feature-section">
                      <h4 class="font-semibold text-green-500 mb-3">📊 Analysis & Export</h4>
                      <ul class="space-y-2 text-sm text-theme-secondary">
                        <li>• Training metrics and history charts</li>
                        <li>• Confusion matrix analysis</li>
                        <li>• Network performance statistics</li>
                        <li>• Export trained models and data</li>
                        <li>• Visualization export capabilities</li>
                      </ul>
                    </div>
                    
                    <div class="feature-section">
                      <h4 class="font-semibold text-purple-500 mb-3">🧠 Neural Architecture</h4>
                      <ul class="space-y-2 text-sm text-theme-secondary">
                        <li>• Dynamic neuron placement and removal</li>
                        <li>• Multiple similarity kernel options</li>
                        <li>• Various activation function choices</li>
                        <li>• Customizable network topologies</li>
                        <li>• Training preset configurations</li>
                      </ul>
                    </div>
                    
                    <div class="feature-section">
                      <h4 class="font-semibold text-orange-500 mb-3">⚡ Performance</h4>
                      <ul class="space-y-2 text-sm text-theme-secondary">
                        <li>• GPU-accelerated computations</li>
                        <li>• Optimized gradient calculations</li>
                        <li>• Real-time training visualization</li>
                        <li>• Smooth pan and zoom controls</li>
                        <li>• Responsive interface design</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Mathematical Comparison -->
                <div class="doc-card mt-8">
                  <h3 class="text-xl font-semibold mb-4">Performance Comparison</h3>
                  <div class="comparison-table">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b border-gray-300 dark:border-gray-600">
                          <th class="text-left p-2">Problem</th>
                          <th class="text-left p-2">Best Kernel</th>
                          <th class="text-left p-2">Best Activation</th>
                          <th class="text-left p-2">Neurons</th>
                          <th class="text-left p-2">Learning Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-2">Spiral</td>
                          <td class="p-2 text-purple-600">Yat Product</td>
                          <td class="p-2 text-green-600">Softermax</td>
                          <td class="p-2">4-6</td>
                          <td class="p-2">0.01</td>
                        </tr>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <td class="p-2">XOR</td>
                          <td class="p-2 text-purple-600">Yat Product</td>
                          <td class="p-2 text-blue-600">Softmax</td>
                          <td class="p-2">4</td>
                          <td class="p-2">0.05</td>
                        </tr>
                        <tr>
                          <td class="p-2">Clusters</td>
                          <td class="p-2 text-green-600">Euclidean</td>
                          <td class="p-2 text-green-600">Softermax</td>
                          <td class="p-2">2-3</td>
                          <td class="p-2">0.1</td>
                        </tr>
                      </tbody>
                    </table>
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
</script>

<style scoped>
/* Main container styles */
.main-container {
  background: var(--viz-overlay);
  backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-heavy);
  transform: translateZ(0);
  will-change: transform;
}

/* Navigation cards */
.nav-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700;
  text-decoration: none;
}

.nav-card:hover {
  transform: translateY(-2px);
}

/* Table of contents */
.toc-card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
  background: var(--viz-overlay);
  backdrop-filter: blur(16px);
}

.toc-link {
  @apply block py-1 px-2 rounded text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary transition-colors;
  text-decoration: none;
}

/* Documentation content */
.doc-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700;
  background: var(--viz-overlay);
  backdrop-filter: blur(16px);
}

/* Math styling */
.math-formula {
  @apply font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded;
  font-family: 'Computer Modern', 'Latin Modern Math', 'Cambria Math', serif;
  border: 1px solid rgb(var(--border-secondary));
}

.math-formula-block {
  @apply bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4;
}

.formula-title {
  @apply font-semibold text-theme-primary text-sm mb-2;
}

.formula {
  @apply font-mono text-lg mb-2 text-center;
  font-family: 'Computer Modern', 'Latin Modern Math', 'Cambria Math', serif;
}

.formula.large {
  @apply text-xl;
}

.formula-vars {
  @apply text-xs text-theme-secondary grid grid-cols-1 gap-1;
}

.formula-vars span {
  @apply block;
}

/* Cards */
.metric-card, .activation-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
  transition: all 0.2s ease;
}

.metric-card:hover, .activation-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.highlight-card {
  @apply border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20;
  position: relative;
  overflow: hidden;
}

.highlight-card::before {
  content: '✨';
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.2em;
}

/* Property tags */
.properties {
  @apply flex gap-2 flex-wrap;
}

.property-tag {
  @apply text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full;
}

/* Constraint cards */
.constraint-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

/* Control lists */
.control-list {
  @apply space-y-2;
}

.control-item {
  @apply flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded;
}

.control-key {
  @apply font-mono text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded;
}

.control-desc {
  @apply text-sm text-theme-secondary flex-1 ml-3;
}

/* Training steps */
.training-steps {
  @apply space-y-4;
}

.step-item {
  @apply flex items-start gap-4;
}

.step-number {
  @apply w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0;
}

.step-content h4 {
  @apply font-semibold text-theme-primary;
}

/* Example cards */
.example-card {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200;
  text-decoration: none;
}

.example-card:hover {
  transform: translateY(-2px);
}

.math-tip {
  @apply text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-2 rounded;
}

/* Comparison table */
.comparison-table {
  @apply overflow-x-auto;
}

.comparison-table table {
  @apply min-w-full;
}

.comparison-table th {
  @apply font-semibold text-theme-primary;
}

.comparison-table td {
  @apply text-theme-secondary;
}

/* Math deep dive sections */
.math-deep-dive {
  @apply mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700;
}

.math-section {
  @apply bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500;
}

/* Feature sections */
.feature-section {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

.feature-section h4 {
  @apply flex items-center gap-2;
}

.feature-section ul li {
  @apply flex items-start;
}

.feature-section ul li::before {
  content: '';
  @apply w-1 h-1 bg-current rounded-full mt-2 mr-2 flex-shrink-0;
}

/* Responsive design */
@media (max-width: 768px) {
  .grid.lg\\:grid-cols-4 {
    @apply grid-cols-1;
  }
  
  .math-formula-block .formula {
    @apply text-base;
  }
  
  .math-formula-block .formula.large {
    @apply text-lg;
  }
  
  .formula-vars {
    @apply grid-cols-1;
  }
}

/* Performance optimization */
@media (prefers-reduced-motion: reduce) {
  .nav-card,
  .example-card,
  .metric-card,
  .activation-card {
    transition: none !important;
    transform: none !important;
  }
}
</style>
