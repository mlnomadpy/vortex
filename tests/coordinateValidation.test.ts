import { describe, it, expect } from 'vitest'
import {
  createScales,
  coordinateValidator
} from '../src/utils/coordinateValidation'

describe('coordinateValidation functions', () => {
  describe('createScales', () => {
    it('should create x and y scales', () => {
      const { xScale, yScale } = createScales()
      
      expect(xScale).toBeDefined()
      expect(yScale).toBeDefined()
    })

    it('should map domain [-1, 1] to canvas range for x', () => {
      const { xScale } = createScales()
      
      expect(xScale(-1)).toBe(0)
      expect(xScale(1)).toBe(600)
      expect(xScale(0)).toBe(300)
    })

    it('should map domain [-1, 1] to inverted canvas range for y', () => {
      const { yScale } = createScales()
      
      expect(yScale(-1)).toBe(600) // Bottom
      expect(yScale(1)).toBe(0)    // Top
      expect(yScale(0)).toBe(300)  // Middle
    })

    it('should support inverse mapping for x', () => {
      const { xScale } = createScales()
      
      expect(xScale.invert(0)).toBe(-1)
      expect(xScale.invert(600)).toBe(1)
      expect(xScale.invert(300)).toBe(0)
    })

    it('should support inverse mapping for y', () => {
      const { yScale } = createScales()
      
      expect(yScale.invert(600)).toBe(-1)
      expect(yScale.invert(0)).toBe(1)
      expect(yScale.invert(300)).toBe(0)
    })
  })

  describe('coordinateValidator', () => {
    describe('isValidCanvasCoordinate', () => {
      it('should validate coordinates within canvas bounds', () => {
        expect(coordinateValidator.isValidCanvasCoordinate(0, 0)).toBe(true)
        expect(coordinateValidator.isValidCanvasCoordinate(300, 300)).toBe(true)
        expect(coordinateValidator.isValidCanvasCoordinate(600, 600)).toBe(true)
      })

      it('should reject coordinates outside canvas bounds', () => {
        expect(coordinateValidator.isValidCanvasCoordinate(-1, 0)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(0, -1)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(601, 0)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(0, 601)).toBe(false)
      })

      it('should handle edge cases', () => {
        expect(coordinateValidator.isValidCanvasCoordinate(0, 0)).toBe(true)
        expect(coordinateValidator.isValidCanvasCoordinate(600, 0)).toBe(true)
        expect(coordinateValidator.isValidCanvasCoordinate(0, 600)).toBe(true)
        expect(coordinateValidator.isValidCanvasCoordinate(600, 600)).toBe(true)
      })

      it('should reject extreme values', () => {
        expect(coordinateValidator.isValidCanvasCoordinate(-1000, 0)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(1000, 0)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(0, -1000)).toBe(false)
        expect(coordinateValidator.isValidCanvasCoordinate(0, 1000)).toBe(false)
      })
    })

    describe('isValidNormalizedCoordinate', () => {
      it('should validate coordinates within normalized domain', () => {
        expect(coordinateValidator.isValidNormalizedCoordinate(-1, -1)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, 0)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(1, 1)).toBe(true)
      })

      it('should reject coordinates outside normalized domain', () => {
        expect(coordinateValidator.isValidNormalizedCoordinate(-1.1, 0)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, -1.1)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(1.1, 0)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, 1.1)).toBe(false)
      })

      it('should handle edge cases', () => {
        expect(coordinateValidator.isValidNormalizedCoordinate(-1, -1)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(1, -1)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(-1, 1)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(1, 1)).toBe(true)
      })

      it('should reject extreme values', () => {
        expect(coordinateValidator.isValidNormalizedCoordinate(-100, 0)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(100, 0)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, -100)).toBe(false)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, 100)).toBe(false)
      })

      it('should validate coordinates near boundaries', () => {
        expect(coordinateValidator.isValidNormalizedCoordinate(-0.999, 0)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(0.999, 0)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, -0.999)).toBe(true)
        expect(coordinateValidator.isValidNormalizedCoordinate(0, 0.999)).toBe(true)
      })
    })

    describe('clampNormalizedCoordinates', () => {
      it('should return unchanged coordinates within domain', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(0, 0)
        expect(result).toEqual({ x: 0, y: 0 })
      })

      it('should clamp x coordinate to minimum', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(-2, 0)
        expect(result).toEqual({ x: -1, y: 0 })
      })

      it('should clamp x coordinate to maximum', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(2, 0)
        expect(result).toEqual({ x: 1, y: 0 })
      })

      it('should clamp y coordinate to minimum', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(0, -2)
        expect(result).toEqual({ x: 0, y: -1 })
      })

      it('should clamp y coordinate to maximum', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(0, 2)
        expect(result).toEqual({ x: 0, y: 1 })
      })

      it('should clamp both coordinates', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(-5, 5)
        expect(result).toEqual({ x: -1, y: 1 })
      })

      it('should not modify coordinates at boundaries', () => {
        expect(coordinateValidator.clampNormalizedCoordinates(-1, -1))
          .toEqual({ x: -1, y: -1 })
        expect(coordinateValidator.clampNormalizedCoordinates(1, 1))
          .toEqual({ x: 1, y: 1 })
      })

      it('should handle extreme values', () => {
        const result = coordinateValidator.clampNormalizedCoordinates(-1000, 1000)
        expect(result).toEqual({ x: -1, y: 1 })
      })
    })

    describe('testCoordinateConversion', () => {
      it('should pass coordinate conversion tests', () => {
        const result = coordinateValidator.testCoordinateConversion()
        expect(result).toBe(true)
      })
    })
  })
})
