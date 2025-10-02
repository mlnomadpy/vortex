import { ref, computed } from 'vue'

/**
 * Represents the state of a loading operation
 */
export interface LoadingState {
  /** Whether the operation is currently loading */
  isLoading: boolean
  /** Optional message describing what's loading */
  message?: string
  /** Optional progress percentage (0-100) */
  progress?: number
}

const globalLoadingStates = ref<Map<string, LoadingState>>(new Map())

/**
 * Composable for managing loading states
 * 
 * Features:
 * - Independent loading states per key
 * - Progress tracking
 * - Loading messages
 * - Global loading detection
 * 
 * @param key - Optional unique identifier for this loading state (default: 'default')
 * 
 * @example
 * ```ts
 * const { setLoading, isLoading, loadingProgress } = useLoadingState('fileUpload')
 * 
 * setLoading(true, 'Uploading file...', 0)
 * // ... do upload work
 * setLoading(true, 'Uploading file...', 50)
 * // ... finish
 * setLoading(false)
 * ```
 */
export function useLoadingState(key?: string) {
  const loadingKey = key || 'default'
  
  /**
   * Set the loading state
   * 
   * @param isLoading - Whether loading is active
   * @param message - Optional loading message
   * @param progress - Optional progress percentage (0-100)
   */
  const setLoading = (isLoading: boolean, message?: string, progress?: number) => {
    if (isLoading) {
      globalLoadingStates.value.set(loadingKey, { isLoading, message, progress })
    } else {
      globalLoadingStates.value.delete(loadingKey)
    }
  }
  
  const currentState = computed(() => 
    globalLoadingStates.value.get(loadingKey) || { isLoading: false }
  )
  
  const isLoading = computed(() => currentState.value.isLoading)
  const loadingMessage = computed(() => currentState.value.message)
  const loadingProgress = computed(() => currentState.value.progress)
  
  const hasAnyLoading = computed(() => globalLoadingStates.value.size > 0)
  
  return {
    setLoading,
    isLoading,
    loadingMessage,
    loadingProgress,
    hasAnyLoading,
    currentState
  }
} 