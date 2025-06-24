import * as d3 from 'd3'

// Configuration matching the NeuralCanvas component
const CANVAS_CONFIG = {
  width: 600,
  height: 600,
  domain: [-1, 1] as [number, number]
}

// Create scales identical to those in NeuralCanvas
export const createScales = () => {
  const xScale = d3.scaleLinear()
    .domain(CANVAS_CONFIG.domain)
    .range([0, CANVAS_CONFIG.width])
  
  const yScale = d3.scaleLinear()
    .domain(CANVAS_CONFIG.domain)
    .range([CANVAS_CONFIG.height, 0])
  
  return { xScale, yScale }
}

// Coordinate validation utilities
export const coordinateValidator = {
  /**
   * Validates that canvas coordinates are within bounds
   */
  isValidCanvasCoordinate(x: number, y: number): boolean {
    return x >= 0 && x <= CANVAS_CONFIG.width && 
           y >= 0 && y <= CANVAS_CONFIG.height
  },

  /**
   * Validates that normalized coordinates are within the expected domain
   */
  isValidNormalizedCoordinate(x: number, y: number): boolean {
    const [min, max] = CANVAS_CONFIG.domain
    return x >= min && x <= max && y >= min && y <= max
  },

  /**
   * Clamps normalized coordinates to valid range
   */
  clampNormalizedCoordinates(x: number, y: number): { x: number; y: number } {
    const [min, max] = CANVAS_CONFIG.domain
    return {
      x: Math.max(min, Math.min(max, x)),
      y: Math.max(min, Math.min(max, y))
    }
  },

  /**
   * Tests coordinate conversion accuracy
   */
  testCoordinateConversion(): boolean {
    const { xScale, yScale } = createScales()
    
    // Test known coordinate pairs
    const testCases = [
      { normalized: { x: -1, y: -1 }, canvas: { x: 0, y: CANVAS_CONFIG.height } },
      { normalized: { x: 1, y: 1 }, canvas: { x: CANVAS_CONFIG.width, y: 0 } },
      { normalized: { x: 0, y: 0 }, canvas: { x: CANVAS_CONFIG.width / 2, y: CANVAS_CONFIG.height / 2 } }
    ]

    for (const testCase of testCases) {
      // Test forward conversion (normalized -> canvas)
      const canvasX = xScale(testCase.normalized.x)
      const canvasY = yScale(testCase.normalized.y)
      
      if (Math.abs(canvasX - testCase.canvas.x) > 0.01 || 
          Math.abs(canvasY - testCase.canvas.y) > 0.01) {
        console.error('Forward conversion failed:', {
          expected: testCase.canvas,
          actual: { x: canvasX, y: canvasY },
          input: testCase.normalized
        })
        return false
      }

      // Test reverse conversion (canvas -> normalized)
      const normalizedX = xScale.invert(testCase.canvas.x)
      const normalizedY = yScale.invert(testCase.canvas.y)
      
      if (Math.abs(normalizedX - testCase.normalized.x) > 0.01 || 
          Math.abs(normalizedY - testCase.normalized.y) > 0.01) {
        console.error('Reverse conversion failed:', {
          expected: testCase.normalized,
          actual: { x: normalizedX, y: normalizedY },
          input: testCase.canvas
        })
        return false
      }
    }

    console.log('✅ All coordinate conversion tests passed!')
    return true
  }
}

// Click simulation utilities for testing
export const clickSimulator = {
  /**
   * Simulates a click at the given canvas coordinates
   */
  simulateCanvasClick(x: number, y: number, canvasElement: SVGElement) {
    const rect = canvasElement.getBoundingClientRect()
    
    const clickEvent = new MouseEvent('click', {
      clientX: rect.left + x,
      clientY: rect.top + y,
      bubbles: true,
      cancelable: true
    })
    
    canvasElement.dispatchEvent(clickEvent)
    return clickEvent
  },

  /**
   * Simulates clicks at various test positions
   */
  runClickTests(canvasElement: SVGElement): void {
    const testPositions = [
      { name: 'Top-left corner', x: 10, y: 10 },
      { name: 'Top-right corner', x: CANVAS_CONFIG.width - 10, y: 10 },
      { name: 'Bottom-left corner', x: 10, y: CANVAS_CONFIG.height - 10 },
      { name: 'Bottom-right corner', x: CANVAS_CONFIG.width - 10, y: CANVAS_CONFIG.height - 10 },
      { name: 'Center', x: CANVAS_CONFIG.width / 2, y: CANVAS_CONFIG.height / 2 }
    ]

    console.log('🧪 Running click position tests...')
    
    testPositions.forEach(pos => {
      console.log(`Testing ${pos.name} at canvas (${pos.x}, ${pos.y})`)
      this.simulateCanvasClick(pos.x, pos.y, canvasElement)
    })
  }
}

// Development helper for debugging coordinate issues
export const debugUtils = {
  /**
   * Logs coordinate information for debugging
   */
  logCoordinateInfo(canvasX: number, canvasY: number): void {
    const { xScale, yScale } = createScales()
    
    const normalizedX = xScale.invert(canvasX)
    const normalizedY = yScale.invert(canvasY)
    
    console.log('🐛 Coordinate Debug Info:', {
      canvas: { x: canvasX, y: canvasY },
      normalized: { x: normalizedX, y: normalizedY },
      isValidCanvas: coordinateValidator.isValidCanvasCoordinate(canvasX, canvasY),
      isValidNormalized: coordinateValidator.isValidNormalizedCoordinate(normalizedX, normalizedY)
    })
  },

  /**
   * Creates visual markers for debugging coordinate mapping
   */
  createDebugMarkers(svgElement: SVGElement): void {
    const { xScale, yScale } = createScales()
    
    // Remove existing debug markers
    svgElement.querySelectorAll('.debug-marker').forEach(el => el.remove())
    
    // Create corner markers
    const corners = [
      { x: -1, y: -1, color: 'red', label: 'BL' },
      { x: 1, y: -1, color: 'green', label: 'BR' },
      { x: -1, y: 1, color: 'blue', label: 'TL' },
      { x: 1, y: 1, color: 'orange', label: 'TR' },
      { x: 0, y: 0, color: 'purple', label: 'C' }
    ]
    
    corners.forEach(corner => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', xScale(corner.x).toString())
      circle.setAttribute('cy', yScale(corner.y).toString())
      circle.setAttribute('r', '5')
      circle.setAttribute('fill', corner.color)
      circle.setAttribute('class', 'debug-marker')
      circle.setAttribute('data-label', corner.label)
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', (xScale(corner.x) + 8).toString())
      text.setAttribute('y', (yScale(corner.y) + 4).toString())
      text.setAttribute('fill', corner.color)
      text.setAttribute('font-size', '12')
      text.setAttribute('font-weight', 'bold')
      text.setAttribute('class', 'debug-marker')
      text.textContent = corner.label
      
      svgElement.appendChild(circle)
      svgElement.appendChild(text)
    })
  }
} 