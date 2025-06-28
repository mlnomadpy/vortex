from flask import Flask, request, jsonify
from flask_cors import CORS
import jax
import jax.numpy as jnp
import optax
import numpy as np
from typing import Dict, List, Tuple, Any
import logging
import urllib.request
import gzip
import os
from pathlib import Path
import zipfile
import subprocess
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Vue.js frontend

# JAX configuration
jax.config.update("jax_enable_x64", True)  # Use 64-bit precision

# Global model state for persistent storage
model_state = {
    'weights': None,
    'biases': None,
    'training_history': [],
    'current_epoch': 0,
    'is_training': False,
    'last_loss': 0.0,
    'last_train_accuracy': 0.0,
    'last_test_accuracy': 0.0,
    'last_gradient_norm': 0.0,
    'use_ternary_weights': True,
    'weight_distribution': None,
    'optimizer': None,
    'opt_state': None
}

class JAXMNISTCalculator:
    """High-performance MNIST calculations using JAX"""
    
    def __init__(self, use_ternary_weights=True):
        self.use_ternary_weights = use_ternary_weights
        self.similarity_functions = {
            'dotProduct': self._dot_product,
            'euclidean': self._euclidean,
            'cosine': self._cosine,
            'manhattan': self._manhattan,
            'rbf': self._rbf,
            'yatProduct': self._yat_product,
        }
        
        self.activation_functions = {
            'softmax': self._softmax,
            'sigmoid': self._sigmoid,
            'relu': self._relu,
            'tanh': self._tanh,
            'linear': self._linear
        }
    
    # Similarity functions
    def _dot_product(self, weights: jnp.ndarray, features: jnp.ndarray) -> jnp.ndarray:
        """Compute dot product similarity"""
        return jnp.dot(weights, features)
    
    def _euclidean(self, weights: jnp.ndarray, features: jnp.ndarray) -> jnp.ndarray:
        """Compute negative euclidean distance (higher is more similar)"""
        return -jnp.linalg.norm(weights - features, axis=-1)
    
    def _cosine(self, weights: jnp.ndarray, features: jnp.ndarray) -> jnp.ndarray:
        """Compute cosine similarity"""
        weights_norm = jnp.linalg.norm(weights, axis=-1, keepdims=True)
        features_norm = jnp.linalg.norm(features)
        return jnp.dot(weights, features) / (weights_norm.flatten() * features_norm + 1e-8)
    
    def _manhattan(self, weights: jnp.ndarray, features: jnp.ndarray) -> jnp.ndarray:
        """Compute negative Manhattan distance"""
        return -jnp.sum(jnp.abs(weights - features), axis=-1)
    
    def _rbf(self, weights: jnp.ndarray, features: jnp.ndarray, gamma: float = 1.0) -> jnp.ndarray:
        """Compute RBF (Gaussian) similarity"""
        dist_sq = jnp.sum((weights - features) ** 2, axis=-1)
        return jnp.exp(-gamma * dist_sq)
    
    def _yat_product(self, weights: jnp.ndarray, features: jnp.ndarray) -> jnp.ndarray:
        """Smoother YAT product: (x·w)² / (||x||² + ||w||² - 2(x·w) + ε)"""
        dot_product = jnp.dot(weights, features)
        
        # Compute norms
        features_norm_sq = jnp.sum(features ** 2)
        weights_norm_sq = jnp.sum(weights ** 2, axis=-1)
        
        # The denominator: ||x||² + ||w||² - 2(x·w)
        # This is actually ||x - w||² but computed more stably
        epsilon = 1e-3
        denominator = features_norm_sq + weights_norm_sq - 2 * dot_product + epsilon
        
        # Compute the smoother YAT product
        raw_score = (dot_product ** 2) / denominator
        
        # Scale down to reasonable range for softmax
        raw_score = raw_score * 100  # Scale factor to prevent softmax saturation
        
        return raw_score
    
    
    # Activation functions
    def _softmax(self, x: jnp.ndarray) -> jnp.ndarray:
        """Compute softmax activation - standard differentiable version"""
        exp_x = jnp.exp(x)
        return exp_x / jnp.sum(exp_x)
    
    def _sigmoid(self, x: jnp.ndarray) -> jnp.ndarray:
        """Compute sigmoid activation"""
        return 1 / (1 + jnp.exp(-jnp.clip(x, -500, 500)))
    
    def _relu(self, x: jnp.ndarray) -> jnp.ndarray:
        """Compute ReLU activation"""
        return jnp.maximum(0, x)
    
    def _tanh(self, x: jnp.ndarray) -> jnp.ndarray:
        """Compute tanh activation"""
        return jnp.tanh(x)
    
    def _linear(self, x: jnp.ndarray) -> jnp.ndarray:
        """Linear activation (identity)"""
        return x
    
    def initialize_ternary_weights(self, num_classes: int, num_features: int, 
                                 sparsity_ratio: float = 0.3) -> Tuple[jnp.ndarray, jnp.ndarray]:
        """Initialize ternary weights with improved strategy"""
        # For ternary weights, we want a good balance of -1, 0, and 1
        # Use a structured initialization based on class patterns
        
        weights = []
        for class_id in range(num_classes):
            # Create a pattern for each class
            # Use random seed based on class_id for reproducibility
            key = jax.random.PRNGKey(42 + class_id)
            
            # Generate random values in [-1, 1]
            class_weights = jax.random.uniform(key, (num_features,), minval=-1.0, maxval=1.0)
            
            # Apply sparsity: set a fraction of weights to zero
            sparse_key = jax.random.PRNGKey(100 + class_id)
            sparse_mask = jax.random.uniform(sparse_key, (num_features,)) > sparsity_ratio
            class_weights = jnp.where(sparse_mask, class_weights, 0.0)
            
            # Quantize to ternary values
            class_weights = self._quantize_to_ternary(class_weights)
            weights.append(class_weights)
        
        weights = jnp.array(weights)
        
        # Initialize biases to small random values (not ternary)
        bias_key = jax.random.PRNGKey(200)
        biases = jax.random.normal(bias_key, (num_classes,)) * 0.1
        
        logger.info(f"Initialized ternary weights: shape={weights.shape}")
        logger.info(f"Weight distribution: {self._analyze_ternary_distribution(weights)}")
        
        return weights, biases
    
    def _quantize_to_ternary(self, weights: jnp.ndarray) -> jnp.ndarray:
        """Quantize weights to ternary values {-1, 0, 1}"""
        if not self.use_ternary_weights:
            return weights
            
        # Use percentile-based quantization instead of fixed threshold
        # This ensures we always have some non-zero weights
        flat_weights = weights.flatten()
        abs_weights = jnp.abs(flat_weights)
        
        # Find thresholds that give us roughly 30% zeros, 35% positive, 35% negative
        threshold_zero = jnp.percentile(abs_weights, 30)  # Bottom 30% become zero
        
        # Create ternary weights
        ternary_weights = jnp.where(
            jnp.abs(weights) <= threshold_zero,
            0.0,  # Smallest 30% become 0
            jnp.where(weights > 0, 1.0, -1.0)  # Others become +1 or -1
        )
        
        return ternary_weights
    
    def _analyze_ternary_distribution(self, weights: jnp.ndarray) -> Dict[str, float]:
        """Analyze the distribution of ternary weights"""
        flat_weights = weights.flatten()
        total = len(flat_weights)
        
        num_neg_one = jnp.sum(flat_weights == -1.0)
        num_zero = jnp.sum(flat_weights == 0.0)
        num_pos_one = jnp.sum(flat_weights == 1.0)
        
        return {
            'negative_one_ratio': float(num_neg_one / total),
            'zero_ratio': float(num_zero / total),
            'positive_one_ratio': float(num_pos_one / total),
            'total_weights': int(total)
        }
    
    def _forward_pass_internal(self, weights: jnp.ndarray, biases: jnp.ndarray, features: jnp.ndarray, 
                              similarity_metric: str, activation_function: str) -> Tuple[jnp.ndarray, jnp.ndarray]:
        """Internal forward pass that returns JAX arrays (for gradient computation)"""
        # Compute similarity scores
        similarity_fn = self.similarity_functions[similarity_metric]
        scores = similarity_fn(weights, features)
        
        # Don't add  Bias
        scores = scores 
        
        # Apply activation function
        activation_fn = self.activation_functions[activation_function]
        activations = activation_fn(scores)
        
        return scores, activations
    
    def forward_pass(self, weights: jnp.ndarray, biases: jnp.ndarray, features: jnp.ndarray, 
                    similarity_metric: str, activation_function: str) -> Dict[str, Any]:
        """Perform forward pass through the network (external API)"""
        
        scores, activations = self._forward_pass_internal(weights, biases, features, similarity_metric, activation_function)
        
        # Get prediction
        predicted_class = jnp.argmax(activations)
        confidence = jnp.max(activations)
        
        return {
            'scores': scores.tolist(),
            'activations': activations.tolist(),
            'predicted_class': int(predicted_class),
            'confidence': float(confidence)
        }
    
    def compute_loss(self, weights: jnp.ndarray, biases: jnp.ndarray, 
                    batch_features: jnp.ndarray, batch_labels: jnp.ndarray,
                    similarity_metric: str, activation_function: str) -> float:
        """Compute categorical cross-entropy loss for a batch"""
        
        def single_sample_loss(features, label):
            scores, activations = self._forward_pass_internal(weights, biases, features, similarity_metric, activation_function)
            
            # One-hot encode the label
            one_hot = jnp.zeros(10)
            one_hot = one_hot.at[label].set(1.0)
            
            # Compute cross-entropy loss with improved numerical stability
            epsilon = 1e-8
            activations = jnp.clip(activations, epsilon, 1.0 - epsilon)
            return -jnp.sum(one_hot * jnp.log(activations))
        
        # Vectorize the loss computation
        losses = jax.vmap(single_sample_loss)(batch_features, batch_labels)
        mean_loss = jnp.mean(losses)
        
        # Check for NaN or infinity
        mean_loss = jnp.where(jnp.isnan(mean_loss) | jnp.isinf(mean_loss), 1000.0, mean_loss)
            
        return mean_loss
    
    def compute_optax_loss(self, params: Tuple[jnp.ndarray, jnp.ndarray], 
                          batch_features: jnp.ndarray, batch_labels: jnp.ndarray,
                          similarity_metric: str) -> float:
        """Compute softmax cross-entropy loss using Optax for a batch"""
        weights, biases = params
        
        def get_logits(features):
            """Get raw logits from similarity scores"""
            similarity_fn = self.similarity_functions[similarity_metric]
            scores = similarity_fn(weights, features)
            # Add bias (though we're not using it in current setup)
            return scores
        
        # Vectorize logits computation
        logits = jax.vmap(get_logits)(batch_features)
        
        # Use Optax's softmax cross-entropy loss
        # Convert labels to one-hot
        one_hot_labels = jax.nn.one_hot(batch_labels, num_classes=10)
        
        # Compute softmax cross-entropy loss
        loss = optax.softmax_cross_entropy(logits=logits, labels=one_hot_labels)
        mean_loss = jnp.mean(loss)
        
        # Check for NaN or infinity
        mean_loss = jnp.where(jnp.isnan(mean_loss) | jnp.isinf(mean_loss), 1000.0, mean_loss)
        
        return mean_loss
    
    def compute_gradients(self, weights: jnp.ndarray, biases: jnp.ndarray,
                         batch_features: jnp.ndarray, batch_labels: jnp.ndarray,
                         similarity_metric: str, activation_function: str) -> Dict[str, Any]:
        """Compute gradients using JAX automatic differentiation"""
        
        # Ensure inputs have correct dtypes for gradient computation
        weights = weights.astype(jnp.float64)
        biases = biases.astype(jnp.float64)
        batch_features = batch_features.astype(jnp.float64)
        batch_labels = batch_labels.astype(jnp.int32)  # Labels should be integers
        
        def loss_fn(params):
            w, b = params
            return self.compute_loss(w, b, batch_features, batch_labels, similarity_metric, activation_function)
        
        # Compute gradients
        grad_fn = jax.grad(loss_fn)
        gradients = grad_fn((weights, biases))
        
        weight_gradients, bias_gradients = gradients
        
        # Check for NaN or infinity in gradients
        weight_has_nan = jnp.any(jnp.isnan(weight_gradients)) or jnp.any(jnp.isinf(weight_gradients))
        bias_has_nan = jnp.any(jnp.isnan(bias_gradients)) or jnp.any(jnp.isinf(bias_gradients))
        
        if weight_has_nan:
            logger.warning(f"NaN or infinity detected in weight gradients for {similarity_metric}, using zeros")
            weight_gradients = jnp.zeros_like(weights)
            
        if bias_has_nan:
            logger.warning(f"NaN or infinity detected in bias gradients for {similarity_metric}, using zeros")
            bias_gradients = jnp.zeros_like(biases)
        
        # Log gradient statistics for debugging
        weight_grad_norm = jnp.linalg.norm(weight_gradients)
        bias_grad_norm = jnp.linalg.norm(bias_gradients)
        
        if similarity_metric == 'yatProduct':
            logger.info(f"YAT Product Gradients - Weight norm: {weight_grad_norm:.6f}, "
                       f"Bias norm: {bias_grad_norm:.6f}, "
                       f"Has NaN: weight={weight_has_nan}, bias={bias_has_nan}")
            
            # Check individual gradient components for YAT
            weight_grad_max = jnp.max(jnp.abs(weight_gradients))
            weight_grad_mean = jnp.mean(jnp.abs(weight_gradients))
            logger.info(f"YAT Weight gradient stats - Max: {weight_grad_max:.6f}, Mean: {weight_grad_mean:.6f}")
            
            # Debug: Check YAT scores and predictions for first sample
            if batch_features.shape[0] > 0:
                first_sample = batch_features[0]
                first_label = batch_labels[0]
                
                # Get YAT scores
                yat_scores = calculator._yat_product(weights, first_sample)
                logger.info(f"YAT Scores for sample 0 - Min: {jnp.min(yat_scores):.6f}, "
                           f"Max: {jnp.max(yat_scores):.6f}, "
                           f"Range: {jnp.max(yat_scores) - jnp.min(yat_scores):.6f}, "
                           f"Mean: {jnp.mean(yat_scores):.6f}")
                logger.info(f"Raw YAT scores (before activation): {[f'{x:.6f}' for x in yat_scores]}")
                
                # Also show what happens after adding biases (this is what goes into softmax)
                scores_with_bias = yat_scores + biases
                logger.info(f"YAT scores + biases (input to softmax): {[f'{x:.6f}' for x in scores_with_bias]}")
                
                # Get full forward pass prediction
                forward_result = calculator.forward_pass(weights, biases, first_sample, similarity_metric, 'softmax')
                predicted_class = forward_result['predicted_class']
                confidence = forward_result['confidence']
                
                logger.info(f"YAT Prediction - True label: {first_label}, Predicted: {predicted_class}, "
                           f"Confidence: {confidence:.4f}")
                logger.info(f"YAT Activations (all {len(forward_result['activations'])} classes): {[f'{x:.4f}' for x in forward_result['activations']]}")
                
                # Check weight distribution
                nonzero_weights = jnp.sum(jnp.abs(weights) > 1e-8)
                total_weights = weights.size
                logger.info(f"Weight stats - Non-zero: {nonzero_weights}/{total_weights} ({100*nonzero_weights/total_weights:.1f}%)")
                logger.info(f"Model dimensions - Weights: {weights.shape}, Biases: {biases.shape}, Classes: {weights.shape[0]}")
                
                # Check dot products
                dot_products = jnp.dot(weights, first_sample)
                logger.info(f"Dot products (all {len(dot_products)} classes): {dot_products.tolist()}")
        
        # Apply gradient clipping for stability
        max_norm = 1.0
        weight_grad_norm = jnp.linalg.norm(weight_gradients)
        if weight_grad_norm > max_norm:
            weight_gradients = weight_gradients * (max_norm / weight_grad_norm)
            
        bias_grad_norm = jnp.linalg.norm(bias_gradients)
        if bias_grad_norm > max_norm:
            bias_gradients = bias_gradients * (max_norm / bias_grad_norm)
        
        # Compute loss separately to avoid tracing issues
        loss_value = self.compute_loss(weights, biases, batch_features, batch_labels, similarity_metric, activation_function)
        
        return {
            'weight_gradients': weight_gradients.tolist(),
            'bias_gradients': bias_gradients.tolist(),
            'loss': loss_value.tolist() if hasattr(loss_value, 'tolist') else float(loss_value)
        }
    
    def compute_optax_gradients(self, params: Tuple[jnp.ndarray, jnp.ndarray],
                               batch_features: jnp.ndarray, batch_labels: jnp.ndarray,
                               similarity_metric: str) -> Dict[str, Any]:
        """Compute gradients using Optax softmax cross-entropy loss"""
        
        # Ensure inputs have correct dtypes for gradient computation
        weights, biases = params
        weights = weights.astype(jnp.float64)
        biases = biases.astype(jnp.float64)
        batch_features = batch_features.astype(jnp.float64)
        batch_labels = batch_labels.astype(jnp.int32)
        
        params = (weights, biases)
        
        # Define loss function for gradient computation
        def loss_fn(params):
            return self.compute_optax_loss(params, batch_features, batch_labels, similarity_metric)
        
        # Compute loss and gradients
        loss_value, gradients = jax.value_and_grad(loss_fn)(params)
        weight_gradients, bias_gradients = gradients
        
        # Check for NaN or infinity in gradients
        weight_has_nan = jnp.any(jnp.isnan(weight_gradients)) or jnp.any(jnp.isinf(weight_gradients))
        bias_has_nan = jnp.any(jnp.isnan(bias_gradients)) or jnp.any(jnp.isinf(bias_gradients))
        
        if weight_has_nan:
            logger.warning(f"NaN or infinity detected in weight gradients for {similarity_metric}, using zeros")
            weight_gradients = jnp.zeros_like(weights)
            
        if bias_has_nan:
            logger.warning(f"NaN or infinity detected in bias gradients for {similarity_metric}, using zeros")
            bias_gradients = jnp.zeros_like(biases)
        
        # Log gradient statistics for debugging
        weight_grad_norm = jnp.linalg.norm(weight_gradients)
        bias_grad_norm = jnp.linalg.norm(bias_gradients)
        
        logger.info(f"Optax Gradients - Loss: {loss_value:.6f}, Weight norm: {weight_grad_norm:.6f}, "
                   f"Bias norm: {bias_grad_norm:.6f}")
        
        # Apply gradient clipping for stability
        max_norm = 1.0
        if weight_grad_norm > max_norm:
            weight_gradients = weight_gradients * (max_norm / weight_grad_norm)
            
        if bias_grad_norm > max_norm:
            bias_gradients = bias_gradients * (max_norm / bias_grad_norm)
        
        return {
            'weight_gradients': weight_gradients,
            'bias_gradients': bias_gradients,
            'loss': loss_value,
            'gradient_norms': {
                'weight_gradient_norm': float(weight_grad_norm),
                'bias_gradient_norm': float(bias_grad_norm)
            }
        }
    
    def compute_accuracy(self, weights: jnp.ndarray, biases: jnp.ndarray,
                        test_features: jnp.ndarray, test_labels: jnp.ndarray,
                        similarity_metric: str, activation_function: str) -> float:
        """Compute accuracy on test data"""
        
        def predict_single(features):
            scores, activations = self._forward_pass_internal(weights, biases, features, similarity_metric, activation_function)
            return jnp.argmax(activations)
        
        # Vectorize predictions
        predictions = jax.vmap(predict_single)(test_features)
        correct = jnp.sum(predictions == test_labels)
        accuracy = correct / len(test_labels)
        
        return accuracy

