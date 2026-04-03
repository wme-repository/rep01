import { runKeywordResearch } from '../../core/keyword-research.js';
import { generateEditorialCalendar } from '../../core/editorial-planner.js';
import { loadStore } from '../../services/store.js';

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
  const parsed = parseArgs(args);

  if (parsed.keywords || parsed.k) {
    const count = parseInt(parsed.count || parsed.n || '10', 10);

    console.log('Running keyword research...\n');
    const keywords = await runKeywordResearch();

    if (keywords.length === 0) {
      console.log('No keywords found. Run "analyze --competitors" first.');
      return;
    }

    console.log(`\n=== Top ${Math.min(count, keywords.length)} Keyword Opportunities ===`);
    for (const kw of keywords.slice(0, count)) {
      console.log(`[${(kw.funnelStage || '?').toUpperCase().padEnd(14)}] ${kw.word} (score: ${kw.score?.toFixed(1) || '?'}, competitors: ${kw.competitorCount || 0})`);
    }
  } else if (parsed.calendar || parsed.cal) {
    const store = await loadStore();
    const kwData = store.operations?.['keyword-research'];

    if (!kwData?.prioritized) {
      console.log('No keyword research found. Run "plan --keywords" first.');
      return;
    }

    const weeks = parseInt(parsed.weeks || '4', 10);
    const output = parsed.json || parsed.output === 'json';

    const calendar = await generateEditorialCalendar(kwData.prioritized, { weeksAhead: weeks });

    if (output) {
      console.log(JSON.stringify(calendar, null, 2));
    } else {
      console.log('\n=== Editorial Calendar ===');
      for (const article of calendar) {
        console.log(`\n${article.targetDate} [${(article.funnelStage || '?').toUpperCase().padEnd(14)}]`);
        console.log(`  Keyword: ${article.keyword}`);
        console.log(`  Title: ${article.title}`);
        console.log(`  Priority: ${article.priority?.toFixed(1) || '?'}`);
      }
    }
  } else {
    console.log('plan --keywords [--count N]  Research keywords and find gaps');
    console.log('plan --calendar [--weeks N] [--json]  Generate editorial calendar from keywords');
  }
}
