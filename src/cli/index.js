#!/usr/bin/env node

import chalk from 'chalk';

// CLI commands mapping
const commands = {
  analyze: { desc: 'Analyze competitors and identify keyword gaps', module: './commands/analyze.js' },
  plan: { desc: 'Generate editorial calendar from keywords', module: './commands/plan.js' },
  generate: { desc: 'Generate article content via Arvo', module: './commands/generate.js' },
  publish: { desc: 'Publish content to WordPress', module: './commands/publish.js' },
  'run-weekly': { desc: 'Execute weekly blog pipeline', module: './commands/run-weekly.js' },
  'read-rss': { desc: 'Read RSS feed and detect new posts', module: './commands/read-rss.js' },
  social: { desc: 'Generate and publish social media content', module: './commands/social.js' },
  'brand-kit': { desc: 'Brand kit status and validation', module: './commands/brand-kit.js' },
  help: { desc: 'Show this help message', module: './commands/help.js' },
};

const args = process.argv.slice(2);
const command = args[0] || 'help';
const subArgs = args.slice(1);

async function main() {
  // Load .env if exists
  try {
    const { config } = await import('dotenv');
    config();
  } catch (e) {
    // dotenv not required at this stage
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log('seo-ranker v1.0.0');
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(chalk.red(`Unknown command: ${command}`));
    console.log(chalk.gray(`Run 'node src/cli/index.js --help' for usage`));
    process.exit(1);
  }

  try {
    const mod = await import(cmd.module);
    await mod.default(subArgs);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error(chalk.red(`Command '${command}' not yet implemented`));
      console.log(chalk.gray('This is expected during Phase 1.'));
    } else {
      console.error(chalk.red(`Error in command '${command}':`), err.message);
      process.exit(1);
    }
  }
}

function showHelp() {
  console.log(chalk.bold('\n📊 SEO Ranker - Content Marketing Automation\n'));
  console.log(chalk.gray('Usage: node src/cli/index.js <command> [options]\n'));
  console.log(chalk.bold('Commands:'));
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${chalk.cyan(name.padEnd(15))} ${cmd.desc}`);
  }
  console.log(chalk.gray('\nOptions:'));
  console.log(`  ${chalk.cyan('--help, -h'.padEnd(15))} Show this help`);
  console.log(`  ${chalk.cyan('--version, -v'.padEnd(15))} Show version`);
  console.log(chalk.gray('\n'));
}

main();
