import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.jsx';
import PipelinePanel from './components/PipelinePanel.jsx';
import ArticleTable from './components/ArticleTable.jsx';
import HealthCheck from './components/HealthCheck.jsx';
import Settings from './components/Settings.jsx';

const API_BASE = 'http://localhost:3001/api';

export { API_BASE };

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#1e293b', padding: '1rem 2rem', borderBottom: '1px solid #334155' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>SEO Ranker Dashboard</h1>
      </header>

      <nav style={{ background: '#1e293b', padding: '0.5rem 2rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #334155' }}>
        {['dashboard', 'pipeline', 'articles', 'health', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main style={{ padding: '2rem' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pipeline' && <PipelinePanel />}
        {activeTab === 'articles' && <ArticleTable />}
        {activeTab === 'health' && <HealthCheck />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
