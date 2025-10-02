import { describe, it, expect, vi } from 'vitest'
import {
  generateUniqueId,
  delay,
  debounce,
  throttle,
  isDefined,
  isEmpty,
  deepClone,
  formatNumber,
  truncate,
  capitalize,
  toKebabCase,
  parseQueryString,
  getNestedValue
} from '@/utils/helpers'

describe('helpers utility functions', () => {
  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId()
      const id2 = generateUniqueId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await delay(100)
      const elapsed = Date.now() - start
      
      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow some variance
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(fn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledTimes(1)
      
      vi.restoreAllMocks()
    })

    it('should pass arguments to debounced function', async () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn('test', 123)
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledWith('test', 123)
      
      vi.restoreAllMocks()
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers()
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(fn).toHaveBeenCalledTimes(1)
      
      vi.advanceTimersByTime(100)
      
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
      
      vi.restoreAllMocks()
    })
  })

  describe('isDefined', () => {
    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false)
      expect(isDefined(undefined)).toBe(false)
    })

    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true)
      expect(isDefined('')).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined([])).toBe(true)
      expect(isDefined({})).toBe(true)
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty values', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty('')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty values', () => {
      expect(isEmpty(0)).toBe(false)
      expect(isEmpty('test')).toBe(false)
      expect(isEmpty([1])).toBe(false)
      expect(isEmpty({ a: 1 })).toBe(false)
      expect(isEmpty(false)).toBe(false)
    })
  })

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('test')).toBe('test')
      expect(deepClone(true)).toBe(true)
      expect(deepClone(null)).toBe(null)
    })

    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = deepClone(original)
      
      cloned.b.c = 3
      
      expect(original.b.c).toBe(2)
      expect(cloned.b.c).toBe(3)
    })

    it('should deep clone arrays', () => {
      const original = [1, [2, 3]]
      const cloned = deepClone(original)
      
      cloned[1][0] = 99
      
      expect(original[1][0]).toBe(2)
      expect(cloned[1][0]).toBe(99)
    })

    it('should clone Date objects', () => {
      const original = new Date('2024-01-01')
      const cloned = deepClone(original)
      
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(1000)).toBe('1,000')
    })

    it('should format with decimal places', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57')
      expect(formatNumber(1234, 2)).toBe('1,234.00')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
      expect(truncate('Test', 10)).toBe('Test')
    })

    it('should handle strings exactly at max length', () => {
      expect(truncate('12345678', 8)).toBe('12345678')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('hello world')).toBe('Hello world')
    })

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('')
    })

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello')
    })
  })

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('camelCase')).toBe('camel-case')
      expect(toKebabCase('myVariableName')).toBe('my-variable-name')
    })

    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('PascalCase')).toBe('pascal-case')
      expect(toKebabCase('MyComponentName')).toBe('my-component-name')
    })

    it('should handle already kebab-case strings', () => {
      expect(toKebabCase('kebab-case')).toBe('kebab-case')
    })
  })

  describe('parseQueryString', () => {
    it('should parse query strings', () => {
      expect(parseQueryString('?foo=bar&baz=qux')).toEqual({
        foo: 'bar',
        baz: 'qux'
      })
    })

    it('should handle query strings without leading ?', () => {
      expect(parseQueryString('foo=bar&baz=qux')).toEqual({
        foo: 'bar',
        baz: 'qux'
      })
    })

    it('should handle empty query strings', () => {
      expect(parseQueryString('')).toEqual({})
      expect(parseQueryString('?')).toEqual({})
    })

    it('should decode URL-encoded values', () => {
      expect(parseQueryString('name=John%20Doe')).toEqual({
        name: 'John Doe'
      })
    })

    it('should handle parameters without values', () => {
      expect(parseQueryString('foo=&bar')).toEqual({
        foo: '',
        bar: ''
      })
    })
  })

  describe('getNestedValue', () => {
    const obj = {
      a: {
        b: {
          c: 42
        }
      },
      x: [1, 2, 3]
    }

    it('should get nested values', () => {
      expect(getNestedValue(obj, 'a.b.c')).toBe(42)
    })

    it('should return default value for non-existent paths', () => {
      expect(getNestedValue(obj, 'a.b.d', 'default')).toBe('default')
      expect(getNestedValue(obj, 'x.y.z', null)).toBe(null)
    })

    it('should handle null/undefined in path', () => {
      expect(getNestedValue(obj, 'a.x.y', 'fallback')).toBe('fallback')
    })

    it('should handle top-level properties', () => {
      expect(getNestedValue(obj, 'a')).toEqual({ b: { c: 42 } })
    })
  })
})
