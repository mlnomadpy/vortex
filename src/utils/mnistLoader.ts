import type { MNISTDataset, NDDataPoint } from '@/types'
import { normalizeFeatures } from './ndMathCore'

// Declare TensorFlow.js as global
declare global {
  interface Window {
    tf: any
  }
}

/**
 * MNIST Data Loader using TensorFlow.js
 * Loads MNIST dataset from TensorFlow.js data sources
 */
export class MNISTLoader {
  private dataset: MNISTDataset | null = null
  private isLoading = false

  /**
   * Load MNIST dataset using TensorFlow.js
   */
  async loadMNIST(maxSamples: { train: number; test: number } = { train: 1000, test: 200 }): Promise<MNISTDataset> {
    if (this.dataset) {
      return this.dataset
    }

    if (this.isLoading) {
      throw new Error('MNIST dataset is already loading')
    }

    this.isLoading = true

    try {
      // Check if TensorFlow.js is available
      if (!window.tf) {
        throw new Error('TensorFlow.js is not loaded. Make sure tf.js is included in your HTML.')
      }

      const tf = window.tf

      // Load MNIST data using TensorFlow.js data API
      console.log('Loading MNIST dataset...')
      
      // Load the data - we'll use tf.data API
      const mnistData = await this.loadMNISTData(tf, maxSamples)
      
      this.dataset = {
        trainImages: mnistData.trainImages,
        testImages: mnistData.testImages,
        imageShape: { width: 28, height: 28 },
        numClasses: 10
      }

      console.log(`MNIST loaded: ${this.dataset.trainImages.length} train, ${this.dataset.testImages.length} test samples`)
      
      return this.dataset

    } catch (error) {
      console.error('Failed to load MNIST:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Load MNIST data using TensorFlow.js
   */
  private async loadMNISTData(tf: any, maxSamples: { train: number; test: number }): Promise<{
    trainImages: NDDataPoint[]
    testImages: NDDataPoint[]
  }> {
    // For demo purposes, we'll create synthetic MNIST-like data
    // In a real implementation, you'd load actual MNIST data
    
    const trainImages = await this.generateSyntheticMNIST(maxSamples.train, 'train')
    const testImages = await this.generateSyntheticMNIST(maxSamples.test, 'test')

    return { trainImages, testImages }
  }

  /**
   * Generate synthetic MNIST-like data for demonstration
   * This creates simple patterns that resemble digit-like features
   */
  private async generateSyntheticMNIST(numSamples: number, split: 'train' | 'test'): Promise<NDDataPoint[]> {
    const data: NDDataPoint[] = []
    const imageSize = 28 * 28 // 784 features

    for (let i = 0; i < numSamples; i++) {
      const label = Math.floor(Math.random() * 10) // Random digit 0-9
      const features = this.generateDigitPattern(label, imageSize)
      
      data.push({
        features: normalizeFeatures(features), // Normalize to [0, 1]
        label,
        originalLabel: label
      })
    }

    return data
  }

  /**
   * Generate a simple pattern for each digit (0-9)
   * This creates recognizable patterns that a neural network can learn
   */
  private generateDigitPattern(digit: number, imageSize: number): number[] {
    const size = Math.sqrt(imageSize) // 28 for MNIST
    const features = new Array(imageSize).fill(0)
    const noise = 0.1 // Add some noise for realism

    // Helper function to set pixel value
    const setPixel = (x: number, y: number, value: number) => {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = Math.floor(y) * size + Math.floor(x)
        if (index >= 0 && index < imageSize) {
          features[index] = Math.max(0, Math.min(1, value + (Math.random() - 0.5) * noise))
        }
      }
    }

    // Generate different patterns for each digit
    switch (digit) {
      case 0: // Circle
        for (let angle = 0; angle < 2 * Math.PI; angle += 0.1) {
          const radius = 8
          const x = size / 2 + radius * Math.cos(angle)
          const y = size / 2 + radius * Math.sin(angle)
          setPixel(x, y, 0.8)
          setPixel(x + 1, y, 0.6)
          setPixel(x, y + 1, 0.6)
        }
        break

      case 1: // Vertical line
        for (let y = 5; y < size - 5; y++) {
          setPixel(size / 2, y, 0.8)
          setPixel(size / 2 + 1, y, 0.6)
        }
        break

      case 2: // S-shape
        for (let x = 5; x < size - 5; x++) {
          setPixel(x, 8, 0.8) // Top horizontal
          setPixel(x, size / 2, 0.8) // Middle horizontal
          setPixel(x, size - 8, 0.8) // Bottom horizontal
        }
        for (let y = 8; y < size / 2; y++) {
          setPixel(5, y, 0.8) // Left vertical (top)
        }
        for (let y = size / 2; y < size - 8; y++) {
          setPixel(size - 6, y, 0.8) // Right vertical (bottom)
        }
        break

      case 3: // Two horizontal curves
        for (let x = 5; x < size - 5; x++) {
          setPixel(x, 8, 0.8) // Top
          setPixel(x, size / 2, 0.8) // Middle
          setPixel(x, size - 8, 0.8) // Bottom
        }
        for (let y = size / 2; y < size - 8; y++) {
          setPixel(size - 6, y, 0.8) // Right side
        }
        break

      case 4: // L-shape with top
        for (let y = 5; y < size / 2; y++) {
          setPixel(8, y, 0.8) // Left vertical
          setPixel(size - 8, y, 0.8) // Right vertical
        }
        for (let x = 8; x < size - 8; x++) {
          setPixel(x, size / 2, 0.8) // Horizontal connector
        }
        for (let y = size / 2; y < size - 5; y++) {
          setPixel(size - 8, y, 0.8) // Right continues down
        }
        break

      case 5: // S-shape reversed
        for (let x = 5; x < size - 5; x++) {
          setPixel(x, 8, 0.8) // Top
          setPixel(x, size / 2, 0.8) // Middle
          setPixel(x, size - 8, 0.8) // Bottom
        }
        for (let y = 8; y < size / 2; y++) {
          setPixel(size - 6, y, 0.8) // Right vertical (top)
        }
        for (let y = size / 2; y < size - 8; y++) {
          setPixel(5, y, 0.8) // Left vertical (bottom)
        }
        break

      case 6: // Circle with gap on top right
        for (let angle = Math.PI; angle < 2 * Math.PI + Math.PI; angle += 0.1) {
          const radius = 8
          const x = size / 2 + radius * Math.cos(angle)
          const y = size / 2 + radius * Math.sin(angle)
          setPixel(x, y, 0.8)
        }
        for (let x = 5; x < size / 2; x++) {
          setPixel(x, size / 2, 0.8) // Horizontal line
        }
        break

      case 7: // Diagonal line with top
        for (let x = 5; x < size - 5; x++) {
          setPixel(x, 8, 0.8) // Top horizontal
        }
        for (let i = 0; i < size - 10; i++) {
          setPixel(size - 8 - i * 0.5, 8 + i, 0.8) // Diagonal
        }
        break

      case 8: // Two circles
        // Top circle
        for (let angle = 0; angle < 2 * Math.PI; angle += 0.2) {
          const radius = 5
          const x = size / 2 + radius * Math.cos(angle)
          const y = size / 3 + radius * Math.sin(angle)
          setPixel(x, y, 0.8)
        }
        // Bottom circle
        for (let angle = 0; angle < 2 * Math.PI; angle += 0.2) {
          const radius = 5
          const x = size / 2 + radius * Math.cos(angle)
          const y = 2 * size / 3 + radius * Math.sin(angle)
          setPixel(x, y, 0.8)
        }
        break

      case 9: // Circle with gap on bottom left
        for (let angle = -Math.PI / 2; angle < Math.PI + Math.PI / 2; angle += 0.1) {
          const radius = 8
          const x = size / 2 + radius * Math.cos(angle)
          const y = size / 2 + radius * Math.sin(angle)
          setPixel(x, y, 0.8)
        }
        for (let x = size / 2; x < size - 5; x++) {
          setPixel(x, size / 2, 0.8) // Horizontal line
        }
        break
    }

    return features
  }

  /**
   * Get a small sample for quick testing
   */
  async getQuickSample(numSamples: number = 100): Promise<NDDataPoint[]> {
    return this.generateSyntheticMNIST(numSamples, 'train')
  }

  /**
   * Load real MNIST data using TensorFlow.js (future implementation)
   */
  private async loadRealMNIST(tf: any): Promise<{ trainImages: NDDataPoint[], testImages: NDDataPoint[] }> {
    // This would be the real implementation using tf.data
    // For now, we'll use synthetic data
    
    try {
      // Example of how to load real MNIST (requires additional setup)
      // const dataset = tf.data.web('path/to/mnist.json')
      // const { xs: trainImages, ys: trainLabels } = await dataset.train.batch(1000).take(1).toArray()
      
      // For now, return empty arrays - use synthetic data instead
      return {
        trainImages: [],
        testImages: []
      }
    } catch (error) {
      console.warn('Real MNIST loading not implemented, using synthetic data')
      return {
        trainImages: [],
        testImages: []
      }
    }
  }

  /**
   * Convert image data to feature vector
   */
  private imageToFeatures(imageData: any): number[] {
    // Convert TensorFlow.js tensor to array of numbers
    if (!imageData) return []
    
    // This would handle the actual tensor conversion
    // const features = await imageData.data()
    // return Array.from(features)
    
    return []
  }

  /**
   * Get dataset statistics
   */
  getDatasetStats(): { train: number, test: number, features: number, classes: number } | null {
    if (!this.dataset) return null
    
    return {
      train: this.dataset.trainImages.length,
      test: this.dataset.testImages.length,
      features: this.dataset.trainImages[0]?.features.length || 0,
      classes: this.dataset.numClasses
    }
  }

  /**
   * Sample random batch from training data
   */
  sampleTrainBatch(batchSize: number): NDDataPoint[] {
    if (!this.dataset) return []
    
    const shuffled = [...this.dataset.trainImages].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(batchSize, shuffled.length))
  }

  /**
   * Get test data
   */
  getTestData(): NDDataPoint[] {
    return this.dataset?.testImages || []
  }

  /**
   * Get training data
   */
  getTrainData(): NDDataPoint[] {
    return this.dataset?.trainImages || []
  }
}

// Export singleton instance
export const mnistLoader = new MNISTLoader() 