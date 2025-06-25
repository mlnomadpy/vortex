# 🌪️ Vortex Neural Network

<div align="center">

[![Vue 3](https://img.shields.io/badge/Vue-3.4.0-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.8.5-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A modern, interactive neural network visualization tool for educational exploration and understanding**

*Click, visualize, and learn how neural networks make decisions in real-time*

[🚀 Live Demo](#) | [📖 Documentation](src/views/Documentation.vue) | [🎯 Features](#-features) | [🛠️ Installation](#-installation)

</div>

---

## ✨ Features

### 🎯 **Interactive Visualization**
- **Click-to-Add Neurons**: Point and click anywhere on the canvas to add neurons
- **Real-time Decision Boundaries**: Watch how neural networks partition the space
- **Fullscreen Mode**: Immersive visualization with advanced controls and shortcuts
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile

### 🧠 **Neural Network Capabilities**
- **Multiple Similarity Metrics**:
  - **Dot Product**: `x₁x₂ + y₁y₂`
  - **Euclidean Distance**: `-√((x₁-x₂)² + (y₁-y₂)²)`  
  - **My Product**: `(x₁x₂ + y₁y₂) / √(distance² + ε)`

- **Advanced Activation Functions**:
  - **Softmax**: `softmax(xᵢ) = eˣⁱ / Σⱼeˣʲ` - Probability distribution
  - **ReLU**: `ReLU(x) = max(0, x)` - Rectified Linear Unit
  - **Sigmoid**: `σ(x) = 1 / (1 + e⁻ˣ)` - S-shaped curve
  - **GELU**: `GELU(x) = 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))` - Smooth ReLU alternative
  - **Softermax**: Gentler probability distribution
  - **None**: Raw similarity scores

### 📊 **Real-time Analytics**
- **Live Metrics**: Accuracy, loss, neuron activity, and performance stats
- **Loss Landscape Visualization**: 3D surface plots for selected neurons  
- **Optimization History**: Track gradient descent progress with interactive charts
- **Performance Monitoring**: Grid cell count, data point filtering, and processing stats

### 🎨 **Advanced Visualization**
- **Grid-based Rendering**: High-performance D3.js visualization with configurable density (10×10 to 150×150)
- **Color-coded Predictions**: Visual feedback showing predicted vs actual classifications
- **Coordinate System Control**: Customizable ranges with presets (±1, ±5, ±10) and auto-fit
- **Neuron Movement Tracking**: Trail visualization during gradient descent optimization
- **Mathematical Formula Rendering**: LaTeX equations with MathJax integration

### 🔄 **Training & Optimization**
- **Gradient Descent**: Visual training with configurable learning rate, epochs, and speed
- **Real-time Convergence**: Watch neurons move to optimal positions
- **Optimization Controls**: Start, stop, and monitor training progress
- **Movement History**: Track neuron trajectories and convergence patterns

### 📁 **Data Management**
- **CSV Import**: Upload custom datasets with automatic parsing
- **Class Filtering**: Toggle visibility of specific data classes
- **Auto-coordinate Fitting**: Automatically adjust view to data bounds
- **Export Capabilities**: Save training results and model states

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/mlnomadpy/vortex.git
cd vortex

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint and fix code with ESLint |
| `npm run type-check` | Run TypeScript type checking |

---

## 📖 Usage Guide

### 🎯 Getting Started

1. **Load Data**
   ```csv
   x,y,label
   0.5,0.3,0
   -0.2,0.8,1
   0.1,-0.4,0
   -0.7,-0.1,1
   ```
   - Click "Choose CSV File" and select your dataset
   - Or use the built-in sample data generators

2. **Add Neurons**
   - Click anywhere on the main canvas to place neurons
   - Each neuron represents a decision center for classification

3. **Configure Network**
   - Choose similarity metrics (how neurons measure distances)
   - Select activation functions (how neurons process scores)
   - Adjust visualization settings (boundaries, colors, grid density)

4. **Train & Optimize**
   - Click "Run Gradient Descent" to start training
   - Watch neurons move to minimize classification error
   - Monitor metrics and loss landscapes in real-time

### 🎮 Keyboard Shortcuts (Fullscreen Mode)

| Key | Action |
|-----|--------|
| `Esc` | Exit fullscreen mode |
| `R` | Reinitialize visualization grid |
| `B` | Toggle decision boundaries |
| `Click` | Add neuron at cursor position |

### 📊 Understanding the Interface

- **Main Canvas**: Interactive visualization area for neurons and data
- **Stats Panel**: Real-time accuracy, loss, and performance metrics  
- **Controls Grid**: Data upload, network configuration, and training controls
- **Loss Landscape**: 3D visualization of error surface for selected neurons
- **Class Toggles**: Show/hide specific data classes
- **Metrics Panel**: Detailed analytics and optimization history

---

## 🏗️ Architecture

### 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vue 3 Composition API | Reactive UI components |
| **Language** | TypeScript | Type safety and enhanced DX |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Visualization** | D3.js v7 | High-performance data visualization |
| **State** | Pinia | Centralized state management |
| **Build** | Vite | Fast development and optimized builds |
| **Math** | MathJax | LaTeX equation rendering |

### 📁 Project Structure

```
src/
├── components/                 # Vue components
│   ├── layout/                # App shell components
│   │   ├── AppHeader.vue      # Navigation and theme controls
│   │   └── AppFooter.vue      # Footer with links and info
│   ├── sections/              # Page section components  
│   │   ├── ControlsGrid.vue   # Main control panel
│   │   ├── HeroSection.vue    # Landing hero area
│   │   ├── MathFormulas.vue   # Mathematical explanations
│   │   └── VisualizationControls.vue # Display settings
│   ├── ui/                    # Reusable UI components
│   │   ├── FileUpload.vue     # CSV file upload widget
│   │   ├── NotificationContainer.vue # Toast notifications
│   │   └── ParticlesBackground.vue # Animated background
│   └── visualization/         # Core visualization components
│       ├── InteractiveCanvas.vue # Main D3 canvas
│       ├── NeuralCanvas.vue   # Complete neural network view
│       ├── FullscreenCanvas.vue # Immersive fullscreen mode
│       ├── LossLandscape.vue  # 3D loss surface visualization
│       ├── MetricsPanel.vue   # Real-time statistics
│       └── OptimizationControls.vue # Training controls
├── composables/               # Vue composition functions
│   ├── useNeuralCanvas.ts     # Canvas visualization logic
│   └── useTheme.ts           # Dark/light theme management
├── stores/                    # Pinia state stores
│   ├── neuralNetwork.ts       # Core neural network state
│   └── notification.ts        # User notification system
├── utils/                     # Utility functions and algorithms
│   ├── mathCore.ts           # Neural network mathematics
│   ├── d3Grid.ts             # D3 grid rendering utilities
│   ├── d3SvgRenderer.ts      # SVG visualization renderer
│   ├── colors.ts             # Color scheme generation
│   ├── csvUtils.ts           # CSV parsing and validation
│   └── performance.ts        # Performance optimization helpers
├── types/                     # TypeScript type definitions
├── views/                     # Page-level Vue components
│   ├── Home.vue              # Main application view
│   ├── Playground.vue        # Experimental features
│   └── Documentation.vue     # Built-in help and docs
└── config/                    # Application configuration
    └── index.ts              # Constants and default settings
```

### 🔄 State Management

The application uses **Pinia** for reactive state management:

**`neuralNetworkStore`** - Core neural network functionality:
- Neuron positions and properties
- Dataset management and filtering  
- Similarity metrics and activation functions
- Training state and optimization history
- Real-time predictions and loss calculation

**`notificationStore`** - User feedback system:
- Toast notifications for user actions
- Error handling and success messages
- Progress indicators for long-running operations

---

## 🧮 Mathematical Foundation

### Similarity Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| **Dot Product** | `x₁x₂ + y₁y₂` | Linear similarity measure |
| **Euclidean** | `-√((x₁-x₂)² + (y₁-y₂)²)` | Negative distance (closer = higher score) |
| **My Product** | `(x₁x₂ + y₁y₂) / √(distance² + ε)` | Normalized dot product with distance weighting |

### Activation Functions

| Function | Formula | Use Case |
|----------|---------|----------|
| **Softmax** | `eˣⁱ / Σⱼeˣʲ` | Multi-class probability distribution |
| **ReLU** | `max(0, x)` | Simple thresholding with sparsity |
| **Sigmoid** | `1 / (1 + e⁻ˣ)` | Smooth probability-like output |
| **GELU** | `0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))` | Smooth ReLU with better gradients |

### Loss Function

The system uses **categorical cross-entropy loss**:

```
L = -Σᵢ yᵢ log(ŷᵢ)
```

Where `yᵢ` is the true label and `ŷᵢ` is the predicted probability.

---

## 🔧 Development

### Adding New Features

1. **New Components**: Add to appropriate `components/` subdirectory
2. **State Management**: Extend stores in `stores/` directory  
3. **Mathematical Functions**: Implement in `utils/mathCore.ts`
4. **Visualization**: Extend D3 utilities in `utils/d3*.ts`
5. **Types**: Define interfaces in `types/index.ts`

### Performance Considerations

- **Grid Optimization**: Configurable density with performance monitoring
- **Data Limiting**: Automatic limiting of large datasets for smooth rendering
- **Debounced Updates**: Throttled re-rendering during user interactions
- **Web Workers**: Background processing for intensive calculations
- **Memory Management**: Efficient cleanup of D3 elements and event listeners

### Theme System

The application supports **dark/light themes** with CSS custom properties:

```css
/* Theme variables in src/style.css */
:root {
  --color-primary: 59 130 246;      /* Primary blue */
  --bg-primary: 255 255 255;        /* Main background */
  --text-primary: 15 23 42;         /* Primary text */
  /* ... additional theme variables */
}

[data-theme="dark"] {
  --bg-primary: 15 23 42;           /* Dark background */
  --text-primary: 248 250 252;      /* Light text */
  /* ... dark theme overrides */
}
```

---

## 🎯 Roadmap

### Immediate (v1.1)
- [ ] **Advanced Architectures**: Multi-layer perceptrons and CNNs
- [ ] **Dataset Generators**: Built-in pattern generators (spirals, clusters, XOR)
- [ ] **Model Export**: Save and load trained network configurations
- [ ] **Batch Training**: Process multiple datasets simultaneously

### Medium Term (v1.5) 
- [ ] **Performance Optimization**: WebGL acceleration for large grids
- [ ] **Advanced Visualizations**: t-SNE embeddings and attention maps
- [ ] **Collaborative Features**: Share models and collaborate in real-time
- [ ] **Mobile App**: React Native version for iOS and Android

### Long Term (v2.0)
- [ ] **Cloud Integration**: Online model storage and sharing platform
- [ ] **Educational Content**: Interactive tutorials and guided learning paths
- [ ] **Research Tools**: Advanced analysis and comparison features
- [ ] **API Integration**: Connect with popular ML frameworks (TensorFlow, PyTorch)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/vortex-neural-network.git
cd vortex-neural-network

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/amazing-feature

# Start development server
npm run dev
```

### Contribution Guidelines

1. **Follow TypeScript conventions** with strict type checking
2. **Write comprehensive tests** for new mathematical functions
3. **Update documentation** for new features and APIs
4. **Use semantic commit messages** following conventional commits
5. **Ensure accessibility** with proper ARIA labels and keyboard navigation

### Pull Request Process

1. Update documentation and add tests for new features
2. Ensure all existing tests pass: `npm run lint && npm run type-check`
3. Add a clear description of changes and motivation
4. Request review from maintainers
5. Address feedback and iterate as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Inspired by**: [TensorFlow Playground](https://playground.tensorflow.org/) - The original neural network visualization tool
- **Built with**: Amazing open-source technologies from the Vue.js and D3.js communities
- **Mathematical Foundation**: Based on educational neural network principles and modern deep learning research
- **Design Inspiration**: Material Design and modern data visualization best practices

---

## 📞 Support

- **Documentation**: Built-in help available at `/documentation` route
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/yourusername/vortex-neural-network/issues)
- **Discussions**: Join conversations on [GitHub Discussions](https://github.com/yourusername/vortex-neural-network/discussions)

---

<div align="center">

**[⭐ Star this project](https://github.com/yourusername/vortex-neural-network)** if you find it useful!

*Happy learning and exploring neural networks!* 🚀

---

*Built with ❤️ using Vue 3, TypeScript, and D3.js*

</div>
