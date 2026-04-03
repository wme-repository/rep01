import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import PipelinePanel from './components/PipelinePanel.jsx';
import ArticleTable from './components/ArticleTable.jsx';
import HealthCheck from './components/HealthCheck.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'articles', label: 'Articles' },
    { id: 'health', label: 'Health' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="bg-slate-800 px-8 py-4 border-b border-slate-700">
        <h1 className="m-0 text-xl text-slate-100">SEO Ranker Dashboard</h1>
      </header>

      <nav className="bg-slate-800 px-8 py-3 flex gap-2 border-b border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pipeline' && <PipelinePanel />}
        {activeTab === 'articles' && <ArticleTable />}
        {activeTab === 'health' && <HealthCheck />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}