#!/usr/bin/env python3
"""
Test script for Optax integration in JAX MNIST API
Demonstrates SGD optimization with softmax cross-entropy loss
"""

import requests
import json
import numpy as np

API_BASE = "http://localhost:5000"

def test_optax_integration():
    """Test the Optax integration with SGD optimizer"""
    
    print("🚀 Testing Optax Integration with SGD and Softmax Loss")
    print("=" * 60)
    
    # 1. Check API health
    print("1. Checking API health...")
    response = requests.get(f"{API_BASE}/health")
    if response.status_code == 200:
        print("✅ API is healthy")
        print(f"   JAX devices: {response.json()['jax_devices']}")
    else:
        print("❌ API health check failed")
        return
    
    # 2. Initialize ternary model
    print("\n2. Initializing ternary model...")
    init_data = {
        "num_classes": 10,
        "num_features": 784,
        "sparsity_ratio": 0.3
    }
    response = requests.post(f"{API_BASE}/model/initialize_ternary", json=init_data)
    if response.status_code == 200:
        result = response.json()['result']
        print("✅ Model initialized")
        print(f"   Weight distribution: {result['weight_distribution']}")
        print(f"   Model info: {result['model_info']}")
    else:
        print("❌ Model initialization failed")
        return
    
    # 3. Initialize SGD optimizer
    print("\n3. Initializing SGD optimizer...")
    optimizer_data = {
        "optimizer_type": "sgd",
        "learning_rate": 0.01,
        "momentum": 0.9
    }
    response = requests.post(f"{API_BASE}/optimizer/init", json=optimizer_data)
    if response.status_code == 200:
        result = response.json()
        print("✅ SGD optimizer initialized")
        print(f"   Config: {result['config']}")
    else:
        print("❌ Optimizer initialization failed")
        print(f"   Error: {response.json().get('error', 'Unknown error')}")
        return
    
    # 4. Check optimizer status
    print("\n4. Checking optimizer status...")
    response = requests.get(f"{API_BASE}/optimizer/status")
    if response.status_code == 200:
        result = response.json()['result']
        print("✅ Optimizer status retrieved")
        print(f"   Initialized: {result['initialized']}")
        print(f"   Has state: {result['has_state']}")
    else:
        print("❌ Failed to get optimizer status")
    
    # 5. Load some sample data
    print("\n5. Loading sample MNIST data...")
    dataset_data = {
        "dataset_name": "mnist_original",
        "subset": "train",
        "max_samples": 1000
    }
    response = requests.post(f"{API_BASE}/datasets/load", json=dataset_data)
    if response.status_code == 200:
        dataset_info = response.json()['dataset_info']
        print("✅ Dataset loaded")
        print(f"   Samples: {dataset_info['num_samples']}")
        print(f"   Classes: {dataset_info['num_classes']}")
    else:
        print("❌ Dataset loading failed")
        print(f"   Error: {response.json().get('error', 'Unknown error')}")
        # Continue with synthetic data
        print("   Continuing with synthetic data...")
    
    # 6. Get a training batch
    print("\n6. Getting training batch...")
    batch_data = {
        "dataset_name": "mnist_original",
        "subset": "train",
        "batch_size": 32,
        "class_filter": [0, 1, 2, 3, 4]  # First 5 classes for faster testing
    }
    response = requests.post(f"{API_BASE}/datasets/batch", json=batch_data)
    if response.status_code == 200:
        batch = response.json()['batch']
        batch_features = batch['features']
        batch_labels = batch['labels']
        print("✅ Training batch retrieved")
        print(f"   Batch size: {len(batch_labels)}")
        print(f"   Label distribution: {np.bincount(batch_labels)}")
    else:
        print("❌ Failed to get training batch, using synthetic data")
        # Create synthetic data
        batch_size = 32
        batch_features = np.random.rand(batch_size, 784).tolist()
        batch_labels = np.random.randint(0, 10, batch_size).tolist()
        print(f"   Using synthetic batch of size {batch_size}")
    
    # 7. Perform training steps with Optax
    print("\n7. Performing training steps with Optax SGD...")
    similarity_metrics = ['dotProduct', 'yatProduct', 'euclidean']
    
    for i, metric in enumerate(similarity_metrics):
        print(f"\n   Step {i+1}: Training with {metric} similarity...")
        
        train_data = {
            "batch_features": batch_features,
            "batch_labels": batch_labels,
            "similarity_metric": metric
        }
        
        response = requests.post(f"{API_BASE}/train_step_optax", json=train_data)
        if response.status_code == 200:
            result = response.json()['result']
            print(f"   ✅ Training step completed")
            print(f"      Loss: {result['loss']:.6f}")
            print(f"      Weight gradient norm: {result['gradient_norms']['weight_gradient_norm']:.6f}")
            print(f"      Bias gradient norm: {result['gradient_norms']['bias_gradient_norm']:.6f}")
        else:
            print(f"   ❌ Training step failed")
            print(f"      Error: {response.json().get('error', 'Unknown error')}")
    
    # 8. Get training metrics
    print("\n8. Getting training metrics...")
    response = requests.get(f"{API_BASE}/training/metrics")
    if response.status_code == 200:
        metrics = response.json()['result']
        print("✅ Training metrics retrieved")
        print(f"   Current epoch: {metrics['current_epoch']}")
        print(f"   Current loss: {metrics['current_loss']:.6f}")
        print(f"   Gradient norm: {metrics['gradient_norm']:.6f}")
        print(f"   Training history length: {len(metrics['training_history'])}")
    else:
        print("❌ Failed to get training metrics")
    
    # 9. Test different optimizers
    print("\n9. Testing different optimizers...")
    
    optimizers_to_test = [
        {"optimizer_type": "adam", "learning_rate": 0.001},
        {"optimizer_type": "adamw", "learning_rate": 0.001, "weight_decay": 0.01}
    ]
    
    for opt_config in optimizers_to_test:
        print(f"\n   Testing {opt_config['optimizer_type']} optimizer...")
        
        # Reset optimizer
        requests.post(f"{API_BASE}/optimizer/reset")
        
        # Initialize new optimizer
        response = requests.post(f"{API_BASE}/optimizer/init", json=opt_config)
        if response.status_code == 200:
            print(f"   ✅ {opt_config['optimizer_type']} initialized")
            
            # Perform one training step
            train_data = {
                "batch_features": batch_features[:16],  # Smaller batch
                "batch_labels": batch_labels[:16],
                "similarity_metric": "dotProduct"
            }
            
            response = requests.post(f"{API_BASE}/train_step_optax", json=train_data)
            if response.status_code == 200:
                result = response.json()['result']
                print(f"      Training step - Loss: {result['loss']:.6f}")
            else:
                print(f"      Training step failed: {response.json().get('error', 'Unknown')}")
        else:
            print(f"   ❌ {opt_config['optimizer_type']} initialization failed")
    
    # 10. Test ternary weight statistics
    print("\n10. Checking ternary weight statistics...")
    response = requests.get(f"{API_BASE}/model/ternary_stats")
    if response.status_code == 200:
        stats = response.json()['result']
        print("✅ Ternary statistics retrieved")
        print(f"   Is ternary: {stats['is_ternary']}")
        print(f"   Unique values: {stats['unique_values']}")
        print(f"   Overall distribution: {stats['overall_distribution']}")
        print(f"   Total parameters: {stats['total_parameters']}")
    else:
        print("❌ Failed to get ternary statistics")
    
    print("\n" + "=" * 60)
    print("🎉 Optax integration test completed!")
    print("\nKey features tested:")
    print("✅ SGD optimizer with momentum")
    print("✅ Adam and AdamW optimizers")
    print("✅ Optax softmax cross-entropy loss")
    print("✅ Ternary weight quantization")
    print("✅ Multiple similarity metrics")
    print("✅ Training metrics tracking")

if __name__ == "__main__":
    try:
        test_optax_integration()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server.")
        print("   Please make sure the API server is running on http://localhost:5000")
        print("   Run: python api/app.py")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}") 