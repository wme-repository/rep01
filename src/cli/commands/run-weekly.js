import { runWeeklyBlog, runWeeklySocial } from '../../core/runners.js';

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
      parsed[arg.slice(1).replace(/-/g, '_')] = true;
    } else {
      parsed._.push(arg);
    }
  }
  return parsed;
}

export default async function(args) {
  const parsed = parseArgs(args);

  if (parsed.check || parsed.health) {
    const { runHealthCheck } = await import('../../core/health.js');
    const healthy = await runHealthCheck();
    process.exit(healthy ? 0 : 1);
    return;
  }

  if (parsed.blog || parsed.b || parsed.all || parsed.a) {
    const options = {
      dryRun: parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true',
      platform: parsed.platform || 'twitter',
      all: parsed.all || parsed.a
    };

    if (parsed.all || parsed.a) {
      console.log('Running BOTH pipelines...\n');
      const blogResult = await runWeeklyBlog(options);
      console.log('\n');
      const socialResult = await runWeeklySocial({ ...options, platform: 'twitter' });

      console.log('\n═══════════════════════════════════════════');
      console.log('  FINAL RESULT');
      console.log('═══════════════════════════════════════════');
      console.log(`  Blog:   ${blogResult.success ? '✓ SUCCESS' : '✗ FAILED'}`);
      console.log(`  Social: ${socialResult.success ? '✓ SUCCESS' : '✗ FAILED'}`);
      return;
    }

    await runWeeklyBlog(options);
  } else if (parsed.social || parsed.s) {
    const options = {
      dryRun: parsed.dry_run || parsed.dry || process.env.DRY_RUN === 'true',
      platform: parsed.platform || 'twitter',
      all: parsed.all
    };
    await runWeeklySocial(options);
  } else {
    console.log('run-weekly --check                Run health check');
    console.log('run-weekly --blog [--dry-run]     Run full blog pipeline');
    console.log('run-weekly --social [--dry-run]    Run social pipeline');
    console.log('run-weekly --all [--dry-run]      Run both pipelines');
    console.log('Options: --dry-run, --platform twitter|linkedin|facebook');
  }
}
