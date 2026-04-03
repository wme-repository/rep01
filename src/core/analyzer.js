import { loadStore, saveStore } from '../services/store.js';
import { logger } from '../services/logger.js';
import { loadConfig } from '../config/index.js';

const DEFAULT_RETRYABLE = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '429', '503', '504'];

async function withRetry(fn, options = {}) {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = options;
  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) logger.info(`Retry succeeded on attempt ${attempt}`);
      return { result, attempts: attempt, finalError: null };
    } catch (err) {
      lastError = err;
      const isRetryable = DEFAULT_RETRYABLE.some(e =>
        err.message?.includes(e) || err.code === e || err.status === e
      );
      if (attempt > maxRetries + 1 || !isRetryable) {
        logger.error(`Non-retryable error after ${attempt} attempts: ${err.message}`);
        return { result: null, attempts: attempt, finalError: err };
      }
      logger.warn(`Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  return { result: null, attempts: maxRetries + 1, finalError: lastError };
}

export async function analyzeCompetitors(competitorUrls) {
  const store = await loadStore();
  const results = [];

  for (const url of competitorUrls) {
    const cacheKey = `competitor:${url}`;
    const cached = store.operations?.[cacheKey];

    // Skip if analyzed within 24h
    if (cached?.data && Date.now() - new Date(cached.detectedAt).getTime() < 86400000) {
      results.push(cached.data);
      logger.info(`[analyzer] Using cached data for ${url}`);
      continue;
    }

    try {
      const { result: data } = await withRetry(async () => {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'SEO-Ranker Bot/1.0' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        return extractCompetitorData(html, url);
      });

      if (!data) throw new Error('Failed to fetch after retries');

      const newStore = await loadStore();
      newStore.operations = newStore.operations || {};
      newStore.operations[cacheKey] = { data, detectedAt: new Date().toISOString() };
      await saveStore(newStore);

      results.push(data);
      logger.info(`[analyzer] Analyzed ${url}: ${data.keywords.length} keywords`);
    } catch (err) {
      logger.error(`[analyzer] Failed to fetch ${url}: ${err.message}`);
    }
  }

  return results;
}

function extractCompetitorData(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];

  const headings = [
    ...h1Matches.map(h => ({ level: 1, text: stripTags(h) })),
    ...h2Matches.map(h => ({ level: 2, text: stripTags(h) }))
  ];

  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = textContent.toLowerCase().split(' ').filter(w => w.length > 3);
  const wordCount = words.length;

  // Simple keyword extraction: most frequent words (excluding stop words)
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'this', 'that', 'with', 'have', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'will', 'other', 'about', 'many', 'then', 'them', 'these', 'some', 'would', 'into', 'has', 'more', 'two', 'day', 'also', 'after', 'most', 'she', 'way', 'where', 'your', 'than', 'this', 'that', 'with', 'have', 'from', 'they', 'been', 'have', 'were', 'said', 'each']);
  const freq = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return {
    url,
    title: titleMatch?.[1] || '',
    metaDescription: metaDescMatch?.[1] || '',
    keywords,
    headings,
    wordCount,
    detectedAt: new Date().toISOString()
  };
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}
