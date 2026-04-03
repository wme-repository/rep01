import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function HealthCheck() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    api.getHealth()
      .then(setHealth)
      .catch(err => setHealth({ healthy: false, error: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  if (loading) return <p className="text-slate-400">Running health checks...</p>;

  if (!health || !health.checks) {
    return (
      <div>
        <p className="text-red-400">{health?.error || 'Failed to load health status'}</p>
        <button onClick={refresh} className="bg-blue-500 text-white border-none px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="m-0 text-lg font-semibold" style={{ color: health.healthy ? '#22c55e' : '#ef4444' }}>
          {health.healthy ? 'All Systems Operational' : 'System Issues Detected'}
        </h2>
        <button onClick={refresh} className="bg-blue-500 text-white border-none px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">Refresh</button>
      </div>

      <div className="flex flex-col gap-3">
        {health.checks.map((check, i) => (
          <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span style={{ color: check.passed ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                {check.passed ? '\u2713' : '\u2717'}
              </span>
              <span className="font-medium">{check.name}</span>
              <span className="text-slate-400 text-sm ml-2">({check.type})</span>
            </div>
            <span className="text-slate-400 text-sm">{check.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}