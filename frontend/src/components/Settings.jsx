import { useState, useEffect } from 'react';
import { api } from '../api.js';

const SETTINGS_TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'competidores', label: 'Competidores' },
  { id: 'apis', label: 'APIs' },
];

const SETTINGS_FIELDS = {
  geral: [
    { key: 'LOG_LEVEL', label: 'Log Level', type: 'text', placeholder: 'info' },
    { key: 'DEBUG', label: 'Debug Mode', type: 'text', placeholder: 'true ou false' },
  ],
  competidores: [
    { key: 'MAIN_SITE_URL', label: 'Site Principal', type: 'url', placeholder: 'https://yoursite.com', required: true },
    { key: 'COMPETITORS', label: 'Concorrentes', type: 'text', placeholder: 'https://competitor1.com,https://competitor2.com' },
  ],
  apis: [
    { key: 'ARVO_API_KEY', label: 'Arvo API Key', type: 'password', placeholder: 'Sua chave da API Arvo' },
    { key: 'WORDPRESS_URL', label: 'WordPress URL', type: 'url', placeholder: 'https://yoursite.com', required: true },
    { key: 'WORDPRESS_USER', label: 'WordPress User', type: 'text', placeholder: 'username' },
    { key: 'WORDPRESS_APP_PASSWORD', label: 'WordPress App Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx' },
    { key: 'BLOTADO_API_KEY', label: 'Blotado API Key', type: 'password', placeholder: 'Sua chave da API Blotado' },
  ],
};

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    api.getSettings()
      .then(setSettings)
      .catch(err => showToast('error', 'Falha ao carregar: ' + err.message))
      .finally(() => setLoading(false));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validateField = (field, value) => {
    if (field.required && !value) {
      return 'Campo obrigatorio';
    }
    if (field.type === 'url' && value) {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'URL deve comecar com http:// ou https://';
      }
    }
    return null;
  };

  const handleBlur = (key, field) => {
    const value = settings[key] || '';
    const error = validateField(field, value);
    if (error) {
      showToast('error', error);
      return;
    }
    api.updateSettings(settings)
      .then(() => showToast('success', 'Salvo com sucesso'))
      .catch(err => showToast('error', 'Falha ao salvar: ' + err.message));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="text-slate-400">Carregando configuracoes...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="m-0 text-lg font-semibold text-slate-100">Configuracoes</h2>
        <button onClick={loadSettings} className="bg-blue-500 text-white border-none px-4 py-2 rounded cursor-pointer hover:bg-blue-600">Recarregar</button>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white font-medium z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded border-none cursor-pointer ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {SETTINGS_FIELDS[activeTab].map(field => (
          <div key={field.key} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <label className="block mb-2 text-slate-400 text-sm">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              value={settings[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              onBlur={() => handleBlur(field.key, field)}
              placeholder={field.placeholder}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}