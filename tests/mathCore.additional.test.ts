import { describe, it, expect } from 'vitest'
import {
  getPrediction,
  computeCategoricalCrossEntropyLoss,
  clamp,
  calculateAccuracy
} from '../src/utils/mathCore'
import type { Neuron, DataPoint } from '../src/types'

describe('mathCore additional functions', () => {
  describe('getPrediction', () => {
    const neurons: Neuron[] = [
      { id: 0, x: 1, y: 0, color: '#ff0000' },
      { id: 1, x: 0, y: 1, color: '#00ff00' },
      { id: 2, x: -1, y: 0, color: '#0000ff' }
    ]

    it('should return prediction with winning neuron', () => {
      const result = getPrediction(0.9, 0, neurons, 'dotProduct', 'softmax')
      
      expect(result.winningNeuron).toBeDefined()
      expect(result.winningNeuron?.id).toBe(0) // Closest to (1, 0)
      expect(result.scores).toHaveLength(3)
      expect(result.probabilities).toHaveLength(3)
    })

    it('should normalize probabilities to sum to 1', () => {
      const result = getPrediction(0.5, 0.5, neurons, 'dotProduct', 'softmax')
      
      const sum = result.probabilities.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 5)
    })

    it('should handle empty neurons array', () => {
      const result = getPrediction(1, 1, [], 'dotProduct', 'softmax')
      
      expect(result.winningNeuron).toBeNull()
      expect(result.scores).toEqual([])
      expect(result.probabilities).toEqual([])
    })

    it('should select neuron with highest probability', () => {
      const result = getPrediction(0, 0.9, neurons, 'dotProduct', 'softmax')
      
      expect(result.winningNeuron?.id).toBe(1) // Closest to (0, 1)
    })

    it('should work with different similarity metrics', () => {
      const result1 = getPrediction(1, 0, neurons, 'dotProduct', 'softmax')
      const result2 = getPrediction(1, 0, neurons, 'euclidean', 'softmax')
      
      expect(result1.winningNeuron).toBeDefined()
      expect(result2.winningNeuron).toBeDefined()
    })

    it('should work with different activation functions', () => {
      const result1 = getPrediction(1, 0, neurons, 'dotProduct', 'softmax')
      const result2 = getPrediction(1, 0, neurons, 'dotProduct', 'sigmoid')
      
      expect(result1.winningNeuron).toBeDefined()
      expect(result2.winningNeuron).toBeDefined()
    })
  })

  describe('computeCategoricalCrossEntropyLoss', () => {
    const neurons: Neuron[] = [
      { id: 0, x: 1, y: 0, color: '#ff0000' },
      { id: 1, x: 0, y: 1, color: '#00ff00' }
    ]

    it('should compute loss for data points', () => {
      const data: DataPoint[] = [
        { x: 1, y: 0, label: 0 },
        { x: 0, y: 1, label: 1 }
      ]
      
      const loss = computeCategoricalCrossEntropyLoss(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(loss).toBeGreaterThan(0)
      expect(loss).toBeLessThan(10)
    })

    it('should return 0 for empty data', () => {
      const loss = computeCategoricalCrossEntropyLoss(
        [], neurons, 'dotProduct', 'softmax'
      )
      
      expect(loss).toBe(0)
    })

    it('should return 0 for empty neurons', () => {
      const data: DataPoint[] = [{ x: 1, y: 0, label: 0 }]
      const loss = computeCategoricalCrossEntropyLoss(
        data, [], 'dotProduct', 'softmax'
      )
      
      expect(loss).toBe(0)
    })

    it('should have lower loss for well-classified data', () => {
      const goodData: DataPoint[] = [
        { x: 1, y: 0, label: 0 },
        { x: 0, y: 1, label: 1 }
      ]
      
      const badData: DataPoint[] = [
        { x: 0, y: 1, label: 0 },
        { x: 1, y: 0, label: 1 }
      ]
      
      const goodLoss = computeCategoricalCrossEntropyLoss(
        goodData, neurons, 'dotProduct', 'softmax'
      )
      const badLoss = computeCategoricalCrossEntropyLoss(
        badData, neurons, 'dotProduct', 'softmax'
      )
      
      expect(goodLoss).toBeLessThan(badLoss)
    })

    it('should handle none activation function', () => {
      const data: DataPoint[] = [{ x: 1, y: 0, label: 0 }]
      const loss = computeCategoricalCrossEntropyLoss(
        data, neurons, 'dotProduct', 'none'
      )
      
      expect(loss).toBeGreaterThan(0)
      expect(isFinite(loss)).toBe(true)
    })

    it('should add penalty for missing class labels', () => {
      const data: DataPoint[] = [
        { x: 1, y: 0, label: 5 } // No neuron with id 5
      ]
      
      const loss = computeCategoricalCrossEntropyLoss(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(loss).toBeGreaterThan(0)
    })
  })

  describe('clamp', () => {
    it('should clamp value to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('should clamp value to maximum', () => {
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

    it('should handle very large values', () => {
      expect(clamp(1e100, 0, 100)).toBe(100)
      expect(clamp(-1e100, 0, 100)).toBe(0)
    })

    it('should handle very small ranges', () => {
      expect(clamp(0.5, 0.4, 0.6)).toBe(0.5)
      expect(clamp(0.3, 0.4, 0.6)).toBe(0.4)
      expect(clamp(0.7, 0.4, 0.6)).toBe(0.6)
    })
  })

  describe('calculateAccuracy', () => {
    const neurons: Neuron[] = [
      { id: 0, x: 1, y: 0, color: '#ff0000' },
      { id: 1, x: 0, y: 1, color: '#00ff00' }
    ]

    it('should calculate accuracy correctly', () => {
      const data: DataPoint[] = [
        { x: 0.9, y: 0, label: 0 }, // Correct
        { x: 0, y: 0.9, label: 1 }, // Correct
        { x: 0.9, y: 0, label: 1 }  // Incorrect
      ]
      
      const accuracy = calculateAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBeCloseTo(2/3, 5)
    })

    it('should return 0 for empty data', () => {
      const accuracy = calculateAccuracy(
        [], neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })

    it('should return 0 for empty neurons', () => {
      const data: DataPoint[] = [{ x: 1, y: 0, label: 0 }]
      const accuracy = calculateAccuracy(
        data, [], 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })

    it('should return 1 for perfectly classified data', () => {
      const data: DataPoint[] = [
        { x: 1, y: 0, label: 0 },
        { x: 0, y: 1, label: 1 }
      ]
      
      const accuracy = calculateAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(1)
    })

    it('should return 0 for completely misclassified data', () => {
      const data: DataPoint[] = [
        { x: 1, y: 0, label: 1 },
        { x: 0, y: 1, label: 0 }
      ]
      
      const accuracy = calculateAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(0)
    })

    it('should work with different similarity metrics', () => {
      const data: DataPoint[] = [
        { x: 1, y: 0, label: 0 },
        { x: 0, y: 1, label: 1 }
      ]
      
      const accuracy1 = calculateAccuracy(data, neurons, 'dotProduct', 'softmax')
      const accuracy2 = calculateAccuracy(data, neurons, 'euclidean', 'softmax')
      
      expect(accuracy1).toBeGreaterThan(0)
      expect(accuracy2).toBeGreaterThan(0)
    })

    it('should handle single data point', () => {
      const data: DataPoint[] = [{ x: 1, y: 0, label: 0 }]
      const accuracy = calculateAccuracy(
        data, neurons, 'dotProduct', 'softmax'
      )
      
      expect(accuracy).toBe(1)
    })
  })
})
