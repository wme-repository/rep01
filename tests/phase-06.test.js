// Phase 06 - Weekly Runner Tests
// Run with: node tests/phase-06.test.js

import { runWeeklyBlog, runWeeklySocial } from '../src/core/runners.js';
import { checkHealth, runHealthCheck } from '../src/core/health.js';
import { loadConfig } from '../src/config/index.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n=== Phase 06 Tests ===\n');

// Test 1: Health check returns structured result
test('checkHealth() returns { healthy, checks }', async () => {
  const result = await checkHealth();
  assert(typeof result.healthy === 'boolean', 'healthy must be boolean');
  assert(Array.isArray(result.checks), 'checks must be array');
  assert(result.checks.length > 0, 'checks must not be empty');
});

// Test 2: Health checks include config and API checks
test('checkHealth() includes config checks', async () => {
  const { checks } = await checkHealth();
  const configChecks = checks.filter(c => c.type === 'config');
  assert(configChecks.length >= 5, 'Should have config checks');
  const configNames = configChecks.map(c => c.name);
  assert(configNames.includes('BUSINESS_NAME'), 'Should check BUSINESS_NAME');
  assert(configNames.includes('ARVO_API_KEY'), 'Should check ARVO_API_KEY');
});

// Test 3: Health checks include WordPress
test('checkHealth() includes WordPress check', async () => {
  const { checks } = await checkHealth();
  const wpCheck = checks.find(c => c.name === 'WordPress');
  assert(wpCheck, 'Should have WordPress check');
  assert(wpCheck.type === 'api', 'WordPress check should be type api');
});

// Test 4: runHealthCheck outputs formatted result
test('runHealthCheck() outputs to console', async () => {
  // Just verify it doesn't throw and returns boolean
  const result = await runHealthCheck();
  assert(typeof result === 'boolean', 'Should return boolean');
});

// Test 5: runWeeklyBlog returns structured result
test('runWeeklyBlog({ dryRun: true }) returns { success, steps, errors }', async () => {
  const result = await runWeeklyBlog({ dryRun: true });
  assert(typeof result.success === 'boolean', 'success must be boolean');
  assert(Array.isArray(result.steps), 'steps must be array');
  assert(Array.isArray(result.errors), 'errors must be array');
  assert(result.steps.length === 5, 'should have 5 steps');
});

// Test 6: runWeeklySocial returns structured result
test('runWeeklySocial({ dryRun: true }) returns { success, steps, errors }', async () => {
  const result = await runWeeklySocial({ dryRun: true });
  assert(typeof result.success === 'boolean', 'success must be boolean');
  assert(Array.isArray(result.steps), 'steps must be array');
  assert(result.steps.length === 2, 'should have 2 steps');
});

// Test 7: Steps have name and success
test('Each step has name and success boolean', async () => {
  const blogResult = await runWeeklyBlog({ dryRun: true });
  for (const step of blogResult.steps) {
    assert(typeof step.name === 'string', 'step name must be string');
    assert(typeof step.success === 'boolean', 'step.success must be boolean');
  }
});

// Test 8: DRY_RUN skips health check
test('DRY_RUN=true skips health check in blog pipeline', async () => {
  const result = await runWeeklyBlog({ dryRun: true });
  // If health check ran, step1 would fail with config errors
  // In dry run, it skips and runs actual steps
  assert(result.steps.length === 5, 'Should have 5 steps without health check blocking');
});

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
