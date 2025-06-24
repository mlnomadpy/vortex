<template>
  <Teleport to="body">
    <div class="notification-container fixed top-4 right-4 z-50 space-y-2">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="notificationClasses(notification.type)"
          class="notification-item p-4 rounded-lg shadow-lg text-white font-semibold max-w-sm"
        >
          <div class="flex items-center">
            <component 
              :is="getIcon(notification.type)" 
              class="w-5 h-5 mr-2 flex-shrink-0"
            />
            <span class="flex-1">{{ notification.message }}</span>
            <button
              @click="removeNotification(notification.id)"
              class="ml-2 p-1 hover:bg-white/20 rounded transition-colors duration-150"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@/components/ui/icons'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

function notificationClasses(type: string) {
  const baseClasses = 'shadow-xl border'
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500 border-green-400`
    case 'error':
      return `${baseClasses} bg-red-500 border-red-400`
    case 'warning':
      return `${baseClasses} bg-yellow-500 border-yellow-400`
    default:
      return `${baseClasses} bg-blue-500 border-blue-400`
  }
}

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
}

function removeNotification(id: string) {
  notificationStore.removeNotification(id)
}
</script>

<style scoped>
.notification-container {
  contain: layout style;
  transform: translateZ(0);
}

.notification-item {
  transform: translateZ(0);
  will-change: transform, opacity;
}

.notification-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) translateZ(0);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) translateZ(0);
}

.notification-move {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Performance optimization for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .notification-enter-active,
  .notification-leave-active,
  .notification-move {
    transition-duration: 0.1s !important;
  }
}
</style>

