# Kaggle API Setup Guide

**Important**: This API now primarily relies on Kaggle for dataset downloads due to broken links from original sources (LeCun, etc.). Kaggle setup is **required** for most functionality.

## Why Kaggle?

The original MNIST dataset links from LeCun's website and other sources are no longer working (returning 404 errors). Kaggle provides reliable, fast downloads of these datasets in both original IDX format and convenient CSV format.

## Prerequisites

1. A Kaggle account (sign up at [kaggle.com](https://www.kaggle.com)) - **Required**
2. Python environment with the requirements installed

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Get Kaggle API Credentials

1. Go to [Kaggle.com](https://www.kaggle.com)
2. Sign in to your account
3. Go to your account settings: Click on your profile picture → Account
4. Scroll down to the "API" section
5. Click "Create New API Token"
6. This will download a `kaggle.json` file

## Step 3: Configure Kaggle API

### Option A: Environment Variables (Recommended)
Set these environment variables with your Kaggle credentials:

```bash
export KAGGLE_USERNAME=your_username
export KAGGLE_KEY=your_api_key
```

### Option B: Kaggle.json File
Place the downloaded `kaggle.json` file in one of these locations:

**Windows:**
```
C:\Users\<username>\.kaggle\kaggle.json
```

**Linux/Mac:**
```
~/.kaggle/kaggle.json
```

Make sure the file has proper permissions:
```bash
chmod 600 ~/.kaggle/kaggle.json
```

## Step 4: Test the Setup

Start the API server and test the Kaggle connection:

```bash
python app.py
```

Then test with curl:
```bash
curl http://localhost:5000/kaggle/status
```

You should see a response indicating that Kaggle API is available.

## Available Datasets

The API now supports these datasets (prioritizing Kaggle sources):

### Primary Datasets (Kaggle - Recommended)

1. **mnist** - MNIST in CSV format (Default)
   - Source: Kaggle (`oddrationale/mnist-in-csv`)
   - Files: `mnist_train.csv`, `mnist_test.csv`
   - Format: CSV with labels in first column
   - **This is now the default MNIST dataset**

2. **fashion_mnist** - Fashion-MNIST in CSV format (Default)
   - Source: Kaggle (`zalando-research/fashionmnist`)
   - Files: `fashion-mnist_train.csv`, `fashion-mnist_test.csv`
   - Format: CSV with labels in first column

3. **digits_kaggle** - Digit Recognizer Competition
   - Source: Kaggle Competition (`digit-recognizer`)
   - Files: `train.csv`, `test.csv`
   - Note: Requires accepting competition rules

### Backup Datasets (Direct Download)

4. **mnist_original** - Original MNIST IDX format
   - Source: GitHub mirror
   - Format: IDX binary files
   - Use only if Kaggle is unavailable

5. **fashion_mnist_original** - Original Fashion-MNIST IDX format
   - Source: GitHub mirror
   - Format: IDX binary files
   - Use only if Kaggle is unavailable

## Usage Examples

### Check Kaggle Status
```bash
curl http://localhost:5000/kaggle/status
```

### Download a Dataset
```bash
curl -X POST http://localhost:5000/kaggle/download \
  -H "Content-Type: application/json" \
  -d '{"dataset_name": "mnist"}'
```

### Load the Default MNIST Dataset (Kaggle)
```bash
curl -X POST http://localhost:5000/datasets/load \
  -H "Content-Type: application/json" \
  -d '{"dataset_name": "mnist", "subset": "train", "max_samples": 1000}'
```

### Load Fashion-MNIST
```bash
curl -X POST http://localhost:5000/datasets/load \
  -H "Content-Type: application/json" \
  -d '{"dataset_name": "fashion_mnist", "subset": "train"}'
```

## Troubleshooting

### "Kaggle API not found"
- Make sure you installed the kaggle package: `pip install kaggle`
- Verify the kaggle command works: `kaggle --version`

### "Unauthorized"
- Check your API credentials in `kaggle.json` or environment variables
- Make sure the `kaggle.json` file has correct permissions (600)

### "Dataset not found"
- Verify the dataset exists on Kaggle
- Check if you have access to the dataset (some require accepting competition rules)

### "Permission denied"
- Some competitions require accepting terms and conditions on the Kaggle website
- Visit the competition page and accept the rules before downloading

### "Failed to download from original sources"
- This is expected! The original LeCun links are broken
- Use the Kaggle datasets instead (they're faster and more reliable)
- Set up Kaggle API credentials to access datasets

## Migration Notes

If you were using the API before this update:

- `mnist` now refers to the Kaggle CSV version (was IDX format)
- `fashion_mnist` now refers to the Kaggle CSV version (was IDX format)
- Original IDX formats are available as `mnist_original` and `fashion_mnist_original`
- Kaggle setup is now required for most functionality

## Security Notes

- Never commit `kaggle.json` to version control
- Use environment variables in production environments
- Keep your API key secure and rotate it periodically 