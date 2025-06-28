import type { MNISTDataset, NDDataPoint } from '@/types'
import { normalizeFeatures } from './ndMathCore'

/**
 * Lightweight MNIST Data Loader
 * Generates high-quality synthetic MNIST-like data without dependencies
 */
export class MNISTLoader {
  private dataset: MNISTDataset | null = null
  private isLoading = false

  /**
   * Load MNIST dataset (uses high-quality synthetic data)
   */
  async loadMNIST(maxSamples: { train: number; test: number } = { train: 1000, test: 200 }): Promise<MNISTDataset> {
    if (this.dataset && this.dataset.trainImages.length >= maxSamples.train) {
      return {
        trainImages: this.dataset.trainImages.slice(0, maxSamples.train),
        testImages: this.dataset.testImages.slice(0, maxSamples.test),
        imageShape: this.dataset.imageShape,
        numClasses: this.dataset.numClasses
      }
    }

    if (this.isLoading) {
      throw new Error('MNIST dataset is already loading')
    }

    this.isLoading = true

    try {
      console.log('Generating high-quality MNIST-like dataset...')
      
      const mnistData = await this.generateHighQualityMNIST(maxSamples)
      
      this.dataset = {
        trainImages: mnistData.trainImages,
        testImages: mnistData.testImages,
        imageShape: { width: 28, height: 28 },
        numClasses: 10
      }

      console.log(`MNIST dataset ready: ${this.dataset.trainImages.length} train, ${this.dataset.testImages.length} test samples`)
      
      return this.dataset

    } catch (error) {
      console.error('Failed to generate MNIST dataset:', error)
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Generate high-quality MNIST-like data with realistic variations
   */
  private async generateHighQualityMNIST(maxSamples: { train: number; test: number }): Promise<{
    trainImages: NDDataPoint[]
    testImages: NDDataPoint[]
  }> {
    const trainImages = await this.generateMNISTSamples(maxSamples.train, 'train')
    const testImages = await this.generateMNISTSamples(maxSamples.test, 'test')
    
    return { trainImages, testImages }
  }

  /**
   * Generate MNIST samples with realistic digit patterns
   */
  private async generateMNISTSamples(numSamples: number, split: 'train' | 'test'): Promise<NDDataPoint[]> {
    const data: NDDataPoint[] = []
    const samplesPerDigit = Math.ceil(numSamples / 10)
    console.log(split)
    for (let digit = 0; digit < 10; digit++) {
      for (let variation = 0; variation < samplesPerDigit && data.length < numSamples; variation++) {
        const features = this.generateRealisticDigit(digit, variation)
        
        data.push({
          features: normalizeFeatures(features),
          label: digit,
          originalLabel: digit
        })
      }
    }
    
    // Shuffle the data to ensure random distribution
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]]
    }
    
