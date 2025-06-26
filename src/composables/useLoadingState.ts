import { ref, computed } from 'vue'

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

const globalLoadingStates = ref<Map<string, LoadingState>>(new Map())

export function useLoadingState(key?: string) {
  const loadingKey = key || 'default'
  
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