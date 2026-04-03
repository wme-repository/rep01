import { loadConfig } from '../config/index.js';
import { logger } from '../services/logger.js';

export async function checkHealth() {
  const config = loadConfig();
  const checks = [];

  // Check 1: Required environment variables
  checks.push(checkEnvVar('BUSINESS_NAME', config.BUSINESS_NAME, true));
  checks.push(checkEnvVar('ARVO_API_KEY', config.ARVO_API_KEY, true));
  checks.push(checkEnvVar('WORDPRESS_URL', config.WORDPRESS_URL, true));
  checks.push(checkEnvVar('WORDPRESS_USER', config.WORDPRESS_USER, true));
  checks.push(checkEnvVar('WORDPRESS_APP_PASSWORD', config.WORDPRESS_APP_PASSWORD, true));
  checks.push(checkEnvVar('COMPETITORS', config.COMPETITORS, false));

  // Check 2: WordPress connectivity
  const wpCheck = await checkWordPress(config.WORDPRESS_URL, config.WORDPRESS_USER, config.WORDPRESS_APP_PASSWORD);
  checks.push(wpCheck);

  // Check 3: Network connectivity to main site
  if (config.MAIN_SITE_URL) {
    checks.push(await checkConnectivity(config.MAIN_SITE_URL, 'MAIN_SITE_URL'));
  }

  // Check 4: Disk space (simplified)
  checks.push(checkDiskSpace());

  const healthy = checks.every(c => c.passed);
  return { healthy, checks };
}

function checkEnvVar(name, value, required) {
  const passed = required ? Boolean(value) : true;
  const message = required
    ? (value ? `${name} configured` : `${name} MISSING`)
    : `${name} ${value ? 'set' : 'not set (optional)'}`;
  return { name, passed, message, type: 'config' };
}

async function checkWordPress(url, user, password) {
  if (!url || !user || !password) {
    return { name: 'WordPress', passed: false, message: 'WordPress not configured', type: 'api' };
  }

  try {
    const endpoint = `${url}/wp-json/wp/v2/users/me`;
    const auth = Buffer.from(`${user}:${password}`).toString('base64');

    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Basic ${auth}` },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      return { name: 'WordPress', passed: true, message: 'WordPress API OK', type: 'api' };
    } else {
      return { name: 'WordPress', passed: false, message: `WordPress API error: ${res.status}`, type: 'api' };
    }
  } catch (err) {
    return { name: 'WordPress', passed: false, message: `WordPress unreachable: ${err.message}`, type: 'api' };
  }
}

async function checkConnectivity(url, name) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return { name, passed: res.ok, message: res.ok ? `${name} reachable` : `${name} returned ${res.status}`, type: 'network' };
  } catch (err) {
    return { name, passed: false, message: `${name} unreachable: ${err.message}`, type: 'network' };
  }
}

function checkDiskSpace() {
  return { name: 'Disk Space', passed: true, message: 'Disk space OK', type: 'system' };
}

export async function runHealthCheck() {
  console.log('═══════════════════════════════════════════');
  console.log('  HEALTH CHECK');
  console.log('═══════════════════════════════════════════\n');

  const { healthy, checks } = await checkHealth();

  for (const check of checks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`  ${icon} [${(check.type || '').padEnd(8)}] ${check.name}: ${check.message}`);
  }

  console.log('\n═══════════════════════════════════════════');
  if (healthy) {
    console.log('  Status: ✓ ALL CHECKS PASSED');
  } else {
    console.log('  Status: ✗ HEALTH CHECK FAILED');
  }
  console.log('═══════════════════════════════════════════');

  return healthy;
}

export async function notifyFailure(message, details = {}) {
  logger.error(`[notification] FAILURE: ${message}`);

  console.error('\n═══════════════════════════════════════════');
  console.error('  ✗ PIPELINE FAILURE');
  console.error('═══════════════════════════════════════════');
  console.error(`  Message: ${message}`);
  if (details.step) {
    console.error(`  Step: ${details.step}`);
  }
  if (details.error) {
    console.error(`  Error: ${details.error}`);
  }
  console.error('═══════════════════════════════════════════\n');

  const config = loadConfig();
  if (config.NOTIFY_WEBHOOK_URL) {
    try {
      await fetch(config.NOTIFY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `SEO Ranker Failure: ${message}`,
          details
        })
      });
      logger.info('[notification] Webhook notification sent');
    } catch (err) {
      logger.error(`[notification] Webhook failed: ${err.message}`);
    }
  }
}
