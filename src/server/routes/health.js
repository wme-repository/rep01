import { Router } from 'express';
import { checkHealth } from '../../core/health.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await checkHealth();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