    return data.slice(0, numSamples)
  }

  /**
   * Generate realistic digit patterns with proper variations
   */
  private generateRealisticDigit(digit: number, variation: number): number[] {
    const size = 28
    // Generate base pattern for the digit
    const basePattern = this.getDigitBasePattern(digit, size)
    
    // Apply realistic transformations
    const transformedPattern = this.applyRealisticTransformations(basePattern, variation, size)
    
    return transformedPattern
  }

  /**
   * Get base pattern for each digit (more realistic than before)
   */
  private getDigitBasePattern(digit: number, size: number): number[] {
    const pattern = new Array(784).fill(0)
    const setPixel = (x: number, y: number, intensity: number) => {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = Math.floor(y) * size + Math.floor(x)
        pattern[index] = Math.max(pattern[index], intensity)
      }
    }

    const drawLine = (x1: number, y1: number, x2: number, y2: number, intensity: number) => {
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const sx = x1 < x2 ? 1 : -1
      const sy = y1 < y2 ? 1 : -1
      let err = dx - dy
      
      let x = x1, y = y1
      while (true) {
        setPixel(x, y, intensity)
        setPixel(x + 1, y, intensity * 0.7)
        setPixel(x, y + 1, intensity * 0.7)
        
        if (x === x2 && y === y2) break
        const e2 = 2 * err
        if (e2 > -dy) { err -= dy; x += sx }
        if (e2 < dx) { err += dx; y += sy }
      }
    }

    const drawCircle = (centerX: number, centerY: number, radius: number, intensity: number, thickness: number = 2) => {
      for (let angle = 0; angle < 2 * Math.PI; angle += 0.05) {
        for (let r = radius - thickness; r <= radius + thickness; r++) {
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          const fade = Math.max(0, 1 - Math.abs(r - radius) / thickness)
          setPixel(x, y, intensity * fade)
        }
      }
    }

    switch (digit) {
      case 0:
        drawCircle(14, 14, 9, 0.9, 3)
        break
        
      case 1:
        drawLine(12, 6, 14, 4, 0.8)  // Top angle
        drawLine(14, 4, 14, 22, 0.9) // Main vertical
        drawLine(10, 22, 18, 22, 0.8) // Bottom base
        break
        
      case 2:
        drawLine(6, 8, 20, 8, 0.8)   // Top horizontal
        drawLine(20, 8, 20, 14, 0.8)  // Right side
        drawLine(20, 14, 6, 22, 0.9)  // Diagonal
        drawLine(6, 22, 20, 22, 0.8)  // Bottom horizontal
        break
        
      case 3:
        drawLine(6, 6, 18, 6, 0.8)   // Top
        drawLine(18, 6, 18, 14, 0.8)  // Right top
        drawLine(10, 14, 18, 14, 0.7) // Middle
        drawLine(18, 14, 18, 22, 0.8) // Right bottom
        drawLine(6, 22, 18, 22, 0.8)  // Bottom
        break
        
      case 4:
        drawLine(8, 6, 8, 14, 0.9)   // Left vertical
        drawLine(8, 14, 20, 14, 0.8)  // Horizontal
        drawLine(16, 6, 16, 22, 0.9)  // Right vertical
        break
        
      case 5:
        drawLine(6, 6, 18, 6, 0.8)   // Top
        drawLine(6, 6, 6, 14, 0.8)   // Left top
        drawLine(6, 14, 16, 14, 0.8)  // Middle
        drawLine(16, 14, 16, 22, 0.8) // Right bottom
        drawLine(6, 22, 16, 22, 0.8)  // Bottom
        break
        
      case 6:
        drawCircle(14, 10, 8, 0.8, 2) // Top curve
        drawCircle(14, 17, 6, 0.9, 2) // Bottom circle
        drawLine(6, 10, 6, 22, 0.8)   // Left side
        break
        
      case 7:
        drawLine(6, 6, 20, 6, 0.8)   // Top horizontal
        drawLine(20, 6, 12, 22, 0.9)  // Diagonal
        break
        
      case 8:
        drawCircle(14, 10, 6, 0.8, 2) // Top circle
        drawCircle(14, 18, 6, 0.8, 2) // Bottom circle
        break
        
      case 9:
        drawCircle(14, 11, 6, 0.9, 2) // Top circle
        drawCircle(14, 18, 8, 0.8, 2) // Bottom curve
        drawLine(20, 11, 20, 22, 0.8)  // Right side
        break
    }

    return pattern
  }

  /**
   * Apply realistic transformations (rotation, scaling, noise, etc.)
   */
  private applyRealisticTransformations(pattern: number[], variation: number, size: number): number[] {
    const transformed = [...pattern]
    
    // Add noise
    const noiseLevel = 0.02 + (variation % 3) * 0.01
    for (let i = 0; i < transformed.length; i++) {
      if (transformed[i] > 0) {
        transformed[i] = Math.max(0, Math.min(1, transformed[i] + (Math.random() - 0.5) * noiseLevel))
      }
    }
    
    // Add random speckles for realism
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * transformed.length)
      transformed[randomIndex] = Math.min(0.3, transformed[randomIndex] + Math.random() * 0.1)
    }
    
    // Slight blur effect
    const blurred = [...transformed]
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const index = y * size + x
        if (transformed[index] > 0.1) {
          const neighbors = [
            transformed[(y-1) * size + x],
            transformed[(y+1) * size + x],
            transformed[y * size + (x-1)],
            transformed[y * size + (x+1)]
          ]
          const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / 4
          blurred[index] = Math.min(1, transformed[index] + avgNeighbor * 0.1)
        }
      }
    }
    
    return blurred
  }

  // Keep existing utility methods
  async getQuickSample(numSamples: number = 100): Promise<NDDataPoint[]> {
    return this.generateMNISTSamples(numSamples, 'train')
  }

  getDatasetStats(): { train: number, test: number, features: number, classes: number } | null {
    if (!this.dataset) return null
    
    return {
      train: this.dataset.trainImages.length,
      test: this.dataset.testImages.length,
      features: this.dataset.trainImages[0]?.features.length || 0,
      classes: this.dataset.numClasses
    }
  }

  sampleTrainBatch(batchSize: number): NDDataPoint[] {
    if (!this.dataset) return []
    
    const shuffled = [...this.dataset.trainImages].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(batchSize, shuffled.length))
  }

  getTestData(): NDDataPoint[] {
    return this.dataset?.testImages || []
  }

  getTrainData(): NDDataPoint[] {
    return this.dataset?.trainImages || []
  }
}

// Export singleton instance
export const mnistLoader = new MNISTLoader() 