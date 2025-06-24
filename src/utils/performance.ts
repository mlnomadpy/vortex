// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }
  
  endMeasure(name: string): number {
    const endMark = `${name}-end`
    const startMark = `${name}-start`
    
    performance.mark(endMark)
    performance.measure(name, startMark, endMark)
    
    const measure = performance.getEntriesByName(name).pop() as PerformanceMeasure
    const duration = measure?.duration || 0
    
    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)
    
    // Keep only last 10 measurements
    const measurements = this.metrics.get(name)!
    if (measurements.length > 10) {
      measurements.shift()
    }
    
    // Clean up performance entries
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(name)
    
    return duration
  }
  
  getAverageTime(name: string): number {
    const measurements = this.metrics.get(name)
    if (!measurements || measurements.length === 0) return 0
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length
  }
  
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {}
    
    for (const [name, measurements] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageTime(name),
        count: measurements.length
      }
    }
    
    return result
  }
  
  logMetrics(): void {
    const metrics = this.getAllMetrics()
    console.group('🎯 Performance Metrics')
    
    for (const [name, data] of Object.entries(metrics)) {
      console.log(`${name}: ${data.average.toFixed(2)}ms (${data.count} samples)`)
    }
    
    console.groupEnd()
  }
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// Request animation frame wrapper for smooth animations
export function requestAnimationFramePromise(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

// Batch DOM updates for better performance
export async function batchUpdates(updates: (() => void)[]): Promise<void> {
  for (let i = 0; i < updates.length; i++) {
    updates[i]()
    
    // Yield to browser every 5 updates
    if (i % 5 === 0) {
      await requestAnimationFramePromise()
    }
  }
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// GPU acceleration check
export function supportsGPUAcceleration(): boolean {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return !!gl
}

// Memory usage monitoring (if available)
export function getMemoryUsage(): { used: number; total: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize
    }
  }
  return null
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance() 