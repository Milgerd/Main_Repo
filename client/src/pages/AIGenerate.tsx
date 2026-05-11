import { useState } from 'react';
import api from '../lib/axios';

export default function AIGenerate() {
  const [form, setForm] = useState({ projectName: '', description: '', goal: '', projectId: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await api.post('/ai/generate', {
        ...form,
        projectId: parseInt(form.projectId),
      });
      setResult(res.data.content);
    } catch {
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Launch Plan Generator</h1>
      <p className="text-gray-500 mb-8 text-sm">Describe your project and get an AI-generated launch plan.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Launch Plan'}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Generated Launch Plan</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  );
}