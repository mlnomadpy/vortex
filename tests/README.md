# Test Suite Documentation

This directory contains comprehensive unit tests for the Vortex Neural Network utility functions.

## Test Coverage

### 1. **mathCore.test.ts** (42 tests)
Tests core mathematical functions for 2D neural networks:
- `calculateSimilarityScore()` - Tests dot product, euclidean distance, and yatProduct metrics
- `applyActivationFunction()` - Tests none, softmax, softermax, sigmoid, relu, and gelu activations
- `getActivationDerivative()` - Tests derivatives for all activation functions
- Configuration constants validation

### 2. **mathCore.additional.test.ts** (27 tests)
Tests additional mathematical operations:
- `getPrediction()` - Neural network prediction with winning neuron selection
- `computeCategoricalCrossEntropyLoss()` - Loss calculation for classification
- `clamp()` - Value clamping utility
- `calculateAccuracy()` - Model accuracy computation

### 3. **ndMathCore.test.ts** (49 tests)
Tests N-dimensional neural network functions for MNIST:
- `calculateNDSimilarityScore()` - Tests 6 similarity metrics (dotProduct, euclidean, cosine, manhattan, rbf, yatProduct)
- `applyNDActivationFunction()` - Tests all activation functions in N-dimensions
- `getNDPrediction()` - N-dimensional prediction
- `computeNDCategoricalCrossEntropyLoss()` - Loss calculation for high-dimensional data
- `calculateNDAccuracy()` - Accuracy for N-dimensional classification
- `clamp()` and `normalizeFeatures()` - Utility functions

### 4. **colors.test.ts** (22 tests)
Tests color conversion utilities:
- `hslToHex()` - HSL to hexadecimal color conversion
- `getClassColor()` - Generate class-specific colors
- `getNeuronColor()` - Generate neuron-specific colors
- `isHslColor()` - HSL format validation
- `ensureHexColor()` - Color format normalization

### 5. **csvUtils.test.ts** (11 tests)
Tests CSV data utilities:
- `validateDataPoint()` - Data point validation with proper error handling
- Edge cases: invalid values, missing fields, type conversion

### 6. **cn.test.ts** (6 tests)
Tests class name utility:
- `cn()` - Tailwind CSS class merging and conflict resolution
- Conditional classes, arrays, and edge cases

### 7. **coordinateValidation.test.ts** (23 tests)
Tests coordinate system utilities:
- `createScales()` - D3 scale creation and conversion
- `isValidCanvasCoordinate()` - Canvas bounds validation
- `isValidNormalizedCoordinate()` - Normalized coordinate validation
- `clampNormalizedCoordinates()` - Coordinate clamping
- `testCoordinateConversion()` - Coordinate conversion accuracy

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Test Statistics

- **Total Test Files**: 7
- **Total Tests**: 180
- **Pass Rate**: 100%

## Coverage Areas

The test suite provides comprehensive coverage for:
- ✅ Mathematical operations (similarity metrics, activation functions)
- ✅ N-dimensional neural network operations
- ✅ Data validation and preprocessing
- ✅ Color utilities and conversion
- ✅ Coordinate system transformations
- ✅ Utility functions (clamping, normalization)

## Testing Framework

- **Framework**: [Vitest](https://vitest.dev/)
- **Configuration**: `vitest.config.ts`
- **Test Files Location**: `/tests` directory

## Best Practices

1. Each test file focuses on a single utility module
2. Tests are organized by function with descriptive names
3. Edge cases and error conditions are thoroughly tested
4. All numeric comparisons use appropriate precision (`toBeCloseTo`)
5. Tests validate both success and failure scenarios
