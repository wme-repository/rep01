import { readFile } from 'fs/promises';
import { resolve } from 'path';

let cachedRules = null;

export async function loadEditorialRules() {
  if (cachedRules) return cachedRules;

  const rulesPath = resolve(process.cwd(), process.env.BRAND_KIT_PATH || './brand-kit', 'editorial-rules.json');

  try {
    const content = await readFile(rulesPath, 'utf-8');
    cachedRules = JSON.parse(content);
    return cachedRules;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('editorial-rules.json not found, using defaults');
      cachedRules = getDefaultRules();
      return cachedRules;
    }
    throw err;
  }
}

function getDefaultRules() {
  return {
    keywordDensity: { target: 1.5, min: 0.8, max: 3.0 },
    linkRules: { internalPerArticle: { min: 2, max: 4 }, externalPerArticle: { min: 1, max: 3 }, maxLinksPerParagraph: 2 },
    topicRestrictions: { prohibited: [], restricted: [] },
    readabilityTargets: { avgSentenceLength: { min: 15, max: 25 }, avgParagraphLength: { min: 3, max: 6 }, fleschReadingEase: { min: 50, max: 80 } },
    structureRules: { introLength: { min: 100, max: 250 }, conclusionLength: { min: 100, max: 200 }, h2FirstParagraphOffset: true }
  };
}

export function validateArticle(article, rules = null) {
  const issues = [];
  const r = rules || cachedRules;

  if (!r) {
    throw new Error('Rules not loaded. Call loadEditorialRules() first.');
  }

  // Keyword density
  if (r.keywordDensity && article.text) {
    const wordCount = article.text.split(/\s+/).length;
    const keywordCount = (article.text.match(new RegExp(article.keyword || '', 'gi')) || []).length;
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

    if (density < r.keywordDensity.min) {
      issues.push({ severity: 'warning', rule: 'keywordDensity', message: `Keyword density ${density.toFixed(1)}% below minimum ${r.keywordDensity.min}%` });
    } else if (density > r.keywordDensity.max) {
      issues.push({ severity: 'error', rule: 'keywordDensity', message: `Keyword density ${density.toFixed(1)}% exceeds maximum ${r.keywordDensity.max}%` });
    }
  }

  // Link rules
  if (r.linkRules && article.links) {
    const internal = article.links.filter(l => l.type === 'internal').length;
    const external = article.links.filter(l => l.type === 'external').length;

    if (internal < r.linkRules.internalPerArticle.min) {
      issues.push({ severity: 'warning', rule: 'internalLinks', message: `Only ${internal} internal links, minimum ${r.linkRules.internalPerArticle.min}` });
    }
    if (internal > r.linkRules.internalPerArticle.max) {
      issues.push({ severity: 'error', rule: 'internalLinks', message: `${internal} internal links exceeds maximum ${r.linkRules.internalPerArticle.max}` });
    }
    if (external < r.linkRules.externalPerArticle.min) {
      issues.push({ severity: 'warning', rule: 'externalLinks', message: `Only ${external} external links, minimum ${r.linkRules.externalPerArticle.min}` });
    }
  }

  // Word count
  if (r.articleStructure) {
    const wordCount = article.text ? article.text.split(/\s+/).length : 0;
    if (wordCount < (r.articleStructure.minWords || 0)) {
      issues.push({ severity: 'error', rule: 'wordCount', message: `Article has ${wordCount} words, minimum ${r.articleStructure.minWords}` });
    }
    if (wordCount > (r.articleStructure.maxWords || Infinity)) {
      issues.push({ severity: 'warning', rule: 'wordCount', message: `Article has ${wordCount} words, maximum ${r.articleStructure.maxWords}` });
    }
  }

  return issues;
}

export function clearRulesCache() {
  cachedRules = null;
}
