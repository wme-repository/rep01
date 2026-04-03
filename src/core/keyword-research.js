import { loadStore, saveStore } from '../services/store.js';
import { logger } from '../services/logger.js';

// Funnel stage indicators
const FUNNEL_INDICATORS = {
  awareness: ['what is', 'how to', 'guide', 'tutorial', 'introduction', ' basics', ' for beginners', 'o que é', 'como fazer', 'guia', 'tutorial'],
  consideration: ['vs', 'versus', 'compare', 'comparison', 'review', 'best', 'top', 'alternatives', 'pros and cons', 'comparativo', 'review', 'melhores', 'versus'],
  decision: ['buy', 'price', 'cost', 'discount', 'coupon', 'order', 'purchase', 'pricing', 'quote', 'cheap', 'affordable', 'license', 'comprar', 'preço', 'custo', 'desconto']
};

export async function findKeywordGaps(mainSiteKeywords = [], competitorData = []) {
  const mainSet = new Set(mainSiteKeywords.map(k => k.word?.toLowerCase() || k.toLowerCase()));
  const compMap = new Map();

  for (const comp of competitorData) {
    for (const kw of comp.keywords || []) {
      const word = (kw.word || '').toLowerCase();
      if (!word || word.length <= 3) continue;
      if (!compMap.has(word)) {
        compMap.set(word, { word, competitors: [], totalCount: 0 });
      }
      const entry = compMap.get(word);
      entry.competitors.push(comp.url);
      entry.totalCount += kw.count || 1;
    }
  }

  // Gaps = keywords competitors have that main site doesn't
  const gaps = [];
  for (const [word, data] of compMap) {
    if (!mainSet.has(word) && word.length > 3) {
      gaps.push({
        word,
        competitorCount: data.competitors.length,
        totalMentions: data.totalCount,
        competitors: data.competitors
      });
    }
  }

  return gaps.sort((a, b) => b.totalMentions - a.totalMentions);
}

export function prioritizeKeywords(gaps, options = {}) {
  const { maxKeywords = 20, preferredFunnel = 'decision' } = options;

  const scored = gaps.map(gap => {
    const word = gap.word.toLowerCase();
    let funnelStage = 'awareness';

    for (const [stage, indicators] of Object.entries(FUNNEL_INDICATORS)) {
      if (indicators.some(ind => word.includes(ind))) {
        funnelStage = stage;
        break;
      }
    }

    const funnelScore = { awareness: 1, consideration: 2, decision: 3 }[funnelStage];
    const opportunityScore = gap.competitorCount * 10 + Math.log10(gap.totalMentions + 1);
    const boost = funnelStage === preferredFunnel ? 1.5 : 1;

    return {
      ...gap,
      funnelStage,
      score: opportunityScore * funnelScore * boost
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, maxKeywords);
}

export async function runKeywordResearch() {
  const store = await loadStore();

  // Get competitor data from store
  const competitorData = Object.values(store.operations || {})
    .filter(op => op?.data?.keywords || op?.data?.url)
    .map(op => op.data)
    .filter(Boolean);

  if (competitorData.length === 0) {
    logger.warn('[keyword-research] No competitor data found. Run analyze --competitors first.');
    return [];
  }

  const gaps = await findKeywordGaps([], competitorData);
  const prioritized = prioritizeKeywords(gaps);

  const newStore = await loadStore();
  newStore.operations = newStore.operations || {};
  newStore.operations['keyword-research'] = {
    id: 'keyword-research',
    gaps: gaps.slice(0, 50),
    prioritized,
    generatedAt: new Date().toISOString()
  };
  await saveStore(newStore);

  logger.info(`[keyword-research] Found ${gaps.length} gaps, prioritized ${prioritized.length}`);
  return prioritized;
}
