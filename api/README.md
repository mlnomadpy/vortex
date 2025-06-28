# MNIST JAX API

This is a high-performance Flask API that uses JAX for MNIST neural network computations. It provides endpoints for forward passes, gradient computation, training steps, and accuracy evaluation.

## Features

- **JAX-powered computation**: Uses JAX for automatic differentiation and GPU acceleration
- **RESTful API**: Clean HTTP endpoints for all neural network operations
- **Multiple similarity metrics**: Supports dot product, euclidean, cosine, manhattan, RBF, and YAT product
- **Multiple activation functions**: Supports softmax, sigmoid, ReLU, tanh, and linear
- **Batch processing**: Efficient batch gradient computation
- **CORS enabled**: Ready for frontend integration

## Setup

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Installation

1. Navigate to the API directory:
```bash
cd api
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the API

#### Development mode:
```bash
python app.py
```

#### Production mode with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns API status and available JAX devices

### Forward Pass
- **POST** `/forward`
- Performs forward pass for a single sample
- **Body**: `{ weights, biases, features, similarity_metric, activation_function }`

### Batch Forward Pass
- **POST** `/batch_forward`
- Performs forward pass for multiple samples
- **Body**: `{ weights, biases, batch_features, similarity_metric, activation_function }`

### Gradient Computation
- **POST** `/gradients`
- Computes gradients for a batch
- **Body**: `{ weights, biases, batch_features, batch_labels, similarity_metric, activation_function }`

### Training Step
- **POST** `/train_step`
- Performs a complete training step (gradients + weight update)
- **Body**: `{ weights, biases, batch_features, batch_labels, similarity_metric, activation_function, learning_rate }`

### Accuracy Evaluation
- **POST** `/accuracy`
- Computes accuracy on test data
- **Body**: `{ weights, biases, test_features, test_labels, similarity_metric, activation_function }`

## Configuration

The API can be configured through environment variables:

- `FLASK_ENV`: Set to `development` for debug mode
- `JAX_ENABLE_X64`: Set to `True` for 64-bit precision (default: True)
- `JAX_PLATFORM_NAME`: Force specific backend (`cpu`, `gpu`, `tpu`)

## Integration with Vue.js Frontend

The Vue.js frontend automatically detects and connects to this API. Make sure the API is running on `http://localhost:5000` or set the `VITE_API_URL` environment variable in the frontend.

## Performance

- **CPU**: Fast computation using JAX's optimized kernels
- **GPU**: Automatic GPU acceleration when available
- **Memory efficient**: Optimized for large batch processing
- **Scalable**: Can handle multiple concurrent requests

## Error Handling

The API includes comprehensive error handling and will gracefully fall back to CPU computation if GPU acceleration fails. All endpoints return structured JSON responses with success/error status.

## Development

To extend the API:

1. Add new similarity metrics in `JAXMNISTCalculator.similarity_functions`
2. Add new activation functions in `JAXMNISTCalculator.activation_functions`  
3. Create new endpoints following the existing pattern
4. Update the frontend `mnistApiService.ts` to use new endpoints 