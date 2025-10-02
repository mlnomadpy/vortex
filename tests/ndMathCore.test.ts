import { describe, it, expect } from 'vitest'
import {
  calculateNDSimilarityScore,
  applyNDActivationFunction,
  getNDPrediction,
  computeNDCategoricalCrossEntropyLoss,
  calculateNDAccuracy,
  clamp,
  normalizeFeatures
} from '../src/utils/ndMathCore'
import type { NDNeuron, NDDataPoint, NDSimilarityMetric, ActivationFunction } from '../src/types'

describe('ndMathCore functions', () => {
  describe('calculateNDSimilarityScore', () => {
    const neuron: NDNeuron = {
      id: 0,
      weights: [1, 2, 3],
      bias: 0.5,
      color: '#000000'
    }

    describe('dotProduct metric', () => {
      it('should calculate dot product with bias', () => {
        const features = [2, 3, 4]
        const score = calculateNDSimilarityScore(neuron, features, 'dotProduct')
        // 1*2 + 2*3 + 3*4 + 0.5 = 2 + 6 + 12 + 0.5 = 20.5
        expect(score).toBe(20.5)
      })

      it('should handle zero features', () => {
        const features = [0, 0, 0]
        const score = calculateNDSimilarityScore(neuron, features, 'dotProduct')
        expect(score).toBe(0.5) // Only bias
      })

      it('should handle negative values', () => {
        const features = [-1, -2, -3]
        const score = calculateNDSimilarityScore(neuron, features, 'dotProduct')
        // 1*(-1) + 2*(-2) + 3*(-3) + 0.5 = -1 - 4 - 9 + 0.5 = -13.5
        expect(score).toBe(-13.5)
      })
    })

    describe('euclidean metric', () => {
      it('should calculate negative euclidean distance with bias', () => {
        const features = [1, 2, 3]
        const score = calculateNDSimilarityScore(neuron, features, 'euclidean')
        expect(score).toBe(0.5) // Distance is 0, only bias
      })

      it('should return negative distance for different features', () => {
        const features = [2, 3, 4]
        const score = calculateNDSimilarityScore(neuron, features, 'euclidean')
        const expectedDist = Math.sqrt((2-1)**2 + (3-2)**2 + (4-3)**2) // sqrt(3)
        expect(score).toBeCloseTo(-expectedDist + 0.5, 5)
      })
    })

    describe('cosine metric', () => {
      it('should calculate cosine similarity with bias', () => {
        const features = [1, 2, 3]
        const score = calculateNDSimilarityScore(neuron, features, 'cosine')
        // Cosine similarity should be 1 when vectors are the same
        expect(score).toBeCloseTo(1.5, 5) // 1 + 0.5 (bias)
      })

      it('should handle orthogonal vectors', () => {
        const features = [1, -0.5, 0]
        const score = calculateNDSimilarityScore(neuron, features, 'cosine')
        // Cosine of orthogonal vectors is 0
        expect(score).toBeCloseTo(0.5, 1) // Just bias
      })
    })

    describe('manhattan metric', () => {
      it('should calculate negative manhattan distance with bias', () => {
        const features = [2, 3, 4]
        const score = calculateNDSimilarityScore(neuron, features, 'manhattan')
        // |2-1| + |3-2| + |4-3| = 1 + 1 + 1 = 3
        expect(score).toBe(-3 + 0.5)
      })
    })

    describe('rbf metric', () => {
      it('should calculate RBF kernel with bias', () => {
        const features = [1, 2, 3]
        const score = calculateNDSimilarityScore(neuron, features, 'rbf')
        // RBF with distance 0 should be exp(0) = 1
        expect(score).toBeCloseTo(1.5, 5) // 1 + 0.5 (bias)
      })

      it('should decay with distance', () => {
        const features = [10, 10, 10]
        const score = calculateNDSimilarityScore(neuron, features, 'rbf')
        expect(score).toBeLessThan(1.5) // Should be less than max
        expect(score).toBeGreaterThan(0.5) // But greater than just bias
      })
    })

    describe('yatProduct metric', () => {
      it('should calculate yatProduct score', () => {
        const features = [2, 3, 4]
        const score = calculateNDSimilarityScore(neuron, features, 'yatProduct')
        expect(score).toBeGreaterThan(0)
      })
    })

    it('should throw error for dimension mismatch', () => {
      const features = [1, 2] // Only 2 features, neuron has 3 weights
      expect(() => 
        calculateNDSimilarityScore(neuron, features, 'dotProduct')
      ).toThrow('Dimension mismatch')
    })

    it('should throw error for unknown metric', () => {
      const features = [1, 2, 3]
      expect(() => 
        calculateNDSimilarityScore(neuron, features, 'unknown' as NDSimilarityMetric)
      ).toThrow('Unknown similarity metric: unknown')
    })
  })

  describe('applyNDActivationFunction', () => {
    describe('none activation', () => {
      it('should return copy of original scores', () => {
        const scores = [1, 2, 3]
        const result = applyNDActivationFunction(scores, 'none')
        expect(result).toEqual([1, 2, 3])
        expect(result).not.toBe(scores) // Should be a copy
      })

      it('should handle empty array', () => {
        const result = applyNDActivationFunction([], 'none')
        expect(result).toEqual([])
      })
    })

    describe('softmax activation', () => {
      it('should normalize to probability distribution', () => {
        const scores = [1, 2, 3]
        const result = applyNDActivationFunction(scores, 'softmax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
        expect(result.every(x => x > 0 && x < 1)).toBe(true)
      })

      it('should handle large values', () => {
        const scores = [1000, 1001, 1002]
        const result = applyNDActivationFunction(scores, 'softmax')
        
        expect(result.every(x => !isNaN(x) && isFinite(x))).toBe(true)
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })
    })

    describe('softermax activation', () => {
      it('should normalize with softer distribution', () => {
        const scores = [1, 2, 3]
        const result = applyNDActivationFunction(scores, 'softermax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })
    })

    describe('sigmoid activation', () => {
      it('should apply sigmoid to each score', () => {
        const scores = [-2, 0, 2]
        const result = applyNDActivationFunction(scores, 'sigmoid')
        
        expect(result[1]).toBeCloseTo(0.5, 5)
        expect(result.every(x => x > 0 && x < 1)).toBe(true)
      })
    })

    describe('relu activation', () => {
      it('should zero negative values', () => {
        const scores = [-1, 0, 1]
        const result = applyNDActivationFunction(scores, 'relu')
        
        expect(result).toEqual([0, 0, 1])
      })
    })

    describe('gelu activation', () => {
      it('should apply GELU transformation', () => {
        const scores = [0, 1, -1]
        const result = applyNDActivationFunction(scores, 'gelu')
        
        expect(result[0]).toBeCloseTo(0, 5)
        expect(result.every(x => isFinite(x))).toBe(true)
      })
    })

    it('should throw error for unknown activation', () => {
      expect(() => 
        applyNDActivationFunction([1, 2], 'unknown' as ActivationFunction)
      ).toThrow('Unknown activation function: unknown')
    })
  })

  describe('getNDPrediction', () => {
    const neurons: NDNeuron[] = [
      { id: 0, weights: [1, 0], bias: 0, color: '#ff0000', label: 'Class 0' },
      { id: 1, weights: [0, 1], bias: 0, color: '#00ff00', label: 'Class 1' },
      { id: 2, weights: [-1, 0], bias: 0, color: '#0000ff', label: 'Class 2' }
    ]

    it('should return prediction with winning neuron', () => {
      const features = [2, 0]
      const result = getNDPrediction(features, neurons, 'dotProduct', 'softmax')
      
      expect(result.winningNeuron).toBeDefined()
      expect(result.winningNeuron?.id).toBe(0) // Closest to [1, 0]
      expect(result.scores).toHaveLength(3)
      expect(result.probabilities).toHaveLength(3)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should handle empty neurons', () => {
      const features = [1, 1]
      const result = getNDPrediction(features, [], 'dotProduct', 'softmax')
      
      expect(result.winningNeuron).toBeNull()
      expect(result.scores).toEqual([])
      expect(result.probabilities).toEqual([])
      expect(result.confidence).toBe(0)
    })

    it('should normalize probabilities', () => {
      const features = [1, 1]
      const result = getNDPrediction(features, neurons, 'dotProduct', 'softmax')
      
      const sum = result.probabilities.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 5)
    })

    it('should select highest probability as winner', () => {
      const features = [0, 5]
      const result = getNDPrediction(features, neurons, 'dotProduct', 'softmax')
      
      expect(result.winningNeuron?.id).toBe(1) // Closest to [0, 1]
    })

    it('should work with different similarity metrics', () => {
      const features = [1, 0]
      const result = getNDPrediction(features, neurons, 'euclidean', 'softmax')
      
      expect(result.winningNeuron).toBeDefined()
    })
  })

  describe('computeNDCategoricalCrossEntropyLoss', () => {
    const neurons: NDNeuron[] = [
      { id: 0, weights: [1, 0], bias: 0, color: '#ff0000' },
      { id: 1, weights: [0, 1], bias: 0, color: '#00ff00' }
    ]

    it('should compute loss for data points', () => {
      const data: NDDataPoint[] = [
        { features: [1, 0], label: 0 },
        { features: [0, 1], label: 1 }
      ]
      
      const loss = computeNDCategoricalCrossEntropyLoss(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(loss).toBeGreaterThan(0)
      expect(loss).toBeLessThan(10) // Reasonable range
    })

    it('should return 0 for empty data', () => {
      const loss = computeNDCategoricalCrossEntropyLoss(
        [], neurons, 'dotProduct', 'softmax'
      )
      
      expect(loss).toBe(0)
    })

    it('should return 0 for empty neurons', () => {
      const data: NDDataPoint[] = [{ features: [1, 0], label: 0 }]
      const loss = computeNDCategoricalCrossEntropyLoss(
        data, [], 'dotProduct', 'softmax'
      )
      
      expect(loss).toBe(0)
    })

    it('should have lower loss for well-classified data', () => {
      const goodData: NDDataPoint[] = [
        { features: [10, 0], label: 0 }, // Very close to neuron 0
        { features: [0, 10], label: 1 }  // Very close to neuron 1
      ]
      
      const badData: NDDataPoint[] = [
        { features: [0, 10], label: 0 }, // Far from neuron 0
        { features: [10, 0], label: 1 }  // Far from neuron 1
      ]
      
      const goodLoss = computeNDCategoricalCrossEntropyLoss(
        goodData, neurons, 'dotProduct', 'softmax'
      )
      const badLoss = computeNDCategoricalCrossEntropyLoss(
        badData, neurons, 'dotProduct', 'softmax'
      )
      
      expect(goodLoss).toBeLessThan(badLoss)
    })
  })

  describe('calculateNDAccuracy', () => {
    const neurons: NDNeuron[] = [
      { id: 0, weights: [1, 0], bias: 0, color: '#ff0000' },
      { id: 1, weights: [0, 1], bias: 0, color: '#00ff00' }
    ]

    it('should calculate accuracy correctly', () => {
      const data: NDDataPoint[] = [
        { features: [2, 0], label: 0 }, // Correct
        { features: [0, 2], label: 1 }, // Correct
        { features: [2, 0], label: 1 }  // Incorrect
      ]
      
      const accuracy = calculateNDAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBeCloseTo(2/3, 5) // 2 out of 3 correct
    })

    it('should return 0 for empty data', () => {
      const accuracy = calculateNDAccuracy(
        [], neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })

    it('should return 0 for empty neurons', () => {
      const data: NDDataPoint[] = [{ features: [1, 0], label: 0 }]
      const accuracy = calculateNDAccuracy(
        data, [], 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })

    it('should return 1 for perfectly classified data', () => {
      const data: NDDataPoint[] = [
        { features: [10, 0], label: 0 },
        { features: [0, 10], label: 1 }
      ]
      
      const accuracy = calculateNDAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(1)
    })

    it('should return 0 for completely misclassified data', () => {
      const data: NDDataPoint[] = [
        { features: [10, 0], label: 1 },
        { features: [0, 10], label: 0 }
      ]
      
      const accuracy = calculateNDAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })
  })

  describe('clamp', () => {
    it('should clamp values to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp values to max', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should return value when in range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it('should work with negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5)
      expect(clamp(-15, -10, -1)).toBe(-10)
      expect(clamp(0, -10, -1)).toBe(-1)
    })

    it('should work with floating point values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5)
      expect(clamp(1.5, 0, 1)).toBe(1)
      expect(clamp(-0.5, 0, 1)).toBe(0)
    })
  })

  describe('normalizeFeatures', () => {
    it('should normalize features to [0, 1]', () => {
      const features = [1, 2, 3, 4, 5]
      const result = normalizeFeatures(features)
      
      expect(result[0]).toBe(0) // Min maps to 0
      expect(result[4]).toBe(1) // Max maps to 1
      expect(result.every(x => x >= 0 && x <= 1)).toBe(true)
    })

    it('should handle negative values', () => {
      const features = [-2, -1, 0, 1, 2]
      const result = normalizeFeatures(features)
      
      expect(result[0]).toBe(0) // -2 is min
      expect(result[4]).toBe(1) // 2 is max
    })

    it('should return zeros for constant features', () => {
      const features = [5, 5, 5, 5]
      const result = normalizeFeatures(features)
      
      expect(result.every(x => x === 0)).toBe(true)
    })

    it('should handle single element', () => {
      const features = [42]
      const result = normalizeFeatures(features)
      
      expect(result[0]).toBe(0)
    })

    it('should handle two elements', () => {
      const features = [10, 20]
      const result = normalizeFeatures(features)
      
      expect(result[0]).toBe(0)
      expect(result[1]).toBe(1)
    })

    it('should preserve relative ordering', () => {
      const features = [1, 3, 2, 5, 4]
      const result = normalizeFeatures(features)
      
      expect(result[0]).toBeLessThan(result[2])
      expect(result[2]).toBeLessThan(result[1])
      expect(result[1]).toBeLessThan(result[4])
      expect(result[4]).toBeLessThan(result[3])
    })

    it('should handle zero in range', () => {
      const features = [-5, 0, 5]
      const result = normalizeFeatures(features)
      
      expect(result[1]).toBe(0.5)
    })
  })
})
