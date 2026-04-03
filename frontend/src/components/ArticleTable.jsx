import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { FileText, Refresh, Calendar, Add, Search, FileX, TaskAlt, Description } from './Icons.jsx';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ backgroundColor: 'var(--surface-container)' }} />;
}

const STATUS_CONFIG = {
  planned: {
    bg: 'var(--primary)', border: 'var(--primary)', text: 'var(--primary)',
    badge: 'var(--primary)', dot: 'var(--primary)',
    label: 'Planejado', icon: Description
  },
  generated: {
    bg: 'var(--secondary)', border: 'var(--secondary)', text: 'var(--secondary)',
    badge: 'var(--secondary)', dot: 'var(--secondary)',
    label: 'Gerado', icon: FileText
  },
  published: {
    bg: 'var(--tertiary)', border: 'var(--tertiary)', text: 'var(--tertiary)',
    badge: 'var(--tertiary)', dot: 'var(--tertiary)',
    label: 'Publicado', icon: TaskAlt
  },
};

const FILTER_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'planned', label: 'Planejados' },
  { id: 'generated', label: 'Gerados' },
  { id: 'published', label: 'Publicados' },
];

function ArticleCard({ article }) {
  const config = STATUS_CONFIG[article.status] || STATUS_CONFIG.planned;
  const StatusIcon = config.icon;

  return (
    <div
      className="p-5 hover:scale-[1.02] transition-all duration-200 cursor-pointer group rounded-2xl"
      style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: `${config.bg}20`, color: config.bg }}
        >
          <StatusIcon />
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${config.badge}20`, color: config.badge }}
        >
          {config.label}
        </span>
      </div>

      <h3
        className="font-semibold mb-3 group-hover:opacity-80 transition-colors line-clamp-2"
        style={{ color: 'var(--on-surface)' }}
      >
        {article.keyword || article.title || 'Sem título'}
      </h3>

      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--on-surface-variant)' }}>
        {article.createdAt && (
          <span className="flex items-center gap-1.5">
            <Calendar />
            {new Date(article.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {/* Status Progress Bar */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: config.dot }}
          />
          <span className="text-xs" style={{ color: config.text }}>
            {article.status === 'planned' && 'Aguardando geração...'}
            {article.status === 'generated' && 'Pronto para publicar'}
            {article.status === 'published' && 'Publicado com sucesso'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ArticleTable() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    setLoading(true);
    api.getArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const filteredArticles = articles
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (a.keyword || a.title || '').toLowerCase().includes(query);
    });

  const statusCounts = {
    all: articles.length,
    planned: articles.filter(a => a.status === 'planned').length,
    generated: articles.filter(a => a.status === 'generated').length,
    published: articles.filter(a => a.status === 'published').length,
  };

  if (loading && articles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Artigos</h2>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {articles.length} artigos no calendário editorial
          </p>
        </div>
        <button
          onClick={loadArticles}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all self-start"
          style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <Refresh />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--on-surface-variant)' }}>
            <Search />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artigos..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--on-surface)',
              borderWidth: '1px',
              borderColor: 'var(--outline-variant)',
            }}
          />
        </div>

        {/* Filter Pills - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === tab.id ? 'var(--primary-container)' : 'var(--surface-container)',
                color: filter === tab.id ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
              }}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({statusCounts[tab.id]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl"
          style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <FileX />
          <h3 className="text-xl font-semibold mt-4 mb-2" style={{ color: 'var(--on-surface)' }}>Nenhum artigo encontrado</h3>
          <p className="text-center max-w-md mb-6" style={{ color: 'var(--on-surface-variant)' }}>
            Execute o pipeline de blog para gerar artigos para o calendário editorial.
          </p>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            <Add />
            Executar Blog Pipeline
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--on-surface-variant)' }}>
          <Search />
          <p className="mt-3">Nenhum artigo corresponde à busca.</p>
          <button
            onClick={() => { setFilter('all'); setSearchQuery(''); }}
            className="mt-2 transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Results Footer */}
          <div className="flex justify-between items-center text-sm px-2" style={{ color: 'var(--on-surface-variant)' }}>
            <span>Mostrando {filteredArticles.length} de {articles.length} artigos</span>
            {filter !== 'all' || searchQuery ? (
              <button
                onClick={() => { setFilter('all'); setSearchQuery(''); }}
                className="transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}