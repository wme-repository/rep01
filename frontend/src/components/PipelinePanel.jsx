import { useState } from 'react';
import { api } from '../api.js';
import { Play, Rocket, Globe, Terminal, CheckCircle, Error as ErrorIcon, Loader2 } from './Icons.jsx';

const PIPELINES = [
  {
    id: 'blog',
    name: 'Blog Pipeline',
    description: 'Análise → Keywords → Geração → Publicação',
    icon: Rocket,
    gradient: 'var(--tertiary)',
    borderColor: 'var(--tertiary)',
  },
  {
    id: 'social',
    name: 'Social Pipeline',
    description: 'RSS → Detectar → Gerar → Publicar',
    icon: Globe,
    gradient: 'var(--primary)',
    borderColor: 'var(--primary)',
  },
  {
    id: 'all',
    name: 'Todos',
    description: 'Executa blog + social sequentially',
    icon: Play,
    gradient: 'var(--secondary)',
    borderColor: 'var(--secondary)',
  },
];

export default function PipelinePanel() {
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(null);

  const append = (text, type = 'info') => {
    setOutput(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const runPipeline = async (pipelineId) => {
    if (running) return;

    setRunning(true);
    setRunningPipeline(pipelineId);
    append(`Iniciando ${pipelineId === 'blog' ? 'Blog Pipeline' : pipelineId === 'social' ? 'Social Pipeline' : 'Todos os Pipelines'}...`, 'info');

    try {
      let result;
      if (pipelineId === 'blog') {
        result = await api.runBlogPipeline({ dryRun: true });
      } else if (pipelineId === 'social') {
        result = await api.runSocialPipeline({ dryRun: true });
      } else {
        result = await api.runAllPipelines({ dryRun: true });
      }
      append(`Pipeline executado com sucesso`, 'success');
      append(JSON.stringify(result, null, 2), 'result');
    } catch (err) {
      append(`Erro: ${err.message}`, 'error');
    }

    setRunning(false);
    setRunningPipeline(null);
  };

  const clearOutput = () => setOutput([]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Pipeline</h2>
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Execute os pipelines de automação de conteúdo</p>
      </div>

      {/* Pipeline Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PIPELINES.map(pipeline => {
          const Icon = pipeline.icon;
          const isRunning = running && runningPipeline === pipeline.id;
          const isDisabled = running && !isRunning;

          return (
            <button
              key={pipeline.id}
              onClick={() => runPipeline(pipeline.id)}
              disabled={isDisabled}
              className={`
                relative overflow-hidden p-5 sm:p-6 rounded-2xl border transition-all duration-300 text-left
                hover:scale-[1.02] hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
              `}
              style={{
                backgroundColor: 'var(--surface-container-low)',
                borderColor: 'var(--outline-variant)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: pipeline.gradient }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${pipeline.gradient}20`, color: pipeline.gradient }}
                  >
                    {isRunning ? (
                      <Loader2 />
                    ) : (
                      <Icon />
                    )}
                  </div>
                  {isRunning && (
                    <span className="text-xs animate-pulse" style={{ color: 'var(--on-surface-variant)' }}>Executando...</span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{pipeline.name}</h3>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--on-surface-variant)' }}>{pipeline.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Output Console - Responsive */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-container-low)', borderWidth: '1px', borderColor: 'var(--outline-variant)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
        >
          <div className="flex items-center gap-2">
            <Terminal />
            <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>Console Output</span>
            {running && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--primary)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary)' }} />
                Running
              </span>
            )}
          </div>
          <button
            onClick={clearOutput}
            className="text-xs transition-colors px-2 py-1 rounded"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            Limpar
          </button>
        </div>

        <div className="p-4 h-64 sm:h-80 overflow-y-auto font-mono text-xs sm:text-sm">
          {output.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--on-surface-variant)' }}>
              <Terminal />
              <p className="mt-3 text-center">Execute um pipeline para ver o output aqui...</p>
            </div>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className="flex gap-3 py-1 -mx-2 px-2 rounded transition-colors"
                style={{ '--tw-bg-opacity': 0.5 }}
              >
                <span className="shrink-0 text-xs" style={{ color: 'var(--outline)' }}>{line.time}</span>
                <span style={{
                  color: line.type === 'error' ? 'var(--error)' :
                    line.type === 'success' ? 'var(--tertiary)' :
                    line.type === 'result' ? 'var(--primary)' :
                    'var(--on-surface)'
                }}>
                  {line.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}