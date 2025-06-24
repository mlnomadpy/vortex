# Vortex Neural Network

A modern, interactive neural network visualization tool built with Vue 3, TypeScript, and D3.js. This application allows users to explore and understand neural networks through real-time visualization and interaction.

![Vortex Neural Network](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Vortex+Neural+Network)

## ✨ Features

- 🎯 **Interactive Canvas**: Click to add neurons and visualize decision boundaries
- 📊 **Real-time Metrics**: Monitor accuracy, neuron activity, and loss landscapes
- 🔄 **Multiple Activation Functions**: Softmax, ReLU, Sigmoid, GELU, and more
- 📈 **Gradient Descent Optimization**: Train your network with visual feedback
- 🎨 **Beautiful UI**: Modern design with Tailwind CSS and smooth animations
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🧮 **Mathematical Formulas**: Built-in LaTeX rendering with MathJax

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vortex-neural-network.git
   cd vortex-neural-network
   ```

2. **Install dependencies**
   
   On Windows:
   ```bash
   ./install.bat
   ```
   
   On macOS/Linux:
   ```bash
   ./install.sh
   ```
   
   Or manually:
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage

### Data Upload
1. Prepare a CSV file with the format: `x,y,label`
2. Click "Choose CSV File" and select your data
3. Click "Load Data" to visualize your dataset

### Neural Network Interaction
1. **Add Neurons**: Click anywhere on the canvas to add neurons
2. **Configure Settings**: Choose similarity metrics and activation functions
3. **Train Network**: Use gradient descent to optimize neuron positions
4. **Analyze Results**: View metrics and loss landscapes in real-time

### Example Data Format
```csv
x,y,label
0.5,0.3,0
-0.2,0.8,1
0.1,-0.4,0
-0.7,-0.1,1
```

## 🛠️ Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: D3.js
- **State Management**: Pinia
- **Build Tool**: Vite
- **Math Rendering**: MathJax

## 📁 Project Structure

```
src/
├── components/           # Vue components
│   ├── layout/          # Layout components (Header, Footer)
│   ├── sections/        # Page sections (Controls, Hero, etc.)
│   ├── ui/              # Reusable UI components
│   └── visualization/   # Visualization components
├── stores/              # Pinia stores
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── views/               # Vue views/pages
└── style.css           # Global styles
```

## 🎨 Component Architecture

### Core Components

- **NeuralCanvas**: Main visualization canvas with D3.js integration
- **ControlsGrid**: Control panels for data, neurons, and settings
- **MetricsPanel**: Real-time performance metrics
- **LossLandscape**: 3D loss visualization for selected neurons

### State Management

The application uses Pinia for state management with two main stores:

- **neuralNetworkStore**: Manages neural network state, data, and computations
- **notificationStore**: Handles user notifications and feedback

## 🧮 Mathematical Features

### Similarity Metrics
- **Dot Product**: `x₁x₂ + y₁y₂`
- **Euclidean Distance**: `-√((x₁-x₂)² + (y₁-y₂)²)`
- **My Product**: `(x₁x₂ + y₁y₂) / √(distance² + ε)`

### Activation Functions
- **Softmax**: `softmax(xᵢ) = eˣⁱ / Σⱼeˣʲ`
- **ReLU**: `ReLU(x) = max(0, x)`
- **Sigmoid**: `σ(x) = 1 / (1 + e⁻ˣ)`
- **GELU**: `GELU(x) = 0.5x(1 + tanh(√(2/π)(x + 0.044715x³)))`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run type-check` - Type checking

### Adding New Features

1. **Components**: Add new components in appropriate directories
2. **Types**: Define TypeScript interfaces in `src/types/`
3. **Stores**: Extend existing stores or create new ones in `src/stores/`
4. **Utils**: Add utility functions in `src/utils/`

## 🎯 Roadmap

- [ ] Advanced neural network architectures
- [ ] More dataset generators
- [ ] Export trained models
- [ ] Performance optimization for large datasets
- [ ] Mobile app version
- [ ] Collaborative features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by TensorFlow Playground
- Built with amazing open-source technologies
- Special thanks to the Vue.js and D3.js communities

---

**Happy learning and exploring neural networks!** 🚀

For questions or support, please open an issue or contact [your.email@example.com](mailto:your.email@example.com).
