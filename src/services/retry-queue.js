import { logger } from './logger.js';

const DEFAULT_RETRYABLE = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503', '504'];

export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryableErrors = DEFAULT_RETRYABLE,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        logger.info(`Retry succeeded on attempt ${attempt}`);
      }
      return { result, attempts: attempt, finalError: null };
    } catch (err) {
      lastError = err;
      const isRetryable = retryableErrors.some(e =>
        err.message?.includes(e) || err.code === e || err.status === e
      );

      if (attempt > maxRetries + 1 || !isRetryable) {
        logger.error(`Non-retryable error after ${attempt} attempts: ${err.message}`);
        return { result: null, attempts: attempt, finalError: err };
      }

      logger.warn(`Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  return { result: null, attempts: maxRetries + 1, finalError: lastError };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryQueue {
  constructor(options = {}) {
    this.queue = [];
    this.maxConcurrent = options.maxConcurrent || 2;
    this.running = 0;
    this.options = options;
  }

  async add(operation, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, priority, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.process();
    });
  }

  async process() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      this.running++;
      try {
        const result = await withRetry(item.operation, this.options);
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      } finally {
        this.running--;
        this.process();
      }
    }
  }
}
