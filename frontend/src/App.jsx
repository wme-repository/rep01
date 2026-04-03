import { useState } from 'react';
import { LayoutDashboard, Cpu, FileText, HealthCheck, Settings as SettingsIcon } from './components/Icons.jsx';
import Dashboard from './components/Dashboard.jsx';
import PipelinePanel from './components/PipelinePanel.jsx';
import ArticleTable from './components/ArticleTable.jsx';
import HealthCheckComponent from './components/HealthCheck.jsx';
import SettingsComponent from './components/Settings.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Cpu },
  { id: 'articles', label: 'Artigos', icon: FileText },
  { id: 'health', label: 'Health Check', icon: HealthCheck },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'pipeline': return <PipelinePanel />;
      case 'articles': return <ArticleTable />;
      case 'health': return <HealthCheckComponent />;
      case 'settings': return <SettingsComponent />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full flex flex-col w-64 transition-all duration-200 z-50"
        style={{ backgroundColor: 'var(--surface-container-low)' }}
      >
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary-container)' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-container)' }}>dns</span>
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-lg" style={{ color: 'var(--primary)' }}>SEO Automator</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--on-surface-variant)' }}>Command & Control</p>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-4 px-4 py-3 w-full
                    ${isActive ? 'font-semibold border-r-2' : ''}
                    transition-all duration-200
                  `}
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                    borderColor: isActive ? 'var(--primary)' : 'transparent',
                    backgroundColor: isActive ? 'var(--surface-container)' : 'transparent',
                  }}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6">
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-variant)', borderWidth: '1px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>System Status</span>
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--tertiary)' }}></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '14px' }}>check_circle</span>
              <span className="text-xs font-medium" style={{ color: 'var(--tertiary)' }}>Healthy</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen flex-1">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-40 flex justify-between items-center px-8 h-16 w-full backdrop-blur-xl text-sm"
          style={{ backgroundColor: 'var(--surface-container-low)', opacity: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-64">
              <input
                className="w-full rounded-full py-2 pl-10 pr-4 text-xs outline-none transition-all"
                style={{
                  backgroundColor: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                }}
                placeholder="Search resources..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>search</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="transition-all hover:scale-105 active:scale-95" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="transition-all hover:scale-105 active:scale-95" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined">dns</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
