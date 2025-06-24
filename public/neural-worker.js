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
      return (x * neuron.x + y * neuron.y) / (Math.sqrt(distSq) + 1e-6);
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
  
  for (let point of dataPoints) {
    const scores = neurons.map(n => calculateScore(n, point.x, point.y, similarityMetric));
    const probabilities = applyActivation(scores.length > 1 ? scores : [scores[0], -scores[0]], activationFunction);
    
    const correctClassIndex = neurons.findIndex(n => n.id === point.label);
    if (correctClassIndex !== -1 && probabilities[correctClassIndex] > 0) {
      totalLoss -= Math.log(probabilities[correctClassIndex]);
    } else {
      totalLoss -= Math.log(1e-9);
    }
  }
  
  self.postMessage({
    type: 'LOSS_RESULT',
    data: totalLoss / dataPoints.length
  });
} 