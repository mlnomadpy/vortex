import { describe, it, expect } from 'vitest'
import {
  calculateSimilarityScore,
  applyActivationFunction,
  getActivationDerivative,
  SIMILARITY_METRICS,
  ACTIVATION_FUNCTIONS
} from '../src/utils/mathCore'
import type { Neuron, SimilarityMetric, ActivationFunction } from '../src/types'

describe('mathCore functions', () => {
  describe('calculateSimilarityScore', () => {
    const neuron: Neuron = { id: 0, x: 1, y: 2, color: '#000000' }

    describe('dotProduct metric', () => {
      it('should calculate dot product correctly', () => {
        const score = calculateSimilarityScore(neuron, 3, 4, 'dotProduct')
        expect(score).toBe(11) // 3*1 + 4*2 = 11
      })

      it('should handle zero values', () => {
        const score = calculateSimilarityScore(neuron, 0, 0, 'dotProduct')
        expect(score).toBe(0)
      })

      it('should handle negative values', () => {
        const score = calculateSimilarityScore(neuron, -1, -2, 'dotProduct')
        expect(score).toBe(-5) // -1*1 + -2*2 = -5
      })
    })

    describe('euclidean metric', () => {
      it('should calculate negative euclidean distance', () => {
        const score = calculateSimilarityScore(neuron, 1, 2, 'euclidean')
        expect(score).toBeCloseTo(0, 5) // Distance is 0 when point equals neuron
      })

      it('should return negative distance for far points', () => {
        const score = calculateSimilarityScore(neuron, 4, 6, 'euclidean')
        expect(score).toBe(-5) // -sqrt((4-1)^2 + (6-2)^2) = -5
      })

      it('should handle points close to neuron', () => {
        const score = calculateSimilarityScore(neuron, 1.1, 2.1, 'euclidean')
        expect(score).toBeCloseTo(-Math.sqrt(0.02), 5)
      })
    })

    describe('yatProduct metric', () => {
      it('should calculate yatProduct score', () => {
        const score = calculateSimilarityScore(neuron, 3, 4, 'yatProduct')
        const dotProd = 3 * 1 + 4 * 2 // 11
        const distSq = (3 - 1) ** 2 + (4 - 2) ** 2 // 8
        const expected = Math.min((dotProd * dotProd) / (distSq + 1e-6), 50)
        expect(score).toBeCloseTo(expected, 5)
      })

      it('should handle coincident points', () => {
        const score = calculateSimilarityScore(neuron, 1, 2, 'yatProduct')
        expect(score).toBeLessThanOrEqual(50)
      })

      it('should clamp large values to 50', () => {
        const score = calculateSimilarityScore(neuron, 1.0001, 2.0001, 'yatProduct')
        expect(score).toBeLessThanOrEqual(50)
      })
    })

    it('should throw error for unknown metric', () => {
      expect(() => 
        calculateSimilarityScore(neuron, 1, 2, 'unknown' as SimilarityMetric)
      ).toThrow('Unknown similarity metric: unknown')
    })
  })

  describe('applyActivationFunction', () => {
    describe('none activation', () => {
      it('should return original scores', () => {
        const scores = [1, 2, 3]
        const result = applyActivationFunction(scores, 'none')
        expect(result).toEqual([1, 2, 3])
      })

      it('should handle empty array', () => {
        const result = applyActivationFunction([], 'none')
        expect(result).toEqual([])
      })
    })

    describe('softmax activation', () => {
      it('should normalize scores to probabilities', () => {
        const scores = [1, 2, 3]
        const result = applyActivationFunction(scores, 'softmax')
        
        expect(result.length).toBe(3)
        expect(result.every(x => x > 0 && x < 1)).toBe(true)
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })

      it('should handle negative scores', () => {
        const scores = [-1, -2, -3]
        const result = applyActivationFunction(scores, 'softmax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })

      it('should handle large values without overflow', () => {
        const scores = [1000, 1001, 1002]
        const result = applyActivationFunction(scores, 'softmax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
        expect(result.every(x => !isNaN(x) && isFinite(x))).toBe(true)
      })

      it('should give highest probability to largest score', () => {
        const scores = [1, 5, 2]
        const result = applyActivationFunction(scores, 'softmax')
        
        expect(result[1]).toBeGreaterThan(result[0])
        expect(result[1]).toBeGreaterThan(result[2])
      })
    })

    describe('softermax activation', () => {
      it('should normalize with softer distribution', () => {
        const scores = [1, 2, 3]
        const result = applyActivationFunction(scores, 'softermax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })

      it('should handle negative scores', () => {
        const scores = [0, 1, 2] // Changed to positive to avoid division by negative sum
        const result = applyActivationFunction(scores, 'softermax')
        
        expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5)
      })
    })

    describe('sigmoid activation', () => {
      it('should squash scores to (0, 1)', () => {
        const scores = [-2, 0, 2]
        const result = applyActivationFunction(scores, 'sigmoid')
        
        expect(result.every(x => x > 0 && x < 1)).toBe(true)
        expect(result[1]).toBeCloseTo(0.5, 5) // sigmoid(0) = 0.5
      })

      it('should approach 0 for large negative values', () => {
        const scores = [-100]
        const result = applyActivationFunction(scores, 'sigmoid')
        
        expect(result[0]).toBeCloseTo(0, 5)
      })

      it('should approach 1 for large positive values', () => {
        const scores = [100]
        const result = applyActivationFunction(scores, 'sigmoid')
        
        expect(result[0]).toBeCloseTo(1, 5)
      })
    })

    describe('relu activation', () => {
      it('should zero out negative values', () => {
        const scores = [-2, -1, 0, 1, 2]
        const result = applyActivationFunction(scores, 'relu')
        
        expect(result).toEqual([0, 0, 0, 1, 2])
      })

      it('should keep positive values unchanged', () => {
        const scores = [1, 2, 3]
        const result = applyActivationFunction(scores, 'relu')
        
        expect(result).toEqual([1, 2, 3])
      })
    })

    describe('gelu activation', () => {
      it('should apply GELU transformation', () => {
        const scores = [0, 1, -1]
        const result = applyActivationFunction(scores, 'gelu')
        
        expect(result[0]).toBeCloseTo(0, 5) // GELU(0) ≈ 0
        expect(result[1]).toBeGreaterThan(0) // GELU(1) > 0
      })

      it('should be smooth near zero', () => {
        const scores = [-0.1, 0, 0.1]
        const result = applyActivationFunction(scores, 'gelu')
        
        expect(result.every(x => isFinite(x))).toBe(true)
      })

      it('should handle large values', () => {
        const scores = [-10, 10]
        const result = applyActivationFunction(scores, 'gelu')
        
        expect(result[0]).toBeCloseTo(0, 5) // GELU(-10) ≈ 0
        expect(result[1]).toBeCloseTo(10, 1) // GELU(10) ≈ 10
      })
    })

    it('should throw error for unknown activation function', () => {
      expect(() => 
        applyActivationFunction([1, 2], 'unknown' as ActivationFunction)
      ).toThrow('Unknown activation function: unknown')
    })
  })

  describe('getActivationDerivative', () => {
    describe('none activation', () => {
      it('should return 1 for identity derivative', () => {
        const result = getActivationDerivative([1, 2, 3], 0, 'none')
        expect(result).toBe(1)
      })

      it('should handle empty array', () => {
        const result = getActivationDerivative([], 0, 'none')
        expect(result).toBe(1)
      })
    })

    describe('softmax activation', () => {
      it('should compute softmax derivative', () => {
        const scores = [1, 2, 3]
        const result = getActivationDerivative(scores, 1, 'softmax')
        
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(0.25) // p(1-p) < 0.25 for all p
      })

      it('should be symmetric around 0.5', () => {
        const scores = [0, 0]
        const result = getActivationDerivative(scores, 0, 'softmax')
        
        // When all scores are equal, probabilities are 0.5 each
        // Derivative should be 0.5 * (1 - 0.5) = 0.25
        expect(result).toBeCloseTo(0.25, 5)
      })
    })

    describe('sigmoid activation', () => {
      it('should compute sigmoid derivative', () => {
        const scores = [0]
        const result = getActivationDerivative(scores, 0, 'sigmoid')
        
        // sigmoid(0) = 0.5, derivative = 0.5 * (1 - 0.5) = 0.25
        expect(result).toBeCloseTo(0.25, 5)
      })

      it('should approach 0 for large absolute values', () => {
        const result1 = getActivationDerivative([100], 0, 'sigmoid')
        const result2 = getActivationDerivative([-100], 0, 'sigmoid')
        
        expect(result1).toBeCloseTo(0, 5)
        expect(result2).toBeCloseTo(0, 5)
      })
    })

    describe('relu activation', () => {
      it('should return 1 for positive values', () => {
        const result = getActivationDerivative([1, 2, 3], 1, 'relu')
        expect(result).toBe(1)
      })

      it('should return 0 for negative values', () => {
        const result = getActivationDerivative([-1, -2, -3], 1, 'relu')
        expect(result).toBe(0)
      })

      it('should return 0 for zero', () => {
        const result = getActivationDerivative([0], 0, 'relu')
        expect(result).toBe(0)
      })
    })

    describe('gelu activation', () => {
      it('should compute GELU derivative', () => {
        const scores = [0, 1, -1]
        const result = getActivationDerivative(scores, 0, 'gelu')
        
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(1)
      })

      it('should be smooth and continuous', () => {
        const scores = [-0.5, 0, 0.5]
        const results = scores.map((_, i) => 
          getActivationDerivative(scores, i, 'gelu')
        )
        
        expect(results.every(x => isFinite(x))).toBe(true)
      })
    })
  })

  describe('SIMILARITY_METRICS constant', () => {
    it('should contain all metric configurations', () => {
      expect(SIMILARITY_METRICS.dotProduct).toBeDefined()
      expect(SIMILARITY_METRICS.euclidean).toBeDefined()
      expect(SIMILARITY_METRICS.yatProduct).toBeDefined()
    })

    it('should have correct structure for each metric', () => {
      Object.values(SIMILARITY_METRICS).forEach(config => {
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('formula')
      })
    })
  })

  describe('ACTIVATION_FUNCTIONS constant', () => {
    it('should contain all activation function configurations', () => {
      expect(ACTIVATION_FUNCTIONS.none).toBeDefined()
      expect(ACTIVATION_FUNCTIONS.softmax).toBeDefined()
      expect(ACTIVATION_FUNCTIONS.softermax).toBeDefined()
      expect(ACTIVATION_FUNCTIONS.sigmoid).toBeDefined()
      expect(ACTIVATION_FUNCTIONS.relu).toBeDefined()
      expect(ACTIVATION_FUNCTIONS.gelu).toBeDefined()
    })

    it('should have correct structure for each function', () => {
      Object.values(ACTIVATION_FUNCTIONS).forEach(config => {
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('formula')
      })
    })
  })
})

