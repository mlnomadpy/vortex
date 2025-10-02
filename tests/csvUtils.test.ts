import { describe, it, expect } from 'vitest'
import { validateDataPoint } from '../src/utils/csvUtils'
import type { CSVRow } from '../src/types'

describe('csvUtils functions', () => {
  describe('validateDataPoint', () => {
    it('should validate valid data points', () => {
      const row: CSVRow = { x: '1.5', y: '2.5', label: '0' }
      const result = validateDataPoint(row, 0)
      
      expect(result).toEqual({
        x: 1.5,
        y: 2.5,
        label: 0
      })
    })

    it('should handle numeric values', () => {
      const row: CSVRow = { x: 10, y: 20, label: 1 }
      const result = validateDataPoint(row, 0)
      
      expect(result).toEqual({
        x: 10,
        y: 20,
        label: 1
      })
    })

    it('should handle negative values', () => {
      const row: CSVRow = { x: '-5.5', y: '-3.2', label: '2' }
      const result = validateDataPoint(row, 0)
      
      expect(result).toEqual({
        x: -5.5,
        y: -3.2,
        label: 2
      })
    })

    it('should handle zero values', () => {
      const row: CSVRow = { x: '0', y: '0', label: '0' }
      const result = validateDataPoint(row, 0)
      
      expect(result).toEqual({
        x: 0,
        y: 0,
        label: 0
      })
    })

    it('should throw error for invalid x value', () => {
      const row: CSVRow = { x: 'invalid', y: '2.5', label: '0' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should throw error for invalid y value', () => {
      const row: CSVRow = { x: '1.5', y: 'invalid', label: '0' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should throw error for invalid label value', () => {
      const row: CSVRow = { x: '1.5', y: '2.5', label: 'invalid' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should throw error for missing x value', () => {
      const row: CSVRow = { y: '2.5', label: '0' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should throw error for missing y value', () => {
      const row: CSVRow = { x: '1.5', label: '0' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should throw error for missing label value', () => {
      const row: CSVRow = { x: '1.5', y: '2.5' }
      
      expect(() => validateDataPoint(row, 0)).toThrow(
        'Invalid data format at row 1. Expected format: x,y,label'
      )
    })

    it('should include correct row number in error message', () => {
      const row: CSVRow = { x: 'invalid', y: '2.5', label: '0' }
      
      expect(() => validateDataPoint(row, 5)).toThrow(
        'Invalid data format at row 6. Expected format: x,y,label'
      )
    })
  })
})
