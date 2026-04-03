import { loadStore, saveStore } from '../services/store.js';
import { logger } from '../services/logger.js';
import { loadConfig } from '../config/index.js';
import { parseString } from 'xml2js';

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
        return { result: null, attempts: attempt, finalError: err };
      }
      logger.warn(`Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  return { result: null, attempts: maxRetries + 1, finalError: lastError };
}

function parseXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function fetchFeed(feedUrl) {
  const { result } = await withRetry(async () => {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'SEO-Ranker Bot/1.0' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  });

  if (!result) throw new Error('Failed to fetch RSS feed after retries');

  const parsed = await parseXml(result);
  const channel = parsed.rss?.channel || parsed.feed || {};

  const items = channel.item
    ? (Array.isArray(channel.item) ? channel.item : [channel.item])
    : [];

  return items.map(item => ({
    title: item.title?._ || item.title || '',
    link: item.link?._ || item.link || (typeof item.link === 'object' ? item.link._ : '') || item.guid?._ || item.guid || '',
    pubDate: item.pubDate || item.date || new Date().toISOString(),
    content: item.description?._ || item.description || item.content?._ || item.content || '',
    guid: item.guid?._ || item.guid || item.link?._ || item.link || ''
  }));
}

export async function getNewPosts(feedUrl) {
  const config = loadConfig();
  const url = feedUrl || config.RSS_FEED_URL;

  if (!url) {
    throw new Error('RSS_FEED_URL not configured');
  }

  const store = await loadStore();
  const processed = new Set(store.social?.processedPosts || []);

  logger.info(`[rss] Fetching feed: ${url}`);
  const posts = await fetchFeed(url);

  const newPosts = posts.filter(post => {
    const id = post.guid || post.link;
    return id && !processed.has(id);
  });

  logger.info(`[rss] Found ${posts.length} posts, ${newPosts.length} new`);
  return newPosts;
}

export async function markPostsProcessed(posts) {
  const store = await loadStore();
  store.social = store.social || {};

  const currentProcessed = Array.isArray(store.social.processedPosts)
    ? store.social.processedPosts
    : [];

  const processedSet = new Set(currentProcessed);

  for (const post of posts) {
    const id = post.guid || post.link;
    if (id) {
      processedSet.add(id);
    }
  }

  store.social.processedPosts = Array.from(processedSet);
  await saveStore(store);

  logger.info(`[rss] Marked ${posts.length} posts as processed`);
}

export async function markSocialGenerated(posts) {
  // Mark posts as having social content generated (for RSS deduplication)
  const store = await loadStore();
  store.social = store.social || {};

  const currentProcessed = Array.isArray(store.social.processedPosts)
    ? store.social.processedPosts
    : [];

  const processedSet = new Set(currentProcessed);

  for (const post of posts) {
    const id = post.guid || post.link;
    if (id) {
      processedSet.add(id);
    }
  }

  store.social.processedPosts = Array.from(processedSet);
  await saveStore(store);

  logger.info(`[rss] Marked ${posts.length} posts as social-generated (processed)`);
}
