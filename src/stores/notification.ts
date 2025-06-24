import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NotificationItem } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])
  
  function addNotification(notification: Omit<NotificationItem, 'id'>) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: NotificationItem = {
      id,
      duration: 3000,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  function clearAll() {
    notifications.value = []
  }
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  }
})
