import { readFile } from 'fs/promises';
import { resolve } from 'path';

let cachedKit = null;

export async function loadBrandKit() {
  if (cachedKit) return cachedKit;

  const kitPath = resolve(process.cwd(), process.env.BRAND_KIT_PATH || './brand-kit', 'brand.json');

  try {
    const content = await readFile(kitPath, 'utf-8');
    const kit = JSON.parse(content);
    validateBrandKit(kit);
    cachedKit = kit;
    return kit;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Brand kit not found at ${kitPath}. Copy brand-kit/brand.example.json to brand.json and configure.`);
    }
    throw err;
  }
}

function validateBrandKit(kit) {
  const required = ['voice', 'tone', 'ctas', 'internalLinks', 'prohibitedWords', 'articleStructure'];
  const missing = required.filter(f => !kit[f]);
  if (missing.length > 0) {
    throw new Error(`Brand kit invalid: missing fields: ${missing.join(', ')}`);
  }
}

export function getCachedBrandKit() {
  if (!cachedKit) {
    throw new Error('Brand kit not loaded. Call loadBrandKit() first.');
  }
  return cachedKit;
}

export function clearBrandKitCache() {
  cachedKit = null;
}
