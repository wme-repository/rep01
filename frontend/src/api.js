const API_BASE = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getHealth: () => request('/health'),
  getStore: () => request('/store'),
  getArticles: () => request('/store/articles'),
  getOperations: () => request('/store/operations'),
  getLogs: () => request('/store/logs'),
  runBlogPipeline: (body) => request('/pipeline/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  runSocialPipeline: (body) => request('/pipeline/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  runAllPipelines: (body) => request('/pipeline/all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};
