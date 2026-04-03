import { randomUUID } from 'crypto';
import { isAlreadyDone, markPending, markDone, markFailed, getResult } from './idempotency.js';
import { logger } from './logger.js';

export async function withIdempotency(fn, options = {}) {
  const { operationId = null, ttlDays = 7 } = options;

  if (operationId) {
    const cached = await getResult(operationId);
    if (cached !== null) {
      logger.debug(`Operation ${operationId} found in cache`);
      return { result: cached, fromCache: true };
    }
  }

  const opId = operationId || randomUUID();

  await markPending(opId, ttlDays);

  try {
    const result = await fn(opId);
    await markDone(opId, result, ttlDays);
    return { result, fromCache: false };
  } catch (err) {
    await markFailed(opId, err);
    throw err;
  }
}
