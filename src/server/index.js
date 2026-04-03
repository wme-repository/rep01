import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import storeRoutes from './routes/store.js';
import pipelineRoutes from './routes/pipeline.js';
import healthRoutes from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/store', storeRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/health', healthRoutes);

// Settings endpoints
const ENV_PATH = join(__dirname, '../../.env');

function parseEnvFile(content) {
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function stringifyEnvFile(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    const needsQuotes = typeof value === 'string' && (value.includes(' ') || value.includes('#'));
    const quoted = needsQuotes ? `"${value}"` : value;
    lines.push(`${key}=${quoted}`);
  }
  return lines.join('\n') + '\n';
}

app.get('/api/settings', (req, res) => {
  try {
    if (!fs.existsSync(ENV_PATH)) {
      return res.json({});
    }
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const settings = parseEnvFile(content);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    const content = stringifyEnvFile(settings);
    fs.writeFileSync(ENV_PATH, content, 'utf8');
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production
const distPath = join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SEO Ranker API server running on http://localhost:${PORT}`);
});
