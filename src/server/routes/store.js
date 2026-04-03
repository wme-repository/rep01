import { Router } from 'express';
import { loadStore } from '../../services/store.js';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const store = await loadStore();
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/articles', async (req, res) => {
  try {
    const store = await loadStore();
    const calendar = store.articles?.editorialCalendar || [];
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/operations', async (req, res) => {
  try {
    const store = await loadStore();
    const ops = Object.values(store.operations || {}).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(ops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logsDir = resolve(process.cwd(), './logs');
    const files = await readdir(logsDir);
    const today = new Date().toISOString().split('T')[0];
    const logFile = files.find(f => f.includes(today)) || files[files.length - 1];

    if (!logFile) {
      return res.json([]);
    }

    const content = await readFile(join(logsDir, logFile), 'utf-8');
    const lines = content.split('\n').filter(Boolean).slice(-100);
    res.json(lines.map(line => ({ raw: line })));
  } catch (err) {
    res.json([]);
  }
});

export default router;
