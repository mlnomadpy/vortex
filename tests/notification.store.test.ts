import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('addNotification', () => {
    it('should add a notification', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Test notification',
        type: 'info'
      })
      
      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].message).toBe('Test notification')
      expect(store.notifications[0].type).toBe('info')
    })

    it('should generate unique ID for notifications', () => {
      const store = useNotificationStore()
      
      const id1 = store.addNotification({
        message: 'Notification 1',
        type: 'info'
      })
      
      const id2 = store.addNotification({
        message: 'Notification 2',
        type: 'success'
      })
      
      expect(id1).not.toBe(id2)
      expect(store.notifications[0].id).toBe(id1)
      expect(store.notifications[1].id).toBe(id2)
    })

    it('should set default duration to 3000ms', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Test',
        type: 'info'
      })
      
      expect(store.notifications[0].duration).toBe(3000)
    })

    it('should allow custom duration', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Test',
        type: 'info',
        duration: 5000
      })
      
      expect(store.notifications[0].duration).toBe(5000)
    })

    it('should auto-remove notification after duration', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Test',
        type: 'info',
        duration: 3000
      })
      
      expect(store.notifications).toHaveLength(1)
      
      vi.advanceTimersByTime(3000)
      
      expect(store.notifications).toHaveLength(0)
    })

    it('should not auto-remove notification with duration 0', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Persistent notification',
        type: 'error',
        duration: 0
      })
      
      expect(store.notifications).toHaveLength(1)
      
      vi.advanceTimersByTime(10000)
      
      expect(store.notifications).toHaveLength(1)
    })

    it('should handle multiple notifications', () => {
      const store = useNotificationStore()
      
      store.addNotification({ message: 'Notification 1', type: 'info' })
      store.addNotification({ message: 'Notification 2', type: 'success' })
      store.addNotification({ message: 'Notification 3', type: 'warning' })
      
      expect(store.notifications).toHaveLength(3)
    })

    it('should preserve notification properties', () => {
      const store = useNotificationStore()
      
      store.addNotification({
        message: 'Custom notification',
        type: 'warning',
        duration: 2000
      })
      
      const notification = store.notifications[0]
      expect(notification.message).toBe('Custom notification')
      expect(notification.type).toBe('warning')
      expect(notification.duration).toBe(2000)
      expect(notification.id).toBeDefined()
    })
  })

  describe('removeNotification', () => {
    it('should remove notification by ID', () => {
      const store = useNotificationStore()
      
      const id = store.addNotification({
        message: 'Test',
        type: 'info',
        duration: 0
      })
      
      expect(store.notifications).toHaveLength(1)
      
      store.removeNotification(id)
      
      expect(store.notifications).toHaveLength(0)
    })

    it('should handle removing non-existent notification', () => {
      const store = useNotificationStore()
      
      store.addNotification({ message: 'Test', type: 'info' })
      
      expect(store.notifications).toHaveLength(1)
      
      store.removeNotification('non-existent-id')
      
      expect(store.notifications).toHaveLength(1)
    })

    it('should remove correct notification from multiple notifications', () => {
      const store = useNotificationStore()
      
      const id1 = store.addNotification({ message: 'First', type: 'info', duration: 0 })
      const id2 = store.addNotification({ message: 'Second', type: 'success', duration: 0 })
      const id3 = store.addNotification({ message: 'Third', type: 'warning', duration: 0 })
      
      expect(store.notifications).toHaveLength(3)
      
      store.removeNotification(id2)
      
      expect(store.notifications).toHaveLength(2)
      expect(store.notifications[0].id).toBe(id1)
      expect(store.notifications[1].id).toBe(id3)
    })
  })

  describe('clearAll', () => {
    it('should clear all notifications', () => {
      const store = useNotificationStore()
      
      store.addNotification({ message: 'First', type: 'info' })
      store.addNotification({ message: 'Second', type: 'success' })
      store.addNotification({ message: 'Third', type: 'error' })
      
      expect(store.notifications).toHaveLength(3)
      
      store.clearAll()
      
      expect(store.notifications).toHaveLength(0)
    })

    it('should work with empty notifications', () => {
      const store = useNotificationStore()
      
      expect(store.notifications).toHaveLength(0)
      
      store.clearAll()
      
      expect(store.notifications).toHaveLength(0)
    })
  })

  describe('notification types', () => {
    it('should handle info notifications', () => {
      const store = useNotificationStore()
      store.addNotification({ message: 'Info message', type: 'info' })
      expect(store.notifications[0].type).toBe('info')
    })

    it('should handle success notifications', () => {
      const store = useNotificationStore()
      store.addNotification({ message: 'Success message', type: 'success' })
      expect(store.notifications[0].type).toBe('success')
    })

    it('should handle warning notifications', () => {
      const store = useNotificationStore()
      store.addNotification({ message: 'Warning message', type: 'warning' })
      expect(store.notifications[0].type).toBe('warning')
    })

    it('should handle error notifications', () => {
      const store = useNotificationStore()
      store.addNotification({ message: 'Error message', type: 'error' })
      expect(store.notifications[0].type).toBe('error')
    })
  })
})
