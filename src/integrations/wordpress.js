import { loadConfig } from '../config/index.js';
import { logger } from '../services/logger.js';
import { loadStore, saveStore } from '../services/store.js';

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

export async function publishArticle(article, options = {}) {
  const dryRun = options.dryRun || process.env.DRY_RUN === 'true';

  // Dry run doesn't need WordPress config
  if (dryRun) {
    const config = loadConfig();
    const wpUrl = config.WORDPRESS_URL || 'https://example.wordpress.com';
    logger.info('[wordpress] DRY RUN - would publish article');
    return {
      url: `${wpUrl}/?p=dry-run-${Date.now()}`,
      postId: null,
      dryRun: true,
      articleTitle: article.title
    };
  }

  const config = loadConfig();
  const wpUrl = config.WORDPRESS_URL;
  const wpUser = config.WORDPRESS_USER;
  const wpPassword = config.WORDPRESS_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpPassword) {
    throw new Error('WordPress not configured. Set WORDPRESS_URL, WORDPRESS_USER, WORDPRESS_APP_PASSWORD in .env');
  }

  const publishMode = config.PUBLISH_MODE || 'draft';
  const articleId = article.id || article.articleId;

  // Idempotency check via store
  if (articleId) {
    const store = await loadStore();
    const existing = store.operations?.[`wordpress:${articleId}`];
    if (existing?.url) {
      logger.info(`[wordpress] Article ${articleId} already published: ${existing.url}`);
      return { url: existing.url, postId: existing.postId, alreadyPublished: true };
    }
  }

  const endpoint = `${wpUrl}/wp-json/wp/v2/posts`;
  const auth = Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');

  const payload = {
    title: article.title,
    content: article.article || article.content,
    excerpt: article.metaDescription || '',
    status: publishMode === 'publish' ? 'publish' : 'draft',
    meta: {
      _keyword: article.keyword || '',
      _funnel_stage: article.funnelStage || ''
    }
  };

  try {
    const { result } = await withRetry(async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`WordPress API error: ${response.status} - ${err}`);
      }

      return response.json();
    });

    if (!result) throw new Error('WordPress API returned no result');

    const postUrl = result.link || `${wpUrl}/?p=${result.id}`;
    logger.info(`[wordpress] Published (${result.status}): ${postUrl}`);

    // Mark as published for idempotency
    if (articleId) {
      const store = await loadStore();
      store.operations = store.operations || {};
      store.operations[`wordpress:${articleId}`] = { url: postUrl, postId: result.id, publishedAt: new Date().toISOString() };
      await saveStore(store);
    }

    return {
      url: postUrl,
      postId: result.id,
      status: result.status
    };
  } catch (err) {
    logger.error(`[wordpress] Publish failed: ${err.message}`);
    throw err;
  }
}

export async function publishFromCalendar(options = {}) {
  const store = await loadStore();
  const calendar = store.articles?.editorialCalendar || [];

  const toPublish = calendar.filter(a => a.status === 'generated');

  if (toPublish.length === 0) {
    logger.info('[wordpress] No generated articles to publish');
    return [];
  }

  const results = [];
  for (const article of toPublish) {
    try {
      const result = await publishArticle(article, options);
      results.push(result);

      // Update calendar status
      const newStore = await loadStore();
      const updatedCalendar = (newStore.articles?.editorialCalendar || []).map(a =>
        a.id === article.id
          ? { ...a, status: 'published', publishedAt: new Date().toISOString(), wpUrl: result.url }
          : a
      );
      newStore.articles = newStore.articles || {};
      newStore.articles.editorialCalendar = updatedCalendar;
      await saveStore(newStore);
    } catch (err) {
      logger.error(`[wordpress] Failed to publish ${article.title}: ${err.message}`);
    }
  }

  return results;
}
