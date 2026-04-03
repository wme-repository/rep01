import { loadStore, saveStore } from '../../services/store.js';
import { loadConfig } from '../../config/index.js';
import { generateArticleFromCalendar } from '../../integrations/arvo.js';

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

    if (calendar.length === 0) {
      console.log('No editorial calendar found. Run "plan --calendar" first.');
      return;
    }

    // Find article by id or use first pending
    let articleToGenerate = parsed.id
      ? calendar.find(a => a.id === parsed.id)
      : calendar.find(a => a.status === 'planned');

    if (!articleToGenerate) {
      const generated = calendar.filter(a => a.status === 'generated');
      if (generated.length > 0) {
        console.log('All articles are generated. Use "publish --article" to publish.');
      } else {
        console.log('No pending articles found in calendar.');
      }
      return;
    }

    console.log(`Generating article: ${articleToGenerate.title}`);
    console.log(`Keyword: ${articleToGenerate.keyword}\n`);

    // Show article brief for approval
    console.log('=== ARTICLE BRIEF ===');
    console.log(`Title: ${articleToGenerate.title}`);
    console.log(`Meta: ${articleToGenerate.metaDescription}`);
    console.log(`Outline:\n${(articleToGenerate.outline || []).map(o => `  - ${o.heading}`).join('\n')}\n`);

    // Approval mode
    if (config.APPROVAL_MODE === 'true' && !parsed.yes && !parsed.y) {
      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise(resolve => {
        rl.question('Generate article with Arvo? (y/n): ', resolve);
      });
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.');
        return;
      }
    }

    const dryRun = parsed.dryRun || parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true';

    const result = await generateArticleFromCalendar(articleToGenerate, { dryRun });

    if (dryRun) {
      console.log('\n=== DRY RUN OUTPUT ===');
      console.log(result.article);
      return;
    }

    // Save generated article to store
    const newStore = await loadStore();
    const updatedCalendar = (newStore.articles?.editorialCalendar || []).map(a =>
      a.id === articleToGenerate.id
        ? { ...a, status: 'generated', generatedAt: new Date().toISOString(), article: result.article }
        : a
    );
    newStore.articles = newStore.articles || {};
    newStore.articles.editorialCalendar = updatedCalendar;
    await saveStore(newStore);

    console.log('\n=== GENERATED ARTICLE (excerpt) ===');
    console.log(result.article.substring(0, 500) + (result.article.length > 500 ? '\n...' : ''));
    console.log(`\nSaved to store. Status: generated`);
  } else {
    console.log('generate --article [--id X] [--dry-run] [--yes]  Generate article via Arvo');
  }
}
