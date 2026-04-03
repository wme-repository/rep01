import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { rename, unlink } from 'fs/promises';

const STORE_PATH = resolve(process.cwd(), './context', 'store.json');

export async function ensureDir() {
  const dir = resolve(process.cwd(), './context');
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    // already exists
  }
}

export async function loadStore() {
  try {
    const content = await readFile(STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { operations: {}, articles: {}, social: {} };
    }
    throw err;
  }
}

export async function saveStore(store) {
  await ensureDir();
  const tmpPath = STORE_PATH + '.tmp';
  await writeFile(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
  try {
    await rename(tmpPath, STORE_PATH);
  } catch (err) {
    // Windows fallback
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    try { await unlink(tmpPath); } catch (_) {}
  }
}

export async function getContext(key) {
  const store = await loadStore();
  return store.operations[key] || null;
}

export async function setContext(key, value) {
  const store = await loadStore();
  store.operations[key] = value;
  await saveStore(store);
}

export async function recordOperation(opId, data) {
  const store = await loadStore();
  if (!store.operations[opId]) {
    store.operations[opId] = { id: opId, status: 'pending', createdAt: new Date().toISOString() };
  }
  Object.assign(store.operations[opId], data);
  await saveStore(store);
}

export const OPERATION_STATUS = {
  PENDING: 'pending',
  DONE: 'done',
  FAILED: 'failed',
};
