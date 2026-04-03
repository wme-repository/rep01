import chalk from 'chalk';

export default async function(args) {
  const action = args[0];

  if (action === '--validate' || action === '-v') {
    console.log('Validating brand kit...\n');
    try {
      const { loadBrandKit } = await import('../../core/brand-kit.js');
      const kit = await loadBrandKit();
      console.log(chalk.green('✓ Brand kit loaded successfully'));
      console.log(`  Voice: ${kit.voice.values.description}`);
      console.log(`  CTAs: ${Object.keys(kit.ctas).length} configured`);
      console.log(`  Prohibited words: ${kit.prohibitedWords.length}`);
      console.log(`  Internal links: ${Object.keys(kit.internalLinks).length}`);
    } catch (err) {
      console.error(chalk.red('✗ Brand kit validation failed:'), err.message);
      process.exit(1);
    }
    return;
  }

  console.log(chalk.bold('\n📋 Brand Kit Commands\n'));
  console.log('  node src/cli/index.js brand-kit          Show this help');
  console.log('  node src/cli/index.js brand-kit --validate  Validate brand kit');
  console.log();
}
