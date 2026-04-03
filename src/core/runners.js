import { analyzeCompetitors } from './analyzer.js';
import { runKeywordResearch } from './keyword-research.js';
import { generateEditorialCalendar } from './editorial-planner.js';
import { generateArticleFromCalendar } from '../integrations/arvo.js';
import { publishFromCalendar } from '../integrations/wordpress.js';
import { getNewPosts } from './rss-reader.js';
import { generateSocialPost, publishSocialPost } from '../integrations/blotado.js';
import { loadConfig } from '../config/index.js';
import { loadStore, saveStore } from '../services/store.js';
import { logger } from '../services/logger.js';
import { checkHealth, notifyFailure } from './health.js';

async function runStep(name, fn, ...args) {
  logger.info(`[runner] Step: ${name}`);
  console.log(`\n▶ ${name}`);
  try {
    const result = await fn(...args);
    console.log(`  ✓ ${name} — OK`);
    return { name, success: true, result };
  } catch (err) {
    logger.error(`[runner] Step failed: ${name} — ${err.message}`);
    console.log(`  ✗ ${name} — FAILED: ${err.message}`);
    return { name, success: false, error: err.message };
  }
}

export async function runWeeklyBlog(options = {}) {
  const config = loadConfig();
  const dryRun = options.dryRun || process.env.DRY_RUN === 'true';

  console.log('═══════════════════════════════════════════');
  console.log('  WEEKLY BLOG PIPELINE');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('═══════════════════════════════════════════\n');

  // Health check (skip in dry run)
  if (!dryRun) {
    const health = await checkHealth();
    if (!health.healthy) {
      const failedChecks = health.checks.filter(c => !c.passed);
      const msg = `Health check failed: ${failedChecks.map(c => c.name).join(', ')}`;
      await notifyFailure(msg, { step: 'Health Check' });
      return { success: false, steps: [], errors: [msg] };
    }
    console.log('  ✓ Health check passed\n');
  }

  const results = { success: true, steps: [], errors: [] };
  const competitors = (config.COMPETITORS || '').split(',').map(s => s.trim()).filter(Boolean);

  // Step 1: Analyze competitors
  const step1 = await runStep('1. Analyze Competitors', async () => {
    if (competitors.length === 0) {
      throw new Error('No competitors configured. Set COMPETITORS env var.');
    }
    return analyzeCompetitors(competitors);
  });
  results.steps.push(step1);
  if (!step1.success) { results.success = false; results.errors.push(step1.error); }

  // Step 2: Keyword research
  const step2 = await runStep('2. Keyword Research', async () => {
    return runKeywordResearch();
  });
  results.steps.push(step2);
  if (!step2.success) { results.success = false; results.errors.push(step2.error); }

  // Step 3: Generate editorial calendar
  const step3 = await runStep('3. Editorial Calendar', async () => {
    const store = await loadStore();
    const keywords = store.operations?.['keyword-research']?.prioritized || [];
    if (keywords.length === 0) {
      throw new Error('No keywords found. Run keyword research first.');
    }
    return generateEditorialCalendar(keywords, { weeksAhead: 1 });
  });
  results.steps.push(step3);
  if (!step3.success) { results.success = false; results.errors.push(step3.error); }

  // Step 4: Generate articles
  const step4 = await runStep('4. Generate Articles', async () => {
    const store = await loadStore();
    const calendar = store.articles?.editorialCalendar || [];
    const pending = calendar.filter(a => a.status === 'planned');

    if (pending.length === 0) {
      console.log('  → No pending articles to generate.');
      return [];
    }

    const generated = [];
    for (const article of pending.slice(0, 1)) {
      const result = await generateArticleFromCalendar(article, { dryRun });
      generated.push(result);

      const updatedStore = await loadStore();
      const updatedCalendar = (updatedStore.articles?.editorialCalendar || []).map(a =>
        a.id === article.id
          ? { ...a, status: 'generated', generatedAt: new Date().toISOString(), article: result.article }
          : a
      );
      updatedStore.articles = updatedStore.articles || {};
      updatedStore.articles.editorialCalendar = updatedCalendar;
      await saveStore(updatedStore);
    }
    return generated;
  });
  results.steps.push(step4);
  if (!step4.success) { results.success = false; results.errors.push(step4.error); }

  // Step 5: Publish articles
  const step5 = await runStep('5. Publish to WordPress', async () => {
    return publishFromCalendar({ dryRun });
  });
  results.steps.push(step5);
  if (!step5.success) { results.success = false; results.errors.push(step5.error); }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  PIPELINE SUMMARY');
  console.log('═══════════════════════════════════════════');
  for (const step of results.steps) {
    console.log(`  ${step.success ? '✓' : '✗'} ${step.name}`);
  }
  console.log(`\n  Result: ${results.success ? 'SUCCESS' : 'FAILED'}`);
  if (results.errors.length > 0) {
    console.log(`  Errors: ${results.errors.join(', ')}`);
  }

  return results;
}

export async function runWeeklySocial(options = {}) {
  const config = loadConfig();
  const dryRun = options.dryRun || process.env.DRY_RUN === 'true';
  const platform = options.platform || 'twitter';
  const platforms = options.all ? ['twitter', 'linkedin', 'facebook'] : [platform];

  console.log('═══════════════════════════════════════════');
  console.log('  WEEKLY SOCIAL PIPELINE');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Platforms: ${platforms.join(', ')}`);
  console.log('═══════════════════════════════════════════\n');

  // Health check (skip in dry run)
  if (!dryRun) {
    const health = await checkHealth();
    if (!health.healthy) {
      const failedChecks = health.checks.filter(c => !c.passed);
      const msg = `Health check failed: ${failedChecks.map(c => c.name).join(', ')}`;
      await notifyFailure(msg, { step: 'Health Check' });
      return { success: false, steps: [], errors: [msg] };
    }
    console.log('  ✓ Health check passed\n');
  }

  const results = { success: true, steps: [], errors: [] };

  // Step 1: Read RSS
  const step1 = await runStep('1. Read RSS Feed', async () => {
    return getNewPosts();
  });
  results.steps.push(step1);
  if (!step1.success) { results.success = false; results.errors.push(step1.error); }

  // Step 2: Generate and publish social
  const step2 = await runStep(`2. Generate & Publish Social (${platforms.join(', ')})`, async () => {
    const newPosts = step1.result || [];
    if (newPosts.length === 0) {
      console.log('  → No new posts to process.');
      return [];
    }

    const output = [];
    for (const post of newPosts.slice(0, 5)) {
      for (const p of platforms) {
        const social = generateSocialPost(post, p);

        if (!dryRun) {
          try {
            const result = await publishSocialPost(social, p);
            output.push({ post: post.title, platform: p, result });
          } catch (err) {
            output.push({ post: post.title, platform: p, error: err.message });
          }
        } else {
          console.log(`  → [DRY RUN] ${post.title} → ${p}`);
          output.push({ post: post.title, platform: p, dryRun: true });
        }
      }
    }
    return output;
  });
  results.steps.push(step2);
  if (!step2.success) { results.success = false; results.errors.push(step2.error); }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  PIPELINE SUMMARY');
  console.log('═══════════════════════════════════════════');
  for (const step of results.steps) {
    console.log(`  ${step.success ? '✓' : '✗'} ${step.name}`);
  }
  console.log(`\n  Result: ${results.success ? 'SUCCESS' : 'FAILED'}`);

  return results;
}
