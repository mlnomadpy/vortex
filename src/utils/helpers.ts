/**
 * Common utility helper functions
 * This module provides reusable utility functions used across the application
 */

/**
 * Generate a unique ID string
 * 
 * @returns A unique identifier combining timestamp and random string
 * 
 * @example
 * ```ts
 * const id = generateUniqueId()
 * // => "1234567890abc123def"
 * ```
 */
export function generateUniqueId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11)
}

/**
 * Delay execution for a specified time
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 * 
 * @example
 * ```ts
 * await delay(1000) // Wait 1 second
 * console.log('Executed after 1 second')
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce a function call
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before calling function
 * @returns Debounced function
 * 
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query)
 * }, 300)
 * 
 * debouncedSearch('test') // Will only execute after 300ms of no calls
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle a function call
 * 
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between calls
 * @returns Throttled function
 * 
 * @example
 * ```ts
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event')
 * }, 100)
 * 
 * window.addEventListener('scroll', throttledScroll)
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Check if a value is defined (not null or undefined)
 * 
 * @param value - Value to check
 * @returns true if value is defined
 * 
 * @example
 * ```ts
 * isDefined(null) // => false
 * isDefined(undefined) // => false
 * isDefined(0) // => true
 * isDefined('') // => true
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * 
 * @param value - Value to check
 * @returns true if value is empty
 * 
 * @example
 * ```ts
 * isEmpty(null) // => true
 * isEmpty([]) // => true
 * isEmpty({}) // => true
 * isEmpty('') // => true
 * isEmpty(0) // => false
 * isEmpty([1, 2]) // => false
 * ```
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Deep clone an object
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 * 
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } }
 * const cloned = deepClone(original)
 * cloned.b.c = 3
 * console.log(original.b.c) // => 2 (unchanged)
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any
  }
  
  if (obj instanceof Object) {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  
  return obj
}

/**
 * Format a number with thousand separators
 * 
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * ```ts
 * formatNumber(1234567) // => "1,234,567"
 * formatNumber(1234.567, 2) // => "1,234.57"
 * ```
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Truncate a string to a specified length with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @returns Truncated string
 * 
 * @example
 * ```ts
 * truncate('Hello World', 8) // => "Hello..."
 * truncate('Hi', 10) // => "Hi"
 * ```
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalize the first letter of a string
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 * 
 * @example
 * ```ts
 * capitalize('hello world') // => "Hello world"
 * ```
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert camelCase or PascalCase to kebab-case
 * 
 * @param str - String to convert
 * @returns kebab-case string
 * 
 * @example
 * ```ts
 * toKebabCase('camelCase') // => "camel-case"
 * toKebabCase('PascalCase') // => "pascal-case"
 * ```
 */
export function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Parse a query string into an object
 * 
 * @param queryString - Query string (with or without leading '?')
 * @returns Object with query parameters
 * 
 * @example
 * ```ts
 * parseQueryString('?foo=bar&baz=qux') // => { foo: 'bar', baz: 'qux' }
 * ```
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString
  
  if (!query) return params
  
  query.split('&').forEach(param => {
    const [key, value] = param.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })
  
  return params
}

/**
 * Safely access nested object properties
 * 
 * @param obj - Object to access
 * @param path - Dot-notation path to property
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default value
 * 
 * @example
 * ```ts
 * const obj = { a: { b: { c: 42 } } }
 * getNestedValue(obj, 'a.b.c') // => 42
 * getNestedValue(obj, 'a.x.y', 'default') // => 'default'
 * ```
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T {
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T
    }
    result = result[key]
  }
  
  return result !== undefined ? result : (defaultValue as T)
}
