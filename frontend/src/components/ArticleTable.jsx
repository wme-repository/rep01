import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function ArticleTable() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-400">Loading...</p>;

  if (articles.length === 0) {
    return <p className="text-slate-500">No articles in editorial calendar. Run the blog pipeline to generate content.</p>;
  }

  const statusColor = { planned: '#3b82f6', generated: '#a855f7', published: '#22c55e' };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            {['Keyword', 'Status', 'Created'].map(h => (
              <th key={h} className="text-left p-3 text-slate-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article.id} className="border-b border-slate-800">
              <td className="p-3">{article.keyword || article.title || 'N/A'}</td>
              <td className="p-3">
                <span className="text-white text-xs px-3 py-1 rounded-full" style={{ background: statusColor[article.status] || '#64748b' }}>
                  {article.status || 'unknown'}
                </span>
              </td>
              <td className="p-3 text-slate-400">
                {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}