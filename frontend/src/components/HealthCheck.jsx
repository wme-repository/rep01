import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Heart, Refresh, CheckCircle, Error as ErrorIcon, Cog, Server, Shield } from './Icons.jsx';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ backgroundColor: 'var(--surface-container)' }} />;
}

const TYPE_CONFIG = {
  config: { icon: Cog, color: 'var(--primary)', bgColor: 'var(--primary-container)' },
  api: { icon: Server, color: 'var(--secondary)', bgColor: 'var(--secondary-container)' },
  system: { icon: Shield, color: 'var(--tertiary)', bgColor: 'var(--tertiary-container)' },
};

function SummaryCard({ count, label, icon: Icon, colorClass }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${colorClass}20`, color: colorClass }}
        >
          <Icon />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>{count}</p>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ check }) {
  const typeConfig = TYPE_CONFIG[check.type] || TYPE_CONFIG.config;
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors rounded-xl"
      style={{ '--tw-bg-opacity': 0.5 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          <TypeIcon />
        </div>
        <div className="min-w-0">
          <p className="font-medium" style={{ color: 'var(--on-surface)' }}>{check.name}</p>
          <p className="text-sm truncate max-w-[200px] sm:max-w-[300px]" style={{ color: 'var(--on-surface-variant)' }}>{check.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-10 sm:ml-0">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {check.type}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: check.passed ? 'var(--tertiary)' : 'var(--error)' }}
        >
          {check.passed ? 'OK' : 'FAIL'}
        </span>
      </div>
    </div>
  );
}

export default function HealthCheck() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = () => {
    setLoading(true);
    api.getHealth()
      .then(data => {
        setHealth(data);
        setLastRefresh(new Date());
      })
      .catch(err => setHealth({ healthy: false, error: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const passedCount = health?.checks?.filter(c => c.passed).length || 0;
  const failedCount = health?.checks?.filter(c => !c.passed).length || 0;
  const totalCount = health?.checks?.length || 0;

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Health Check</h2>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Status de APIs, configurações e sistemas</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all self-start disabled:opacity-50"
          style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <Refresh />
          Atualizar
        </button>
      </div>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <SummaryCard
          count={passedCount}
          label="Passed"
          icon={CheckCircle}
          colorClass="var(--tertiary)"
        />
        <SummaryCard
          count={failedCount}
          label="Failed"
          icon={ErrorIcon}
          colorClass="var(--error)"
        />
        <SummaryCard
          count={totalCount}
          label="Total"
          icon={Heart}
          colorClass={health?.healthy ? 'var(--tertiary)' : 'var(--error)'}
        />
      </div>

      {/* Overall Status Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 border transition-all"
        style={{
          backgroundColor: health?.healthy ? 'var(--tertiary-container)' : 'var(--error-container)',
          borderColor: health?.healthy ? 'var(--tertiary)' : 'var(--error)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: health?.healthy ? 'var(--tertiary)' : 'var(--error)', color: health?.healthy ? 'var(--on-tertiary)' : 'var(--on-error)' }}
          >
            {health?.healthy ? (
              <CheckCircle />
            ) : (
              <ErrorIcon />
            )}
          </div>
          <div className="flex-1">
            <h3
              className="text-lg sm:text-xl font-bold"
              style={{ color: health?.healthy ? 'var(--tertiary)' : 'var(--error)' }}
            >
              {health?.healthy ? 'All Systems Operational' : 'System Issues Detected'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {passedCount} checks passed, {failedCount} failed
            </p>
          </div>
        </div>
      </div>

      {/* Health Checks List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>Health Checks</h3>
        </div>
        <div className="p-2">
          {health?.checks?.map((check, i) => (
            <HealthItem key={i} check={check} />
          ))}
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <p className="text-center text-xs" style={{ color: 'var(--outline)' }}>
          Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}