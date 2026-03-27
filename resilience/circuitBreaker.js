const CircuitBreaker = require('opossum');

const CIRCUIT_BREAKER_OPTIONS = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

function createCircuitBreaker(fn) {
  const breaker = new CircuitBreaker(fn, CIRCUIT_BREAKER_OPTIONS);

  breaker.on('open', () => console.warn('Circuit breaker opened: OpenAI calls halted'));
  breaker.on('halfOpen', () => console.info('Circuit breaker half-open: testing OpenAI'));
  breaker.on('close', () => console.info('Circuit breaker closed: OpenAI calls resumed'));

  return breaker;
}

module.exports = { createCircuitBreaker };
