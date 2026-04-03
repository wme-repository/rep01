import { loadStore } from '../../services/store.js';
import { loadConfig } from '../../config/index.js';
import { publishArticle, publishFromCalendar } from '../../integrations/wordpress.js';

function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-/g, '_');
      parsed[key] = true;
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed[key] = args[++i];
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1).replace(/-/g, '_');
      parsed[key] = true;
    } else {
      parsed._.push(arg);
    }
  }
  return parsed;
}

export default async function(args) {
  const config = loadConfig();
  const parsed = parseArgs(args);

  if (parsed.article || parsed.a) {
    const store = await loadStore();
    const calendar = store.articles?.editorialCalendar || [];

    const dryRun = parsed.dryRun || parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true';
    const publishMode = config.PUBLISH_MODE || 'draft';

    console.log(`Publish mode: ${dryRun ? 'DRY RUN' : publishMode.toUpperCase()}`);

    if (parsed.id) {
      const article = calendar.find(a => a.id === parsed.id);
      if (!article) {
        console.log(`Article ${parsed.id} not found.`);
        return;
      }

      if (article.status !== 'generated') {
        console.log(`Article "${article.title}" status is "${article.status}". Generate first with "generate --article --id ${parsed.id}".`);
        return;
      }

      console.log(`Publishing: ${article.title}\n`);
      const result = await publishArticle(article, { dryRun });

      if (dryRun) {
        console.log('\n=== DRY RUN OUTPUT ===');
        console.log(`URL would be: ${result.url}`);
        console.log(`Title: ${article.title}`);
        console.log(`Content length: ${(article.article || '').length} chars`);
      } else {
        console.log(`\nPublished! URL: ${result.url}`);
      }
    } else if (parsed.all) {
      console.log('Publishing all generated articles...\n');
      const results = await publishFromCalendar({ dryRun });

      for (const r of results) {
        if (r.alreadyPublished) {
          console.log(`Already published: ${r.url}`);
        } else if (r.dryRun) {
          console.log(`[DRY RUN] Would publish: ${r.articleTitle}`);
        } else {
          console.log(`Published: ${r.url}`);
        }
      }
    } else {
      // Show status of all articles
      console.log('\n=== Article Status ===\n');
      for (const a of calendar) {
        const status = (a.status || 'unknown').padEnd(10);
        const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '';
        console.log(`[${status}] ${a.title} ${date}`);
      }
      console.log('\nUse: publish --article --id <id> [--dry-run]');
      console.log('Or:   publish --all [--dry-run]');
    }
  } else {
    console.log('publish --article [--id X] [--dry-run]  Publish article to WordPress');
    console.log('publish --all [--dry-run]               Publish all generated articles');
  }
}
