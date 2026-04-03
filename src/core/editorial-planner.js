import { loadStore, saveStore } from '../services/store.js';
import { logger } from '../services/logger.js';

const DEFAULT_TEMPLATES = {
  awareness: [
    'Guia Completo: {keyword} em 2026',
    'Tudo sobre {keyword}: O Guia Definitivo',
    '{keyword}: O Que Você Precisa Saber'
  ],
  consideration: [
    '{keyword} vs A Melhor Alternativa',
    'Review Completo: {keyword}',
    'As Melhores Opções de {keyword} em 2026'
  ],
  decision: [
    'Melhores {keyword} para Comprar em 2026',
    '{keyword}: Comparativo de Preços',
    'Como Escolher o Melhor {keyword}'
  ]
};

export async function generateEditorialCalendar(keywords, options = {}) {
  const {
    startDate = new Date(),
    weeksAhead = 4,
    articlesPerWeek = 1
  } = options;

  const calendar = [];
  const start = new Date(startDate);

  for (let w = 0; w < weeksAhead; w++) {
    for (let a = 0; a < articlesPerWeek; a++) {
      const kwIndex = w * articlesPerWeek + a;
      if (kwIndex >= keywords.length) break;

      const kw = keywords[kwIndex];
      const targetDate = new Date(start);
      targetDate.setDate(targetDate.getDate() + w * 7 + a);

      const title = generateTitle(kw);
      const metaDescription = generateMetaDescription(kw);
      const outline = generateOutline(kw);

      calendar.push({
        id: `article-${Date.now()}-${kwIndex}`,
        keyword: kw.word,
        funnelStage: kw.funnelStage || 'awareness',
        title,
        metaDescription,
        outline,
        targetDate: targetDate.toISOString().split('T')[0],
        priority: kw.score || 0,
        status: 'planned'
      });
    }
  }

  // Save to store
  const store = await loadStore();
  store.articles = store.articles || {};
  store.articles.editorialCalendar = calendar;
  store.articles.generatedAt = new Date().toISOString();
  await saveStore(store);

  logger.info(`[editorial-planner] Generated calendar with ${calendar.length} articles`);
  return calendar;
}

function generateTitle(keyword) {
  const stage = keyword.funnelStage || 'awareness';
  const templates = DEFAULT_TEMPLATES[stage] || DEFAULT_TEMPLATES.awareness;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{keyword}', capitalize(keyword.word));
}

function generateMetaDescription(keyword) {
  const maxLength = 160;
  const cta = 'Saiba mais';
  const base = `${capitalize(keyword.word)}: guia completo com dicas práticas. `;
  const withCta = base + cta;
  return withCta.length > maxLength ? withCta.substring(0, maxLength - 3) + '...' : withCta;
}

function generateOutline(keyword) {
  const kw = keyword.word;
  return [
    { heading: 'Introdução', description: `O que é ${kw} e por que é importante` },
    { heading: 'Benefícios', description: `Principais benefícios de ${kw}` },
    { heading: 'Como Começar', description: `Guia passo a passo para iniciar com ${kw}` },
    { heading: 'Erros Comuns', description: `Erros para evitar com ${kw}` },
    { heading: 'Conclusão', description: `Resumo e próximos passos com ${kw}` }
  ];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
