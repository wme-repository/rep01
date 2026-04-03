import { loadStore, saveStore } from './store.js';
import { logger } from './logger.js';

const DEFAULT_TTL_DAYS = 7;

export async function isAlreadyDone(operationId) {
  const store = await loadStore();
  const op = store.operations[operationId];
  if (!op) return false;
  if (op.status === 'done') {
    if (op.completedAt) {
      const ttl = op.ttlDays || DEFAULT_TTL_DAYS;
      const completedDate = new Date(op.completedAt);
      const expires = new Date(completedDate.getTime() + ttl * 24 * 60 * 60 * 1000);
      if (new Date() > expires) {
        logger.debug(`Operation ${operationId} expired`);
        return false;
      }
    }
    return true;
  }
  return false;
}

export async function isPending(operationId) {
  const store = await loadStore();
  const op = store.operations[operationId];
  return op && op.status === 'pending';
}

export async function markPending(operationId, ttlDays = DEFAULT_TTL_DAYS) {
  const store = await loadStore();
  store.operations[operationId] = {
    id: operationId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ttlDays,
  };
  await saveStore(store);
}

export async function markDone(operationId, result, ttlDays = DEFAULT_TTL_DAYS) {
  const store = await loadStore();
  store.operations[operationId] = {
    ...store.operations[operationId],
    status: 'done',
    completedAt: new Date().toISOString(),
    result,
    ttlDays,
  };
  await saveStore(store);
  logger.info(`Operation ${operationId} marked as done`);
}

export async function getResult(operationId) {
  const store = await loadStore();
  const op = store.operations[operationId];
  if (op?.status === 'done') {
    return op.result;
  }
  return null;
}

export async function markFailed(operationId, error) {
  const store = await loadStore();
  store.operations[operationId] = {
    ...store.operations[operationId],
    status: 'failed',
    failedAt: new Date().toISOString(),
    error: error.message || String(error),
  };
  await saveStore(store);
  logger.error(`Operation ${operationId} marked as failed: ${error.message}`);
}
