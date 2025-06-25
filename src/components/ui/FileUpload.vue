<template>
  <div
    @drop.prevent="handleDrop"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @click="openFileDialog"
    :class="[
      'relative cursor-pointer transition-colors duration-200',
      isDragging ? 'bg-blue-100 border-blue-500' : ''
    ]"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      @change="handleFileSelect"
      class="hidden"
    />
    
    <slot :isDragging="isDragging" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  accept?: string
  multiple?: boolean
}

interface Emits {
  (e: 'file-selected', file: File): void
  (e: 'files-selected', files: File[]): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  multiple: false
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files && files.length > 0) {
    if (props.multiple) {
      emit('files-selected', Array.from(files))
    } else {
      emit('file-selected', files[0])
    }
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    if (props.multiple) {
      emit('files-selected', Array.from(files))
    } else {
      emit('file-selected', files[0])
    }
  }
}
</script>
