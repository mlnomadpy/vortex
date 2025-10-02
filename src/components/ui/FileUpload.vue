<template>
  <div
    :class="containerClasses"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-label="ariaLabel"
    :aria-disabled="disabled"
    data-tour="file-upload"
    @drop.prevent="handleDrop"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @click="openFileDialog"
    @keydown="handleKeydown"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    />
    
    <!-- Loading overlay -->
    <div v-if="isProcessing" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
      <LoadingSpinner size="md" message="Processing file..." />
    </div>
    
    <slot 
      :is-dragging="isDragging" 
      :is-processing="isProcessing"
      :has-error="hasError"
      :error-message="errorMessage"
    ></slot>
    
    <!-- Error display -->
    <div v-if="hasError && showInlineErrors" class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
      {{ errorMessage }}
    </div>
    
    <!-- File validation feedback -->
    <div v-if="validationMessage" class="mt-2 text-xs text-theme-secondary">
      {{ validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LoadingSpinner } from '@/components/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'

interface Props {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  maxSize?: number // in MB
  allowedTypes?: string[]
  showInlineErrors?: boolean
}

interface Emits {
  (e: 'file-selected', file: File): void
  (e: 'files-selected', files: File[]): void
  (e: 'error', error: string): void
  (e: 'processing', isProcessing: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  multiple: false,
  disabled: false,
  maxSize: 10, // 10MB default
  allowedTypes: () => [],
  showInlineErrors: true
})

const emit = defineEmits<Emits>()
const { handleError } = useErrorHandler()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isProcessing = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

const containerClasses = computed(() => [
  'relative cursor-pointer transition-all duration-200 border-2 border-dashed rounded-lg p-6',
  {
    'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragging.value,
    'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': !isDragging.value && !hasError.value,
    'border-red-500 bg-red-50 dark:bg-red-900/20': hasError.value,
    'opacity-50 cursor-not-allowed': props.disabled,
  }
])

const ariaLabel = computed(() => 
  props.disabled 
    ? 'File upload disabled' 
    : props.multiple 
      ? 'Click or drag files to upload'
      : 'Click or drag file to upload'
)

const validationMessage = computed(() => {
  if (props.maxSize && props.allowedTypes.length > 0) {
    return `Max size: ${props.maxSize}MB. Accepted: ${props.allowedTypes.join(', ')}`
  } else if (props.maxSize) {
    return `Max file size: ${props.maxSize}MB`
  } else if (props.allowedTypes.length > 0) {
    return `Accepted file types: ${props.allowedTypes.join(', ')}`
  }
  return ''
})

function openFileDialog() {
  if (props.disabled || isProcessing.value) return
  fileInput.value?.click()
}

function handleDragOver(event: DragEvent) {
  if (props.disabled || isProcessing.value) return
  isDragging.value = true
  event.preventDefault()
}

function handleDragLeave(event: DragEvent) {
  isDragging.value = false
  event.preventDefault()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openFileDialog()
  }
}

function validateFile(file: File): string | null {
  // Check file size
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${props.maxSize}MB`
  }
  
  // Check file type
  if (props.allowedTypes.length > 0) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type
    
    const isValidExtension = fileExtension && props.allowedTypes.some(type => 
      type.toLowerCase() === fileExtension || type.toLowerCase() === mimeType
    )
    
    if (!isValidExtension) {
      return `File type not allowed. Expected: ${props.allowedTypes.join(', ')}`
    }
  }
  
  return null
}

async function processFiles(files: File[]) {
  if (props.disabled) return
  
  isProcessing.value = true
  hasError.value = false
  errorMessage.value = ''
  emit('processing', true)
  
  try {
    // Validate files
    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        throw new Error(validationError)
      }
    }
    
    // Emit files
    if (props.multiple) {
      emit('files-selected', files)
    } else {
      emit('file-selected', files[0])
    }
    
  } catch (error) {
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'File processing failed'
    emit('error', errorMessage.value)
    handleError(error as Error, { component: 'FileUpload', files: files.map(f => f.name) })
  } finally {
    isProcessing.value = false
    emit('processing', false)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files && files.length > 0) {
    processFiles(Array.from(files))
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFiles(Array.from(files))
  }
}
</script>
