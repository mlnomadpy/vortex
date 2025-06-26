import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notification'

export interface AppError {
  id: string
  code: string
  message: string
  userMessage: string
  timestamp: Date
  context?: Record<string, any>
  recoverable: boolean
}

const errors = ref<AppError[]>([])

export function useErrorHandler() {
  const notificationStore = useNotificationStore()
  
  const handleError = (
    error: Error | string,
    context?: Record<string, any>,
    userMessage?: string
  ): AppError => {
    const errorMessage = typeof error === 'string' ? error : error.message
    const appError: AppError = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      code: getErrorCode(errorMessage),
      message: errorMessage,
      userMessage: userMessage || getUserFriendlyMessage(errorMessage),
      timestamp: new Date(),
      context,
      recoverable: isRecoverableError(errorMessage)
    }
    
    errors.value.push(appError)
    
    // Show user notification
    notificationStore.addNotification({
      message: appError.userMessage,
      type: 'error',
      duration: appError.recoverable ? 5000 : 0 // Persistent for non-recoverable errors
    })
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('App Error:', appError)
    }
    
    return appError
  }
  
  const clearError = (id: string) => {
    const index = errors.value.findIndex(e => e.id === id)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }
  
  const clearAllErrors = () => {
    errors.value = []
  }
  
  return {
    errors,
    handleError,
    clearError,
    clearAllErrors
  }
}

function getErrorCode(message: string): string {
  if (message.includes('fetch')) return 'NETWORK_ERROR'
  if (message.includes('CSV') || message.includes('parse')) return 'FILE_PARSE_ERROR'
  if (message.includes('MathJax')) return 'MATHJAX_ERROR'
  if (message.includes('gradient') || message.includes('optimization')) return 'OPTIMIZATION_ERROR'
  return 'UNKNOWN_ERROR'
}

function getUserFriendlyMessage(errorMessage: string): string {
  const errorMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'FILE_PARSE_ERROR': 'Unable to read the file. Please ensure it\'s a valid CSV with x, y, and label columns.',
    'MATHJAX_ERROR': 'Mathematical formulas failed to load. The app will continue to work normally.',
    'OPTIMIZATION_ERROR': 'An error occurred during optimization. Try adjusting the learning rate or dataset.',
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
  }
  
  const code = getErrorCode(errorMessage)
  return errorMessages[code] || errorMessages['UNKNOWN_ERROR']
}

function isRecoverableError(message: string): boolean {
  const recoverableErrors = ['NETWORK_ERROR', 'FILE_PARSE_ERROR', 'OPTIMIZATION_ERROR']
  return recoverableErrors.includes(getErrorCode(message))
} 