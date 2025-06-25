// Neural Network Web Worker
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch(type) {
    case 'CALCULATE_PREDICTIONS':
      calculatePredictions(data);
      break;
    case 'CALCULATE_LOSS':
      calculateLoss(data);
      break;
    default:
      console.warn('Unknown worker message type:', type);
  }
};

function calculateScore(neuron, x, y, metric) {
  const dx = x - neuron.x;
  const dy = y - neuron.y;
  const distSq = dx * dx + dy * dy;
  
  switch (metric) {
    case 'dotProduct':
      return x * neuron.x + y * neuron.y;
    case 'euclidean':
      return -Math.sqrt(distSq);
    case 'myProduct':
      const dotProd = x * neuron.x + y * neuron.y;
      const rawScore = (dotProd * dotProd) / (distSq + 1e-6);
      return Math.min(rawScore, 50); // Cap at 50 to prevent exp() overflow
    default:
      return 0;
  }
}

function applyActivation(scores, activationFunction) {
  if (activationFunction === 'none' || scores.length === 0) return scores;
  
  switch (activationFunction) {
    case 'softmax':
      const max = Math.max(...scores);
      const exps = scores.map(s => Math.exp(s - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    case 'softermax':
      const transformed = scores.map(s => 1 + s);
      const sum2 = transformed.reduce((a, b) => a + b, 0);
      return transformed.map(s => s / sum2);
    case 'sigmoid':
      return scores.map(s => 1 / (1 + Math.exp(-s)));
    case 'relu':
      return scores.map(s => Math.max(0, s));
    case 'gelu':
      return scores.map(s => 0.5 * s * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (s + 0.044715 * Math.pow(s, 3)))));
    default:
      return scores;
  }
}

function calculatePredictions(data) {
  const { neurons, points, similarityMetric, activationFunction } = data;
  const results = [];
  
  for (let point of points) {
    const scores = neurons.map(n => calculateScore(n, point.x, point.y, similarityMetric));
    const activatedScores = applyActivation(scores, activationFunction);
    
    let maxScore = -Infinity;
    let winningNeuronId = null;
    
    activatedScores.forEach((score, i) => {
      if (score > maxScore) {
        maxScore = score;
        winningNeuronId = neurons[i].id;
      }
    });
    
    results.push({
      point,
      winningNeuronId,
      scores: activatedScores
    });
  }
  
  self.postMessage({
    type: 'PREDICTIONS_RESULT',
    data: results
  });
}

function calculateLoss(data) {
  const { neurons, dataPoints, similarityMetric, activationFunction } = data;
  
  if (neurons.length === 0 || dataPoints.length === 0) {
    self.postMessage({ type: 'LOSS_RESULT', data: 0 });
    return;
  }
  
  let totalLoss = 0;
  const numSamples = dataPoints.length;
  
  for (let point of dataPoints) {
    // Get scores for all neurons
    const scores = neurons.map(n => calculateScore(n, point.x, point.y, similarityMetric));
    
    // Apply activation function to get probabilities
    // For categorical cross-entropy, we need proper probability distribution
    let probabilities;
    
    if (activationFunction === 'none') {
      // For no activation, use softmax to get proper probabilities
      const maxScore = Math.max(...scores);
      const exps = scores.map(s => Math.exp(s - maxScore));
      const sumExps = exps.reduce((a, b) => a + b, 0);
      probabilities = exps.map(e => e / (sumExps + 1e-8)); // Add epsilon for stability
    } else {
      probabilities = applyActivation(scores, activationFunction);
    }
    
    // Ensure probabilities sum to 1 and are positive (numerical stability)
    const probSum = probabilities.reduce((a, b) => a + b, 0);
    if (probSum > 0) {
      probabilities = probabilities.map(p => Math.max(p / probSum, 1e-8));
    } else {
      // Fallback to uniform distribution if all probabilities are 0
      probabilities = probabilities.map(() => 1 / probabilities.length);
    }
    
    // Find the neuron index that corresponds to the correct class
    const correctClassIndex = neurons.findIndex(n => n.id === point.label);
    
    if (correctClassIndex !== -1) {
      // Standard categorical cross-entropy: -log(p_correct_class)
      const correctClassProbability = Math.max(probabilities[correctClassIndex], 1e-8);
      totalLoss += -Math.log(correctClassProbability);
    } else {
      // If no neuron matches the class, add maximum penalty
      totalLoss += -Math.log(1e-8);
    }
  }
  
  self.postMessage({
    type: 'LOSS_RESULT',
    data: totalLoss / numSamples
  });
} 