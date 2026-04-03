// Configuration loader - reads from environment variables
// See .env.example for all available variables

const REQUIRED_VARS = [
  'BUSINESS_NAME',
  'ARVO_API_KEY',
];

const OPTIONAL_VARS = {
  APPROVAL_MODE: 'manual',
  DEBUG: 'false',
  CONTEXT_PATH: './context',
  LOGS_PATH: './logs',
  BRAND_KIT_PATH: './brand-kit',
};

export function loadConfig() {
  const config = { ...OPTIONAL_VARS };

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('SEO_RANKER_')) {
      config[key.replace('SEO_RANKER_', '')] = value;
    } else {
      config[key] = value;
    }
  }

  // Validate required
  const missing = REQUIRED_VARS.filter(v => !config[v]);
  if (missing.length > 0) {
    console.warn(`Warning: Missing env vars: ${missing.join(', ')}`);
    console.warn('Copy .env.example to .env and fill in values');
  }

  return config;
}

export const config = loadConfig();
export default config;
