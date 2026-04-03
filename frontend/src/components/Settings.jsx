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

  if (loading) return <p style={{ color: '#94a3b8' }}>Carregando configuracoes...</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>Configuracoes</h2>
        <button onClick={loadSettings} style={btnStyle()}>Recarregar</button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          background: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff',
          fontWeight: '500',
          zIndex: 1000,
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {SETTINGS_FIELDS[activeTab].map(field => (
          <div key={field.key} style={fieldStyle()}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </label>
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              value={settings[field.key] || ''}
              onChange={e => handleChange(field.key, e.target.value)}
              onBlur={() => handleBlur(field.key, field)}
              placeholder={field.placeholder}
              style={inputStyle()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle = () => ({
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  cursor: 'pointer',
});

const fieldStyle = () => ({
  background: '#1e293b',
  padding: '1rem',
  borderRadius: '0.5rem',
  border: '1px solid #334155',
});

const inputStyle = () => ({
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.375rem',
  padding: '0.5rem 0.75rem',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  outline: 'none',
});
