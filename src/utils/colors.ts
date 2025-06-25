/**
 * Color utility functions for neural network visualization
 */

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h * 6) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

/**
 * Convert RGB to hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert HSL color string to hex format
 * @param hslString - HSL color string like "hsl(120, 70%, 60%)"
 * @returns Hex color string like "#7db46c"
 */
export function hslToHex(hslString: string): string {
  // Parse HSL string
  const match = hslString.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
  
  if (!match) {
    console.warn(`Invalid HSL color format: ${hslString}`)
    return '#000000' // fallback to black
  }

  const h = parseFloat(match[1])
  const s = parseFloat(match[2])
  const l = parseFloat(match[3])

  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

/**
 * Generate a hex color for a given class label
 * @param classLabel - The class label number
 * @param saturation - Saturation percentage (default: 70)
 * @param lightness - Lightness percentage (default: 60)
 * @returns Hex color string
 */
export function getClassColor(classLabel: number, saturation: number = 70, lightness: number = 60): string {
  const hue = (classLabel * 360 / 10) % 360
  const [r, g, b] = hslToRgb(hue, saturation, lightness)
  return rgbToHex(r, g, b)
}

/**
 * Generate a hex color for a neuron based on its index
 * @param neuronIndex - The neuron index
 * @param saturation - Saturation percentage (default: 70)
 * @param lightness - Lightness percentage (default: 60)
 * @returns Hex color string
 */
export function getNeuronColor(neuronIndex: number, saturation: number = 70, lightness: number = 60): string {
  return getClassColor(neuronIndex, saturation, lightness)
}

/**
 * Check if a color string is in HSL format
 */
export function isHslColor(color: string): boolean {
  return /^hsl\(\d+(?:\.\d+)?,\s*\d+(?:\.\d+)?%,\s*\d+(?:\.\d+)?%\)$/.test(color)
}

/**
 * Ensure a color is in hex format, converting from HSL if necessary
 */
export function ensureHexColor(color: string): string {
  if (isHslColor(color)) {
    return hslToHex(color)
  }
  
  // If it's already hex or other format, return as-is
  return color
} 