import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useErrorHandler } from '@/composables/useErrorHandler'

// Mock the notification store
vi.mock('@/stores/notification', () => ({
  useNotificationStore: vi.fn(() => ({
    addNotification: vi.fn()
  }))
}))

describe('useErrorHandler composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear errors from previous tests by getting a fresh instance
    const { clearAllErrors } = useErrorHandler()
    clearAllErrors()
  })

  describe('error handling', () => {
    it('should handle string errors', () => {
      const { handleError, errors } = useErrorHandler()
      const error = handleError('Test error message')
      
      expect(error).toBeDefined()
      expect(error.message).toBe('Test error message')
      expect(error.id).toBeDefined()
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(errors.value).toHaveLength(1)
    })

    it('should handle Error objects', () => {
      const { handleError, errors } = useErrorHandler()
      const testError = new Error('Test Error object')
      const error = handleError(testError)
      
      expect(error.message).toBe('Test Error object')
      expect(errors.value).toHaveLength(1)
    })

    it('should add context to errors', () => {
      const { handleError } = useErrorHandler()
      const context = { userId: 123, action: 'upload' }
      const error = handleError('Upload failed', context)
      
      expect(error.context).toEqual(context)
    })

    it('should use custom user message when provided', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('Technical error', {}, 'Something went wrong!')
      
      expect(error.userMessage).toBe('Something went wrong!')
    })

    it('should generate unique IDs for errors', () => {
      const { handleError } = useErrorHandler()
      const error1 = handleError('Error 1')
      const error2 = handleError('Error 2')
      
      expect(error1.id).not.toBe(error2.id)
    })
  })

  describe('error code classification', () => {
    it('should classify network errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('Failed to fetch data from server')
      
      expect(error.code).toBe('NETWORK_ERROR')
    })

    it('should classify file parse errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('CSV parse error')
      
      expect(error.code).toBe('FILE_PARSE_ERROR')
    })

    it('should classify MathJax errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('MathJax rendering failed')
      
      expect(error.code).toBe('MATHJAX_ERROR')
    })

    it('should classify optimization errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('optimization calculation failed')
      
      expect(error.code).toBe('OPTIMIZATION_ERROR')
    })

    it('should use UNKNOWN_ERROR for unclassified errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('Random error message')
      
      expect(error.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('error recoverability', () => {
    it('should mark network errors as recoverable', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('Failed to fetch data')
      
      expect(error.recoverable).toBe(true)
    })

    it('should mark file parse errors as recoverable', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('CSV parsing failed')
      
      expect(error.recoverable).toBe(true)
    })

    it('should mark optimization errors as recoverable', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('optimization failed')
      
      expect(error.recoverable).toBe(true)
    })

    it('should mark unknown errors as non-recoverable', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('Unknown error')
      
      expect(error.recoverable).toBe(false)
    })

    it('should mark MathJax errors as non-recoverable', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('MathJax failed')
      
      expect(error.recoverable).toBe(false)
    })
  })

  describe('user-friendly messages', () => {
    it('should provide friendly message for network errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('fetch failed')
      
      expect(error.userMessage).toContain('Unable to connect')
    })

    it('should provide friendly message for file parse errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('CSV parse error')
      
      expect(error.userMessage).toContain('Unable to read the file')
    })

    it('should provide friendly message for MathJax errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('MathJax rendering failed')
      
      expect(error.userMessage).toContain('Mathematical formulas failed to load')
    })

    it('should provide friendly message for optimization errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('optimization failed')
      
      expect(error.userMessage).toContain('error occurred during optimization')
    })

    it('should provide generic friendly message for unknown errors', () => {
      const { handleError } = useErrorHandler()
      const error = handleError('random error')
      
      expect(error.userMessage).toContain('unexpected error occurred')
    })
  })

  describe('error management', () => {
    it('should store multiple errors', () => {
      const { handleError, errors } = useErrorHandler()
      
      handleError('Error 1')
      handleError('Error 2')
      handleError('Error 3')
      
      expect(errors.value).toHaveLength(3)
    })

    it('should clear specific error by ID', () => {
      const { handleError, errors, clearError } = useErrorHandler()
      
      const error1 = handleError('Error 1')
      handleError('Error 2')
      
      expect(errors.value).toHaveLength(2)
      
      clearError(error1.id)
      
      expect(errors.value).toHaveLength(1)
      expect(errors.value[0].message).toBe('Error 2')
    })

    it('should clear all errors', () => {
      const { handleError, errors, clearAllErrors } = useErrorHandler()
      
      handleError('Error 1')
      handleError('Error 2')
      handleError('Error 3')
      
      expect(errors.value).toHaveLength(3)
      
      clearAllErrors()
      
      expect(errors.value).toHaveLength(0)
    })

    it('should handle clearing non-existent error gracefully', () => {
      const { handleError, errors, clearError } = useErrorHandler()
      
      handleError('Error 1')
      const initialLength = errors.value.length
      
      clearError('non-existent-id')
      
      expect(errors.value).toHaveLength(initialLength)
    })
  })

  describe('error timestamps', () => {
    it('should add timestamp to errors', () => {
      const { handleError } = useErrorHandler()
      const beforeTime = new Date()
      const error = handleError('Test error')
      const afterTime = new Date()
      
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })
})
