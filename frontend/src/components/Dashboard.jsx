import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { FileText, TrendingUp, CheckCircle, Schedule, EditNote, Share, ChevronRight, Bolt, Globe } from './Icons.jsx';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ backgroundColor: 'var(--surface-container)' }} />;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, gradient }) {
  return (
    <div
      className="relative overflow-hidden p-6 rounded-2xl"
      style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{title}</p>
          <h3 className="text-4xl font-black mt-1" style={{ color: 'var(--on-surface)' }}>{value}</h3>
        </div>
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${gradient}20`, color: gradient }}>
          <Icon />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--tertiary)' }}>
        <TrendingUp style={{ fontSize: '14px' }} />
        <span>{trend}</span>
      </div>
      <div
        className="absolute bottom-0 right-0 left-0 h-12 opacity-10"
        style={{ background: `linear-gradient(to top, ${gradient}, transparent)` }}
      />
    </div>
  );
}

function QuickAction({ title, description, icon: Icon, color, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl border transition-colors group"
      style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${gradient}20`, color: gradient }}
        >
          <Icon />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>{title}</p>
          <p className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{description}</p>
        </div>
      </div>
      <ChevronRight />
    </button>
  );
}

export default function Dashboard({ onNavigate }) {
  const [store, setStore] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getStore(), api.getHealth()])
      .then(([storeData, healthData]) => {
        setStore(storeData);
        setHealth(healthData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const articles = store?.articles?.editorialCalendar || [];
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const plannedCount = articles.filter(a => a.status === 'planned').length;
  const generatedCount = articles.filter(a => a.status === 'generated').length;

  const chartData = [45, 65, 85, 95, 70, 40, 55];
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-64 rounded-2xl" /></div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Metric Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Published Articles"
          value={publishedCount.toLocaleString()}
          subtitle="artigos"
          icon={FileText}
          trend="+12.5% this month"
          gradient="var(--primary)"
        />
        <MetricCard
          title="Generated Content"
          value={generatedCount.toLocaleString()}
          subtitle="artigos"
          icon={Bolt}
          trend="+8.2% conversion"
          gradient="var(--secondary)"
        />
        <MetricCard
          title="Planned/Queued"
          value={plannedCount.toLocaleString()}
          subtitle="artigos"
          icon={CheckCircle}
          trend="Next sync: 12m"
          gradient="var(--tertiary)"
        />
      </div>

      {/* Main Performance Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Section */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Weekly Performance</h4>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>Content generation volume over the last 7 days</p>
            </div>
            <select
              className="text-xs rounded-lg px-3 py-2 outline-none"
              style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)' }}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {chartData.map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg transition-all hover:brightness-125"
                  style={{
                    height: `${height}%`,
                    backgroundColor: i === 3 ? 'var(--primary-container)' : 'var(--surface-container-high)',
                    boxShadow: i === 3 ? '0 -8px 16px rgba(77,142,255,0.2)' : 'none'
                  }}
                />
                <span className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Widget */}
        <div
          className="rounded-2xl p-6 flex flex-col"
          style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <h4 className="text-lg font-bold mb-6" style={{ color: 'var(--on-surface)' }}>Quick Actions</h4>
          <div className="space-y-4 flex-grow">
            <QuickAction
              title="Blog Pipeline"
              description="Generate 10 posts"
              icon={EditNote}
              color="var(--primary)"
              gradient="var(--primary)"
              onClick={() => onNavigate?.('pipeline')}
            />
            <QuickAction
              title="Social Pipeline"
              description="Sync 4 platforms"
              icon={Share}
              color="var(--secondary)"
              gradient="var(--secondary)"
              onClick={() => onNavigate?.('pipeline')}
            />

            <div
              className="mt-4 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 border border-dashed"
              style={{ backgroundColor: 'var(--surface-container-highest)', borderColor: 'var(--outline-variant)' }}
            >
              <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>New Automation Module</p>
              <button className="text-xs font-bold" style={{ color: 'var(--primary)' }}>Explore Marketplace</button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
            <h4 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>Recent Activity</h4>
            <button
              className="text-xs font-bold"
              style={{ color: 'var(--primary)' }}
              onClick={() => onNavigate?.('articles')}
            >
              View Full History
            </button>
          </div>

          <div>
            {articles.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                <p className="text-sm">Nenhuma atividade recente.</p>
                <p className="text-xs mt-1">Execute um pipeline para ver a atividade aqui.</p>
              </div>
            ) : (
              articles.slice(0, 4).map((article, i) => {
                const statusColors = {
                  published: { dot: 'var(--primary)', badge: 'var(--tertiary)', badgeBg: 'var(--tertiary-container)' },
                  generated: { dot: 'var(--secondary)', badge: 'var(--on-surface-variant)', badgeBg: 'var(--surface-container-highest)' },
                  planned: { dot: 'var(--error)', badge: 'var(--error)', badgeBg: 'var(--error-container)' }
                };
                const colors = statusColors[article.status] || statusColors.planned;

                return (
                  <div
                    key={article.id || i}
                    className="p-4 flex items-center justify-between"
                    style={{ borderBottom: i < 3 ? '1px solid var(--outline-variant)' : 'none', opacity: 0.1 + (0.9 * (4 - i) / 4) }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: colors.dot,
                          boxShadow: article.status === 'published' ? '0 0 8px var(--primary)' : 'none'
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                          {article.keyword || article.title || 'Artigo sem título'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          Status: {article.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>
                        {article.createdAt ? new Date(article.createdAt).toLocaleDateString('pt-BR') : 'Agora'}
                      </p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: colors.badgeBg,
                          color: colors.badge,
                          borderColor: colors.badge
                        }}
                      >
                        {article.status === 'published' ? 'Live' : article.status === 'generated' ? 'Review' : article.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CTA Card */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
          style={{
            background: `linear-gradient(to bottom right, var(--primary-container), var(--secondary-container))`,
            color: 'var(--on-primary-container)'
          }}
        >
          <div className="relative z-10">
            <h5 className="text-2xl font-black leading-tight mb-2">Automate Your Success.</h5>
            <p className="text-sm font-medium opacity-80">Our AI agent has discovered 4 keywords your competitors are missing.</p>
          </div>
          <button
            className="relative z-10 mt-6 py-3 rounded-xl font-bold text-sm border transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Run Auto-Pilot
          </button>
          <div
            className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: 'white' }}
          />
        </div>
      </div>
    </div>
  );
}
