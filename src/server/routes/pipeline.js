import { Router } from 'express';
import { runWeeklyBlog, runWeeklySocial } from '../../core/runners.js';

const router = Router();

router.post('/blog', async (req, res) => {
  try {
    const options = { ...req.body, dryRun: req.body.dryRun ?? false };
    const result = await runWeeklyBlog(options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/social', async (req, res) => {
  try {
    const options = { ...req.body, dryRun: req.body.dryRun ?? false };
    const result = await runWeeklySocial(options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/all', async (req, res) => {
  try {
    const options = { ...req.body, dryRun: req.body.dryRun ?? false };
    const [blog, social] = await Promise.all([
      runWeeklyBlog(options),
      runWeeklySocial(options)
    ]);
    res.json({ blog, social });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
