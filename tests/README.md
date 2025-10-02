# Test Suite Documentation

This directory contains comprehensive unit tests for the Vortex Neural Network utility functions, composables, services, and stores.

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

### 8. **useLoadingState.test.ts** (13 tests)
Tests loading state management composable:
- Basic loading state (on/off)
- Loading messages and progress tracking
- Keyed loading states for independent operations
- Global loading state tracking (`hasAnyLoading`)
- State isolation between different keys

### 9. **useErrorHandler.test.ts** (25 tests)
Tests error handling composable:
- Error creation with string and Error objects
- Error classification (network, file parse, MathJax, optimization)
- User-friendly error messages
- Error recoverability assessment
- Error context and metadata
- Error management (add, remove, clear all)
- Timestamp tracking

### 10. **notification.store.test.ts** (17 tests)
Tests notification store (Pinia):
- Adding notifications with types (info, success, warning, error)
- Unique ID generation
- Auto-removal after duration
- Persistent notifications (duration: 0)
- Manual notification removal
- Clear all notifications

### 11. **gridUpdateService.test.ts** (31 tests)
Tests grid update service:
- Singleton instance management
- Grid registration and unregistration
- Update scheduling with priorities
- Update batching and queuing
- Cache invalidation strategies
- Update type handling (neuron operations, data changes, resizing)
- Helper functions for common update patterns
- Error handling during updates

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

- **Total Test Files**: 11
- **Total Tests**: 266
- **Pass Rate**: 100%

## Coverage Areas

The test suite provides comprehensive coverage for:
- ✅ Mathematical operations (similarity metrics, activation functions)
- ✅ N-dimensional neural network operations
- ✅ Data validation and preprocessing
- ✅ Color utilities and conversion
- ✅ Coordinate system transformations
- ✅ Utility functions (clamping, normalization)
- ✅ **Composables** (error handling, loading states, theme management)
- ✅ **Services** (grid update service)
- ✅ **Stores** (notification store)

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