class MNISTDatasetLoader:
    """Load different MNIST-style datasets from various sources including Kaggle"""
    
    def __init__(self, data_dir='./mnist_data'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Dataset URLs and info
        self.datasets = {
            'mnist': {
                'source': 'kaggle',
                'kaggle_dataset': 'oddrationale/mnist-in-csv',
                'train_file': 'mnist_train.csv',
                'test_file': 'mnist_test.csv',
                'classes': list(range(10)),
                'class_names': [str(i) for i in range(10)]
            },
            'fashion_mnist': {
                'source': 'kaggle',
                'kaggle_dataset': 'zalando-research/fashionmnist',
                'train_file': 'fashion-mnist_train.csv',
                'test_file': 'fashion-mnist_test.csv',
                'classes': list(range(10)),
                'class_names': ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 
                              'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']
            },
            'mnist_original': {
                'source': 'direct',
                'train_images': 'https://storage.googleapis.com/cvdf-datasets/mnist/train-images-idx3-ubyte.gz',
                'train_labels': 'https://storage.googleapis.com/cvdf-datasets/mnist/train-labels-idx1-ubyte.gz',
                'test_images': 'https://storage.googleapis.com/cvdf-datasets/mnist/t10k-images-idx3-ubyte.gz',
                'test_labels': 'https://storage.googleapis.com/cvdf-datasets/mnist/t10k-labels-idx1-ubyte.gz',
                'classes': list(range(10)),
                'class_names': [str(i) for i in range(10)]
            },
            'fashion_mnist_original': {
                'source': 'direct',
                'train_images': 'https://github.com/zalandoresearch/fashion-mnist/raw/master/data/fashion/train-images-idx3-ubyte.gz',
                'train_labels': 'https://github.com/zalandoresearch/fashion-mnist/raw/master/data/fashion/train-labels-idx1-ubyte.gz',
                'test_images': 'https://github.com/zalandoresearch/fashion-mnist/raw/master/data/fashion/t10k-images-idx3-ubyte.gz',
                'test_labels': 'https://github.com/zalandoresearch/fashion-mnist/raw/master/data/fashion/t10k-labels-idx1-ubyte.gz',
                'classes': list(range(10)),
                'class_names': ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat', 
                              'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot']
            },
            'digits_kaggle': {
                'source': 'kaggle',
                'kaggle_dataset': 'c/digit-recognizer',
                'train_file': 'train.csv',
                'test_file': 'test.csv',
                'classes': list(range(10)),
                'class_names': [str(i) for i in range(10)]
            },
            'mnist_pytorch': {
                'source': 'direct',
                'train_images': 'https://ossci-datasets.s3.amazonaws.com/mnist/train-images-idx3-ubyte.gz',
                'train_labels': 'https://ossci-datasets.s3.amazonaws.com/mnist/train-labels-idx1-ubyte.gz',
                'test_images': 'https://ossci-datasets.s3.amazonaws.com/mnist/t10k-images-idx3-ubyte.gz',
                'test_labels': 'https://ossci-datasets.s3.amazonaws.com/mnist/t10k-labels-idx1-ubyte.gz',
                'classes': list(range(10)),
                'class_names': [str(i) for i in range(10)]
            }
        }
        
        self.loaded_datasets = {}
    
    def check_kaggle_setup(self) -> bool:
        """Check if Kaggle API is properly set up"""
        try:
            result = subprocess.run(['kaggle', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"Kaggle API available: {result.stdout.strip()}")
                return True
            else:
                logger.warning("Kaggle API not found. Install with: pip install kaggle")
                return False
        except FileNotFoundError:
            logger.warning("Kaggle API not found. Install with: pip install kaggle")
            return False
    
    def download_kaggle_dataset(self, kaggle_dataset: str) -> bool:
        """Download a dataset from Kaggle"""
        if not self.check_kaggle_setup():
            return False
        
        try:
            # Create a subdirectory for this dataset
            dataset_dir = self.data_dir / kaggle_dataset.replace('/', '_')
            dataset_dir.mkdir(exist_ok=True)
            
            # Download the dataset
            logger.info(f"Downloading Kaggle dataset: {kaggle_dataset}")
            result = subprocess.run([
                'kaggle', 'datasets', 'download', '-d', kaggle_dataset, 
                '-p', str(dataset_dir), '--unzip'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Successfully downloaded {kaggle_dataset}")
                return True
            else:
                logger.error(f"Failed to download {kaggle_dataset}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error downloading Kaggle dataset {kaggle_dataset}: {e}")
            return False
    
    def download_kaggle_competition(self, competition: str) -> bool:
        """Download a competition dataset from Kaggle"""
        if not self.check_kaggle_setup():
            return False
        
        try:
            # Create a subdirectory for this competition
            comp_dir = self.data_dir / f"competition_{competition}"
            comp_dir.mkdir(exist_ok=True)
            
            # Download the competition data
            logger.info(f"Downloading Kaggle competition: {competition}")
            result = subprocess.run([
                'kaggle', 'competitions', 'download', '-c', competition, 
                '-p', str(comp_dir)
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                # Unzip all downloaded files
                for zip_file in comp_dir.glob('*.zip'):
                    with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                        zip_ref.extractall(comp_dir)
                    zip_file.unlink()  # Remove the zip file
                
                logger.info(f"Successfully downloaded competition {competition}")
                return True
            else:
                logger.error(f"Failed to download competition {competition}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error downloading Kaggle competition {competition}: {e}")
            return False
    
    def load_csv_dataset(self, csv_path: str, has_labels: bool = True) -> Dict[str, Any]:
        """Load a dataset from CSV format (common for Kaggle datasets)"""
        import pandas as pd
        
        df = pd.read_csv(csv_path)
        
        if has_labels:
            # First column is usually the label
            labels = df.iloc[:, 0].values
            features = df.iloc[:, 1:].values
        else:
            # No labels (test set)
            labels = None
            features = df.values
        
        # Reshape features to images if they're flattened (784 = 28x28)
        if features.shape[1] == 784:
            images = features.reshape(-1, 28, 28)
        else:
            # Assume square images
            img_size = int(np.sqrt(features.shape[1]))
            images = features.reshape(-1, img_size, img_size)
        
        # Normalize features
        features = features.astype(np.float32) / 255.0
        
        return {
            'images': images.astype(np.uint8),
            'labels': labels,
            'features': features
        }
    
    def download_file(self, url: str, filename: str) -> bool:
        """Download a file if it doesn't exist"""
        filepath = self.data_dir / filename
        if filepath.exists():
            return True
            
        try:
            logger.info(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, filepath)
            logger.info(f"Downloaded {filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to download {filename}: {e}")
            return False
    
    def load_idx_images(self, filepath: str) -> np.ndarray:
        """Load IDX format images"""
        with gzip.open(filepath, 'rb') as f:
            # Read header
            magic = int.from_bytes(f.read(4), 'big')
            num_images = int.from_bytes(f.read(4), 'big')
            rows = int.from_bytes(f.read(4), 'big')
            cols = int.from_bytes(f.read(4), 'big')
            
            # Read images
            images = np.frombuffer(f.read(), dtype=np.uint8)
            images = images.reshape(num_images, rows, cols)
            
            return images
    
    def load_idx_labels(self, filepath: str) -> np.ndarray:
        """Load IDX format labels"""
        with gzip.open(filepath, 'rb') as f:
            # Read header
            magic = int.from_bytes(f.read(4), 'big')
            num_labels = int.from_bytes(f.read(4), 'big')
            
            # Read labels
            labels = np.frombuffer(f.read(), dtype=np.uint8)
            
            return labels
    
    def preprocess_images(self, images: np.ndarray, normalize: bool = True, flatten: bool = True) -> np.ndarray:
        """Preprocess images: normalize and optionally flatten"""
        # Convert to float
        processed = images.astype(np.float32)
        
        # Normalize to [0, 1]
        if normalize:
            processed = processed / 255.0
        
        # Flatten if requested (for neural network input)
        if flatten:
            processed = processed.reshape(processed.shape[0], -1)
        
        return processed
    
    def load_dataset(self, dataset_name: str, subset: str = 'train', max_samples: int = None) -> Dict[str, Any]:
        """Load a complete dataset from various sources"""
        if dataset_name not in self.datasets:
            raise ValueError(f"Unknown dataset: {dataset_name}. Available: {list(self.datasets.keys())}")
        
        dataset_info = self.datasets[dataset_name]
        cache_key = f"{dataset_name}_{subset}"
        
        # Check cache
        if cache_key in self.loaded_datasets:
            logger.info(f"Using cached {dataset_name} {subset} dataset")
            cached = self.loaded_datasets[cache_key]
            if max_samples and max_samples < len(cached['labels']):
                return {
                    'images': cached['images'][:max_samples],
                    'labels': cached['labels'][:max_samples],
                    'features': cached['features'][:max_samples],
                    'class_names': cached['class_names'],
                    'dataset_name': dataset_name
                }
            return cached
        
        # Handle different data sources
        if dataset_info['source'] == 'kaggle':
            return self._load_kaggle_dataset(dataset_name, subset, max_samples)
        elif dataset_info['source'] == 'direct':
            return self._load_direct_dataset(dataset_name, subset, max_samples)
        else:
            # Fallback to traditional method
            return self._load_traditional_dataset(dataset_name, subset, max_samples)
    
    def _load_kaggle_dataset(self, dataset_name: str, subset: str, max_samples: int = None) -> Dict[str, Any]:
        """Load a dataset from Kaggle"""
        dataset_info = self.datasets[dataset_name]
        
        # Check if Kaggle is available
        if not self.check_kaggle_setup():
            logger.warning(f"Kaggle API not available for {dataset_name}. Please set up Kaggle API credentials.")
            logger.info("See KAGGLE_SETUP.md for setup instructions.")
            
            # Try backup as last resort
            backup_names = [f"{dataset_name}_original", f"{dataset_name}_pytorch", "mnist_pytorch"]
            for backup_name in backup_names:
                if backup_name in self.datasets and backup_name != dataset_name:
                    logger.info(f"Trying backup dataset as last resort: {backup_name}")
                    try:
                        return self._load_direct_dataset(backup_name, subset, max_samples)
                    except Exception as backup_e:
                        logger.error(f"Backup dataset {backup_name} also failed: {str(backup_e)}")
                        continue
            
            # Provide helpful error message
            raise RuntimeError(
                f"Cannot load {dataset_name} dataset. Kaggle API not available and backup sources failed.\n"
                f"Please:\n"
                f"1. Set up Kaggle API credentials (see KAGGLE_SETUP.md)\n"
                f"2. Or use a working dataset source\n"
                f"3. Available datasets: {list(self.datasets.keys())}"
            )
        
        try:
            # Download if needed
            if not self.download_kaggle_dataset(dataset_info['kaggle_dataset']):
                if 'c/' in dataset_info['kaggle_dataset']:
                    # Try as competition
                    competition = dataset_info['kaggle_dataset'].replace('c/', '')
                    if not self.download_kaggle_competition(competition):
                        raise RuntimeError(f"Failed to download Kaggle dataset: {dataset_info['kaggle_dataset']}")
            
            # Find the CSV file
            dataset_dir = self.data_dir / dataset_info['kaggle_dataset'].replace('/', '_')
            if 'c/' in dataset_info['kaggle_dataset']:
                dataset_dir = self.data_dir / f"competition_{dataset_info['kaggle_dataset'].replace('c/', '')}"
            
            csv_filename = dataset_info[f'{subset}_file']
            csv_path = dataset_dir / csv_filename
            
            if not csv_path.exists():
                # Try to find any CSV file that might match
                csv_files = list(dataset_dir.glob('*.csv'))
                if csv_files:
                    csv_path = csv_files[0]
                    logger.warning(f"Using {csv_path.name} instead of {csv_filename}")
                else:
                    raise FileNotFoundError(f"Could not find {csv_filename} in {dataset_dir}")
            
            # Load the CSV data
            has_labels = subset == 'train' or 'train' in csv_filename.lower()
            data = self.load_csv_dataset(str(csv_path), has_labels=has_labels)
            
            # Limit samples if requested
            if max_samples and data['labels'] is not None and max_samples < len(data['labels']):
                data['images'] = data['images'][:max_samples]
                data['labels'] = data['labels'][:max_samples]
                data['features'] = data['features'][:max_samples]
            
            result = {
                'images': data['images'],
                'labels': data['labels'],
                'features': data['features'],
                'class_names': dataset_info['class_names'],
                'dataset_name': dataset_name
            }
            
            # Cache the result
            cache_key = f"{dataset_name}_{subset}"
            self.loaded_datasets[cache_key] = result
            
            logger.info(f"✅ Loaded {len(data['labels']) if data['labels'] is not None else len(data['features'])} samples from Kaggle dataset {dataset_name} {subset}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to load Kaggle dataset {dataset_name}: {str(e)}")
            
            # Try backup as last resort
            backup_names = [f"{dataset_name}_original", f"{dataset_name}_pytorch", "mnist_pytorch"]
            for backup_name in backup_names:
                if backup_name in self.datasets and backup_name != dataset_name:
                    logger.info(f"Trying backup dataset as last resort: {backup_name}")
                    try:
                        return self._load_direct_dataset(backup_name, subset, max_samples)
                    except Exception as backup_e:
                        logger.error(f"Backup dataset {backup_name} also failed: {str(backup_e)}")
                        continue
            
            # Final error
            raise RuntimeError(
                f"All attempts to load {dataset_name} failed.\n"
                f"Kaggle error: {str(e)}\n"
                f"Please check:\n"
                f"1. Kaggle API credentials are correct\n"
                f"2. Dataset '{dataset_info['kaggle_dataset']}' exists and is accessible\n"
                f"3. Internet connection is working\n"
                f"See KAGGLE_SETUP.md for detailed setup instructions."
            )
    
    def _load_direct_dataset(self, dataset_name: str, subset: str, max_samples: int = None) -> Dict[str, Any]:
        """Load a dataset from direct download links (GitHub, etc.)"""
        dataset_info = self.datasets[dataset_name]
        cache_key = f"{dataset_name}_{subset}"
        
        # Download files if needed
        images_filename = f"{dataset_name}_{subset}_images.gz"
        labels_filename = f"{dataset_name}_{subset}_labels.gz"
        
        images_url = dataset_info[f'{subset}_images']
        labels_url = dataset_info[f'{subset}_labels']
        
        if not self.download_file(images_url, images_filename):
            raise RuntimeError(f"Failed to download {images_filename}")
        
        if not self.download_file(labels_url, labels_filename):
            raise RuntimeError(f"Failed to download {labels_filename}")
        
        # Load data
        images_path = self.data_dir / images_filename
        labels_path = self.data_dir / labels_filename
        
        logger.info(f"Loading {dataset_name} {subset} dataset...")
        images = self.load_idx_images(str(images_path))
        labels = self.load_idx_labels(str(labels_path))
        
        # Preprocess
        features = self.preprocess_images(images, normalize=True, flatten=True)
        
        # Limit samples if requested
        if max_samples and max_samples < len(labels):
            images = images[:max_samples]
            labels = labels[:max_samples]
            features = features[:max_samples]
        
        result = {
            'images': images,
            'labels': labels,
            'features': features,
            'class_names': dataset_info['class_names'],
            'dataset_name': dataset_name
        }
        
        # Cache the result
        self.loaded_datasets[cache_key] = result
        
        logger.info(f"Loaded {len(labels)} samples from direct download {dataset_name} {subset} dataset")
        return result
    
    def _load_traditional_dataset(self, dataset_name: str, subset: str, max_samples: int = None) -> Dict[str, Any]:
        """Load a dataset from traditional sources (fallback method)"""
        # This is a fallback method for any remaining legacy dataset configurations
        # It's essentially the same as _load_direct_dataset but with different logging
        dataset_info = self.datasets[dataset_name]
        cache_key = f"{dataset_name}_{subset}"
        
        # Download files if needed
        images_filename = f"{dataset_name}_{subset}_images.gz"
        labels_filename = f"{dataset_name}_{subset}_labels.gz"
        
        images_url = dataset_info[f'{subset}_images']
        labels_url = dataset_info[f'{subset}_labels']
        
        if not self.download_file(images_url, images_filename):
            raise RuntimeError(f"Failed to download {images_filename}")
        
        if not self.download_file(labels_url, labels_filename):
            raise RuntimeError(f"Failed to download {labels_filename}")
        
        # Load data
        images_path = self.data_dir / images_filename
        labels_path = self.data_dir / labels_filename
        
        logger.info(f"Loading {dataset_name} {subset} dataset...")
        images = self.load_idx_images(str(images_path))
        labels = self.load_idx_labels(str(labels_path))
        
        # Preprocess
        features = self.preprocess_images(images, normalize=True, flatten=True)
        
        # Limit samples if requested
        if max_samples and max_samples < len(labels):
            images = images[:max_samples]
            labels = labels[:max_samples]
            features = features[:max_samples]
        
        result = {
            'images': images,
            'labels': labels,
            'features': features,
            'class_names': dataset_info['class_names'],
            'dataset_name': dataset_name
        }
        
        # Cache the result
        self.loaded_datasets[cache_key] = result
        
        logger.info(f"Loaded {len(labels)} samples from traditional source {dataset_name} {subset} dataset")
        return result

# Initialize the calculator and dataset loader
calculator = JAXMNISTCalculator(use_ternary_weights=True)
dataset_loader = MNISTDatasetLoader()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'jax_devices': str(jax.devices())})

@app.route('/forward', methods=['POST'])
def forward_pass():
    """Perform forward pass for a single sample"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        features = jnp.array(data['features'])
        similarity_metric = data['similarity_metric']
        activation_function = data['activation_function']
        
        result = calculator.forward_pass(weights, biases, features, similarity_metric, activation_function)
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Error in forward pass: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/gradients', methods=['POST'])
def compute_gradients():
    """Compute gradients for a batch"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        batch_features = jnp.array(data['batch_features'])
        batch_labels = jnp.array(data['batch_labels'])
        similarity_metric = data['similarity_metric']
        activation_function = data['activation_function']
        
        result = calculator.compute_gradients(
            weights, biases, batch_features, batch_labels, 
            similarity_metric, activation_function
        )
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Error computing gradients: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/batch_forward', methods=['POST'])
def batch_forward():
    """Perform forward pass for multiple samples"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        batch_features = jnp.array(data['batch_features'])
        similarity_metric = data['similarity_metric']
        activation_function = data['activation_function']
        
        # Process each sample in the batch
        results = []
        for features in batch_features:
            result = calculator.forward_pass(weights, biases, features, similarity_metric, activation_function)
            results.append(result)
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error in batch forward pass: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/accuracy', methods=['POST'])
def compute_accuracy():
    """Compute accuracy on test data"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        test_features = jnp.array(data['test_features'])
        test_labels = jnp.array(data['test_labels'])
        similarity_metric = data['similarity_metric']
        activation_function = data['activation_function']
        
        accuracy = calculator.compute_accuracy(
            weights, biases, test_features, test_labels,
            similarity_metric, activation_function
        )
        
        return jsonify({
            'success': True,
            'accuracy': accuracy.tolist() if hasattr(accuracy, 'tolist') else float(accuracy)
        })
        
    except Exception as e:
        logger.error(f"Error computing accuracy: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/optimizer/init', methods=['POST'])
def init_optimizer():
    """Initialize Optax optimizer"""
    try:
        data = request.get_json()
        
        optimizer_type = data.get('optimizer_type', 'sgd')
        learning_rate = data.get('learning_rate', 0.01)
        momentum = data.get('momentum', 0.9)
        weight_decay = data.get('weight_decay', 0.0)
        
        # Initialize optimizer based on type
        if optimizer_type == 'sgd':
            if momentum > 0:
                optimizer = optax.sgd(learning_rate=learning_rate, momentum=momentum)
            else:
                optimizer = optax.sgd(learning_rate=learning_rate)
        elif optimizer_type == 'adam':
            optimizer = optax.adam(learning_rate=learning_rate, weight_decay=weight_decay)
        elif optimizer_type == 'adamw':
            optimizer = optax.adamw(learning_rate=learning_rate, weight_decay=weight_decay)
        else:
            return jsonify({
                'success': False,
                'error': f'Unknown optimizer type: {optimizer_type}'
            }), 400
        
        # Initialize optimizer state if we have weights
        if model_state['weights'] is not None and model_state['biases'] is not None:
            params = (model_state['weights'], model_state['biases'])
            opt_state = optimizer.init(params)
            
            # Store in global state
            model_state['optimizer'] = optimizer
            model_state['opt_state'] = opt_state
            
            return jsonify({
                'success': True,
                'message': f'Initialized {optimizer_type} optimizer',
                'config': {
                    'optimizer_type': optimizer_type,
                    'learning_rate': learning_rate,
                    'momentum': momentum if optimizer_type == 'sgd' else None,
                    'weight_decay': weight_decay if 'adam' in optimizer_type else None
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No model weights available. Initialize model first.'
            }), 400
        
    except Exception as e:
        logger.error(f"Error initializing optimizer: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/train_step_optax', methods=['POST'])
def train_step_optax():
    """Perform a single training step using Optax optimizer"""
    try:
        data = request.get_json()
        
        batch_features = jnp.array(data['batch_features'])
        batch_labels = jnp.array(data['batch_labels'])
        similarity_metric = data['similarity_metric']
        
        # Check if optimizer is initialized
        if model_state['optimizer'] is None or model_state['opt_state'] is None:
            return jsonify({
                'success': False,
                'error': 'Optimizer not initialized. Call /optimizer/init first.'
            }), 400
        
        # Check if model is initialized
        if model_state['weights'] is None or model_state['biases'] is None:
            return jsonify({
                'success': False,
                'error': 'Model not initialized. Initialize model first.'
            }), 400
        
        # Get current parameters
        params = (model_state['weights'], model_state['biases'])
        optimizer = model_state['optimizer']
        opt_state = model_state['opt_state']
        
        # Compute gradients using Optax loss
        grad_result = calculator.compute_optax_gradients(
            params, batch_features, batch_labels, similarity_metric
        )
        
        gradients = (grad_result['weight_gradients'], grad_result['bias_gradients'])
        
        # Apply optimizer update
        updates, new_opt_state = optimizer.update(gradients, opt_state, params)
        new_params = optax.apply_updates(params, updates)
        
        new_weights, new_biases = new_params
        
        # Handle ternary weight quantization if enabled
        if calculator.use_ternary_weights:
            # Store shadow weights for ternary training
            if 'shadow_weights' not in model_state:
                model_state['shadow_weights'] = new_weights.astype(jnp.float64)
            else:
                model_state['shadow_weights'] = new_weights
            
            # Quantize the weights
            new_weights = calculator._quantize_to_ternary(new_weights)
            
            logger.info(f"Applied ternary quantization. Distribution: {calculator._analyze_ternary_distribution(new_weights)}")
        
        # Update global model state
        model_state['weights'] = new_weights
        model_state['biases'] = new_biases
        model_state['opt_state'] = new_opt_state
        model_state['last_loss'] = float(grad_result['loss'])
        model_state['last_gradient_norm'] = grad_result['gradient_norms']['weight_gradient_norm']
        model_state['current_epoch'] += 1
        
        # Update weight distribution for ternary weights
        if calculator.use_ternary_weights:
            model_state['weight_distribution'] = calculator._analyze_ternary_distribution(new_weights)
        
        # Add to training history
        model_state['training_history'].append({
            'epoch': model_state['current_epoch'],
            'loss': float(grad_result['loss']),
            'gradient_norm': grad_result['gradient_norms']['weight_gradient_norm'],
            'optimizer': 'optax'
        })
        
        # Keep only last 100 history entries
        if len(model_state['training_history']) > 100:
            model_state['training_history'] = model_state['training_history'][-100:]
        
        return jsonify({
            'success': True,
            'result': {
                'new_weights': new_weights.tolist(),
                'new_biases': new_biases.tolist(),
                'loss': float(grad_result['loss']),
                'gradient_norms': grad_result['gradient_norms']
            }
        })
        
    except Exception as e:
        logger.error(f"Error in Optax training step: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/train_step', methods=['POST'])
def train_step():
    """Perform a single training step"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        batch_features = jnp.array(data['batch_features'])
        batch_labels = jnp.array(data['batch_labels'])
        similarity_metric = data['similarity_metric']
        activation_function = data['activation_function']
        learning_rate = data.get('learning_rate', 0.01)
        
        # Validate learning rate
        if learning_rate <= 0 or learning_rate > 1.0:
            logger.warning(f"Unusual learning rate: {learning_rate}, clamping to [0.001, 0.1]")
            learning_rate = max(0.001, min(0.1, learning_rate))
        
        # Compute gradients
        grad_result = calculator.compute_gradients(
            weights, biases, batch_features, batch_labels,
            similarity_metric, activation_function
        )
        
        # Update weights and biases
        weight_gradients = jnp.array(grad_result['weight_gradients'])
        bias_gradients = jnp.array(grad_result['bias_gradients'])
        
        # For ternary weights, we need to accumulate gradients to avoid losing small updates
        if calculator.use_ternary_weights:
            # Get or initialize accumulated gradients in model state
            if 'accumulated_weight_gradients' not in model_state:
                model_state['accumulated_weight_gradients'] = jnp.zeros_like(weights)
            
            # Accumulate gradients
            accumulated_grads = model_state['accumulated_weight_gradients'] + learning_rate * weight_gradients
            
            # Apply updates to a "shadow" copy of weights (continuous values)
            if 'shadow_weights' not in model_state:
                model_state['shadow_weights'] = weights.astype(jnp.float64)
            
            shadow_weights = model_state['shadow_weights'] - learning_rate * weight_gradients
            
            # Quantize the shadow weights to get the actual ternary weights
            new_weights = calculator._quantize_to_ternary(shadow_weights)
            
            # Update shadow weights and accumulated gradients
            model_state['shadow_weights'] = shadow_weights
            model_state['accumulated_weight_gradients'] = accumulated_grads
            
            logger.info(f"Ternary training - Shadow weight norm: {jnp.linalg.norm(shadow_weights):.6f}, "
                       f"Accumulated grad norm: {jnp.linalg.norm(accumulated_grads):.6f}")
            logger.info(f"Applied ternary quantization. Distribution: {calculator._analyze_ternary_distribution(new_weights)}")
        else:
            # Standard gradient update for continuous weights
            new_weights = weights - learning_rate * weight_gradients
        
        # Always update biases normally (they're not ternary)
        new_biases = biases - learning_rate * bias_gradients
        
        # Log training statistics for debugging (convert to Python scalars outside of traced functions)
        weight_grad_norm = jnp.linalg.norm(weight_gradients)
        bias_grad_norm = jnp.linalg.norm(bias_gradients)
        weight_norm = jnp.linalg.norm(weights)
        
        logger.info(f"Training step - Loss: {grad_result['loss']:.6f}, "
                   f"Weight grad norm: {weight_grad_norm:.6f}, "
                   f"Bias grad norm: {bias_grad_norm:.6f}, "
                   f"Weight norm: {weight_norm:.6f}, "
                   f"LR: {learning_rate}")
        
        # Update global model state
        model_state['weights'] = new_weights
        model_state['biases'] = new_biases
        model_state['last_loss'] = float(grad_result['loss'])
        model_state['last_gradient_norm'] = float(weight_grad_norm)
        model_state['current_epoch'] += 1
        
        # Update weight distribution for ternary weights
        if calculator.use_ternary_weights:
            model_state['weight_distribution'] = calculator._analyze_ternary_distribution(new_weights)
        
        # Add to training history
        model_state['training_history'].append({
            'epoch': model_state['current_epoch'],
            'loss': float(grad_result['loss']),
            'gradient_norm': float(weight_grad_norm),
            'learning_rate': learning_rate
        })
        
        # Keep only last 100 history entries
        if len(model_state['training_history']) > 100:
            model_state['training_history'] = model_state['training_history'][-100:]
        
        return jsonify({
            'success': True,
            'result': {
                'new_weights': new_weights.tolist(),
                'new_biases': new_biases.tolist(),
                'loss': grad_result['loss'],
                'weight_gradients': grad_result['weight_gradients'],
                'bias_gradients': grad_result['bias_gradients'],
                'gradient_norms': {
                    'weight_gradient_norm': float(weight_grad_norm),
                    'bias_gradient_norm': float(bias_grad_norm),
                    'weight_norm': float(weight_norm)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error in training step: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/test_yat', methods=['POST'])
def test_yat_product():
    """Test the YAT product similarity function specifically"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])  # Shape: (num_classes, features)
        features = jnp.array(data['features'])  # Shape: (features,)
        
        # Test YAT product
        yat_scores = calculator._yat_product(weights, features)
        
        # Also compute other similarities for comparison
        dot_scores = calculator._dot_product(weights, features)
        euclidean_scores = calculator._euclidean(weights, features)
        
        # Compute some diagnostic information
        dot_products = jnp.dot(weights, features)
        euclidean_distances = jnp.linalg.norm(weights - features, axis=-1)
        
        # Verify the new YAT formula is equivalent to the old one
        # Old formula: (dot²) / (||x-w||² + ε)
        old_yat_scores = []
        for i in range(weights.shape[0]):
            w = weights[i]
            old_dist_sq = jnp.sum((features - w) ** 2)
            old_score = (dot_products[i] ** 2) / (old_dist_sq + 1e-3)
            old_yat_scores.append(float(old_score))
        
        return jsonify({
            'success': True,
            'yat_scores_new': yat_scores.tolist(),
            'yat_scores_old_formula': old_yat_scores,
            'dot_scores': dot_scores.tolist(),
            'euclidean_scores': euclidean_scores.tolist(),
            'diagnostics': {
                'dot_products': dot_products.tolist(),
                'euclidean_distances': euclidean_distances.tolist(),
                'weights_norm': jnp.linalg.norm(weights).tolist(),
                'features_norm': jnp.linalg.norm(features).tolist(),
                'yat_new_min': jnp.min(yat_scores).tolist(),
                'yat_new_max': jnp.max(yat_scores).tolist(),
                'yat_new_mean': jnp.mean(yat_scores).tolist(),
                'formula_difference': [abs(new - old) for new, old in zip(yat_scores.tolist(), old_yat_scores)]
            }
        })
        
    except Exception as e:
        logger.error(f"Error testing YAT product: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/debug_gradients', methods=['POST'])
def debug_gradients():
    """Debug gradient computation for different similarity metrics"""
    try:
        data = request.get_json()
        
        weights = jnp.array(data['weights'])
        biases = jnp.array(data['biases'])
        batch_features = jnp.array(data['batch_features'][:5])  # Use only first 5 samples for debugging
        batch_labels = jnp.array(data['batch_labels'][:5])
        activation_function = data['activation_function']
        
        results = {}
        
        # Test different similarity metrics
        metrics_to_test = ['dotProduct', 'euclidean', 'yatProduct']
        
        for metric in metrics_to_test:
            try:
                grad_result = calculator.compute_gradients(
                    weights, biases, batch_features, batch_labels,
                    metric, activation_function
                )
                
                weight_grad_norm = jnp.linalg.norm(jnp.array(grad_result['weight_gradients']))
                
                results[metric] = {
                    'loss': grad_result['loss'],
                    'weight_gradient_norm': float(weight_grad_norm),
                    'weight_gradient_max': float(jnp.max(jnp.abs(jnp.array(grad_result['weight_gradients'])))),
                    'weight_gradient_mean': float(jnp.mean(jnp.abs(jnp.array(grad_result['weight_gradients'])))),
                    'bias_gradient_norm': float(jnp.linalg.norm(jnp.array(grad_result['bias_gradients'])))
                }
                
            except Exception as e:
                results[metric] = {'error': str(e)}
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error debugging gradients: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/kaggle/status', methods=['GET'])
def kaggle_status():
    """Check Kaggle API status and configuration"""
    try:
        is_setup = dataset_loader.check_kaggle_setup()
        
        status = {
            'kaggle_api_installed': is_setup,
            'available_kaggle_datasets': []
        }
        
        if is_setup:
            # List available Kaggle datasets from our configuration
            kaggle_datasets = {k: v for k, v in dataset_loader.datasets.items() if v['source'] == 'kaggle'}
            status['available_kaggle_datasets'] = list(kaggle_datasets.keys())
        
        return jsonify({
            'success': True,
            'status': status
        })
        
    except Exception as e:
        logger.error(f"Error checking Kaggle status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/kaggle/download', methods=['POST'])
def download_kaggle_dataset():
    """Download a specific dataset from Kaggle"""
    try:
        data = request.get_json()
        dataset_name = data.get('dataset_name')
        
        if not dataset_name:
            return jsonify({
                'success': False,
                'error': 'dataset_name is required'
            }), 400
        
        if dataset_name not in dataset_loader.datasets:
            return jsonify({
                'success': False,
                'error': f'Unknown dataset: {dataset_name}'
            }), 400
        
        dataset_info = dataset_loader.datasets[dataset_name]
        
        if dataset_info['source'] != 'kaggle':
            return jsonify({
                'success': False,
                'error': f'Dataset {dataset_name} is not a Kaggle dataset'
            }), 400
        
        # Download the dataset
        if 'c/' in dataset_info['kaggle_dataset']:
            # Competition dataset
            competition = dataset_info['kaggle_dataset'].replace('c/', '')
            success = dataset_loader.download_kaggle_competition(competition)
        else:
            # Regular dataset
            success = dataset_loader.download_kaggle_dataset(dataset_info['kaggle_dataset'])
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {dataset_name}',
                'kaggle_dataset': dataset_info['kaggle_dataset']
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Failed to download {dataset_name}'
            }), 400
        
    except Exception as e:
        logger.error(f"Error downloading Kaggle dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/datasets/available', methods=['GET'])
def get_available_datasets():
    """Get list of available datasets"""
    return jsonify({
        'success': True,
        'datasets': {
            name: {
                'classes': info['classes'],
                'class_names': info['class_names'],
                'description': f"{name.replace('_', ' ').title()} dataset with {len(info['classes'])} classes"
            }
            for name, info in dataset_loader.datasets.items()
        }
    })

@app.route('/datasets/load', methods=['POST'])
def load_dataset():
    """Load a dataset"""
    try:
        data = request.get_json()
        
        dataset_name = data.get('dataset_name', 'mnist')
        subset = data.get('subset', 'train')  # 'train' or 'test'
        max_samples = data.get('max_samples', None)
        
        dataset = dataset_loader.load_dataset(dataset_name, subset, max_samples)
        
        # Convert numpy arrays to lists for JSON serialization
        # Note: We don't send the actual images/features to avoid huge JSON responses
        return jsonify({
            'success': True,
            'dataset_info': {
                'dataset_name': dataset['dataset_name'],
                'num_samples': len(dataset['labels']),
                'num_classes': len(set(dataset['labels'])),
                'class_names': dataset['class_names'],
                'feature_shape': list(dataset['features'].shape),
                'image_shape': list(dataset['images'].shape),
                'sample_labels': dataset['labels'][:10].tolist(),  # First 10 labels as sample
            }
        })
        
    except Exception as e:
        logger.error(f"Error loading dataset: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/datasets/sample', methods=['POST'])
def get_dataset_sample():
    """Get a sample of data from a loaded dataset"""
    try:
        data = request.get_json()
        
        dataset_name = data.get('dataset_name', 'mnist')
        subset = data.get('subset', 'train')
        start_idx = data.get('start_idx', 0)
        count = data.get('count', 100)
        
        # Load dataset if not cached
        dataset = dataset_loader.load_dataset(dataset_name, subset)
        
        end_idx = min(start_idx + count, len(dataset['labels']))
        
        return jsonify({
            'success': True,
            'data': {
                'features': dataset['features'][start_idx:end_idx].tolist(),
                'labels': dataset['labels'][start_idx:end_idx].tolist(),
                'images': dataset['images'][start_idx:end_idx].tolist(),
                'class_names': dataset['class_names'],
                'start_idx': start_idx,
                'end_idx': end_idx,
                'total_samples': len(dataset['labels'])
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting dataset sample: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/datasets/batch', methods=['POST'])
def get_training_batch():
    """Get a training batch from a dataset"""
    try:
        data = request.get_json()
        
        dataset_name = data.get('dataset_name', 'mnist')
        subset = data.get('subset', 'train')
        batch_size = data.get('batch_size', 32)
        class_filter = data.get('class_filter', None)  # Optional: only include specific classes
        
        # Load dataset
        dataset = dataset_loader.load_dataset(dataset_name, subset)
        
        # Filter by classes if specified
        if class_filter is not None:
            mask = np.isin(dataset['labels'], class_filter)
            features = dataset['features'][mask]
            labels = dataset['labels'][mask]
        else:
            features = dataset['features']
            labels = dataset['labels']
        
        # Randomly sample a batch
        if len(labels) > batch_size:
            indices = np.random.choice(len(labels), size=batch_size, replace=False)
            batch_features = features[indices]
            batch_labels = labels[indices]
        else:
            batch_features = features
            batch_labels = labels
        
        return jsonify({
            'success': True,
            'batch': {
                'features': batch_features.tolist(),
                'labels': batch_labels.tolist(),
                'batch_size': len(batch_labels),
                'class_names': dataset['class_names']
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting training batch: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/datasets/preprocess', methods=['POST'])
def preprocess_image():
    """Preprocess a raw image for inference"""
    try:
        data = request.get_json()
        
        # Expect image as 28x28 array or flattened 784 array
        image_data = np.array(data['image'])
        
        # Reshape if needed
        if image_data.shape == (784,):
            image_data = image_data.reshape(28, 28)
        elif image_data.shape != (28, 28):
            raise ValueError(f"Expected image shape (28, 28) or (784,), got {image_data.shape}")
        
        # Preprocess
        processed = dataset_loader.preprocess_images(
            image_data.reshape(1, 28, 28), 
            normalize=data.get('normalize', True),
            flatten=True
        )
        
        return jsonify({
            'success': True,
            'processed_features': processed[0].tolist(),  # First (and only) sample
            'original_shape': image_data.shape,
            'processed_shape': processed.shape
        })
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/model/weights', methods=['GET'])
def get_model_weights():
    """Get current model weights and statistics"""
    try:
        if model_state['weights'] is None or model_state['biases'] is None:
            return jsonify({
                'success': False,
                'error': 'No model weights available. Train a model first.'
            }), 400
        
        weights = model_state['weights']
        biases = model_state['biases']
        
        # Compute weight statistics for each class
        weight_stats = []
        for i, (weight_vec, bias) in enumerate(zip(weights, biases)):
            stats = {
                'class_id': i,
                'weight_norm': float(np.linalg.norm(weight_vec)),
                'weight_mean': float(np.mean(weight_vec)),
                'weight_std': float(np.std(weight_vec)),
                'weight_min': float(np.min(weight_vec)),
                'weight_max': float(np.max(weight_vec))
            }
            weight_stats.append(stats)
        
        return jsonify({
            'success': True,
            'result': {
                'weights': weights.tolist() if hasattr(weights, 'tolist') else weights,
                'biases': biases.tolist() if hasattr(biases, 'tolist') else biases,
                'weight_stats': weight_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting model weights: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get model weights: {str(e)}'
        }), 500

@app.route('/model/weights', methods=['POST'])
def update_model_weights():
    """Update model weights"""
    try:
        data = request.get_json()
        
        if not data or 'weights' not in data or 'biases' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing weights or biases in request'
            }), 400
        
        # Update global model state
        model_state['weights'] = jnp.array(data['weights'])
        model_state['biases'] = jnp.array(data['biases'])
        
        # Compute updated statistics
        weights = model_state['weights']
        biases = model_state['biases']
        
        weight_stats = []
        for i, (weight_vec, bias) in enumerate(zip(weights, biases)):
            stats = {
                'class_id': i,
                'weight_norm': float(np.linalg.norm(weight_vec)),
                'weight_mean': float(np.mean(weight_vec)),
                'weight_std': float(np.std(weight_vec))
            }
            weight_stats.append(stats)
        
        return jsonify({
            'success': True,
            'result': {
                'updated_weights': weights.tolist(),
                'updated_biases': biases.tolist(),
                'weight_stats': weight_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating model weights: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to update model weights: {str(e)}'
        }), 500

@app.route('/model/activations', methods=['POST'])
def get_model_activations():
    """Get model activations for a specific input"""
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing features in request'
            }), 400
        
        features = jnp.array(data['features'])
        
        # Use provided weights/biases or global model state
        if 'weights' in data and 'biases' in data:
            weights = jnp.array(data['weights'])
            biases = jnp.array(data['biases'])
        elif model_state['weights'] is not None and model_state['biases'] is not None:
            weights = model_state['weights']
            biases = model_state['biases']
        else:
            return jsonify({
                'success': False,
                'error': 'No weights available. Provide weights or train a model first.'
            }), 400
        
        similarity_metric = data.get('similarity_metric', 'dotProduct')
        activation_function = data.get('activation_function', 'softmax')
        
        # Compute forward pass
        calculator = JAXMNISTCalculator()
        result = calculator.forward_pass(weights, biases, features, similarity_metric, activation_function)
        
        # Enhanced result with similarity breakdown
        similarity_breakdown = []
        for i, (score, activation) in enumerate(zip(result['scores'], result['activations'])):
            similarity_breakdown.append({
                'class_id': i,
                'similarity_score': float(score),
                'activation_value': float(activation)
            })
        
        enhanced_result = {
            'raw_similarities': result['scores'],
            'activations': result['activations'],
            'predicted_class': result['predicted_class'],
            'confidence': result['confidence'],
            'similarity_breakdown': similarity_breakdown
        }
        
        return jsonify({
            'success': True,
            'result': enhanced_result
        })
        
    except Exception as e:
        logger.error(f"Error getting model activations: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get model activations: {str(e)}'
        }), 500

@app.route('/model/weights/visualization', methods=['GET'])
def get_weight_visualization():
    """Get weight visualization data"""
    try:
        if model_state['weights'] is None:
            return jsonify({
                'success': False,
                'error': 'No model weights available. Train a model first.'
            }), 400
        
        weights = model_state['weights']
        class_id = request.args.get('class_id', type=int)
        colormap = request.args.get('colormap', 'diverging')
        
        # Global weight statistics
        all_weights = weights.flatten()
        global_stats = {
            'min_weight': float(np.min(all_weights)),
            'max_weight': float(np.max(all_weights)),
            'mean_weight': float(np.mean(all_weights)),
            'std_weight': float(np.std(all_weights))
        }
        
        # Process specific class or all classes
        weight_images = []
        
        if class_id is not None:
            # Single class
            if 0 <= class_id < len(weights):
                weight_vec = weights[class_id]
                weight_matrix = weight_vec.reshape(28, 28)
                
                # Normalize for visualization
                min_w, max_w = np.min(weight_vec), np.max(weight_vec)
                range_w = max_w - min_w if max_w != min_w else 1.0
                normalized_matrix = (weight_matrix - min_w) / range_w
                
                weight_images.append({
                    'class_id': class_id,
                    'weight_matrix': weight_matrix.tolist(),
                    'normalized_matrix': normalized_matrix.tolist(),
                    'stats': {
                        'min': float(min_w),
                        'max': float(max_w),
                        'mean': float(np.mean(weight_vec)),
                        'std': float(np.std(weight_vec)),
                        'norm': float(np.linalg.norm(weight_vec))
                    }
                })
        else:
            # All classes
            for i, weight_vec in enumerate(weights):
                weight_matrix = weight_vec.reshape(28, 28)
                
                # Normalize for visualization
                min_w, max_w = np.min(weight_vec), np.max(weight_vec)
                range_w = max_w - min_w if max_w != min_w else 1.0
                normalized_matrix = (weight_matrix - min_w) / range_w
                
                weight_images.append({
                    'class_id': i,
                    'weight_matrix': weight_matrix.tolist(),
                    'normalized_matrix': normalized_matrix.tolist(),
                    'stats': {
                        'min': float(min_w),
                        'max': float(max_w),
                        'mean': float(np.mean(weight_vec)),
                        'std': float(np.std(weight_vec)),
                        'norm': float(np.linalg.norm(weight_vec))
                    }
                })
        
        return jsonify({
            'success': True,
            'result': {
                'weight_images': weight_images,
                'global_stats': global_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting weight visualization: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get weight visualization: {str(e)}'
        }), 500

@app.route('/training/metrics', methods=['GET'])
def get_training_metrics():
    """Get current training metrics and progress"""
    try:
        return jsonify({
            'success': True,
            'result': {
                'current_epoch': model_state['current_epoch'],
                'total_epochs': 100,  # Default, could be configurable
                'current_loss': model_state['last_loss'],
                'train_accuracy': model_state['last_train_accuracy'],
                'test_accuracy': model_state['last_test_accuracy'],
                'learning_rate': 0.01,  # Default, could be configurable
                'gradient_norm': model_state['last_gradient_norm'],
                'weight_update_norm': 0.0,  # Could be computed if needed
                'is_training': model_state['is_training'],
                'training_history': model_state['training_history'][-50:]  # Last 50 entries
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting training metrics: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get training metrics: {str(e)}'
        }), 500

@app.route('/model/initialize_ternary', methods=['POST'])
def initialize_ternary_model():
    """Initialize model with ternary weights"""
    try:
        data = request.get_json()
        
        num_classes = data.get('num_classes', 10)
        num_features = data.get('num_features', 784)
        sparsity_ratio = data.get('sparsity_ratio', 0.3)
        
        # Initialize ternary weights
        weights, biases = calculator.initialize_ternary_weights(num_classes, num_features, sparsity_ratio)
        
        # Update global model state
        model_state['weights'] = weights
        model_state['biases'] = biases
        model_state['current_epoch'] = 0
        model_state['training_history'] = []
        
        # Analyze the initialized weights
        weight_distribution = calculator._analyze_ternary_distribution(weights)
        
        return jsonify({
            'success': True,
            'result': {
                'weights': weights.tolist(),
                'biases': biases.tolist(),
                'weight_distribution': weight_distribution,
                'model_info': {
                    'num_classes': num_classes,
                    'num_features': num_features,
                    'sparsity_ratio': sparsity_ratio,
                    'use_ternary_weights': calculator.use_ternary_weights
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error initializing ternary model: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to initialize ternary model: {str(e)}'
        }), 500

@app.route('/model/quantize_weights', methods=['POST'])
def quantize_current_weights():
    """Force quantization of current weights to ternary values"""
    try:
        if model_state['weights'] is None:
            return jsonify({
                'success': False,
                'error': 'No model weights available. Initialize a model first.'
            }), 400
        
        # Get current weights
        current_weights = model_state['weights']
        
        # Apply ternary quantization
        quantized_weights = calculator._quantize_to_ternary(current_weights)
        
        # Update model state
        model_state['weights'] = quantized_weights
        
        # Analyze before and after
        original_distribution = calculator._analyze_ternary_distribution(current_weights)
        quantized_distribution = calculator._analyze_ternary_distribution(quantized_weights)
        
        return jsonify({
            'success': True,
            'result': {
                'quantized_weights': quantized_weights.tolist(),
                'original_distribution': original_distribution,
                'quantized_distribution': quantized_distribution,
                'quantization_applied': True
            }
        })
        
    except Exception as e:
        logger.error(f"Error quantizing weights: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to quantize weights: {str(e)}'
        }), 500

@app.route('/model/ternary_stats', methods=['GET'])
def get_ternary_stats():
    """Get statistics about ternary weight distribution"""
    try:
        if model_state['weights'] is None:
            return jsonify({
                'success': False,
                'error': 'No model weights available.'
            }), 400
        
        weights = model_state['weights']
        
        # Overall distribution
        overall_distribution = calculator._analyze_ternary_distribution(weights)
        
        # Per-class distribution
        per_class_stats = []
        for i, class_weights in enumerate(weights):
            class_distribution = calculator._analyze_ternary_distribution(class_weights.reshape(1, -1))
            class_stats = {
                'class_id': i,
                'distribution': class_distribution,
                'weight_norm': float(jnp.linalg.norm(class_weights)),
                'unique_values': list(set(class_weights.tolist()))
            }
            per_class_stats.append(class_stats)
        
        # Check if weights are truly ternary
        flat_weights = weights.flatten()
        unique_values = jnp.unique(flat_weights)
        is_ternary = len(unique_values) <= 3 and all(val in [-1.0, 0.0, 1.0] for val in unique_values)
        
        return jsonify({
            'success': True,
            'result': {
                'is_ternary': bool(is_ternary),
                'unique_values': unique_values.tolist(),
                'overall_distribution': overall_distribution,
                'per_class_stats': per_class_stats,
                'total_parameters': int(weights.size),
                'use_ternary_weights': calculator.use_ternary_weights
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting ternary stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get ternary stats: {str(e)}'
        }), 500

@app.route('/model/toggle_ternary', methods=['POST'])
def toggle_ternary_weights():
    """Toggle ternary weights on/off"""
    try:
        data = request.get_json() or {}
        
        # Get the new setting (if provided) or toggle current setting
        if 'use_ternary_weights' in data:
            new_setting = bool(data['use_ternary_weights'])
        else:
            new_setting = not calculator.use_ternary_weights
        
        # Update the calculator setting
        calculator.use_ternary_weights = new_setting
        
        # Update model state
        model_state['use_ternary_weights'] = new_setting
        
        logger.info(f"Ternary weights {'enabled' if new_setting else 'disabled'}")
        
        return jsonify({
            'success': True,
            'result': {
                'use_ternary_weights': new_setting,
                'message': f"Ternary weights {'enabled' if new_setting else 'disabled'}"
            }
        })
        
    except Exception as e:
        logger.error(f"Error toggling ternary weights: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to toggle ternary weights: {str(e)}'
        }), 500

@app.route('/optimizer/status', methods=['GET'])
def get_optimizer_status():
    """Get current optimizer status and configuration"""
    try:
        if model_state['optimizer'] is None:
            return jsonify({
                'success': True,
                'result': {
                    'initialized': False,
                    'optimizer_type': None,
                    'config': None
                }
            })
        
        # Extract optimizer information (this is a bit tricky with Optax)
        optimizer_info = {
            'initialized': True,
            'has_state': model_state['opt_state'] is not None,
            'current_epoch': model_state['current_epoch']
        }
        
        return jsonify({
            'success': True,
            'result': optimizer_info
        })
        
    except Exception as e:
        logger.error(f"Error getting optimizer status: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get optimizer status: {str(e)}'
        }), 500

@app.route('/optimizer/reset', methods=['POST'])
def reset_optimizer():
    """Reset optimizer state"""
    try:
        model_state['optimizer'] = None
        model_state['opt_state'] = None
        
        return jsonify({
            'success': True,
            'message': 'Optimizer reset successfully'
        })
        
    except Exception as e:
        logger.error(f"Error resetting optimizer: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to reset optimizer: {str(e)}'
        }), 500

if __name__ == '__main__':
    logger.info("Starting JAX MNIST API server...")
    logger.info(f"JAX devices available: {jax.devices()}")
    app.run(debug=True, host='0.0.0.0', port=5000) 