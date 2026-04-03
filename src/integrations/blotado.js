import { loadConfig } from '../config/index.js';
import { logger } from '../services/logger.js';
import { loadStore, saveStore } from '../services/store.js';

const BLOTADO_API_URL = process.env.BLOTADO_API_URL || 'https://api.blotado.com/v1';

const PLATFORM_LIMITS = {
  twitter: { maxLength: 280, hasHashtags: true, hasEmoji: true },
  linkedin: { maxLength: 3000, hasHashtags: true, hasEmoji: false },
  facebook: { maxLength: 500, hasHashtags: true, hasEmoji: true }
};

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

export function generateSocialPost(article, platform = 'twitter') {
  const limit = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.twitter;
  const title = article.title || '';
  const link = article.link || '';

  let content = '';

  if (platform === 'twitter') {
    const hashtags = generateHashtags(title);
    const truncated = title.length > 200 ? title.substring(0, 197) + '...' : title;
    content = `${truncated} ${hashtags}\n\nRead more: ${link}`;
    if (content.length > limit.maxLength) {
      content = `${title.substring(0, 140)}...\n\nRead more: ${link}`;
    }
  } else if (platform === 'linkedin') {
    content = `${title}\n\nDiscover the key insights in our latest article. Click to read the full piece.\n\n${link}`;
    if (content.length > limit.maxLength) {
      content = `${title}\n\nFull article linked below.\n\n${link}`;
    }
  } else if (platform === 'facebook') {
    content = `${title}\n\nCheck out our latest article! Full read via the link below.\n\n${link}`;
    if (content.length > limit.maxLength) {
      content = `${title.substring(0, 280)}...\n\n${link}`;
    }
  } else {
    content = `${title}\n\n${link}`;
  }

  return {
    content,
    platform,
    articleTitle: title,
    articleLink: link,
    characterCount: content.length,
    generatedAt: new Date().toISOString()
  };
}

function generateHashtags(title) {
  const words = title.split(/\s+/)
    .filter(w => w.length > 4)
    .filter(w => !['about', 'which', 'their', 'would', 'there', 'these', 'those'].includes(w.toLowerCase()))
    .slice(0, 2);

  return words.map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
}

export async function publishSocialPost(post, platform = 'twitter') {
  const config = loadConfig();
  const apiKey = config.BLOTADO_API_KEY;
  const blogId = config.BLOTADO_BLOG_ID;

  const dryRun = process.env.DRY_RUN === 'true';

  if (dryRun) {
    logger.info('[blotado] DRY RUN - would publish social post');
    return {
      platform,
      content: post.content,
      url: `https://blotado.social/dry-run-${Date.now()}`,
      dryRun: true
    };
  }

  if (!apiKey || !blogId) {
    throw new Error('Blotado not configured. Set BLOTADO_API_KEY and BLOTADO_BLOG_ID in .env');
  }

  const endpoint = `${BLOTADO_API_URL}/blogs/${blogId}/posts`;

  const payload = {
    content: post.content,
    platform,
    status: 'scheduled'
  };

  try {
    const { result } = await withRetry(async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Blotado API error: ${response.status} - ${err}`);
      }

      return response.json();
    });

    logger.info(`[blotado] Published ${platform} post: ${result.url || result.id}`);
    return { platform, url: result.url || result.id, postId: result.id };
  } catch (err) {
    logger.error(`[blotado] Failed to publish ${platform}: ${err.message}`);
    throw err;
  }
}

export async function generateAndPublishSocial(articles, platforms = ['twitter', 'linkedin']) {
  const results = [];

  for (const article of articles) {
    const articleId = article.guid || article.link;

    // Idempotency check
    const store = await loadStore();
    const existing = store.social?.publishedPosts?.[articleId];
    if (existing && existing.length > 0) {
      logger.info(`[blotado] Article already has social posts: ${article.title}`);
      continue;
    }

    for (const platform of platforms) {
      const post = generateSocialPost(article, platform);
      const result = await publishSocialPost(post, platform);
      results.push({ article: article.title, platform, result });

      // Save idempotency
      const newStore = await loadStore();
      newStore.social = newStore.social || {};
      newStore.social.publishedPosts = newStore.social.publishedPosts || {};
      newStore.social.publishedPosts[articleId] = newStore.social.publishedPosts[articleId] || [];
      newStore.social.publishedPosts[articleId].push({ platform, ...result, publishedAt: new Date().toISOString() });
      await saveStore(newStore);
    }
  }

  return results;
}
