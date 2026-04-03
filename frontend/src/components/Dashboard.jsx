import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Dashboard() {
  const [store, setStore] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    Promise.all([api.getStore(), api.getHealth()])
      .then(([storeData, healthData]) => {
        setStore(storeData);
        setHealth(healthData);
      })
      .catch(console.error);
  }, []);

  const articles = store?.articles?.editorialCalendar || [];
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const plannedCount = articles.filter(a => a.status === 'planned').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <Card title="Articles Published" value={publishedCount} color="#22c55e" />
      <Card title="Articles Planned" value={plannedCount} color="#3b82f6" />
      <Card title="Keywords Tracked" value={store?.operations?.['keyword-research']?.prioritized?.length || 0} color="#a855f7" />
      <Card
        title="System Health"
        value={health?.healthy ? 'Healthy' : 'Issues'}
        color={health?.healthy ? '#22c55e' : '#ef4444'}
      />
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <p className="m-0 text-slate-400 text-sm">{title}</p>
      <p className="mt-2 mb-0 text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}