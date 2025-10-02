import { describe, it, expect, beforeEach } from 'vitest'
import { useLoadingState } from '@/composables/useLoadingState'

describe('useLoadingState composable', () => {
  // Helper to clear all loading states between tests
  beforeEach(() => {
    // Clear all existing loading states
    const clearState = useLoadingState('test-cleanup')
    clearState.setLoading(false)
    
    // Try to clear default and common keys
    const keys = ['default', 'upload', 'download', 'task1', 'task2']
    keys.forEach(key => {
      const state = useLoadingState(key)
      state.setLoading(false)
    })
  })

  describe('basic loading state management', () => {
    it('should initialize with isLoading false', () => {
      const { isLoading } = useLoadingState()
      expect(isLoading.value).toBe(false)
    })

    it('should set loading state to true', () => {
      const { setLoading, isLoading } = useLoadingState()
      setLoading(true, 'Loading data...')
      expect(isLoading.value).toBe(true)
    })

    it('should set loading state to false', () => {
      const { setLoading, isLoading } = useLoadingState()
      setLoading(true, 'Loading...')
      expect(isLoading.value).toBe(true)
      setLoading(false)
      expect(isLoading.value).toBe(false)
    })

    it('should handle loading message', () => {
      const { setLoading, loadingMessage } = useLoadingState()
      setLoading(true, 'Processing data...')
      expect(loadingMessage.value).toBe('Processing data...')
    })

    it('should clear message when loading is set to false', () => {
      const { setLoading, loadingMessage, isLoading } = useLoadingState()
      setLoading(true, 'Loading...')
      expect(loadingMessage.value).toBe('Loading...')
      setLoading(false)
      expect(isLoading.value).toBe(false)
      expect(loadingMessage.value).toBeUndefined()
    })

    it('should handle loading progress', () => {
      const { setLoading, loadingProgress } = useLoadingState()
      setLoading(true, 'Uploading...', 50)
      expect(loadingProgress.value).toBe(50)
    })

    it('should update progress value', () => {
      const { setLoading, loadingProgress } = useLoadingState()
      setLoading(true, 'Uploading...', 25)
      expect(loadingProgress.value).toBe(25)
      setLoading(true, 'Uploading...', 75)
      expect(loadingProgress.value).toBe(75)
    })
  })

  describe('keyed loading states', () => {
    it('should manage separate loading states with different keys', () => {
      const state1 = useLoadingState('upload')
      const state2 = useLoadingState('download')
      
      state1.setLoading(true, 'Uploading...')
      state2.setLoading(false)
      
      expect(state1.isLoading.value).toBe(true)
      expect(state2.isLoading.value).toBe(false)
    })

    it('should not interfere with other keyed states', () => {
      const state1 = useLoadingState('task1')
      const state2 = useLoadingState('task2')
      
      state1.setLoading(true, 'Task 1 running')
      expect(state1.isLoading.value).toBe(true)
      expect(state2.isLoading.value).toBe(false)
      
      state2.setLoading(true, 'Task 2 running')
      expect(state1.isLoading.value).toBe(true)
      expect(state2.isLoading.value).toBe(true)
    })

    it('should track hasAnyLoading across all states', () => {
      const state1 = useLoadingState('task1')
      const state2 = useLoadingState('task2')
      
      expect(state1.hasAnyLoading.value).toBe(false)
      
      state1.setLoading(true)
      expect(state1.hasAnyLoading.value).toBe(true)
      expect(state2.hasAnyLoading.value).toBe(true)
      
      state2.setLoading(true)
      expect(state1.hasAnyLoading.value).toBe(true)
      
      state1.setLoading(false)
      expect(state1.hasAnyLoading.value).toBe(true)
      
      state2.setLoading(false)
      expect(state1.hasAnyLoading.value).toBe(false)
    })
  })

  describe('currentState', () => {
    it('should return full loading state object', () => {
      const { setLoading, currentState } = useLoadingState()
      setLoading(true, 'Processing...', 45)
      
      expect(currentState.value).toEqual({
        isLoading: true,
        message: 'Processing...',
        progress: 45
      })
    })

    it('should return default state when not loading', () => {
      const { currentState } = useLoadingState()
      expect(currentState.value).toEqual({
        isLoading: false
      })
    })
  })

  describe('default key behavior', () => {
    it('should use "default" key when no key specified', () => {
      const state1 = useLoadingState()
      const state2 = useLoadingState()
      
      state1.setLoading(true, 'Loading...')
      
      // Both should reflect the same state
      expect(state1.isLoading.value).toBe(true)
      expect(state2.isLoading.value).toBe(true)
      expect(state1.loadingMessage.value).toBe('Loading...')
      expect(state2.loadingMessage.value).toBe('Loading...')
    })
  })
})
