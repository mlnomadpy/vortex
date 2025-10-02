import { describe, it, expect } from 'vitest'
import {
  hslToHex,
  getClassColor,
  getNeuronColor,
  isHslColor,
  ensureHexColor
} from '../src/utils/colors'

describe('colors utility functions', () => {
  describe('hslToHex', () => {
    it('should convert HSL to hex correctly', () => {
      const result = hslToHex('hsl(0, 100%, 50%)')
      expect(result).toBe('#ff0000') // Red
    })

    it('should convert HSL with different values', () => {
      const result = hslToHex('hsl(120, 100%, 50%)')
      expect(result).toBe('#00ff00') // Green
    })

    it('should convert HSL with lower saturation', () => {
      const result = hslToHex('hsl(240, 100%, 50%)')
      expect(result).toBe('#0000ff') // Blue
    })

    it('should handle decimal values', () => {
      const result = hslToHex('hsl(180.5, 50.5%, 50.5%)')
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should return fallback for invalid HSL format', () => {
      const result = hslToHex('invalid')
      expect(result).toBe('#000000')
    })

    it('should handle grayscale colors', () => {
      const result = hslToHex('hsl(0, 0%, 50%)')
      expect(result).toBe('#808080') // Gray
    })
  })

  describe('getClassColor', () => {
    it('should generate different colors for different classes', () => {
      const color0 = getClassColor(0)
      const color1 = getClassColor(1)
      expect(color0).not.toBe(color1)
    })

    it('should return hex color format', () => {
      const result = getClassColor(5)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should handle different saturation values', () => {
      const result1 = getClassColor(0, 50, 60)
      const result2 = getClassColor(0, 80, 60)
      expect(result1).not.toBe(result2)
    })

    it('should handle different lightness values', () => {
      const result1 = getClassColor(0, 70, 40)
      const result2 = getClassColor(0, 70, 80)
      expect(result1).not.toBe(result2)
    })

    it('should cycle colors after 10 classes', () => {
      const color0 = getClassColor(0)
      const color10 = getClassColor(10)
      expect(color0).toBe(color10)
    })
  })

  describe('getNeuronColor', () => {
    it('should generate colors for neurons', () => {
      const result = getNeuronColor(0)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    it('should match getClassColor output', () => {
      const neuronColor = getNeuronColor(5, 70, 60)
      const classColor = getClassColor(5, 70, 60)
      expect(neuronColor).toBe(classColor)
    })

    it('should use default saturation and lightness', () => {
      const result = getNeuronColor(3)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  describe('isHslColor', () => {
    it('should identify valid HSL colors', () => {
      expect(isHslColor('hsl(120, 70%, 60%)')).toBe(true)
      expect(isHslColor('hsl(0, 0%, 0%)')).toBe(true)
      expect(isHslColor('hsl(359, 100%, 100%)')).toBe(true)
    })

    it('should identify invalid HSL colors', () => {
      expect(isHslColor('#ff0000')).toBe(false)
      expect(isHslColor('rgb(255, 0, 0)')).toBe(false)
      expect(isHslColor('red')).toBe(false)
      expect(isHslColor('')).toBe(false)
    })

    it('should handle HSL with decimals', () => {
      expect(isHslColor('hsl(120.5, 70.5%, 60.5%)')).toBe(true)
    })

    it('should reject malformed HSL strings', () => {
      expect(isHslColor('hsl(120, 70, 60)')).toBe(false) // Missing %
      expect(isHslColor('hsl(120 70% 60%)')).toBe(false) // Missing commas
    })
  })

  describe('ensureHexColor', () => {
    it('should convert HSL to hex', () => {
      const result = ensureHexColor('hsl(0, 100%, 50%)')
      expect(result).toBe('#ff0000')
    })

    it('should pass through hex colors unchanged', () => {
      const hex = '#ff5500'
      const result = ensureHexColor(hex)
      expect(result).toBe(hex)
    })

    it('should pass through RGB colors unchanged', () => {
      const rgb = 'rgb(255, 0, 0)'
      const result = ensureHexColor(rgb)
      expect(result).toBe(rgb)
    })

    it('should pass through named colors unchanged', () => {
      const named = 'red'
      const result = ensureHexColor(named)
      expect(result).toBe(named)
    })
  })
})
