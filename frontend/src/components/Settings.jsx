import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Globe, Key, Cog, Refresh, Check, Error as ErrorIcon, Loader2, AlertCircle, Verified } from './Icons.jsx';

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ backgroundColor: 'var(--surface-container)' }} />;
}

const TABS = [
  { id: 'geral', label: 'Geral', icon: Cog },
  { id: 'competidores', label: 'Concorrentes', icon: Globe },
  { id: 'apis', label: 'APIs', icon: Key },
];

const FIELDS = {
  geral: [
    { key: 'LOG_LEVEL', label: 'Log Level', type: 'text', placeholder: 'info', description: 'Nível de logging: debug, info, warn, error' },
    { key: 'DEBUG', label: 'Debug Mode', type: 'text', placeholder: 'true ou false', description: 'Ativa logs detalhados para debug' },
  ],
  competidores: [
    { key: 'MAIN_SITE_URL', label: 'Site Principal', type: 'url', placeholder: 'https://yoursite.com', required: true, description: 'URL do seu site principal' },
    { key: 'COMPETITORS', label: 'Concorrentes', type: 'text', placeholder: 'https://competitor1.com,https://competitor2.com', description: 'Lista de URLs dos concorrentes (separados por vírgula)' },
  ],
  apis: [
    { key: 'ARVO_API_KEY', label: 'Arvo API Key', type: 'password', placeholder: 'Sua chave da API Arvo', required: true, description: 'Chave da API do Arvo para geração de conteúdo' },
    { key: 'WORDPRESS_URL', label: 'WordPress URL', type: 'url', placeholder: 'https://yoursite.com', required: true, description: 'URL da instalação WordPress' },
    { key: 'WORDPRESS_USER', label: 'WordPress User', type: 'text', placeholder: 'username', description: 'Nome de usuário do WordPress' },
    { key: 'WORDPRESS_APP_PASSWORD', label: 'WordPress App Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx', description: 'App Password do WordPress (gerado em Usuários > Segurança)' },
    { key: 'BLOTADO_API_KEY', label: 'Blotado API Key', type: 'password', placeholder: 'Sua chave da API Blotado', description: 'Chave da API do Blotado para social media' },
  ],
};

function FieldInput({ field, value, onSave, saving }) {
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const validate = (val) => {
    if (field.required && !val) return 'Campo obrigatório';
    if (field.type === 'url' && val) {
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return 'URL deve começar com http:// ou https://';
      }
    }
    return '';
  };

  const handleBlur = () => {
    setTouched(true);
    const err = validate(localValue);
    setError(err);
    if (!err && localValue !== value) {
      onSave(field.key, localValue);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    if (touched) {
      setError(validate(e.target.value));
    }
  };

  const showError = touched && error;
  const showSuccess = touched && !error && localValue === value && justSaved;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
      </label>
      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{field.description}</p>

      <div className="relative">
        <input
          type={field.type === 'password' ? 'password' : 'text'}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          className={`
            w-full border rounded-xl px-4 py-3 text-sm
            outline-none transition-all
            ${showError
              ? 'border-red-500/50 focus:border-red-500'
              : showSuccess
                ? 'border-green-500/50 focus:border-green-500'
                : 'focus:border-blue-500'
            }
          `}
          style={{
            backgroundColor: 'var(--surface-container-high)',
            color: 'var(--on-surface)',
            borderColor: showError ? 'var(--error)' : showSuccess ? 'var(--tertiary)' : 'var(--outline-variant)',
          }}
        />

        {/* Status Indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {saving ? (
            <Loader2 />
          ) : showSuccess ? (
            <div className="flex items-center gap-1" style={{ color: 'var(--tertiary)' }}>
              <Check />
              <span className="text-xs">Salvo</span>
            </div>
          ) : showError ? (
            <div className="flex items-center gap-1" style={{ color: 'var(--error)' }}>
              <ErrorIcon />
              <span className="text-xs">Erro</span>
            </div>
          ) : null}
        </div>
      </div>

      {showError && (
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--error)' }}>
          <AlertCircle />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    api.getSettings()
      .then(data => {
        setSettings(data);
        const defaults = { LOG_LEVEL: 'info', DEBUG: 'false' };
        setSettings(prev => ({ ...defaults, ...prev }));
      })
      .catch(err => {
        showToast('error', 'Falha ao carregar configurações');
      })
      .finally(() => setLoading(false));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (key, value) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    const newSettings = { ...settings, [key]: value };

    api.updateSettings(newSettings)
      .then(() => {
        setSettings(newSettings);
      })
      .catch(err => {
        showToast('error', 'Falha ao salvar');
        setSettings(settings);
      })
      .finally(() => {
        setSaving(prev => ({ ...prev, [key]: false }));
      });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 sm:right-6 px-4 py-3 rounded-xl font-medium z-50 flex items-center gap-2 shadow-xl animate-in slide-in-from-right ${
          toast.type === 'error' ? '' : ''
        }`}
        style={{
          backgroundColor: toast.type === 'error' ? 'var(--error-container)' : 'var(--tertiary-container)',
          color: toast.type === 'error' ? 'var(--on-error-container)' : 'var(--on-tertiary-container)',
        }}>
          {toast.type === 'error' ? <ErrorIcon /> : <Check />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--on-surface)' }}>Configurações</h2>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Gerencie variáveis de ambiente e configurações</p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all self-start"
          style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
        >
          <Refresh />
          Recarregar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              `}
              style={{
                backgroundColor: isActive ? 'var(--primary-container)' : 'transparent',
                color: isActive ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
              }}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {FIELDS[activeTab].map(field => (
          <div
            key={field.key}
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
          >
            <FieldInput
              field={field}
              value={settings[field.key]}
              onSave={handleSave}
              saving={saving[field.key]}
            />
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--primary-container)', borderWidth: '1px', borderColor: 'var(--primary)' }}>
        <div className="flex items-start gap-3">
          <Verified />
          <div>
            <p className="text-sm" style={{ color: 'var(--on-primary-container)' }}>
              <strong>Nota:</strong> As alterações são salvas automaticamente ao sair do campo (on blur).
              As configurações são escritas diretamente no arquivo <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-primary-container)' }}>.env</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
