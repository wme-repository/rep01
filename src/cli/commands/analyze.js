import { analyzeCompetitors } from '../../core/analyzer.js';
import { loadConfig } from '../../config/index.js';

function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      parsed[key] = true;
      // check if next arg is a value
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        parsed[key] = args[++i];
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
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

  if (parsed.competitors || parsed.c) {
    const competitors = (config.COMPETITORS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (competitors.length === 0) {
      console.log('No competitors configured. Set COMPETITORS env var.');
      return;
    }

    console.log(`Analyzing ${competitors.length} competitors...`);
    const results = await analyzeCompetitors(competitors);

    console.log('\n=== Competitor Analysis ===');
    if (results.length === 0) {
      console.log('No results fetched. Check URLs and try again.');
      return;
    }
    for (const r of results) {
      console.log(`\n${r.url}`);
      console.log(`  Title: ${r.title || '(no title)'}`);
      console.log(`  Keywords (top 10): ${r.keywords.slice(0, 10).map(k => k.word).join(', ')}`);
      console.log(`  Word count: ${r.wordCount}`);
    }
  } else {
    console.log('analyze --competitors  Analyze competitor sites for keyword gaps');
  }
}
