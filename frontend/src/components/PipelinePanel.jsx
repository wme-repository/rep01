import { useState } from 'react';
import { api } from '../api.js';

export default function PipelinePanel() {
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);

  const append = (text) => setOutput(prev => [...prev, text]);

  const runBlog = async () => {
    setRunning(true);
    append('Starting Blog Pipeline...');
    try {
      const result = await api.runBlogPipeline({ dryRun: true });
      append(JSON.stringify(result, null, 2));
    } catch (err) {
      append(`Error: ${err.message}`);
    }
    setRunning(false);
  };

  const runSocial = async () => {
    setRunning(true);
    append('Starting Social Pipeline...');
    try {
      const result = await api.runSocialPipeline({ dryRun: true });
      append(JSON.stringify(result, null, 2));
    } catch (err) {
      append(`Error: ${err.message}`);
    }
    setRunning(false);
  };

  const runAll = async () => {
    setRunning(true);
    append('Starting All Pipelines...');
    try {
      const result = await api.runAllPipelines({ dryRun: true });
      append(JSON.stringify(result, null, 2));
    } catch (err) {
      append(`Error: ${err.message}`);
    }
    setRunning(false);
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button onClick={runBlog} disabled={running} className="bg-green-500 text-white border-none px-6 py-3 rounded-lg cursor-pointer font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">Run Blog Pipeline</button>
        <button onClick={runSocial} disabled={running} className="bg-blue-500 text-white border-none px-6 py-3 rounded-lg cursor-pointer font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">Run Social Pipeline</button>
        <button onClick={runAll} disabled={running} className="bg-purple-500 text-white border-none px-6 py-3 rounded-lg cursor-pointer font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed">Run All</button>
      </div>

      <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 max-h-96 overflow-auto">
        {output.length === 0 ? (
          <p className="text-slate-500 m-0">Pipeline output will appear here...</p>
        ) : (
          output.map((line, i) => (
            <pre key={i} className="my-1 text-sm text-slate-300 whitespace-pre-wrap">{line}</pre>
          ))
        )}
      </div>
    </div>
  );
}